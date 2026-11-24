import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

async function build() {
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, 'app.js')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    minify: true,
    write: false,
  });

  const bundledJs = result.outputFiles[0].text;
  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Thống kê lượng token sử dụng thực tế của Antigravity theo hội thoại, ngày, tháng và tổng cộng." />
  <title>Antigravity Token Usage</title>
  <style>${css.trim()}</style>
</head>
<body>
  <main class="app-shell" id="app-root">
    <header class="topbar">
      <div class="topbar-title-group">
        <h1 class="topbar-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="13" width="4" height="8" rx="1" fill="currentColor" opacity="0.5"/>
            <rect x="10" y="8" width="4" height="13" rx="1" fill="#10b981"/>
            <rect x="17" y="3" width="4" height="18" rx="1" fill="#f59e0b"/>
          </svg>
          <span>Antigravity Token Usage</span>
        </h1>
        <p class="topbar-subtitle" id="status-subtitle">Đang quét dữ liệu token thực tế từ Antigravity…</p>
      </div>
      <div class="topbar-actions">
        <span class="meta-pill" id="tz-pill">Local time</span>
        <button class="btn" id="refresh-btn" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.64-6.36"/>
            <polyline points="21 3 21 9 15 9"/>
          </svg>
          <span>Làm mới</span>
        </button>
      </div>
    </header>

    <section class="pixel-stage-card" aria-label="Sân khấu pixel đồng hành">
      <canvas class="pixel-canvas" id="pixel-stage" height="104" aria-label="Bé Mèo Pixel thu thập xu token, bấm để tương tác"></canvas>
      <div class="pixel-speech">
        <span class="pixel-speech-text" id="pixel-speech-text">Meo meo! Đang canh từng token cho anh nè…</span>
        <span class="pixel-speech-hint">Bấm vào sân khấu để thả tim &amp; xu</span>
      </div>
    </section>

    <section class="kpi-strip" aria-label="Tổng quan token">
      <div class="kpi-cell">
        <div class="kpi-head-row">
          <svg class="pixel-icon" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">
            <rect x="2" y="1" width="4" height="1" fill="#fbbf24"/>
            <rect x="1" y="2" width="6" height="4" fill="#fbbf24"/>
            <rect x="2" y="2" width="1" height="3" fill="#fef08a"/>
            <rect x="2" y="6" width="4" height="1" fill="#b45309"/>
          </svg>
          <span class="kpi-label">Tổng cộng (All-Time)</span>
        </div>
        <span class="kpi-value" id="kpi-total">0</span>
        <span class="kpi-sub" id="kpi-total-sub">Đang tải…</span>
      </div>
      <div class="kpi-cell">
        <div class="kpi-head-row">
          <svg class="pixel-icon" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">
            <rect x="3" y="0" width="2" height="1" fill="#f59e0b"/>
            <rect x="2" y="2" width="4" height="4" fill="#fbbf24"/>
            <rect x="3" y="3" width="2" height="2" fill="#fef08a"/>
            <rect x="0" y="3" width="1" height="2" fill="#f59e0b"/>
            <rect x="7" y="3" width="1" height="2" fill="#f59e0b"/>
            <rect x="3" y="7" width="2" height="1" fill="#f59e0b"/>
          </svg>
          <span class="kpi-label">Hôm nay</span>
        </div>
        <span class="kpi-value" id="kpi-today">0</span>
        <span class="kpi-sub" id="kpi-today-sub">0 hội thoại</span>
      </div>
      <div class="kpi-cell">
        <div class="kpi-head-row">
          <svg class="pixel-icon" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">
            <rect x="1" y="1" width="6" height="2" fill="#38bdf8"/>
            <rect x="1" y="3" width="6" height="4" fill="#e2e8f0"/>
            <rect x="2" y="4" width="1" height="1" fill="#0284c7"/>
            <rect x="5" y="4" width="1" height="1" fill="#0284c7"/>
            <rect x="2" y="6" width="4" height="1" fill="#94a3b8"/>
          </svg>
          <span class="kpi-label">Tháng này</span>
        </div>
        <span class="kpi-value" id="kpi-month">0</span>
        <span class="kpi-sub" id="kpi-month-sub">0 hội thoại</span>
      </div>
      <div class="kpi-cell">
        <div class="kpi-head-row">
          <svg class="pixel-icon" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">
            <rect x="3" y="1" width="2" height="1" fill="#6ee7b7"/>
            <rect x="2" y="2" width="4" height="2" fill="#10b981"/>
            <rect x="1" y="4" width="6" height="2" fill="#059669"/>
            <rect x="3" y="6" width="2" height="1" fill="#047857"/>
          </svg>
          <span class="kpi-label">Tỉ lệ Cache Hit</span>
        </div>
        <span class="kpi-value" id="kpi-cache">0%</span>
        <span class="kpi-sub" id="kpi-cache-sub">Cache read trên tổng input</span>
      </div>
    </section>

    <section class="composition-bar-wrap" aria-label="Cơ cấu token">
      <div class="composition-header">
        <div class="composition-legend" id="composition-legend">
          <span class="legend-item"><span class="legend-swatch swatch-input"></span>Input mới: 0</span>
          <span class="legend-item"><span class="legend-swatch swatch-cache"></span>Cache Read: 0</span>
          <span class="legend-item"><span class="legend-swatch swatch-output"></span>Output: 0</span>
        </div>
        <span class="panel-meta" id="scan-meta"></span>
      </div>
      <div class="stacked-track" id="composition-track">
        <div class="stacked-seg-input" style="width: 0%"></div>
        <div class="stacked-seg-cache" style="width: 0%"></div>
        <div class="stacked-seg-output" style="width: 0%"></div>
      </div>
    </section>

    <nav class="tabs-bar" aria-label="Chế độ xem">
      <div class="tabs-list" role="tablist">
        <button class="tab-btn" role="tab" data-tab="overview" aria-selected="true" type="button">Tổng quan</button>
        <button class="tab-btn" role="tab" data-tab="daily" aria-selected="false" type="button">Theo Ngày</button>
        <button class="tab-btn" role="tab" data-tab="monthly" aria-selected="false" type="button">Theo Tháng</button>
        <button class="tab-btn" role="tab" data-tab="conversations" aria-selected="false" type="button">Conversation</button>
        <button class="tab-btn" role="tab" data-tab="models" aria-selected="false" type="button">Model</button>
      </div>
    </nav>

    <section id="tab-content" aria-live="polite">
      <div class="panel">
        <div class="empty-state">Đang tải dữ liệu thống kê token từ máy chủ MCP…</div>
      </div>
    </section>
  </main>

  <div class="drawer-backdrop" id="detail-drawer" hidden>
    <aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div class="drawer-head">
        <div style="min-width:0">
          <h2 class="drawer-title" id="drawer-title">Chi tiết Conversation</h2>
          <div class="drawer-id" id="drawer-id"></div>
        </div>
        <button class="close-btn" id="drawer-close" type="button">Đóng</button>
      </div>
      <div class="drawer-body" id="drawer-body"></div>
    </aside>
  </div>

  <script>
${bundledJs}
  </script>
</body>
</html>
`;

  const distDir = path.join(ROOT, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  const outPath = path.join(distDir, 'dashboard.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Built ${outPath} (${(Buffer.byteLength(html, 'utf8') / 1024).toFixed(1)} KB)`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
