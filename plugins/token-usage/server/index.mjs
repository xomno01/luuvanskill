import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { TokenUsageScanner } from './scanner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_ROOT = path.resolve(__dirname, '..');

const APP_URI = 'ui://token-usage/dashboard.html';
const APP_MIME_TYPE = 'text/html;profile=mcp-app';

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--data-dir=')) {
      opts.dataDir = arg.slice('--data-dir='.length);
    } else if (arg === '--data-dir' && argv[i + 1]) {
      opts.dataDir = argv[++i];
    } else if (arg.startsWith('--app-data-dir=')) {
      opts.appDataDir = arg.slice('--app-data-dir='.length);
    }
  }
  return opts;
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function fmtCompact(n) {
  const v = Number(n || 0);
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(v);
}

function readDashboardHtml() {
  const htmlPath =
    process.env.TOKEN_USAGE_APP_HTML ||
    path.join(PLUGIN_ROOT, 'dist', 'dashboard.html');
  if (!fs.existsSync(htmlPath)) {
    return `<!doctype html><html><body style="font-family:system-ui;padding:24px;"><h2>Token Usage UI not built</h2><p>Run <code>npm run build:ui</code> in ${PLUGIN_ROOT}.</p></body></html>`;
  }
  return fs.readFileSync(htmlPath, 'utf8');
}

const cliOpts = parseArgs(process.argv.slice(2));
const scanner = new TokenUsageScanner({
  appDataDir: cliOpts.appDataDir,
  dataDir: cliOpts.dataDir,
});

const server = new McpServer(
  {
    name: 'token-usage',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// 1. Register UI HTML resource (served fresh on every view open)
server.registerResource(
  'Token Usage Dashboard',
  APP_URI,
  {
    description: 'Interactive Antigravity Token Usage dashboard (per conversation, daily, monthly, and total)',
    mimeType: APP_MIME_TYPE,
    _meta: {
      ui: {
        prefersBorder: false,
      },
    },
  },
  async () => ({
    contents: [
      {
        uri: APP_URI,
        mimeType: APP_MIME_TYPE,
        text: readDashboardHtml(),
        _meta: {
          ui: {
            prefersBorder: false,
          },
        },
      },
    ],
  })
);

// 2. Primary Dashboard Tool — attached to Sidebar (global) & Side Pane (aux_pane) & Inline
server.registerTool(
  'open_token_dashboard',
  {
    title: 'Token Usage',
    description:
      'Open the interactive Antigravity Token Usage dashboard showing exact token consumption per conversation, per day, per month, per model, and all-time totals.',
    inputSchema: z.object({
      view: z
        .enum(['overview', 'daily', 'monthly', 'conversations', 'models'])
        .optional()
        .describe('Initial tab to display (default: overview)'),
      month: z
        .string()
        .optional()
        .describe('Optional YYYY-MM month filter'),
      date: z
        .string()
        .optional()
        .describe('Optional YYYY-MM-DD date filter'),
      conversation_id: z
        .string()
        .optional()
        .describe('Optional conversation ID to inspect immediately'),
    }),
    _meta: {
      ui: {
        resourceUri: APP_URI,
      },
      'com.google.antigravity/ui': {
        entrypoints: [
          { type: 'aux_pane', title: 'Token Usage' },
          { type: 'global', title: 'Token Usage' },
        ],
      },
    },
  },
  async (args = {}) => {
    const report = scanner.scanAll();
    const summaryText = [
      `Antigravity Token Usage (${report.timeZone})`,
      `- Today (${report.todaySummary.date}): ${fmtCompact(report.todaySummary.total)} tokens (${fmtNum(report.todaySummary.total)}) | ${report.todaySummary.conversations} conversations | ${report.todaySummary.turns} turns | Cache hit ${report.todaySummary.cacheHitRate}%`,
      `- This month (${report.thisMonthSummary.month}): ${fmtCompact(report.thisMonthSummary.total)} tokens (${fmtNum(report.thisMonthSummary.total)}) | ${report.thisMonthSummary.conversations} conversations | ${report.thisMonthSummary.activeDays} active days`,
      `- All-time total: ${fmtCompact(report.totals.total)} tokens (${fmtNum(report.totals.total)}) | Input: ${fmtCompact(report.totals.input)} | Cache Read: ${fmtCompact(report.totals.cacheRead)} | Output: ${fmtCompact(report.totals.output)} | ${report.totals.conversations} conversations`,
    ].join('\n');

    // Keep initial structuredContent compact (< 100 KB); the UI fetches full conversation list via app_get_usage_data
    return {
      content: [{ type: 'text', text: summaryText }],
      structuredContent: {
        initialParams: {
          view: args.view || 'overview',
          month: args.month || '',
          date: args.date || '',
          conversationId: args.conversation_id || '',
        },
        summary: {
          generatedAt: report.generatedAt,
          scanDurationMs: report.scanDurationMs,
          timeZone: report.timeZone,
          today: report.today,
          currentMonth: report.currentMonth,
          totals: report.totals,
          todaySummary: report.todaySummary,
          thisMonthSummary: report.thisMonthSummary,
        },
      },
    };
  }
);

// 3. Quick Text/Data Query Tool for Chat
server.registerTool(
  'get_token_summary',
  {
    title: 'Get Token Summary',
    description:
      'Query exact Antigravity token usage numbers for today, this month, all-time, daily breakdown, monthly breakdown, or top conversations.',
    inputSchema: z.object({
      period: z
        .enum(['overview', 'today', 'month', 'daily', 'monthly', 'top_conversations', 'models'])
        .optional()
        .describe('Which slice of token usage to return (default: overview)'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Maximum number of rows to return (default: 15)'),
    }),
  },
  async (args = {}) => {
    const report = scanner.scanAll();
    const period = args.period || 'overview';
    const limit = args.limit || 15;

    let text = '';
    if (period === 'today') {
      const t = report.todaySummary;
      text = `Today (${t.date}): ${fmtNum(t.total)} total tokens (Input: ${fmtNum(t.input)}, Cache Read: ${fmtNum(t.cacheRead)}, Output: ${fmtNum(t.output)}, Cache Hit: ${t.cacheHitRate}%, Turns: ${t.turns}, Conversations: ${t.conversations}).`;
    } else if (period === 'month') {
      const m = report.thisMonthSummary;
      text = `This Month (${m.month}): ${fmtNum(m.total)} total tokens (Input: ${fmtNum(m.input)}, Cache Read: ${fmtNum(m.cacheRead)}, Output: ${fmtNum(m.output)}, Cache Hit: ${m.cacheHitRate}%, Turns: ${m.turns}, Conversations: ${m.conversations}, Active Days: ${m.activeDays}).`;
    } else if (period === 'daily') {
      const rows = report.daily.slice(0, limit);
      text =
        `Daily Token Usage (latest ${rows.length} days):\n` +
        rows
          .map(
            (d) =>
              `${d.date}: ${fmtCompact(d.total)} (in ${fmtCompact(d.input)} / cache ${fmtCompact(d.cacheRead)} / out ${fmtCompact(d.output)}, ${d.conversations} convs, ${d.turns} turns)`
          )
          .join('\n');
    } else if (period === 'monthly') {
      const rows = report.monthly.slice(0, limit);
      text =
        `Monthly Token Usage:\n` +
        rows
          .map(
            (m) =>
              `${m.month}: ${fmtCompact(m.total)} (in ${fmtCompact(m.input)} / cache ${fmtCompact(m.cacheRead)} / out ${fmtCompact(m.output)}, ${m.activeDays} days, ${m.conversations} convs)`
          )
          .join('\n');
    } else if (period === 'top_conversations') {
      const rows = [...report.conversations]
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
      text =
        `Top ${rows.length} Conversations by Total Tokens:\n` +
        rows
          .map(
            (c, idx) =>
              `${idx + 1}. [${c.lastDate}] ${c.title} (${c.id.slice(0, 8)}) — ${fmtCompact(c.total)} (in ${fmtCompact(c.input)} / cache ${fmtCompact(c.cacheRead)} / out ${fmtCompact(c.output)}, ${c.turns} turns)`
          )
          .join('\n');
    } else if (period === 'models') {
      text =
        `Token Usage by Model:\n` +
        report.models
          .map(
            (m) =>
              `- ${m.model}: ${fmtCompact(m.total)} (${m.sharePct}%, ${m.turns} turns, cache ${m.cacheHitRate}%)`
          )
          .join('\n');
    } else {
      text = [
        `Antigravity Token Usage Overview (${report.timeZone}):`,
        `Today (${report.todaySummary.date}): ${fmtCompact(report.todaySummary.total)} (${fmtNum(report.todaySummary.total)})`,
        `This Month (${report.thisMonthSummary.month}): ${fmtCompact(report.thisMonthSummary.total)} (${fmtNum(report.thisMonthSummary.total)})`,
        `All-Time Total: ${fmtCompact(report.totals.total)} (${fmtNum(report.totals.total)}) across ${report.totals.conversations} conversations & ${report.totals.activeDays} active days`,
        `Breakdown: Input ${fmtCompact(report.totals.input)} | Cache Read ${fmtCompact(report.totals.cacheRead)} (${report.totals.cacheHitRate}%) | Output ${fmtCompact(report.totals.output)}`,
      ].join('\n');
    }

    return {
      content: [{ type: 'text', text }],
    };
  }
);

// 4. App-only Tool: Full Usage Dataset (bypasses 1 MiB trajectory cap)
server.registerTool(
  'app_get_usage_data',
  {
    title: 'Fetch Full Usage Data',
    description: 'Internal app-only tool to fetch complete token usage dataset.',
    inputSchema: z.object({
      refresh: z.boolean().optional(),
    }),
    _meta: {
      ui: {
        visibility: ['app'],
      },
    },
  },
  async () => {
    const report = scanner.scanAll();
    return {
      content: [{ type: 'text', text: 'OK' }],
      structuredContent: report,
    };
  }
);

// 5. App-only Tool: Single Conversation Turn-by-Turn Detail
server.registerTool(
  'app_get_conversation_detail',
  {
    title: 'Fetch Conversation Token Detail',
    description: 'Internal app-only tool to fetch turn-by-turn token breakdown for a conversation.',
    inputSchema: z.object({
      conversation_id: z.string(),
    }),
    _meta: {
      ui: {
        visibility: ['app'],
      },
    },
  },
  async (args) => {
    const detail = scanner.getConversationDetail(args.conversation_id);
    return {
      content: [{ type: 'text', text: 'OK' }],
      structuredContent: detail,
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`[token-usage] Fatal error: ${err?.stack || err}\n`);
  process.exit(1);
});
