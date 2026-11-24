import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: LOCAL_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: LOCAL_TZ,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function toLocalDate(isoStr) {
  if (!isoStr) return 'unknown';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return dateFormatter.format(d); // YYYY-MM-DD
}

function toLocalTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return '';
  return timeFormatter.format(d);
}

function calcCacheHitRate(input, cacheRead) {
  const totalIn = input + cacheRead;
  if (totalIn <= 0) return 0;
  return Math.round((cacheRead / totalIn) * 1000) / 10; // 1 decimal %
}

function cleanWorkspaceName(workspaceUris) {
  if (!workspaceUris || typeof workspaceUris !== 'string') return '';
  const trimmed = workspaceUris.trim();
  if (!trimmed) return '';
  // May be JSON array or newline/comma separated file:/// URIs
  let first = trimmed;
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr) && arr.length > 0) first = String(arr[0]);
    } catch {
      // keep trimmed
    }
  } else {
    first = trimmed.split(/[\r\n,]+/)[0].trim();
  }
  try {
    const decoded = decodeURIComponent(first.replace(/^file:\/\/\/?/i, ''));
    const parts = decoded.replace(/[\\/]+$/, '').split(/[\\/]/).filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : '';
  } catch {
    return '';
  }
}

function sanitizeTitle(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

export class TokenUsageScanner {
  constructor({ appDataDir, dataDir } = {}) {
    this.appDataDir =
      appDataDir ||
      process.env.ANTIGRAVITY_APP_DATA_DIR ||
      path.join(os.homedir(), '.gemini', 'antigravity');
    this.brainDir = path.join(this.appDataDir, 'brain');
    this.summariesDbPath = path.join(this.appDataDir, 'conversation_summaries.db');
    this.dataDir = dataDir || path.join(this.appDataDir, 'plugin_data', 'token-usage');
    this.cacheFile = path.join(this.dataDir, 'transcript-cache.v1.json');

    /** @type {Map<string, any>} */
    this.fileCache = new Map();
    this._loadDiskCache();
  }

  _loadDiskCache() {
    try {
      if (!fs.existsSync(this.cacheFile)) return;
      const raw = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
      if (raw && raw.version === 1 && raw.entries && typeof raw.entries === 'object') {
        for (const [id, entry] of Object.entries(raw.entries)) {
          this.fileCache.set(id, entry);
        }
      }
    } catch {
      // Ignore corrupt cache and rebuild cleanly
    }
  }

  _saveDiskCache() {
    try {
      fs.mkdirSync(this.dataDir, { recursive: true });
      const entries = Object.fromEntries(this.fileCache.entries());
      const tmp = `${this.cacheFile}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ version: 1, tz: LOCAL_TZ, entries }), 'utf8');
      fs.renameSync(tmp, this.cacheFile);
    } catch {
      // Non-fatal if cache cannot be written
    }
  }

  _readConversationMetadata() {
    /** @type {Map<string, { title: string, preview: string, workspace: string, parentId: string, lastModified: string }>} */
    const meta = new Map();
    if (!fs.existsSync(this.summariesDbPath)) return meta;
    let db;
    try {
      db = new DatabaseSync(this.summariesDbPath, { readOnly: true });
      const rows = db
        .prepare(
          `SELECT conversation_id, title, preview, workspace_uris, parent_conversation_id, last_modified_time
           FROM conversation_summaries`
        )
        .all();
      for (const r of rows) {
        meta.set(r.conversation_id, {
          title: sanitizeTitle(r.title),
          preview: sanitizeTitle(r.preview),
          workspace: cleanWorkspaceName(r.workspace_uris),
          parentId: r.parent_conversation_id || '',
          lastModified: r.last_modified_time || '',
        });
      }
    } catch {
      // Graceful fallback if DB is temporarily locked
    } finally {
      if (db) {
        try {
          db.close();
        } catch {
          // ignore
        }
      }
    }
    return meta;
  }

  _parseTranscriptFile(convId, filePath, stat) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split('\n');

    let input = 0;
    let cacheRead = 0;
    let output = 0;
    let turns = 0;
    let firstAt = '';
    let lastAt = '';
    let firstUserPrompt = '';

    /** @type {Record<string, { input: number, cacheRead: number, output: number, total: number, turns: number }>} */
    const byDate = {};
    /** @type {Record<string, { input: number, cacheRead: number, output: number, total: number, turns: number }>} */
    const byModel = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.length < 2) continue;

      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }

      if (!firstUserPrompt && obj.type === 'USER_INPUT' && obj.content) {
        firstUserPrompt = sanitizeTitle(obj.content);
      }

      const inTok = Number(obj.input_tokens) || 0;
      const cacheTok = Number(obj.cache_read_tokens) || 0;
      const outTok = Number(obj.output_tokens) || 0;

      if (obj.type !== 'PLANNER_RESPONSE' && inTok === 0 && cacheTok === 0 && outTok === 0) {
        continue;
      }
      if (inTok === 0 && cacheTok === 0 && outTok === 0) {
        continue;
      }

      const totalTok = inTok + cacheTok + outTok;
      const createdAt = typeof obj.created_at === 'string' ? obj.created_at : '';
      const dateKey = toLocalDate(createdAt);
      const modelKey = obj.model || 'unknown';

      input += inTok;
      cacheRead += cacheTok;
      output += outTok;
      turns += 1;

      if (createdAt) {
        if (!firstAt || createdAt < firstAt) firstAt = createdAt;
        if (!lastAt || createdAt > lastAt) lastAt = createdAt;
      }

      if (!byDate[dateKey]) {
        byDate[dateKey] = { input: 0, cacheRead: 0, output: 0, total: 0, turns: 0 };
      }
      byDate[dateKey].input += inTok;
      byDate[dateKey].cacheRead += cacheTok;
      byDate[dateKey].output += outTok;
      byDate[dateKey].total += totalTok;
      byDate[dateKey].turns += 1;

      if (!byModel[modelKey]) {
        byModel[modelKey] = { input: 0, cacheRead: 0, output: 0, total: 0, turns: 0 };
      }
      byModel[modelKey].input += inTok;
      byModel[modelKey].cacheRead += cacheTok;
      byModel[modelKey].output += outTok;
      byModel[modelKey].total += totalTok;
      byModel[modelKey].turns += 1;
    }

    return {
      id: convId,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      input,
      cacheRead,
      output,
      total: input + cacheRead + output,
      turns,
      firstAt,
      lastAt,
      firstUserPrompt,
      byDate,
      byModel,
    };
  }

  scanAll() {
    const startMs = Date.now();
    let cacheDirty = false;
    const seenIds = new Set();

    if (fs.existsSync(this.brainDir)) {
      const entries = fs.readdirSync(this.brainDir, { withFileTypes: true });
      for (const dirent of entries) {
        if (!dirent.isDirectory()) continue;
        const convId = dirent.name;
        const transcriptPath = path.join(
          this.brainDir,
          convId,
          '.system_generated',
          'logs',
          'transcript.jsonl'
        );
        if (!fs.existsSync(transcriptPath)) continue;

        let stat;
        try {
          stat = fs.statSync(transcriptPath);
        } catch {
          continue;
        }
        seenIds.add(convId);

        const cached = this.fileCache.get(convId);
        if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
          continue;
        }

        try {
          const parsed = this._parseTranscriptFile(convId, transcriptPath, stat);
          this.fileCache.set(convId, parsed);
          cacheDirty = true;
        } catch {
          // Skip unreadable file
        }
      }
    }

    // Remove deleted/missing entries from in-memory cache
    for (const id of [...this.fileCache.keys()]) {
      if (!seenIds.has(id)) {
        this.fileCache.delete(id);
        cacheDirty = true;
      }
    }

    if (cacheDirty) {
      this._saveDiskCache();
    }

    const dbMeta = this._readConversationMetadata();
    const nowIso = new Date().toISOString();
    const today = toLocalDate(nowIso);
    const currentMonth = today.slice(0, 7);

    const totals = {
      input: 0,
      cacheRead: 0,
      output: 0,
      total: 0,
      turns: 0,
      conversations: 0,
      activeDays: 0,
      cacheHitRate: 0,
    };

    /** @type {Map<string, { date: string, input: number, cacheRead: number, output: number, total: number, turns: number, convSet: Set<string>, modelTotals: Record<string, number> }>} */
    const dailyMap = new Map();
    /** @type {Map<string, { month: string, input: number, cacheRead: number, output: number, total: number, turns: number, convSet: Set<string>, daySet: Set<string>, modelTotals: Record<string, number> }>} */
    const monthlyMap = new Map();
    /** @type {Map<string, { model: string, input: number, cacheRead: number, output: number, total: number, turns: number, convSet: Set<string> }>} */
    const modelMap = new Map();

    const conversations = [];

    for (const entry of this.fileCache.values()) {
      if (entry.turns === 0 || entry.total === 0) continue;

      totals.input += entry.input;
      totals.cacheRead += entry.cacheRead;
      totals.output += entry.output;
      totals.total += entry.total;
      totals.turns += entry.turns;
      totals.conversations += 1;

      const meta = dbMeta.get(entry.id);
      const title =
        (meta && (meta.title || meta.preview)) ||
        entry.firstUserPrompt ||
        `Conversation ${entry.id.slice(0, 8)}`;

      // Determine primary model for this conversation
      let primaryModel = 'unknown';
      let maxModelTok = -1;
      const modelList = [];
      for (const [m, stats] of Object.entries(entry.byModel)) {
        modelList.push(m);
        if (stats.total > maxModelTok) {
          maxModelTok = stats.total;
          primaryModel = m;
        }
        if (!modelMap.has(m)) {
          modelMap.set(m, {
            model: m,
            input: 0,
            cacheRead: 0,
            output: 0,
            total: 0,
            turns: 0,
            convSet: new Set(),
          });
        }
        const mm = modelMap.get(m);
        mm.input += stats.input;
        mm.cacheRead += stats.cacheRead;
        mm.output += stats.output;
        mm.total += stats.total;
        mm.turns += stats.turns;
        mm.convSet.add(entry.id);
      }

      // Distribute across daily & monthly buckets
      for (const [dateKey, dStats] of Object.entries(entry.byDate)) {
        if (dateKey === 'unknown') continue;
        const monthKey = dateKey.slice(0, 7);

        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, {
            date: dateKey,
            input: 0,
            cacheRead: 0,
            output: 0,
            total: 0,
            turns: 0,
            convSet: new Set(),
            modelTotals: {},
          });
        }
        const dm = dailyMap.get(dateKey);
        dm.input += dStats.input;
        dm.cacheRead += dStats.cacheRead;
        dm.output += dStats.output;
        dm.total += dStats.total;
        dm.turns += dStats.turns;
        dm.convSet.add(entry.id);
        dm.modelTotals[primaryModel] = (dm.modelTotals[primaryModel] || 0) + dStats.total;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            month: monthKey,
            input: 0,
            cacheRead: 0,
            output: 0,
            total: 0,
            turns: 0,
            convSet: new Set(),
            daySet: new Set(),
            modelTotals: {},
          });
        }
        const mm = monthlyMap.get(monthKey);
        mm.input += dStats.input;
        mm.cacheRead += dStats.cacheRead;
        mm.output += dStats.output;
        mm.total += dStats.total;
        mm.turns += dStats.turns;
        mm.convSet.add(entry.id);
        mm.daySet.add(dateKey);
        mm.modelTotals[primaryModel] = (mm.modelTotals[primaryModel] || 0) + dStats.total;
      }

      const lastDate = toLocalDate(entry.lastAt);
      conversations.push({
        id: entry.id,
        title,
        workspace: (meta && meta.workspace) || '',
        parentId: (meta && meta.parentId) || '',
        isSubagent: Boolean(meta && meta.parentId),
        firstAt: entry.firstAt,
        lastAt: entry.lastAt,
        lastDate,
        lastMonth: lastDate !== 'unknown' ? lastDate.slice(0, 7) : 'unknown',
        input: entry.input,
        cacheRead: entry.cacheRead,
        output: entry.output,
        total: entry.total,
        turns: entry.turns,
        cacheHitRate: calcCacheHitRate(entry.input, entry.cacheRead),
        primaryModel,
        models: modelList,
      });
    }

    totals.activeDays = dailyMap.size;
    totals.cacheHitRate = calcCacheHitRate(totals.input, totals.cacheRead);

    const pickTopModel = (modelTotals) => {
      let best = 'unknown';
      let bestVal = -1;
      for (const [m, v] of Object.entries(modelTotals)) {
        if (v > bestVal) {
          bestVal = v;
          best = m;
        }
      }
      return best;
    };

    const daily = [...dailyMap.values()]
      .map((d) => ({
        date: d.date,
        month: d.date.slice(0, 7),
        input: d.input,
        cacheRead: d.cacheRead,
        output: d.output,
        total: d.total,
        turns: d.turns,
        conversations: d.convSet.size,
        cacheHitRate: calcCacheHitRate(d.input, d.cacheRead),
        topModel: pickTopModel(d.modelTotals),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const monthly = [...monthlyMap.values()]
      .map((m) => ({
        month: m.month,
        input: m.input,
        cacheRead: m.cacheRead,
        output: m.output,
        total: m.total,
        turns: m.turns,
        conversations: m.convSet.size,
        activeDays: m.daySet.size,
        cacheHitRate: calcCacheHitRate(m.input, m.cacheRead),
        topModel: pickTopModel(m.modelTotals),
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    const models = [...modelMap.values()]
      .map((m) => ({
        model: m.model,
        input: m.input,
        cacheRead: m.cacheRead,
        output: m.output,
        total: m.total,
        turns: m.turns,
        conversations: m.convSet.size,
        cacheHitRate: calcCacheHitRate(m.input, m.cacheRead),
        sharePct: totals.total > 0 ? Math.round((m.total / totals.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    conversations.sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));

    const todayRow = daily.find((d) => d.date === today) || {
      date: today,
      input: 0,
      cacheRead: 0,
      output: 0,
      total: 0,
      turns: 0,
      conversations: 0,
      cacheHitRate: 0,
      topModel: '-',
    };

    const thisMonthRow = monthly.find((m) => m.month === currentMonth) || {
      month: currentMonth,
      input: 0,
      cacheRead: 0,
      output: 0,
      total: 0,
      turns: 0,
      conversations: 0,
      activeDays: 0,
      cacheHitRate: 0,
      topModel: '-',
    };

    return {
      generatedAt: nowIso,
      scanDurationMs: Date.now() - startMs,
      timeZone: LOCAL_TZ,
      today,
      currentMonth,
      totals,
      todaySummary: todayRow,
      thisMonthSummary: thisMonthRow,
      daily,
      monthly,
      models,
      conversations,
    };
  }

  getConversationDetail(conversationId) {
    // Prevent path traversal: allow only safe UUID/slug characters
    if (!conversationId || !/^[a-zA-Z0-9_-]{4,80}$/.test(conversationId)) {
      throw new Error('Invalid conversation_id');
    }
    const transcriptPath = path.join(
      this.brainDir,
      conversationId,
      '.system_generated',
      'logs',
      'transcript.jsonl'
    );
    if (!fs.existsSync(transcriptPath)) {
      throw new Error(`Transcript not found for conversation ${conversationId}`);
    }

    const dbMeta = this._readConversationMetadata();
    const meta = dbMeta.get(conversationId);
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

    const turns = [];
    const byModel = {};
    const byDate = {};
    let input = 0;
    let cacheRead = 0;
    let output = 0;
    let firstUserPrompt = '';

    for (const line of lines) {
      if (!line || line.length < 2) continue;
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }
      if (!firstUserPrompt && obj.type === 'USER_INPUT' && obj.content) {
        firstUserPrompt = sanitizeTitle(obj.content);
      }
      const inTok = Number(obj.input_tokens) || 0;
      const cacheTok = Number(obj.cache_read_tokens) || 0;
      const outTok = Number(obj.output_tokens) || 0;
      if (inTok === 0 && cacheTok === 0 && outTok === 0) continue;

      const totalTok = inTok + cacheTok + outTok;
      const createdAt = typeof obj.created_at === 'string' ? obj.created_at : '';
      const localDate = toLocalDate(createdAt);
      const localTime = toLocalTime(createdAt);
      const model = obj.model || 'unknown';

      input += inTok;
      cacheRead += cacheTok;
      output += outTok;

      turns.push({
        stepIndex: obj.step_index ?? turns.length,
        createdAt,
        localDate,
        localTime,
        model,
        input: inTok,
        cacheRead: cacheTok,
        output: outTok,
        total: totalTok,
        cacheHitRate: calcCacheHitRate(inTok, cacheTok),
        toolCalls: Array.isArray(obj.tool_calls) ? obj.tool_calls.length : 0,
      });

      if (!byModel[model]) {
        byModel[model] = { model, input: 0, cacheRead: 0, output: 0, total: 0, turns: 0 };
      }
      byModel[model].input += inTok;
      byModel[model].cacheRead += cacheTok;
      byModel[model].output += outTok;
      byModel[model].total += totalTok;
      byModel[model].turns += 1;

      if (!byDate[localDate]) {
        byDate[localDate] = { date: localDate, input: 0, cacheRead: 0, output: 0, total: 0, turns: 0 };
      }
      byDate[localDate].input += inTok;
      byDate[localDate].cacheRead += cacheTok;
      byDate[localDate].output += outTok;
      byDate[localDate].total += totalTok;
      byDate[localDate].turns += 1;
    }

    return {
      id: conversationId,
      title:
        (meta && (meta.title || meta.preview)) ||
        firstUserPrompt ||
        `Conversation ${conversationId.slice(0, 8)}`,
      workspace: (meta && meta.workspace) || '',
      parentId: (meta && meta.parentId) || '',
      input,
      cacheRead,
      output,
      total: input + cacheRead + output,
      turnsCount: turns.length,
      cacheHitRate: calcCacheHitRate(input, cacheRead),
      byModel: Object.values(byModel).sort((a, b) => b.total - a.total),
      byDate: Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date)),
      turns,
    };
  }
}
