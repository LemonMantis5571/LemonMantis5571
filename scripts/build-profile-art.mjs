#!/usr/bin/env node
// Builds the Spotify-style profile art used by README.md.
// Edit the data blocks below, then run:  node scripts/build-profile-art.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PROFILE = {
  name: 'Leonel Guerrero',
  handle: 'LemonMantis5571',
  followers: '33 followers',
  bio: ['Web artisan from El Salvador,', 'building agents, dev tools,', 'games and themes.', 'ES · EN · KR · CN'],
  site: 'lemonmantis.dev',
};

const PLAYLIST = {
  title: 'Liked Repos',
  description: 'Agents, dev tools, games and themes, shipped from El Salvador.',
  stats: '19 repos, 5 yr of commits',
};

// Sorted like Spotify's "Recently added": newest push first.
// `label` overrides `name` when a repo name is too long for the Title column.
const TRACKS = [
  { name: 'Zest-Harness', owner: 'LemonMantis5571', lang: 'RS', album: 'Agent harness', date: 'Sep 27, 2026', stars: 3, cover: 'zest' },
  { name: 'larp-linux', owner: 'LemonMantis5571', lang: 'TS', album: 'Fake Arch desktop', date: 'Sep 10, 2026', stars: 0, cover: 'larp' },
  { name: 'LimeBot-OS', owner: 'Ethereal-Lemons', lang: 'PY', album: 'Agentic assistant', date: 'Sep 3, 2026', stars: 16, cover: 'limebot' },
  { name: 'Aero-Webring', owner: 'LemonMantis5571', lang: 'CSS', album: 'Webring template', date: 'Aug 9, 2026', stars: 0, cover: 'aero' },
  { name: 'A-mess-Visual-Novel', label: 'A-mess Visual Novel', owner: 'LemonMantis5571', lang: 'PY', album: 'Visual novel', date: 'Jul 26, 2026', stars: 5, cover: 'amess' },
  { name: 'MCP-Discord-Image-Downloader', label: 'MCP-Discord-Image…', owner: 'LemonMantis5571', lang: 'TS', album: 'Discord MCP', date: 'Jul 19, 2026', stars: 0, cover: 'mcp' },
  { name: 'Ethereal-Theme', owner: 'Ethereal-Lemons', lang: 'JS', album: 'VS Code theme', date: 'Jul 16, 2026', stars: 2, cover: 'ethereal' },
  { name: 'PokeMMO-Utilities', owner: 'LemonMantis5571', lang: 'TS', album: 'PokeMMO toolkit', date: 'May 23, 2026', stars: 12, cover: 'pokemmo' },
  { name: 'SilentFail', owner: 'Ethereal-Lemons', lang: 'TS', album: 'Cron monitor', date: 'Mar 26, 2026', stars: 7, cover: 'silentfail' },
];

const CHIPS = ['Agents', 'Rust', 'TypeScript', 'Python', 'MCP', 'Games', 'Pokémon', 'Themes', 'Web', 'Tools'];

// The "now playing" track. Its description doubles as the lyrics preview.
const NOW_PLAYING = {
  track: TRACKS[0],
  lyrics: ['A local-first coding', 'harness for agent', 'orchestration, with', 'explicit delegation.'],
  lyricCard: '#b4531f',
  lyricDim: '#51250e',
  seconds: 180, // must be a whole number of minutes so the clock digits loop cleanly
};

const LINKS = [
  { file: 'link-portfolio.svg', label: 'Play portfolio', primary: true },
  { file: 'link-linkedin.svg', label: 'LinkedIn' },
  { file: 'link-repos.svg', label: 'Repositories' },
  { file: 'link-ethereal.svg', label: 'Ethereal-Lemons' },
];

// ---------------------------------------------------------------------------
// Spotify palette and helpers
// ---------------------------------------------------------------------------

const C = {
  base: '#000000',
  panel: '#121212',
  card: '#1f1f1f',
  raised: '#2a2a2a',
  text: '#ffffff',
  sub: '#b3b3b3',
  dim: '#7c7c7c',
  line: 'rgba(255,255,255,0.1)',
  green: '#1ed760',
  header: '#5038a0',
};

const FONT = `"Spotify Mix","Circular Std","Segoe UI Variable Display","Segoe UI","SF Pro Display",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Roboto,Arial,sans-serif`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Rough width of a string at a given font size, used to size pills and badges.
function textWidth(str, size, weight = 400) {
  const narrow = /[ilIj.,:;'!|·]/;
  const wide = /[mwMW@]/;
  let w = 0;
  for (const ch of str) {
    if (ch === ' ') w += 0.28;
    else if (narrow.test(ch)) w += 0.28;
    else if (wide.test(ch)) w += 0.82;
    else if (/[A-Z]/.test(ch)) w += 0.64;
    else w += 0.54;
  }
  return w * size * (weight >= 600 ? 1.05 : 1);
}

let clipSeq = 0;
function coverUse(id, x, y, size, radius) {
  const clip = `cc${clipSeq++}`;
  const shape = radius === 'circle'
    ? `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}"/>`
    : `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}"/>`;
  return `<clipPath id="${clip}">${shape}</clipPath><g clip-path="url(#${clip})"><use href="#cover-${id}" x="${x}" y="${y}" width="${size}" height="${size}"/></g>`;
}

// 24-unit icons, drawn with strokes so they scale cleanly.
const ICONS = {
  home: `<path d="M12 3.2 3.5 10.4V21h6v-6.2h5V21h6V10.4Z" fill="currentColor"/>`,
  search: `<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  browse: `<path d="M4 9h16v10.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5Z M3 4h18v5H3Z M9.5 13.5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,
  bell: `<path d="M6 10.5a6 6 0 0 1 12 0v3.8l1.8 2.9H4.2L6 14.3Z M10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  friends: `<circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 19.5c0-3.4 2.7-5.7 6-5.7s6 2.3 6 5.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16.5" cy="7.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 12.8c2.9 0 5 1.9 5 4.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  library: `<path d="M5 3.5v17M10 3.5v17M14.5 4.5l5.5 15.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  plus: `<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  back: `<path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  forward: `<path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  shuffle: `<path d="M3 17h3.2c1.4 0 2.3-.5 3.1-1.6L14.7 8.6c.8-1.1 1.7-1.6 3.1-1.6H21M3 7h3.2c1.4 0 2.3.5 3.1 1.6l.9 1.2M13.8 14.2l.9 1.2c.8 1.1 1.7 1.6 3.1 1.6H21M18 4l3 3-3 3M18 14l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  download: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v9M8.2 12.6 12 16.4l3.8-3.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  more: `<circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/>`,
  list: `<path d="M3 6h2M3 12h2M3 18h2M8 6h13M8 12h13M8 18h13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  prev: `<path d="M5.5 4.5v15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M19.5 4.8v14.4L8 12Z" fill="currentColor"/>`,
  next: `<path d="M18.5 4.5v15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M4.5 4.8v14.4L16 12Z" fill="currentColor"/>`,
  play: `<path d="M7 4.5v15L19.5 12Z" fill="currentColor"/>`,
  pause: `<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor"/>`,
  repeat: `<path d="M4 12V9.5A3.5 3.5 0 0 1 7.5 6H20M17 3l3 3-3 3M20 12v2.5a3.5 3.5 0 0 1-3.5 3.5H4M7 21l-3-3 3-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  check: `<circle cx="12" cy="12" r="10" fill="${C.green}"/><path d="m7.2 12.3 3.1 3.1 6.5-6.6" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  star: `<path d="m12 3.2 2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8Z" fill="currentColor"/>`,
  mic: `<rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  queue: `<path d="M3 5.5h14M3 10.5h14M3 15.5h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 13.5v7l6-3.5Z" fill="currentColor"/>`,
  device: `<rect x="6" y="3" width="12" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="14" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="7" r="1.1" fill="currentColor"/>`,
  volume: `<path d="M3.5 9h4l5-4.2v14.4L7.5 15h-4Z" fill="currentColor"/><path d="M15.5 8.8a4.5 4.5 0 0 1 0 6.4M18 6.3a8 8 0 0 1 0 11.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  npv: `<rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14 8h3.5v8H14Z" fill="currentColor"/>`,
  fullscreen: `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  minimize: `<path d="M6 12h12" stroke="currentColor" stroke-width="1.4"/>`,
  maximize: `<rect x="6.5" y="6.5" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.4"/>`,
  close: `<path d="m6.5 6.5 11 11m0-11-11 11" stroke="currentColor" stroke-width="1.4"/>`,
};

function icon(name, x, y, size, color) {
  const s = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${s})" color="${color}">${ICONS[name]}</g>`;
}

// A lemon glyph in a 100-unit box, used for the playlist cover and avatars.
const LEMON = (fill, leaf) => `
  <g transform="rotate(-32 50 54)">
    <ellipse cx="50" cy="54" rx="30" ry="22.5" fill="${fill}"/>
    <path d="M78.5 48.5Q88 54 78.5 59.5Z M21.5 48.5Q12 54 21.5 59.5Z" fill="${fill}"/>
  </g>
  <path d="M80 33c-1-9 5-16 15-18 1 10-5 17-15 18Z" fill="${leaf}"/>
  <path d="M78 36l3-4" stroke="${leaf}" stroke-width="2.5" stroke-linecap="round"/>`;

// ---------------------------------------------------------------------------
// Cover art (100 x 100 symbols)
// ---------------------------------------------------------------------------

function citrusSegments(cx, cy, r, count, color, gap) {
  let out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    out += `<path d="M${cx} ${cy}L${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}" stroke="${gap}" stroke-width="2.2" stroke-linecap="round"/>`;
  }
  return out + `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${gap}"/>`;
}

const COVERS = {
  liked: `
    <defs><linearGradient id="g-liked" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#450af5"/><stop offset="0.55" stop-color="#8e8ee5"/><stop offset="1" stop-color="#c4efd9"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g-liked)"/>
    <g transform="translate(14 12) scale(.72)">${LEMON('#ffffff', '#ffffff')}</g>`,

  zest: `
    <defs>
      <radialGradient id="g-zest" cx=".3" cy=".25" r=".95"><stop offset="0" stop-color="#ffb65c"/><stop offset=".55" stop-color="#f97316"/><stop offset="1" stop-color="#7c2d12"/></radialGradient>
      <radialGradient id="g-zest-shine" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="100" height="100" fill="url(#g-zest)"/>
    <circle cx="80" cy="18" r="30" fill="#fff" opacity=".06"/>
    <circle cx="54" cy="58" r="35" fill="#9a3412" opacity=".35"/>
    <circle cx="52" cy="55" r="34" fill="#fb923c"/>
    <circle cx="52" cy="55" r="31" fill="#fff4e0"/>
    ${citrusSegments(52, 55, 27.5, 10, '#fdba74', '#fff4e0')}
    <circle cx="52" cy="55" r="27.5" fill="url(#g-zest-shine)"/>
    <text x="10" y="20" font-family='${FONT}' font-size="10" font-weight="800" fill="#fff7ed" letter-spacing="1.5">ZEST</text>`,

  larp: `
    <defs><linearGradient id="g-larp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#1793d1"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g-larp)"/>
    <rect x="15" y="22" width="70" height="54" rx="5" fill="#0b1220" stroke="#7dd3fc" stroke-opacity=".6"/>
    <rect x="15" y="22" width="70" height="10" rx="5" fill="#1e293b"/>
    <circle cx="22" cy="27" r="2" fill="#f87171"/><circle cx="28" cy="27" r="2" fill="#fbbf24"/><circle cx="34" cy="27" r="2" fill="#4ade80"/>
    <path d="M50 38 64.5 67 50 59.5 35.5 67Z" fill="#38bdf8"/>`,

  limebot: `
    <defs><linearGradient id="g-lime" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9f99d"/><stop offset="1" stop-color="#4d7c0f"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g-lime)"/>
    <path d="M50 36V24" stroke="#1a2e05" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="19" r="7.5" fill="#ecfccb" stroke="#1a2e05" stroke-width="2.5"/>
    <path d="M50 12.5v13M43.5 19h13" stroke="#65a30d" stroke-width="1.6"/>
    <rect x="20" y="48" width="8" height="16" rx="3" fill="#1a2e05"/><rect x="72" y="48" width="8" height="16" rx="3" fill="#1a2e05"/>
    <rect x="25" y="35" width="50" height="42" rx="13" fill="#1a2e05"/>
    <circle cx="40" cy="54" r="6" fill="#bef264"/><circle cx="60" cy="54" r="6" fill="#bef264"/>
    <path d="M42 66q8 5 16 0" fill="none" stroke="#bef264" stroke-width="3" stroke-linecap="round"/>`,

  aero: `
    <defs>
      <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0369a1"/><stop offset=".6" stop-color="#7dd3fc"/><stop offset="1" stop-color="#e0f2fe"/></linearGradient>
      <linearGradient id="g-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset="1" stop-color="#15803d"/></linearGradient>
      <radialGradient id="g-bubble" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#bae6fd" stop-opacity=".5"/></radialGradient>
    </defs>
    <rect width="100" height="100" fill="url(#g-sky)"/>
    <ellipse cx="30" cy="104" rx="60" ry="30" fill="url(#g-hill)"/>
    <ellipse cx="86" cy="110" rx="46" ry="30" fill="#22c55e"/>
    <circle cx="52" cy="44" r="19" fill="none" stroke="#e0f2fe" stroke-width="7" opacity=".95"/>
    <circle cx="52" cy="44" r="19" fill="none" stroke="#0ea5e9" stroke-width="2.5"/>
    <circle cx="22" cy="26" r="9" fill="url(#g-bubble)" stroke="#fff" stroke-opacity=".7"/>
    <circle cx="80" cy="64" r="6" fill="url(#g-bubble)" stroke="#fff" stroke-opacity=".7"/>
    <circle cx="82" cy="20" r="4" fill="url(#g-bubble)" stroke="#fff" stroke-opacity=".7"/>`,

  amess: `
    <defs><linearGradient id="g-amess" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9a8d4"/><stop offset="1" stop-color="#7e22ce"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g-amess)"/>
    <path d="M58 14l3.5 9.5L71 27l-9.5 3.5L58 40l-3.5-9.5L45 27l9.5-3.5Z" fill="#fff"/>
    <path d="M30 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#fff" opacity=".8"/>
    <rect x="10" y="60" width="80" height="30" rx="5" fill="#1e1b4b" fill-opacity=".85" stroke="#fff" stroke-opacity=".6"/>
    <rect x="14" y="54" width="28" height="10" rx="3" fill="#ec4899"/>
    <circle cx="40" cy="76" r="2.6" fill="#fff"/><circle cx="50" cy="76" r="2.6" fill="#fff"/><circle cx="60" cy="76" r="2.6" fill="#fff"/>`,

  mcp: `
    <defs><linearGradient id="g-mcp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7983f5"/><stop offset="1" stop-color="#3b3fa8"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g-mcp)"/>
    <rect x="20" y="18" width="60" height="44" rx="6" fill="#eef0ff"/>
    <circle cx="36" cy="32" r="5" fill="#fbbf24"/>
    <path d="M24 58l16-16 10 10 8-7 18 13Z" fill="#5865f2"/>
    <circle cx="50" cy="76" r="13" fill="#1e1f4b"/>
    <path d="M50 69v13M44.5 77 50 82.5l5.5-5.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,

  ethereal: `
    <defs><linearGradient id="g-eth" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2e1065"/><stop offset=".6" stop-color="#7c3aed"/><stop offset="1" stop-color="#f472b6"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g-eth)"/>
    <path d="M58 16a24 24 0 1 0 22 33 19 19 0 1 1-22-33Z" fill="#fdf4ff"/>
    <circle cx="22" cy="24" r="1.6" fill="#fff"/><circle cx="34" cy="12" r="1" fill="#fff"/><circle cx="84" cy="80" r="1.4" fill="#fff"/>
    <text x="50" y="86" text-anchor="middle" font-family="Consolas,'Cascadia Code',Menlo,monospace" font-size="18" font-weight="700" fill="#fdf4ff">{ }</text>`,

  pokemmo: `
    <defs><linearGradient id="g-pk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#374151"/><stop offset="1" stop-color="#0b0f19"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g-pk)"/>
    <path d="M20 50a30 30 0 0 1 60 0Z" fill="#ef4444"/>
    <path d="M20 50a30 30 0 0 0 60 0Z" fill="#f9fafb"/>
    <rect x="20" y="47" width="60" height="6" fill="#111827"/>
    <circle cx="50" cy="50" r="10" fill="#f9fafb" stroke="#111827" stroke-width="4.5"/>
    <path d="M34 30a18 18 0 0 1 12-8" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`,

  silentfail: `
    <defs><linearGradient id="g-sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#064e3b"/><stop offset="1" stop-color="#020617"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g-sf)"/>
    <path d="M8 56h22l6-12 9 26 9-40 8 26h30" fill="none" stroke="#4ade80" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="82" cy="20" r="5" fill="#f87171"/>`,

  org: `
    <defs><radialGradient id="g-org" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#4c1d95"/><stop offset="1" stop-color="#0f0a2e"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#g-org)"/>
    <g transform="translate(12 10) scale(.76)">${LEMON('#fde047', '#a3e635')}</g>`,

  avatar: `
    <defs><radialGradient id="g-av" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#22c55e"/><stop offset="1" stop-color="#14532d"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#g-av)"/>
    <g transform="translate(10 8) scale(.8)">${LEMON('#fde047', '#bbf7d0')}</g>`,
};

const coverDefs = Object.entries(COVERS)
  .map(([id, body]) => `<symbol id="cover-${id}" viewBox="0 0 100 100">${body}</symbol>`)
  .join('\n');

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const W = 1000;
const H = 1040;
const TOP = 64; // top bar height
const BAR = 72; // player bar height
const PANEL_BOTTOM = H - BAR - 8;
const SIDE = { x: 8, w: 72 };
const RIGHT = { x: 728, w: 264 };
const MAIN = { x: SIDE.x + SIDE.w + 8, w: RIGHT.x - 8 - (SIDE.x + SIDE.w + 8) };
const ROW = { top: 500, h: 54 };
const COL = {
  num: MAIN.x + 30,
  cover: MAIN.x + 52,
  title: MAIN.x + 104,
  album: MAIN.x + 316,
  date: MAIN.x + 462,
  stars: MAIN.x + MAIN.w - 28,
};

function topBar() {
  const cy = TOP / 2;
  const pill = { x: 348, w: 360 };
  return `
  <g>
    ${icon('more', 16, cy - 10, 20, C.sub)}
    ${icon('back', 54, cy - 11, 22, C.text)}
    ${icon('forward', 86, cy - 11, 22, C.dim)}

    <circle cx="316" cy="${cy}" r="24" fill="${C.card}"/>
    ${icon('home', 304, cy - 12, 24, C.text)}
    <rect x="${pill.x}" y="${cy - 24}" width="${pill.w}" height="48" rx="24" fill="${C.card}"/>
    ${icon('search', pill.x + 14, cy - 12, 24, C.sub)}
    <text x="${pill.x + 48}" y="${cy + 5}" class="s16" fill="${C.sub}">What do you want to build?</text>
    <path d="M${pill.x + pill.w - 50} ${cy - 12}v24" stroke="${C.dim}"/>
    ${icon('browse', pill.x + pill.w - 38, cy - 12, 24, C.sub)}

    ${icon('bell', 800, cy - 11, 22, C.sub)}
    ${icon('friends', 836, cy - 11, 22, C.sub)}
    <circle cx="890" cy="${cy}" r="20" fill="${C.card}"/>
    ${coverUse('avatar', 876, cy - 14, 28, 'circle')}
    ${icon('minimize', 924, cy - 10, 20, C.sub)}
    ${icon('maximize', 948, cy - 10, 20, C.sub)}
    ${icon('close', 972, cy - 10, 20, C.sub)}
  </g>`;
}

function sidebar() {
  const cx = SIDE.x + SIDE.w / 2;
  const tiles = [
    ['liked', 'square'], ['zest', 'square'], ['org', 'circle'], ['limebot', 'square'],
    ['pokemmo', 'square'], ['aero', 'square'], ['avatar', 'circle'], ['amess', 'square'],
    ['larp', 'square'], ['ethereal', 'square'], ['mcp', 'square'], ['silentfail', 'square'],
  ];
  let y = 172;
  const items = tiles.map(([id, shape]) => {
    const out = coverUse(id, cx - 24, y, 48, shape === 'circle' ? 'circle' : 4);
    y += 64;
    return out;
  });
  return `
  <rect x="${SIDE.x}" y="${TOP}" width="${SIDE.w}" height="${PANEL_BOTTOM - TOP}" rx="8" fill="${C.panel}"/>
  <clipPath id="clip-side"><rect x="${SIDE.x}" y="${TOP}" width="${SIDE.w}" height="${PANEL_BOTTOM - TOP}" rx="8"/></clipPath>
  <g clip-path="url(#clip-side)">
    ${icon('library', cx - 12, 84, 24, C.sub)}
    <circle cx="${cx}" cy="140" r="16" fill="${C.card}"/>
    ${icon('plus', cx - 9, 131, 18, C.sub)}
    <rect x="${cx - 30}" y="166" width="60" height="60" rx="6" fill="${C.raised}"/>
    ${items.join('\n    ')}
  </g>`;
}

function mainHeader() {
  const x0 = MAIN.x;
  const coverX = x0 + 24;
  const textX = coverX + 180 + 24;
  return `
    <rect x="${x0}" y="${TOP}" width="${MAIN.w}" height="270" fill="${C.header}"/>
    <rect x="${x0}" y="${TOP}" width="${MAIN.w}" height="270" fill="url(#g-header-shade)"/>
    <rect x="${x0}" y="${TOP + 270}" width="${MAIN.w}" height="240" fill="url(#g-body-fade)"/>

    <g filter="url(#f-cover-shadow)"><rect x="${coverX}" y="128" width="180" height="180" rx="4" fill="#000"/></g>
    ${coverUse('liked', coverX, 128, 180, 4)}

    <text x="${textX}" y="200" class="s13 w6" fill="${C.text}">Playlist</text>
    <text x="${textX - 3}" y="258" class="hero" fill="${C.text}">${esc(PLAYLIST.title)}</text>
    <text x="${textX}" y="284" class="s13" fill="${C.sub}">${esc(PLAYLIST.description)}</text>
    ${coverUse('avatar', textX, 293, 22, 'circle')}
    <text x="${textX + 28}" y="309" class="s13"><tspan class="w7" fill="${C.text}">${esc(PROFILE.name)}</tspan><tspan fill="${C.sub}"> • ${esc(PLAYLIST.stats)}</tspan></text>`;
}

function actionRow() {
  const x0 = MAIN.x;
  const cy = 374;
  const playCx = x0 + 24 + 28;
  return `
    <circle cx="${playCx}" cy="${cy}" r="28" fill="${C.green}"/>
    ${icon('pause', playCx - 12, cy - 12, 24, '#000')}
    ${icon('shuffle', playCx + 48, cy - 14, 28, C.green)}
    <circle cx="${playCx + 62}" cy="${cy + 20}" r="2" fill="${C.green}"/>
    ${icon('download', playCx + 96, cy - 14, 28, C.sub)}
    ${icon('more', playCx + 142, cy - 14, 28, C.sub)}

    ${icon('search', x0 + MAIN.w - 206, cy - 9, 18, C.sub)}
    <text x="${x0 + MAIN.w - 54}" y="${cy + 5}" text-anchor="end" class="s13 w6" fill="${C.sub}">Recently pushed</text>
    ${icon('list', x0 + MAIN.w - 44, cy - 10, 20, C.sub)}`;
}

function chips() {
  let x = MAIN.x + 24;
  const y = 420;
  return CHIPS.map((label) => {
    const w = Math.round(textWidth(label, 13, 600) + 26);
    const out = `<rect x="${x}" y="${y}" width="${w}" height="32" rx="16" fill="rgba(255,255,255,0.1)"/><text x="${x + w / 2}" y="${y + 21}" text-anchor="middle" class="s13 w6" fill="${C.text}">${esc(label)}</text>`;
    x += w + 8;
    return out;
  }).join('\n    ');
}

function tableHeader() {
  const y = 478;
  return `
    <text x="${COL.num}" y="${y}" text-anchor="middle" class="s14" fill="${C.sub}">#</text>
    <text x="${COL.cover}" y="${y}" class="s14" fill="${C.sub}">Title</text>
    <text x="${COL.album}" y="${y}" class="s14" fill="${C.sub}">Album</text>
    <text x="${COL.date}" y="${y}" class="s14" fill="${C.sub}">Date added</text>
    ${icon('star', COL.stars - 16, y - 13, 16, C.sub)}
    <path d="M${MAIN.x + 16} ${y + 12}H${MAIN.x + MAIN.w - 16}" stroke="${C.line}"/>`;
}

function equalizer(cx, baseY) {
  const bars = [0, 1, 2, 3].map((i) => {
    const x = cx - 7 + i * 4;
    return `<rect class="eq eq${i}" x="${x}" y="${baseY - 14}" width="2.6" height="14" rx="0.6" fill="${C.green}"/>`;
  });
  return `<g>${bars.join('')}</g>`;
}

function rows() {
  return TRACKS.map((t, i) => {
    const top = ROW.top + i * ROW.h;
    const playing = t === NOW_PLAYING.track;
    const titleColor = playing ? C.green : C.text;
    const badgeW = Math.round(textWidth(t.lang, 9, 700) + 8);
    const artistX = COL.title + badgeW + 6;
    return `
    <g>
      ${playing
        ? equalizer(COL.num, top + 34)
        : `<text x="${COL.num}" y="${top + 32}" text-anchor="middle" class="s15" fill="${C.sub}">${i + 1}</text>`}
      ${coverUse(t.cover, COL.cover, top + 7, 40, 4)}
      <text x="${COL.title}" y="${top + 24}" class="s15 w5" fill="${titleColor}">${esc(t.label ?? t.name)}</text>
      <rect x="${COL.title}" y="${top + 31}" width="${badgeW}" height="15" rx="2" fill="${C.sub}"/>
      <text x="${COL.title + badgeW / 2}" y="${top + 42}" text-anchor="middle" class="s9 w7" fill="#000">${esc(t.lang)}</text>
      <text x="${artistX}" y="${top + 43}" class="s13" fill="${C.sub}">${esc(t.owner)}</text>
      <text x="${COL.album}" y="${top + 32}" class="s13" fill="${C.sub}">${esc(t.album)}</text>
      <text x="${COL.date}" y="${top + 32}" class="s13" fill="${C.sub}">${esc(t.date)}</text>
      <text x="${COL.stars}" y="${top + 32}" text-anchor="end" class="s13 tab" fill="${C.sub}">${t.stars}</text>
    </g>`;
  }).join('');
}

function mainPanel() {
  return `
  <clipPath id="clip-main"><rect x="${MAIN.x}" y="${TOP}" width="${MAIN.w}" height="${PANEL_BOTTOM - TOP}" rx="8"/></clipPath>
  <rect x="${MAIN.x}" y="${TOP}" width="${MAIN.w}" height="${PANEL_BOTTOM - TOP}" rx="8" fill="${C.panel}"/>
  <g clip-path="url(#clip-main)">
    ${mainHeader()}
    ${actionRow()}
    ${chips()}
    ${tableHeader()}
    ${rows()}
    <rect x="${MAIN.x}" y="${PANEL_BOTTOM - 40}" width="${MAIN.w}" height="40" fill="url(#g-bottom-fade)"/>
  </g>`;
}

function lyricsCard(x, y, w) {
  const lines = NOW_PLAYING.lyrics.map((line, i) =>
    `<text x="${x + 16}" y="${y + 62 + i * 28}" class="s18 w7 lyric ly${i}">${esc(line)}</text>`,
  );
  return `
    <rect x="${x}" y="${y}" width="${w}" height="180" rx="8" fill="${NOW_PLAYING.lyricCard}"/>
    <text x="${x + 16}" y="${y + 28}" class="s14 w7" fill="${C.text}">Lyrics preview</text>
    ${lines.join('\n    ')}`;
}

function aboutCard(x, y, w) {
  const bannerH = 140;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="330" rx="8" fill="${C.card}"/>
    <clipPath id="clip-banner"><path d="M${x} ${y + bannerH}V${y + 8}a8 8 0 0 1 8-8h${w - 16}a8 8 0 0 1 8 8V${y + bannerH}Z"/></clipPath>
    <g clip-path="url(#clip-banner)">
      <rect x="${x}" y="${y}" width="${w}" height="${bannerH}" fill="url(#g-banner)"/>
      <circle cx="${x + w - 40}" cy="${y + 30}" r="70" fill="#fff" opacity=".05"/>
      <circle cx="${x + 30}" cy="${y + bannerH + 10}" r="60" fill="#000" opacity=".18"/>
      <g transform="translate(${x + w - 166} ${y - 2}) scale(1.55)">${LEMON('#fde047', '#86efac')}</g>
      <rect x="${x}" y="${y}" width="${w}" height="${bannerH}" fill="url(#g-banner-shade)"/>
      <text x="${x + 16}" y="${y + 28}" class="s14 w7" fill="${C.text}">About the artist</text>
    </g>
    <text x="${x + 16}" y="${y + bannerH + 30}" class="s16 w7" fill="${C.text}">${esc(PROFILE.name)}</text>
    <text x="${x + 16}" y="${y + bannerH + 52}" class="s13" fill="${C.sub}">${esc(PROFILE.followers)}</text>
    <rect x="${x + w - 82}" y="${y + bannerH + 16}" width="66" height="30" rx="15" fill="none" stroke="${C.dim}"/>
    <text x="${x + w - 49}" y="${y + bannerH + 36}" text-anchor="middle" class="s13 w7" fill="${C.text}">Follow</text>
    ${PROFILE.bio.map((line, i) => `<text x="${x + 16}" y="${y + bannerH + 84 + i * 20}" class="s13" fill="${C.sub}">${esc(line)}</text>`).join('\n    ')}
    <text x="${x + 16}" y="${y + bannerH + 178}" class="s13 w7" fill="${C.text}">${esc(PROFILE.site)} ↗</text>`;
}

function rightPanel() {
  const x = RIGHT.x + 16;
  const w = RIGHT.w - 32;
  const t = NOW_PLAYING.track;
  return `
  <clipPath id="clip-right"><rect x="${RIGHT.x}" y="${TOP}" width="${RIGHT.w}" height="${PANEL_BOTTOM - TOP}" rx="8"/></clipPath>
  <rect x="${RIGHT.x}" y="${TOP}" width="${RIGHT.w}" height="${PANEL_BOTTOM - TOP}" rx="8" fill="${C.panel}"/>
  <g clip-path="url(#clip-right)">
    <text x="${x}" y="96" class="s15 w7" fill="${C.text}">${esc(PLAYLIST.title)}</text>
    ${icon('more', x + w - 44, 84, 18, C.sub)}
    ${icon('close', x + w - 18, 84, 18, C.sub)}
    ${coverUse(t.cover, x, 114, w, 8)}
    <text x="${x}" y="382" class="s22 w7" fill="${C.text}">${esc(t.name)}</text>
    <text x="${x}" y="404" class="s14" fill="${C.sub}">${esc(t.owner)}</text>
    ${icon('check', x + w - 24, 372, 24, C.green)}
    ${lyricsCard(x, 424, w)}
    ${aboutCard(x, 620, w)}
  </g>`;
}

function clockDigits(x, y) {
  // Each digit is a vertical strip of numbers that steps upward, clipped to one line.
  const strip = (cls, count, dx) => {
    const tspans = Array.from({ length: count + 1 }, (_, n) => `<tspan x="${x + dx}" y="${y + n * 16}">${n % count}</tspan>`).join('');
    return `<text class="s12 tab clock ${cls}" text-anchor="end" fill="${C.sub}">${tspans}</text>`;
  };
  return `
    <clipPath id="clip-clock"><rect x="${x - 40}" y="${y - 12}" width="44" height="16"/></clipPath>
    <g clip-path="url(#clip-clock)">
      ${strip('d-min', NOW_PLAYING.seconds / 60, -17.4)}
      <text x="${x - 13.8}" y="${y}" text-anchor="end" class="s12" fill="${C.sub}">:</text>
      ${strip('d-ten', 6, -7)}
      ${strip('d-one', 10, 0)}
    </g>`;
}

function playerBar() {
  const y0 = H - BAR;
  const cy = y0 + 28;
  const t = NOW_PLAYING.track;
  const barX = 328;
  const barW = 344;
  const total = `${Math.floor(NOW_PLAYING.seconds / 60)}:${String(NOW_PLAYING.seconds % 60).padStart(2, '0')}`;
  return `
  <g>
    ${coverUse(t.cover, 16, y0 + 8, 56, 4)}
    <text x="84" y="${y0 + 32}" class="s14 w6" fill="${C.text}">${esc(t.name)}</text>
    <text x="84" y="${y0 + 51}" class="s12" fill="${C.sub}">${esc(t.owner)}</text>
    ${icon('check', 188, y0 + 20, 16, C.green)}

    ${icon('shuffle', 396, cy - 10, 20, C.green)}
    <circle cx="406" cy="${cy + 14}" r="1.8" fill="${C.green}"/>
    ${icon('prev', 438, cy - 9, 18, C.sub)}
    <circle cx="500" cy="${cy}" r="16" fill="${C.text}"/>
    ${icon('pause', 491, cy - 9, 18, '#000')}
    ${icon('next', 544, cy - 9, 18, C.sub)}
    ${icon('repeat', 584, cy - 10, 20, C.sub)}

    ${clockDigits(316, y0 + 58)}
    <rect x="${barX}" y="${y0 + 52}" width="${barW}" height="4" rx="2" fill="#4d4d4d"/>
    <rect class="progress" x="${barX}" y="${y0 + 52}" width="${barW}" height="4" rx="2" fill="${C.text}"/>
    <text x="${barX + barW + 12}" y="${y0 + 58}" class="s12 tab" fill="${C.sub}">${total}</text>

    ${icon('npv', 764, cy - 9, 18, C.green)}
    <circle cx="773" cy="${cy + 14}" r="1.8" fill="${C.green}"/>
    ${icon('mic', 794, cy - 9, 18, C.sub)}
    ${icon('queue', 824, cy - 9, 18, C.sub)}
    ${icon('device', 854, cy - 9, 18, C.sub)}
    ${icon('volume', 884, cy - 9, 18, C.sub)}
    <rect x="908" y="${cy - 2}" width="52" height="4" rx="2" fill="#4d4d4d"/>
    <rect x="908" y="${cy - 2}" width="38" height="4" rx="2" fill="${C.text}"/>
    ${icon('fullscreen', 970, cy - 9, 18, C.sub)}
  </g>`;
}

function styles() {
  const s = NOW_PLAYING.seconds;
  const minutes = s / 60;
  const lyricCount = NOW_PLAYING.lyrics.length;
  const cycle = 14; // seconds for one pass through the lyrics
  const lyricKeyframes = NOW_PLAYING.lyrics.map((_, i) => {
    const on = ((1 + i * 2.6) / cycle) * 100;
    return `@keyframes ly${i} { 0%, ${(on - 0.1).toFixed(1)}% { fill: ${NOW_PLAYING.lyricDim}; } ${on.toFixed(1)}%, 93% { fill: #fff; } 97%, 100% { fill: ${NOW_PLAYING.lyricDim}; } }
    .ly${i} { fill: ${i < 2 ? '#fff' : NOW_PLAYING.lyricDim}; animation: ly${i} ${cycle}s linear infinite; }`;
  }).join('\n    ');
  return `
  <style>
    text { font-family: ${FONT}; }
    .s9 { font-size: 9px; } .s12 { font-size: 12px; } .s13 { font-size: 13px; } .s14 { font-size: 14px; }
    .s15 { font-size: 15px; } .s16 { font-size: 16px; } .s18 { font-size: 18px; } .s22 { font-size: 22px; }
    .w5 { font-weight: 500; } .w6 { font-weight: 600; } .w7 { font-weight: 700; }
    .hero { font-size: 56px; font-weight: 900; letter-spacing: -2px; }
    .tab { font-variant-numeric: tabular-nums; }

    .eq { transform-box: fill-box; transform-origin: 50% 100%; animation: eq 1s ease-in-out infinite alternate; }
    .eq0 { animation-duration: .82s; } .eq1 { animation-duration: 1.14s; animation-delay: -.4s; }
    .eq2 { animation-duration: .7s; animation-delay: -.2s; } .eq3 { animation-duration: .96s; animation-delay: -.6s; }
    @keyframes eq { 0% { transform: scaleY(.25); } 50% { transform: scaleY(1); } 100% { transform: scaleY(.45); } }

    .progress { transform-box: fill-box; transform-origin: 0 50%; transform: scaleX(0); animation: progress ${s}s linear infinite; }
    @keyframes progress { to { transform: scaleX(1); } }
    .d-one { animation: d-one 10s steps(10) infinite; }
    .d-ten { animation: d-ten 60s steps(6) infinite; }
    .d-min { animation: d-min ${s}s steps(${minutes}) infinite; }
    @keyframes d-one { to { transform: translateY(-160px); } }
    @keyframes d-ten { to { transform: translateY(-96px); } }
    @keyframes d-min { to { transform: translateY(-${minutes * 16}px); } }

    ${lyricKeyframes}

    @media (prefers-reduced-motion: reduce) {
      .eq, .progress, .clock, .lyric { animation: none; }
      .eq { transform: scaleY(.7); }
    }
  </style>`;
}

function gradients() {
  return `
    <linearGradient id="g-header-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
    <linearGradient id="g-body-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#231946"/><stop offset="1" stop-color="${C.panel}"/></linearGradient>
    <linearGradient id="g-bottom-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.panel}" stop-opacity="0"/><stop offset="1" stop-color="${C.panel}"/></linearGradient>
    <linearGradient id="g-banner" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14532d"/><stop offset=".6" stop-color="#166534"/><stop offset="1" stop-color="#4c1d95"/></linearGradient>
    <linearGradient id="g-banner-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".45" stop-color="#000" stop-opacity="0"/></linearGradient>
    <filter id="f-cover-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="#000" flood-opacity=".55"/></filter>`;
}

function profileSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(PROFILE.name)} · ${esc(PLAYLIST.title)}</title>
  <desc id="desc">A Spotify-style desktop player showing ${esc(PROFILE.name)}'s public repositories as a playlist, with ${esc(NOW_PLAYING.track.name)} now playing.</desc>
  ${styles()}
  <defs>
    ${gradients()}
    ${coverDefs}
  </defs>

  <rect width="${W}" height="${H}" rx="14" fill="${C.base}"/>
  ${topBar()}
  ${sidebar()}
  ${mainPanel()}
  ${rightPanel()}
  ${playerBar()}
</svg>
`;
}

// Spotify-style pill buttons for the README link row. Each is its own image so it can carry its own link.
function linkSvg({ label, primary }) {
  const h = 44;
  const textW = textWidth(label, 15, 700);
  const w = Math.round(textW + (primary ? 72 : 44));
  const bg = primary ? C.green : C.raised;
  const fg = primary ? '#000' : C.text;
  const lead = primary
    ? `<circle cx="24" cy="${h / 2}" r="12" fill="#000"/>${icon('play', 17, h / 2 - 7, 14, C.green)}`
    : '';
  const textX = primary ? 46 + textW / 2 : w / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">
  <style>text { font-family: ${FONT}; font-size: 15px; font-weight: 700; }</style>
  <rect width="${w}" height="${h}" rx="${h / 2}" fill="${bg}"/>
  ${primary ? '' : `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${h / 2 - 0.5}" fill="none" stroke="#fff" stroke-opacity=".16"/>`}
  ${lead}
  <text x="${textX}" y="${h / 2 + 5.5}" text-anchor="middle" fill="${fg}">${esc(label)}</text>
</svg>
`;
}

mkdirSync(join(ROOT, 'assets'), { recursive: true });
writeFileSync(join(ROOT, 'assets', 'spotify-profile.svg'), profileSvg());
for (const link of LINKS) writeFileSync(join(ROOT, 'assets', link.file), linkSvg(link));
console.log(`wrote assets/spotify-profile.svg and ${LINKS.length} link buttons`);
