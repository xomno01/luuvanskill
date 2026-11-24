import {
  App,
  applyDocumentTheme,
  applyHostStyleVariables,
} from '@modelcontextprotocol/ext-apps';
import { createPixelScene } from './pixel-scene.js';

let pixelScene = null;

const state = {
  data: null,
  activeTab: 'overview',
  dailyMonthFilter: 'all',
  convSearch: '',
  convMonthFilter: 'all',
  convDateFilter: '',
  convSort: 'recent',
  hideSubagents: false,
  loading: false,
  pendingConversationId: '',
};

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtExact(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function fmtCompact(n) {
  const v = Number(n || 0);
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(v);
}

function fmtModel(m) {
  if (!m || m === 'unknown') return 'Legacy / Unlogged';
  return m;
}

function applyThemeContext(ctx) {
  if (!ctx) return;
  if (ctx.theme) {
    applyDocumentTheme(ctx.theme);
    document.documentElement.setAttribute('data-theme', ctx.theme);
  }
  if (ctx.styles?.variables) {
    applyHostStyleVariables(ctx.styles.variables);
  }
}

function renderSummaryHeader(summary) {
  if (!summary) return;
  const { totals, todaySummary, thisMonthSummary, timeZone, scanDurationMs, generatedAt } = summary;

  document.getElementById('tz-pill').textContent = timeZone || 'Local';

  const updatedTime = generatedAt ? new Date(generatedAt).toLocaleTimeString('vi-VN') : '';
  document.getElementById('status-subtitle').textContent =
    `Đo thực tế từ ${fmtExact(totals.conversations)} hội thoại (${fmtExact(totals.turns)} lượt gọi LLM) · Cập nhật lúc ${updatedTime}`;

  const kpiTotal = document.getElementById('kpi-total');
  kpiTotal.textContent = fmtCompact(totals.total);
  kpiTotal.title = `${fmtExact(totals.total)} tokens`;
  document.getElementById('kpi-total-sub').textContent =
    `${fmtExact(totals.conversations)} hội thoại · ${fmtExact(totals.activeDays)} ngày hoạt động`;

  const kpiToday = document.getElementById('kpi-today');
  kpiToday.textContent = fmtCompact(todaySummary.total);
  kpiToday.title = `${fmtExact(todaySummary.total)} tokens`;
  document.getElementById('kpi-today-sub').textContent =
    `${todaySummary.date} · ${todaySummary.conversations} hội thoại · ${todaySummary.turns} lượt`;

  const kpiMonth = document.getElementById('kpi-month');
  kpiMonth.textContent = fmtCompact(thisMonthSummary.total);
  kpiMonth.title = `${fmtExact(thisMonthSummary.total)} tokens`;
  document.getElementById('kpi-month-sub').textContent =
    `${thisMonthSummary.month} · ${thisMonthSummary.conversations} hội thoại · ${thisMonthSummary.activeDays} ngày`;

  const kpiCache = document.getElementById('kpi-cache');
  kpiCache.textContent = `${totals.cacheHitRate}%`;
  kpiCache.title = `Cache Read: ${fmtExact(totals.cacheRead)} / Total Input: ${fmtExact(totals.input + totals.cacheRead)}`;
  document.getElementById('kpi-cache-sub').textContent =
    `Tiết kiệm ${fmtCompact(totals.cacheRead)} tokens từ cache`;

  // Composition bar
  const grand = Math.max(totals.total, 1);
  const inPct = ((totals.input / grand) * 100).toFixed(2);
  const cachePct = ((totals.cacheRead / grand) * 100).toFixed(2);
  const outPct = ((totals.output / grand) * 100).toFixed(2);

  document.getElementById('composition-legend').innerHTML = `
    <span class="legend-item" title="${fmtExact(totals.input)} tokens">
      <span class="legend-swatch swatch-input"></span>
      <span>Input mới: <strong>${fmtCompact(totals.input)}</strong> (${inPct}%)</span>
    </span>
    <span class="legend-item" title="${fmtExact(totals.cacheRead)} tokens">
      <span class="legend-swatch swatch-cache"></span>
      <span>Cache Read: <strong>${fmtCompact(totals.cacheRead)}</strong> (${cachePct}%)</span>
    </span>
    <span class="legend-item" title="${fmtExact(totals.output)} tokens">
      <span class="legend-swatch swatch-output"></span>
      <span>Output: <strong>${fmtCompact(totals.output)}</strong> (${outPct}%)</span>
    </span>
  `;

  document.getElementById('scan-meta').textContent =
    typeof scanDurationMs === 'number' ? `Quét trong ${scanDurationMs}ms` : '';

  document.getElementById('composition-track').innerHTML = `
    <div class="stacked-seg-input" style="width:${inPct}%"></div>
    <div class="stacked-seg-cache" style="width:${cachePct}%"></div>
    <div class="stacked-seg-output" style="width:${outPct}%"></div>
  `;

  if (pixelScene) {
    pixelScene.setStats(summary);
  }
}

function buildStackedBarChart(items, labelKey, chartId) {
  if (!items || items.length === 0) {
    return `<div class="empty-state">Chưa có dữ liệu biểu đồ.</div>`;
  }

  // Chronological order left -> right
  const ordered = [...items].reverse();
  const maxVal = Math.max(...ordered.map((d) => d.total), 1);

  const svgW = 860;
  const svgH = 210;
  const padL = 56;
  const padR = 14;
  const padT = 14;
  const padB = 30;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const slotW = plotW / ordered.length;
  const barW = Math.max(4, Math.min(34, slotW * 0.68));

  // Y gridlines (4 levels)
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const gridLines = yTicks
    .map((ratio) => {
      const y = padT + plotH * (1 - ratio);
      const val = maxVal * ratio;
      return `
        <line x1="${padL}" y1="${y.toFixed(1)}" x2="${svgW - padR}" y2="${y.toFixed(1)}" stroke="var(--border-secondary)" stroke-width="1" />
        <text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="var(--text-tertiary)" font-size="10" font-family="var(--font-mono)">${esc(fmtCompact(val))}</text>
      `;
    })
    .join('');

  const labelStep = Math.max(1, Math.ceil(ordered.length / 8));

  const bars = ordered
    .map((item, idx) => {
      const xCenter = padL + slotW * idx + slotW / 2;
      const x = xCenter - barW / 2;

      const hCache = (item.cacheRead / maxVal) * plotH;
      const hInput = (item.input / maxVal) * plotH;
      const hOutput = (item.output / maxVal) * plotH;

      const yCache = padT + plotH - hCache;
      const yInput = yCache - hInput;
      const yOutput = yInput - hOutput;

      const rawLabel = String(item[labelKey] || '');
      const shortLabel = rawLabel.length === 10 ? rawLabel.slice(5) : rawLabel;
      const showLabel = idx % labelStep === 0 || idx === ordered.length - 1;

      return `
        <g class="chart-bar-group" data-chart="${esc(chartId)}" data-idx="${idx}" style="cursor:pointer">
          <rect x="${(xCenter - slotW / 2).toFixed(1)}" y="${padT}" width="${slotW.toFixed(1)}" height="${plotH}" fill="transparent" />
          ${hCache > 0 ? `<rect x="${x.toFixed(1)}" y="${yCache.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, hCache).toFixed(1)}" fill="var(--tok-cache)" rx="1" />` : ''}
          ${hInput > 0 ? `<rect x="${x.toFixed(1)}" y="${yInput.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, hInput).toFixed(1)}" fill="var(--tok-input)" rx="1" />` : ''}
          ${hOutput > 0 ? `<rect x="${x.toFixed(1)}" y="${yOutput.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, hOutput).toFixed(1)}" fill="var(--tok-output)" rx="1" />` : ''}
          ${
            showLabel
              ? `<text x="${xCenter.toFixed(1)}" y="${svgH - 8}" text-anchor="middle" fill="var(--text-tertiary)" font-size="10" font-family="var(--font-mono)">${esc(shortLabel)}</text>`
              : ''
          }
        </g>
      `;
    })
    .join('');

  return `
    <div class="chart-box" data-chart-box="${esc(chartId)}">
      <svg class="chart-svg" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="none" role="img" aria-label="Biểu đồ token theo thời gian">
        ${gridLines}
        ${bars}
      </svg>
      <div class="chart-tooltip" id="tt-${esc(chartId)}"></div>
    </div>
  `;
}

function bindChartTooltips(chartId, items, labelKey, onBarClick) {
  const box = document.querySelector(`[data-chart-box="${chartId}"]`);
  const tt = document.getElementById(`tt-${chartId}`);
  if (!box || !tt || !items || items.length === 0) return;

  const ordered = [...items].reverse();
  const groups = box.querySelectorAll('.chart-bar-group');
  groups.forEach((g) => {
    const idx = Number(g.getAttribute('data-idx'));
    const item = ordered[idx];
    if (!item) return;

    g.addEventListener('mouseenter', (ev) => {
      tt.innerHTML = `
        <div class="tt-title">${esc(item[labelKey])}</div>
        <div class="tt-row"><span>Tổng cộng</span><strong>${fmtExact(item.total)}</strong></div>
        <div class="tt-row"><span>Cache Read</span><strong>${fmtCompact(item.cacheRead)}</strong></div>
        <div class="tt-row"><span>Input mới</span><strong>${fmtCompact(item.input)}</strong></div>
        <div class="tt-row"><span>Output</span><strong>${fmtCompact(item.output)}</strong></div>
        <div class="tt-row"><span>Hội thoại / Lượt</span><strong>${item.conversations} / ${item.turns}</strong></div>
      `;
      tt.classList.add('visible');
      positionTooltip(box, tt, ev);
    });

    g.addEventListener('mousemove', (ev) => {
      positionTooltip(box, tt, ev);
    });

    g.addEventListener('mouseleave', () => {
      tt.classList.remove('visible');
    });

    if (onBarClick) {
      g.addEventListener('click', () => onBarClick(item));
    }
  });
}

function positionTooltip(box, tt, ev) {
  const rect = box.getBoundingClientRect();
  let left = ev.clientX - rect.left + 12;
  let top = ev.clientY - rect.top - 10;
  if (left + 185 > rect.width) left = Math.max(8, ev.clientX - rect.left - 185);
  if (top + 130 > rect.height) top = Math.max(8, rect.height - 135);
  tt.style.left = `${left}px`;
  tt.style.top = `${Math.max(6, top)}px`;
}

function renderOverviewTab(data) {
  const recent30 = data.daily.slice(0, 30);
  const topConvs = [...data.conversations].sort((a, b) => b.total - a.total).slice(0, 8);
  const recentMonths = data.monthly.slice(0, 6);

  return `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title">Xu hướng sử dụng 30 ngày gần nhất</h2>
          <span class="panel-meta">Di chuột lên cột để xem chi tiết · Bấm vào cột để lọc hội thoại ngày đó</span>
        </div>
        ${buildStackedBarChart(recent30, 'date', 'overview-daily')}
      </div>

      <div class="overview-grid">
        <div class="panel">
          <div class="panel-head">
            <h2 class="panel-title">Tổng hợp theo Tháng</h2>
            <span class="panel-meta">${data.monthly.length} tháng</span>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th class="num">Ngày</th>
                  <th class="num">Hội thoại</th>
                  <th class="num">Cache %</th>
                  <th class="num">Tổng Token</th>
                </tr>
              </thead>
              <tbody>
                ${recentMonths
                  .map(
                    (m) => `
                  <tr class="clickable" data-jump-month="${esc(m.month)}">
                    <td><strong>${esc(m.month)}</strong></td>
                    <td class="num">${m.activeDays}</td>
                    <td class="num">${fmtExact(m.conversations)}</td>
                    <td class="num">${m.cacheHitRate}%</td>
                    <td class="num total-val" title="${fmtExact(m.total)}">${fmtCompact(m.total)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <h2 class="panel-title">Top Conversation tốn nhiều token nhất</h2>
            <span class="panel-meta">Bấm để xem từng lượt</span>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Conversation</th>
                  <th class="num">Lượt</th>
                  <th class="num">Tổng Token</th>
                </tr>
              </thead>
              <tbody>
                ${topConvs
                  .map(
                    (c) => `
                  <tr class="clickable" data-open-conv="${esc(c.id)}">
                    <td class="conv-title-cell">
                      <span class="conv-title" title="${esc(c.title)}">${esc(c.title)}</span>
                      <span class="conv-sub"><span>${esc(c.lastDate)}</span>${c.workspace ? `<span>${esc(c.workspace)}</span>` : ''}</span>
                    </td>
                    <td class="num">${fmtExact(c.turns)}</td>
                    <td class="num total-val" title="${fmtExact(c.total)}">${fmtCompact(c.total)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDailyTab(data) {
  const months = data.monthly.map((m) => m.month);
  const rows =
    state.dailyMonthFilter === 'all'
      ? data.daily
      : data.daily.filter((d) => d.month === state.dailyMonthFilter);

  const chartSlice = rows.slice(0, 31);

  return `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="controls-row">
        <label for="daily-month-select" class="panel-meta">Lọc theo tháng:</label>
        <select id="daily-month-select" class="select-ctrl">
          <option value="all" ${state.dailyMonthFilter === 'all' ? 'selected' : ''}>Tất cả các tháng (${data.daily.length} ngày)</option>
          ${months
            .map(
              (m) =>
                `<option value="${esc(m)}" ${state.dailyMonthFilter === m ? 'selected' : ''}>Tháng ${esc(m)}</option>`
            )
            .join('')}
        </select>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title">Biểu đồ Token theo Ngày</h2>
          <span class="panel-meta">Hiển thị ${chartSlice.length} ngày gần nhất trong bộ lọc</span>
        </div>
        ${buildStackedBarChart(chartSlice, 'date', 'daily-chart')}
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title">Chi tiết từng ngày</h2>
          <span class="panel-meta">${rows.length} ngày hoạt động · Bấm vào 1 ngày để xem các conversation ngày đó</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th class="num">Hội thoại</th>
                <th class="num">Lượt gọi</th>
                <th class="num">Input mới</th>
                <th class="num">Cache Read</th>
                <th class="num">Output</th>
                <th class="num">Cache %</th>
                <th class="num">Tổng Token</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (d) => `
                <tr class="clickable" data-jump-date="${esc(d.date)}">
                  <td><strong>${esc(d.date)}</strong></td>
                  <td class="num">${fmtExact(d.conversations)}</td>
                  <td class="num">${fmtExact(d.turns)}</td>
                  <td class="num tok-in-txt" title="${fmtExact(d.input)}">${fmtCompact(d.input)}</td>
                  <td class="num tok-cache-txt" title="${fmtExact(d.cacheRead)}">${fmtCompact(d.cacheRead)}</td>
                  <td class="num tok-out-txt" title="${fmtExact(d.output)}">${fmtCompact(d.output)}</td>
                  <td class="num">${d.cacheHitRate}%</td>
                  <td class="num total-val" title="${fmtExact(d.total)}">${fmtCompact(d.total)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderMonthlyTab(data) {
  const rows = data.monthly;

  return `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title">Biểu đồ Token theo Tháng</h2>
          <span class="panel-meta">${rows.length} tháng có dữ liệu</span>
        </div>
        ${buildStackedBarChart(rows, 'month', 'monthly-chart')}
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title">Thống kê chi tiết theo Tháng</h2>
          <span class="panel-meta">Bấm vào tháng để xem chi tiết từng ngày</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tháng</th>
                <th class="num">Ngày hoạt động</th>
                <th class="num">Hội thoại</th>
                <th class="num">Lượt gọi</th>
                <th class="num">Input mới</th>
                <th class="num">Cache Read</th>
                <th class="num">Output</th>
                <th class="num">Cache %</th>
                <th class="num">Tổng Token</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (m) => `
                <tr class="clickable" data-jump-month="${esc(m.month)}">
                  <td><strong>${esc(m.month)}</strong></td>
                  <td class="num">${m.activeDays}</td>
                  <td class="num">${fmtExact(m.conversations)}</td>
                  <td class="num">${fmtExact(m.turns)}</td>
                  <td class="num tok-in-txt" title="${fmtExact(m.input)}">${fmtCompact(m.input)}</td>
                  <td class="num tok-cache-txt" title="${fmtExact(m.cacheRead)}">${fmtCompact(m.cacheRead)}</td>
                  <td class="num tok-out-txt" title="${fmtExact(m.output)}">${fmtCompact(m.output)}</td>
                  <td class="num">${m.cacheHitRate}%</td>
                  <td class="num total-val" title="${fmtExact(m.total)}">${fmtCompact(m.total)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderConversationsTab(data) {
  const q = state.convSearch.trim().toLowerCase();
  let list = data.conversations.filter((c) => {
    if (state.hideSubagents && c.isSubagent) return false;
    if (state.convDateFilter && c.lastDate !== state.convDateFilter) return false;
    if (!state.convDateFilter && state.convMonthFilter !== 'all' && c.lastMonth !== state.convMonthFilter) {
      return false;
    }
    if (q) {
      const hay = `${c.title} ${c.workspace} ${c.id} ${c.primaryModel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (state.convSort === 'total') {
    list = [...list].sort((a, b) => b.total - a.total);
  } else if (state.convSort === 'turns') {
    list = [...list].sort((a, b) => b.turns - a.turns);
  } else if (state.convSort === 'output') {
    list = [...list].sort((a, b) => b.output - a.output);
  } else {
    list = [...list].sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
  }

  const filteredTotal = list.reduce((s, c) => s + c.total, 0);
  const months = data.monthly.map((m) => m.month);

  return `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="controls-row">
        <input
          id="conv-search-input"
          class="input-ctrl"
          type="search"
          placeholder="Tìm theo tên conversation, workspace hoặc ID..."
          value="${esc(state.convSearch)}"
        />
        <select id="conv-month-select" class="select-ctrl">
          <option value="all" ${state.convMonthFilter === 'all' ? 'selected' : ''}>Tất cả tháng</option>
          ${months
            .map(
              (m) =>
                `<option value="${esc(m)}" ${state.convMonthFilter === m ? 'selected' : ''}>Tháng ${esc(m)}</option>`
            )
            .join('')}
        </select>
        <select id="conv-sort-select" class="select-ctrl">
          <option value="recent" ${state.convSort === 'recent' ? 'selected' : ''}>Sắp xếp: Mới nhất</option>
          <option value="total" ${state.convSort === 'total' ? 'selected' : ''}>Sắp xếp: Tổng token cao nhất</option>
          <option value="turns" ${state.convSort === 'turns' ? 'selected' : ''}>Sắp xếp: Nhiều lượt gọi nhất</option>
          <option value="output" ${state.convSort === 'output' ? 'selected' : ''}>Sắp xếp: Output cao nhất</option>
        </select>
        <label class="checkbox-label">
          <input id="hide-subagents-cb" type="checkbox" ${state.hideSubagents ? 'checked' : ''} />
          <span>Ẩn subagent</span>
        </label>
        ${
          state.convDateFilter
            ? `<button class="btn" id="clear-date-filter" type="button">Đang lọc ngày ${esc(state.convDateFilter)} ×</button>`
            : ''
        }
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title">Danh sách Conversation</h2>
          <span class="panel-meta">${fmtExact(list.length)} hội thoại · Tổng: ${fmtCompact(filteredTotal)} (${fmtExact(filteredTotal)})</span>
        </div>
        ${
          list.length === 0
            ? `<div class="empty-state">Không tìm thấy conversation nào khớp với bộ lọc.</div>`
            : `
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Conversation</th>
                  <th>Ngày gần nhất</th>
                  <th>Model chính</th>
                  <th class="num">Lượt</th>
                  <th class="num">Input mới</th>
                  <th class="num">Cache Read</th>
                  <th class="num">Output</th>
                  <th class="num">Tổng Token</th>
                </tr>
              </thead>
              <tbody>
                ${list
                  .slice(0, 200)
                  .map(
                    (c) => `
                  <tr class="clickable" data-open-conv="${esc(c.id)}">
                    <td class="conv-title-cell">
                      <span class="conv-title" title="${esc(c.title)}">${esc(c.title)}</span>
                      <span class="conv-sub">
                        <span>${esc(c.id.slice(0, 8))}</span>
                        ${c.workspace ? `<span>${esc(c.workspace)}</span>` : ''}
                        ${c.isSubagent ? `<span class="badge-sub">subagent</span>` : ''}
                      </span>
                    </td>
                    <td style="white-space:nowrap;font-family:var(--font-mono)">${esc(c.lastDate)}</td>
                    <td><span class="model-tag">${esc(fmtModel(c.primaryModel))}</span></td>
                    <td class="num">${fmtExact(c.turns)}</td>
                    <td class="num tok-in-txt" title="${fmtExact(c.input)}">${fmtCompact(c.input)}</td>
                    <td class="num tok-cache-txt" title="${fmtExact(c.cacheRead)}">${fmtCompact(c.cacheRead)}</td>
                    <td class="num tok-out-txt" title="${fmtExact(c.output)}">${fmtCompact(c.output)}</td>
                    <td class="num total-val" title="${fmtExact(c.total)}">${fmtCompact(c.total)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
          ${list.length > 200 ? `<div class="panel-head"><span class="panel-meta">Đang hiển thị 200/${list.length} hội thoại. Hãy dùng ô tìm kiếm hoặc lọc theo tháng để thu hẹp.</span></div>` : ''}
        `
        }
      </div>
    </div>
  `;
}

function renderModelsTab(data) {
  return `
    <div class="panel">
      <div class="panel-head">
        <h2 class="panel-title">Thống kê Token theo Model</h2>
        <span class="panel-meta">${data.models.length} nhóm model</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Model</th>
              <th class="num">Hội thoại</th>
              <th class="num">Lượt gọi</th>
              <th class="num">Input mới</th>
              <th class="num">Cache Read</th>
              <th class="num">Output</th>
              <th class="num">Cache %</th>
              <th class="num">Tỉ trọng</th>
              <th class="num">Tổng Token</th>
            </tr>
          </thead>
          <tbody>
            ${data.models
              .map(
                (m) => `
              <tr>
                <td><span class="model-tag">${esc(fmtModel(m.model))}</span></td>
                <td class="num">${fmtExact(m.conversations)}</td>
                <td class="num">${fmtExact(m.turns)}</td>
                <td class="num tok-in-txt" title="${fmtExact(m.input)}">${fmtCompact(m.input)}</td>
                <td class="num tok-cache-txt" title="${fmtExact(m.cacheRead)}">${fmtCompact(m.cacheRead)}</td>
                <td class="num tok-out-txt" title="${fmtExact(m.output)}">${fmtCompact(m.output)}</td>
                <td class="num">${m.cacheHitRate}%</td>
                <td class="num" style="white-space:nowrap">
                  <span class="share-bar-bg"><span class="share-bar-fill" style="width:${Math.min(100, m.sharePct)}%"></span></span>
                  ${m.sharePct}%
                </td>
                <td class="num total-val" title="${fmtExact(m.total)}">${fmtCompact(m.total)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderActiveTab() {
  const container = document.getElementById('tab-content');
  if (!state.data) {
    container.innerHTML = `<div class="panel"><div class="empty-state">Đang tải dữ liệu...</div></div>`;
    return;
  }

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.setAttribute('aria-selected', btn.dataset.tab === state.activeTab ? 'true' : 'false');
  });

  if (state.activeTab === 'overview') {
    container.innerHTML = renderOverviewTab(state.data);
    bindChartTooltips('overview-daily', state.data.daily.slice(0, 30), 'date', (item) => {
      state.convDateFilter = item.date;
      state.activeTab = 'conversations';
      renderActiveTab();
    });
  } else if (state.activeTab === 'daily') {
    container.innerHTML = renderDailyTab(state.data);
    const filtered =
      state.dailyMonthFilter === 'all'
        ? state.data.daily
        : state.data.daily.filter((d) => d.month === state.dailyMonthFilter);
    bindChartTooltips('daily-chart', filtered.slice(0, 31), 'date', (item) => {
      state.convDateFilter = item.date;
      state.activeTab = 'conversations';
      renderActiveTab();
    });
    const sel = document.getElementById('daily-month-select');
    if (sel) {
      sel.addEventListener('change', () => {
        state.dailyMonthFilter = sel.value;
        renderActiveTab();
      });
    }
  } else if (state.activeTab === 'monthly') {
    container.innerHTML = renderMonthlyTab(state.data);
    bindChartTooltips('monthly-chart', state.data.monthly, 'month', (item) => {
      state.dailyMonthFilter = item.month;
      state.activeTab = 'daily';
      renderActiveTab();
    });
  } else if (state.activeTab === 'conversations') {
    container.innerHTML = renderConversationsTab(state.data);
    const searchEl = document.getElementById('conv-search-input');
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        state.convSearch = searchEl.value;
        renderActiveTab();
        const refocused = document.getElementById('conv-search-input');
        if (refocused) {
          refocused.focus();
          refocused.setSelectionRange(refocused.value.length, refocused.value.length);
        }
      });
    }
    const monthSel = document.getElementById('conv-month-select');
    if (monthSel) {
      monthSel.addEventListener('change', () => {
        state.convMonthFilter = monthSel.value;
        state.convDateFilter = '';
        renderActiveTab();
      });
    }
    const sortSel = document.getElementById('conv-sort-select');
    if (sortSel) {
      sortSel.addEventListener('change', () => {
        state.convSort = sortSel.value;
        renderActiveTab();
      });
    }
    const subCb = document.getElementById('hide-subagents-cb');
    if (subCb) {
      subCb.addEventListener('change', () => {
        state.hideSubagents = subCb.checked;
        renderActiveTab();
      });
    }
    const clearBtn = document.getElementById('clear-date-filter');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.convDateFilter = '';
        renderActiveTab();
      });
    }
  } else if (state.activeTab === 'models') {
    container.innerHTML = renderModelsTab(state.data);
  }

  // Bind row click shortcuts
  container.querySelectorAll('[data-jump-month]').forEach((row) => {
    row.addEventListener('click', () => {
      state.dailyMonthFilter = row.getAttribute('data-jump-month');
      state.activeTab = 'daily';
      renderActiveTab();
    });
  });

  container.querySelectorAll('[data-jump-date]').forEach((row) => {
    row.addEventListener('click', () => {
      state.convDateFilter = row.getAttribute('data-jump-date');
      state.activeTab = 'conversations';
      renderActiveTab();
    });
  });

  container.querySelectorAll('[data-open-conv]').forEach((row) => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-open-conv');
      if (id) openConversationDetail(id);
    });
  });
}

// MCP App instance
const app = new App({ name: 'Token Usage', version: '1.0.0' }, {});

async function openConversationDetail(convId) {
  const drawer = document.getElementById('detail-drawer');
  const titleEl = document.getElementById('drawer-title');
  const idEl = document.getElementById('drawer-id');
  const bodyEl = document.getElementById('drawer-body');

  drawer.hidden = false;
  titleEl.textContent = 'Đang tải chi tiết...';
  idEl.textContent = convId;
  bodyEl.innerHTML = `<div class="empty-state">Đang đọc transcript của conversation...</div>`;

  try {
    const res = await app.callServerTool({
      name: 'app_get_conversation_detail',
      arguments: { conversation_id: convId },
    });
    const detail = res?.structuredContent;
    if (!detail) throw new Error('Không nhận được dữ liệu chi tiết');

    titleEl.textContent = detail.title;
    idEl.textContent = `${detail.id}${detail.workspace ? ` · ${detail.workspace}` : ''}`;

    bodyEl.innerHTML = `
      <div class="kpi-strip" style="grid-template-columns:repeat(4, minmax(0, 1fr))">
        <div class="kpi-cell">
          <span class="kpi-label">Tổng Token</span>
          <span class="kpi-value" style="font-size:18px" title="${fmtExact(detail.total)}">${fmtCompact(detail.total)}</span>
          <span class="kpi-sub">${fmtExact(detail.turnsCount)} lượt gọi</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">Input mới</span>
          <span class="kpi-value tok-in-txt" style="font-size:18px" title="${fmtExact(detail.input)}">${fmtCompact(detail.input)}</span>
          <span class="kpi-sub">Uncached</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">Cache Read</span>
          <span class="kpi-value tok-cache-txt" style="font-size:18px" title="${fmtExact(detail.cacheRead)}">${fmtCompact(detail.cacheRead)}</span>
          <span class="kpi-sub">Hit ${detail.cacheHitRate}%</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">Output</span>
          <span class="kpi-value tok-out-txt" style="font-size:18px" title="${fmtExact(detail.output)}">${fmtCompact(detail.output)}</span>
          <span class="kpi-sub">Model response</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3 class="panel-title">Phân bổ theo Model</h3>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th class="num">Lượt</th>
                <th class="num">Input mới</th>
                <th class="num">Cache Read</th>
                <th class="num">Output</th>
                <th class="num">Tổng</th>
              </tr>
            </thead>
            <tbody>
              ${detail.byModel
                .map(
                  (m) => `
                <tr>
                  <td><span class="model-tag">${esc(fmtModel(m.model))}</span></td>
                  <td class="num">${fmtExact(m.turns)}</td>
                  <td class="num tok-in-txt">${fmtCompact(m.input)}</td>
                  <td class="num tok-cache-txt">${fmtCompact(m.cacheRead)}</td>
                  <td class="num tok-out-txt">${fmtCompact(m.output)}</td>
                  <td class="num total-val">${fmtCompact(m.total)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3 class="panel-title">Lịch sử từng lượt gọi LLM</h3>
          <span class="panel-meta">${detail.turns.length} lượt</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Thời gian</th>
                <th>Model</th>
                <th class="num">Input</th>
                <th class="num">Cache</th>
                <th class="num">Output</th>
                <th class="num">Tổng</th>
              </tr>
            </thead>
            <tbody>
              ${detail.turns
                .slice(-150)
                .reverse()
                .map(
                  (t) => `
                <tr>
                  <td style="font-family:var(--font-mono)">#${t.stepIndex}</td>
                  <td style="white-space:nowrap;font-family:var(--font-mono)">${esc(t.localDate)} ${esc(t.localTime)}</td>
                  <td><span class="model-tag">${esc(fmtModel(t.model))}</span></td>
                  <td class="num tok-in-txt">${fmtExact(t.input)}</td>
                  <td class="num tok-cache-txt">${fmtExact(t.cacheRead)}</td>
                  <td class="num tok-out-txt">${fmtExact(t.output)}</td>
                  <td class="num total-val">${fmtExact(t.total)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    bodyEl.innerHTML = `<div class="empty-state">Lỗi tải chi tiết: ${esc(err?.message || err)}</div>`;
  }
}

async function fetchFullData(isManualRefresh = false) {
  if (state.loading) return;
  state.loading = true;
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) refreshBtn.disabled = true;

  try {
    const res = await app.callServerTool({
      name: 'app_get_usage_data',
      arguments: { refresh: isManualRefresh },
    });
    const full = res?.structuredContent;
    if (full && full.totals) {
      state.data = full;
      renderSummaryHeader(full);
      renderActiveTab();
      if (state.pendingConversationId) {
        const targetId = state.pendingConversationId;
        state.pendingConversationId = '';
        openConversationDetail(targetId);
      }
    }
  } catch (err) {
    document.getElementById('status-subtitle').textContent =
      `Không thể tải dữ liệu từ MCP server: ${err?.message || err}`;
  } finally {
    state.loading = false;
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

function wireStaticEvents() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab;
      renderActiveTab();
    });
  });

  document.getElementById('refresh-btn').addEventListener('click', () => {
    if (pixelScene) pixelScene.celebrate('Meo! Đang làm mới dữ liệu token mới nhất…');
    fetchFullData(true);
  });

  const drawer = document.getElementById('detail-drawer');
  document.getElementById('drawer-close').addEventListener('click', () => {
    drawer.hidden = true;
  });
  drawer.addEventListener('click', (ev) => {
    if (ev.target === drawer) drawer.hidden = true;
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !drawer.hidden) drawer.hidden = true;
  });
}

// Register MCP App handlers BEFORE connect()
app.ontoolinput = ({ arguments: args }) => {
  if (args?.view) state.activeTab = args.view;
  if (args?.month) {
    state.dailyMonthFilter = args.month;
    state.convMonthFilter = args.month;
  }
  if (args?.date) state.convDateFilter = args.date;
  if (args?.conversation_id) state.pendingConversationId = args.conversation_id;
};

app.ontoolresult = (result) => {
  const sc = result?.structuredContent;
  if (sc?.initialParams) {
    if (sc.initialParams.view) state.activeTab = sc.initialParams.view;
    if (sc.initialParams.month) {
      state.dailyMonthFilter = sc.initialParams.month;
      state.convMonthFilter = sc.initialParams.month;
    }
    if (sc.initialParams.date) state.convDateFilter = sc.initialParams.date;
    if (sc.initialParams.conversationId) {
      state.pendingConversationId = sc.initialParams.conversationId;
    }
  }
  if (sc?.summary) {
    renderSummaryHeader(sc.summary);
  }
  fetchFullData(false);
};

app.onhostcontextchanged = (ctx) => {
  applyThemeContext(ctx);
};

async function init() {
  wireStaticEvents();
  pixelScene = createPixelScene(
    document.getElementById('pixel-stage'),
    document.getElementById('pixel-speech-text')
  );
  try {
    await app.connect();
    applyThemeContext(app.getHostContext());
    // Also fetch immediately in case entrypoint launched without prior ontoolresult
    fetchFullData(false);
  } catch (err) {
    document.getElementById('status-subtitle').textContent =
      'Đang chạy ngoài host Antigravity MCP App (cần mở từ sidebar hoặc side pane của Antigravity).';
  }
}

init();
