// Generator SVG pixel-art animation cho README luuvanskill.
// Chạy: node assets/_gen.mjs  -> xuất assets/hero.svg + assets/divider.svg
import { writeFileSync } from 'node:fs'

// ---- RNG tất định để mỗi lần gen ra file giống nhau (git sạch) ----
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd = mulberry32(1337)

// ---- font pixel 5x7 ----
const F = {
  L:["10000","10000","10000","10000","10000","10000","11111"],
  U:["10001","10001","10001","10001","10001","10001","01110"],
  V:["10001","10001","10001","10001","01010","01010","00100"],
  A:["01110","10001","10001","11111","10001","10001","10001"],
  N:["10001","11001","11001","10101","10011","10011","10001"],
  S:["01111","10000","10000","01110","00001","00001","11110"],
  K:["10001","10010","10100","11000","10100","10010","10001"],
  I:["11111","00100","00100","00100","00100","00100","11111"],
}

const WORD = "LUUVANSKILL"
const CELL = 9, PIX = 8, LW = 5, GAP = 1
const W = 880, H = 300, HEADER = 36
const wordCols = WORD.length*LW + (WORD.length-1)*GAP // in cells
const wordW = wordCols*CELL
const x0 = Math.round((W - wordW)/2)
const y0 = 94

// thu thập pixel
const pixels = [] // {lx,ly, col, ax,ay}
let cellCol = 0
for(let i=0;i<WORD.length;i++){
  const g = F[WORD[i]]
  for(let r=0;r<7;r++){
    for(let c=0;c<LW;c++){
      if(g[r][c]==='1'){
        const cc = cellCol + c
        const lx = cc*CELL, ly = r*CELL
        pixels.push({lx,ly,col:cc,ax:x0+lx,ay:y0+ly})
      }
    }
  }
  cellCol += LW + GAP
}
const maxCol = Math.max(...pixels.map(p=>p.col))

// ---- build hero ----
const A = []
A.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="ui-monospace,Menlo,Consolas,monospace" role="img" aria-label="luuvanskill">`)
A.push(`<defs>`)
A.push(`<radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#0e1431"/><stop offset="1" stop-color="#06080f"/></radialGradient>`)
A.push(`<linearGradient id="title" x1="0" y1="0" x2="1" y2="0.25">`)
A.push(`<stop offset="0" stop-color="#21e6ff"/><stop offset="0.34" stop-color="#4f9bff"/><stop offset="0.58" stop-color="#9d6bff"/><stop offset="0.8" stop-color="#ff4d8d"/><stop offset="1" stop-color="#ffae3d"/></linearGradient>`)
A.push(`<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`)
A.push(`<filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`)
// mask = các pixel ở vị trí cuối (để shine chỉ quét trên chữ)
A.push(`<mask id="tmask" maskUnits="userSpaceOnUse">`)
for(const p of pixels) A.push(`<rect x="${p.ax}" y="${p.ay}" width="${PIX}" height="${PIX}" fill="#fff"/>`)
A.push(`</mask>`)
A.push(`</defs>`)

// nền + khung terminal
A.push(`<rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="14" fill="url(#bg)" stroke="#233055"/>`)
A.push(`<path d="M14 0.5 H${W-14} A13.5 13.5 0 0 1 ${W-0.5} 14 V${HEADER} H0.5 V14 A13.5 13.5 0 0 1 14 0.5 Z" fill="#0b1024"/>`)
A.push(`<line x1="0.5" y1="${HEADER}" x2="${W-0.5}" y2="${HEADER}" stroke="#1a2342"/>`)
for(const [i,c] of [["0","#ff5f56"],["1","#febc2e"],["2","#28c840"]]){
  A.push(`<circle cx="${22+Number(i)*20}" cy="18" r="5" fill="${c}"/>`)
}
A.push(`<text x="74" y="22" font-size="12" fill="#5b6a99">~/.claude/skills — luuvanskill</text>`)

// lưới nền mờ
A.push(`<g stroke="#10193a" stroke-width="1" opacity="0.6">`)
for(let gx=x0%44;gx<W;gx+=44) A.push(`<line x1="${gx}" y1="${HEADER+1}" x2="${gx}" y2="${H-1}"/>`)
for(let gy=HEADER+12;gy<H;gy+=44) A.push(`<line x1="1" y1="${gy}" x2="${W-1}" y2="${gy}"/>`)
A.push(`</g>`)

// pixel nền nhấp nháy
A.push(`<g fill="#2de6ff">`)
for(let i=0;i<70;i++){
  const px = Math.round(8 + rnd()*(W-16))
  const py = Math.round(HEADER+8 + rnd()*(H-HEADER-16))
  const s = rnd()<0.25?3:2
  const b = (rnd()*4).toFixed(2)
  const d = (1.6+rnd()*2.4).toFixed(2)
  const o = (0.5+rnd()*0.4).toFixed(2)
  A.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}"><animate attributeName="opacity" values="0.06;${o};0.06" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></rect>`)
}
A.push(`</g>`)

// tiêu đề: pixel bay vào ghép chữ, ghép xong thì chớp liên tục
A.push(`<g transform="translate(${x0},${y0})" fill="url(#title)" filter="url(#glow)">`)
A.push(`<animate attributeName="opacity" begin="2.2s" dur="1.05s" values="1;0.08" keyTimes="0;0.5" calcMode="discrete" repeatCount="indefinite"/>`)
for(const p of pixels){
  const dx = Math.round((rnd()-0.5)*150)
  const dy = Math.round((rnd()-0.5)*110)
  const begin = (0.15 + p.col*0.02 + rnd()*0.14).toFixed(2)
  A.push(`<rect x="${p.lx}" y="${p.ly}" width="${PIX}" height="${PIX}" opacity="0" transform="translate(${dx},${dy})">`)
  A.push(`<animate attributeName="opacity" values="0;1" dur="0.55s" begin="${begin}s" fill="freeze"/>`)
  A.push(`<animateTransform attributeName="transform" type="translate" values="${dx} ${dy};0 0" keyTimes="0;1" calcMode="spline" keySplines="0.16 0.84 0.24 1" dur="0.6s" begin="${begin}s" fill="freeze"/>`)
  A.push(`</rect>`)
}
A.push(`</g>`)

// gạch chân vẽ dần
const ulY = y0 + 7*CELL + 6
A.push(`<rect x="${x0}" y="${ulY}" height="2.5" rx="1.25" fill="url(#title)" width="0"><animate attributeName="width" values="0;${wordW}" dur="0.7s" begin="1.0s" fill="freeze" calcMode="spline" keySplines="0.2 0.8 0.2 1" keyTimes="0;1"/></rect>`)

// shine quét qua chữ
A.push(`<g mask="url(#tmask)"><rect x="0" y="${y0-6}" width="150" height="${7*CELL+12}" fill="url(#shine)" opacity="0.9"><animate attributeName="x" values="${x0-160};${x0+wordW+20}" dur="2.4s" begin="2.3s;ts.end+2.6s" id="ts" fill="freeze"/></rect></g>`)

// tagline
A.push(`<text x="${W/2}" y="${ulY+30}" text-anchor="middle" font-size="14" letter-spacing="3" fill="#8aa0d8" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.8s" begin="1.9s" fill="freeze"/>KHO SKILL CLAUDE CODE CÁ NHÂN</text>`)

// prompt dòng lệnh + con trỏ nhấp nháy
const py = ulY+58
A.push(`<g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.6s" begin="2.4s" fill="freeze"/>`)
A.push(`<text x="${W/2-118}" y="${py}" font-size="13" fill="#3ad07a">▸</text>`)
A.push(`<text x="${W/2-100}" y="${py}" font-size="13" fill="#aab8e0">/plugin install </text>`)
A.push(`<text x="${W/2+8}" y="${py}" font-size="13" fill="#ffae3d">luuvanskill</text>`)
A.push(`<rect x="${W/2+98}" y="${py-11}" width="8" height="14" fill="#2de6ff"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" begin="2.8s" repeatCount="indefinite"/></rect>`)
A.push(`</g>`)

A.push(`</svg>`)
writeFileSync(new URL('./hero.svg', import.meta.url), A.join('\n'))

// ---- divider: hàng pixel sóng chạy ----
const DW=880, DH=22, dcells=Math.floor(DW/CELL)
const D=[]
D.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DW} ${DH}" width="${DW}" height="${DH}" role="img" aria-label="divider">`)
D.push(`<defs><linearGradient id="dg" x1="0" x2="1"><stop offset="0" stop-color="#21e6ff"/><stop offset="0.5" stop-color="#9d6bff"/><stop offset="1" stop-color="#ffae3d"/></linearGradient></defs>`)
D.push(`<g fill="url(#dg)">`)
for(let c=0;c<dcells;c++){
  const x=c*CELL, begin=(c*0.04).toFixed(2)
  D.push(`<rect x="${x}" y="7" width="${PIX}" height="${PIX}" opacity="0.12"><animate attributeName="opacity" values="0.12;1;0.12" dur="2.2s" begin="${begin}s" repeatCount="indefinite"/></rect>`)
}
D.push(`</g></svg>`)
writeFileSync(new URL('./divider.svg', import.meta.url), D.join('\n'))

console.log('OK: hero.svg', A.length, 'lines;  divider.svg', D.length, 'lines;  pixels=', pixels.length)
