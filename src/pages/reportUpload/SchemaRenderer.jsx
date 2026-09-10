import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Info,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Send,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Activity,
  User,
  Tag,
} from "lucide-react";

// ─── Global Styles ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

  :root {
    --c-bg:        #f7f8fa;
    --c-surface:   #ffffff;
    --c-surface-2: #f2f4f7;
    --c-border:    #e4e7ed;
    --c-border-2:  #d1d5de;
    --c-ink:       #0d1117;
    --c-ink-2:     #1e2530;
    --c-ink-3:     #4a5568;
    --c-ink-4:     #8492a6;
    --c-blue:      #2563eb;
    --c-blue-dim:  #eff4ff;
    --c-blue-glow: rgba(37,99,235,0.12);
    --c-green:     #059669;
    --c-green-dim: #ecfdf5;
    --c-amber:     #d97316;
    --c-amber-dim: #fff7ed;
    --c-red:       #dc2626;
    --c-red-dim:   #fef2f2;
    --c-violet:    #7c3aed;
    --c-violet-dim:#f5f3ff;
    --c-teal:      #0891b2;
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   14px;
    --radius-xl:   18px;
    --shadow-sm:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md:   0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
    --shadow-lg:   0 10px 30px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.06);
    font-family: 'Outfit', sans-serif;
    color: var(--c-ink);
    background: var(--c-bg);
  }

  .sr2 * { box-sizing: border-box; margin: 0; padding: 0; }
  .sr2 { background: var(--c-bg); min-height: 100vh; }

  .sr2-ribbon {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 14px; border-radius: var(--radius-md);
    margin-bottom: 20px; font-size: 12px; font-weight: 500; border: 1px solid;
  }
  .sr2-ribbon.edit { background: var(--c-violet-dim); border-color: rgba(124,58,237,0.2); color: #5b21b6; }
  .sr2-ribbon.edit .dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--c-violet); flex-shrink: 0;
    animation: pulse2 2s ease-in-out infinite;
  }
  @keyframes pulse2 { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.75); } }

  .sr2-header {
    background: var(--c-surface); border: 1px solid var(--c-border);
    border-radius: var(--radius-xl); padding: 24px; margin-bottom: 16px; box-shadow: var(--shadow-sm);
  }
  .sr2-header-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
  .sr2-icon-box {
    width: 44px; height: 44px; border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s;
  }
  .sr2-icon-box.default { background: var(--c-ink); }
  .sr2-icon-box.edit    { background: var(--c-violet); }

  .sr2-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
  .sr2-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--c-border-2); }
  .sr2-title { font-size: clamp(20px, 4vw, 28px); font-weight: 800; color: var(--c-ink); letter-spacing: -0.03em; line-height: 1.1; }
  .sr2-desc { margin-top: 6px; font-size: 13.5px; color: var(--c-ink-3); line-height: 1.6; font-weight: 400; }

  .sr2-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px; }
  .sr2-stat { background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; }
  .sr2-stat-label { font-size: 10px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.07em; }
  .sr2-stat-val { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 600; color: var(--c-ink); line-height: 1; }
  .sr2-stat-val.green  { color: var(--c-green); }
  .sr2-stat-val.red    { color: var(--c-red); }
  .sr2-stat-val.violet { color: var(--c-violet); }
  .sr2-stat-val.blue   { color: var(--c-blue); }

  .sr2-progress-wrap { margin-top: 16px; }
  .sr2-progress-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .sr2-progress-label { font-size: 11px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.07em; }
  .sr2-progress-count { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--c-ink-3); }
  .sr2-track { height: 4px; background: var(--c-border); border-radius: 4px; overflow: hidden; }
  .sr2-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--c-blue), var(--c-teal)); transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
  .sr2-fill.complete { background: linear-gradient(90deg, var(--c-green), #10b981); }

  .sr2-alert { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-radius: var(--radius-md); border-left: 3px solid; margin-bottom: 12px; }
  .sr2-alert.amber  { background: var(--c-amber-dim);  border-color: var(--c-amber); }
  .sr2-alert.red    { background: var(--c-red-dim);    border-color: var(--c-red); }
  .sr2-alert.violet { background: var(--c-violet-dim); border-color: var(--c-violet); }
  .sr2-alert-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
  .sr2-alert.amber  .sr2-alert-title { color: #92400e; }
  .sr2-alert.red    .sr2-alert-title { color: #991b1b; }
  .sr2-alert.violet .sr2-alert-title { color: #4c1d95; }
  .sr2-alert-body { font-size: 12.5px; line-height: 1.5; }
  .sr2-alert.amber  .sr2-alert-body { color: #b45309; }
  .sr2-alert.red    .sr2-alert-body { color: #b91c1c; }
  .sr2-alert.violet .sr2-alert-body { color: #6d28d9; }

  /* Patient Form */
  .sr2-patient-form { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 16px; box-shadow: var(--shadow-sm); }
  .sr2-patient-form-head { display: flex; align-items: center; gap: 10px; padding: 10px 18px; background: var(--c-ink-2); }
  .sr2-patient-form-head-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.1em; }
  .sr2-patient-form-body { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
  .sr2-patient-input-cell { padding: 14px 18px; border-right: 1px solid var(--c-border); position: relative; }
  .sr2-patient-input-cell:last-child { border-right: none; }
  .sr2-patient-input-label { font-size: 10px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; display: block; }
  .sr2-patient-input { width: 100%; background: transparent; border: none; outline: none; font-size: 14px; font-weight: 600; color: var(--c-ink); font-family: 'Outfit', sans-serif; }
  .sr2-patient-input::placeholder { color: var(--c-border-2); font-weight: 400; }

  /* ── Section — overflow visible so dropdown can escape ── */
  .sr2-section { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-lg); overflow: visible; box-shadow: var(--shadow-sm); transition: box-shadow 0.2s, border-color 0.2s; }
  .sr2-section:hover { box-shadow: var(--shadow-md); }
  .sr2-section.has-error { border-color: rgba(220,38,38,0.4); }
  .sr2-section-head { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: var(--c-ink); cursor: pointer; border: none; width: 100%; text-align: left; transition: background 0.15s; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
  .sr2-section-head:hover { background: var(--c-ink-2); }
  .sr2-section-head.error { background: #7f1d1d; }
  .sr2-section-num { width: 28px; height: 28px; border-radius: var(--radius-sm); background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.15); }
  .sr2-section-num.done { background: var(--c-blue); border-color: var(--c-blue); color: #fff; }
  .sr2-section-num.err  { background: var(--c-red);  border-color: var(--c-red);  color: #fff; }
  .sr2-section-name { flex: 1; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); letter-spacing: 0.01em; }
  .sr2-section-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; padding: 3px 9px; border-radius: 20px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.1); }
  .sr2-section-badge.done { background: rgba(37,99,235,0.3); color: #93c5fd; border-color: rgba(37,99,235,0.4); }
  .sr2-section-bar { height: 2px; background: rgba(255,255,255,0.06); }
  .sr2-section-bar-fill { height: 100%; background: var(--c-blue); transition: width 0.5s ease; }
  .sr2-chevron { color: rgba(255,255,255,0.3); transition: transform 0.2s ease; flex-shrink: 0; }
  .sr2-chevron.open { transform: rotate(180deg); }

  /* ── Fields grid — overflow visible so dropdown can escape ── */
  .sr2-fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px 18px; padding: 20px 18px; overflow: visible; }

  .sr2-field-wrap { position: relative; background: var(--c-surface); border: 1.5px solid var(--c-border); border-radius: var(--radius-md); transition: border-color 0.15s, box-shadow 0.15s; }
  .sr2-field-wrap:focus-within { border-color: var(--c-blue); box-shadow: 0 0 0 3px var(--c-blue-glow); }
  .sr2-field-wrap.ok     { border-color: var(--c-green);  box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
  .sr2-field-wrap.low    { border-color: var(--c-amber);  box-shadow: 0 0 0 3px rgba(217,115,22,0.1); }
  .sr2-field-wrap.high   { border-color: var(--c-red);    box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
  .sr2-field-wrap.tag    { border-color: var(--c-violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
  .sr2-field-wrap.err    { border-color: var(--c-red);    box-shadow: 0 0 0 3px rgba(220,38,38,0.1); background: #fff8f8; }
  .sr2-field-wrap.edited { border-color: var(--c-violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
  .sr2-float-label { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.05em; pointer-events: none; line-height: 1; background: transparent; transition: all 0.15s ease; white-space: nowrap; max-width: calc(100% - 64px); overflow: hidden; text-overflow: ellipsis; }
  .sr2-field-wrap.floated .sr2-float-label,
  .sr2-field-wrap:focus-within .sr2-float-label { top: 0; transform: translateY(-50%); font-size: 9px; color: var(--c-blue); background: var(--c-surface); padding: 0 4px; left: 9px; }
  .sr2-field-wrap.err.floated .sr2-float-label { background: #fff8f8; color: var(--c-red); }
  .sr2-req { display: inline-block; width: 4px; height: 4px; border-radius: 50%; background: var(--c-blue); margin-left: 3px; vertical-align: middle; margin-bottom: 1px; }
  .sr2-num-input { width: 100%; padding: 18px 14px 8px 12px; background: transparent; border: none; outline: none; font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 500; color: var(--c-ink); line-height: 1.2; min-height: 54px; }
  .sr2-num-input::placeholder { color: transparent; }
  .sr2-num-input::-webkit-outer-spin-button, .sr2-num-input::-webkit-inner-spin-button { -webkit-appearance: none; }
  .sr2-unit { position: absolute; right: 0; top: 0; height: 100%; padding: 0 11px; display: flex; align-items: center; background: var(--c-surface-2); border-left: 1.5px solid var(--c-border); border-radius: 0 8px 8px 0; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; color: var(--c-ink-3); text-transform: uppercase; letter-spacing: 0.06em; pointer-events: none; }

  .sr2-range-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 5px; }
  .sr2-range-text { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-ink-4); }
  .sr2-range-text span { color: var(--c-ink-3); font-weight: 500; }
  .sr2-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; border: 1px solid; }
  .sr2-badge.ok     { background: var(--c-green-dim);  color: var(--c-green);  border-color: rgba(5,150,105,0.25); }
  .sr2-badge.low    { background: var(--c-amber-dim);  color: var(--c-amber);  border-color: rgba(217,115,22,0.25); }
  .sr2-badge.high   { background: var(--c-red-dim);    color: var(--c-red);    border-color: rgba(220,38,38,0.25); }
  .sr2-badge.tag    { background: var(--c-violet-dim); color: var(--c-violet); border-color: rgba(124,58,237,0.25); text-transform: none; }
  .sr2-badge.edited { background: var(--c-violet-dim); color: var(--c-violet); border-color: rgba(124,58,237,0.2); font-family: 'JetBrains Mono', monospace; font-size: 9px; }
  .sr2-tip-wrap { position: relative; display: inline-flex; }
  .sr2-tip-box { position: absolute; z-index: 50; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); width: 220px; background: var(--c-ink-2); color: #e2e8f0; font-size: 11px; border-radius: var(--radius-md); padding: 10px 12px; box-shadow: var(--shadow-lg); border: 1px solid rgba(255,255,255,0.08); pointer-events: none; }
  .sr2-tip-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #60a5fa; margin-bottom: 7px; }
  .sr2-tip-row { color: #94a3b8; line-height: 1.75; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; }
  .sr2-tip-row span { color: #e2e8f0; font-weight: 500; }
  .sr2-tip-sub { color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 6px; margin-bottom: 2px; }
  .sr2-tip-arrow { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: var(--c-ink-2); }
  .sr2-info-btn { background: none; border: none; cursor: pointer; padding: 0; display: inline-flex; line-height: 0; }

  .sr2-toggle { padding: 9px 14px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; border: 1.5px solid var(--c-border); background: var(--c-surface); color: var(--c-ink-3); cursor: pointer; transition: all 0.12s; display: flex; align-items: center; gap: 8px; min-height: 42px; }
  .sr2-toggle:hover { border-color: var(--c-ink-3); color: var(--c-ink); background: var(--c-surface-2); }
  .sr2-toggle.on { background: var(--c-ink); border-color: var(--c-ink); color: #fff; box-shadow: 0 2px 8px rgba(13,17,23,0.2); }

  .sr2-dd-wrap { position: relative; }
  .sr2-dd-btn { width: 100%; display: flex; align-items: flex-end; justify-content: space-between; padding: 18px 14px 8px 12px; border: 1.5px solid var(--c-border); border-radius: var(--radius-md); background: var(--c-surface); cursor: pointer; transition: all 0.15s; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 500; color: var(--c-ink); min-height: 54px; }
  .sr2-dd-btn.empty { color: transparent; }
  .sr2-dd-btn.open, .sr2-dd-btn:focus { border-color: var(--c-blue); box-shadow: 0 0 0 3px var(--c-blue-glow); outline: none; }
  .sr2-dd-label { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.05em; pointer-events: none; transition: all 0.15s ease; background: transparent; line-height: 1; white-space: nowrap; }
  .sr2-dd-wrap.floated .sr2-dd-label { top: 0; transform: translateY(-50%); font-size: 9px; color: var(--c-blue); background: var(--c-surface); padding: 0 4px; left: 9px; }
  /* ── Dropdown menu — high z-index to clear sidebar stacking context ── */
  .sr2-dd-menu { position: absolute; z-index: 9999; top: calc(100% + 4px); left: 0; right: 0; background: var(--c-surface); border: 1.5px solid var(--c-border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); overflow-y: auto; max-height: 200px; }
  .sr2-dd-item { width: 100%; text-align: left; padding: 11px 14px; font-size: 13.5px; font-weight: 400; color: var(--c-ink-3); background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: background 0.1s; min-height: 42px; }
  .sr2-dd-item:hover    { background: var(--c-surface-2); color: var(--c-ink); }
  .sr2-dd-item.selected { background: var(--c-ink); color: #fff; font-weight: 600; }

  .sr2-ta-wrap { position: relative; border: 1.5px solid var(--c-border); border-radius: var(--radius-md); background: var(--c-surface); transition: all 0.15s; overflow: hidden; }
  .sr2-ta-wrap:focus-within { border-color: var(--c-blue); box-shadow: 0 0 0 3px var(--c-blue-glow); }
  .sr2-ta-wrap.err    { border-color: var(--c-red);    background: #fff8f8; }
  .sr2-ta-wrap.edited { border-color: var(--c-violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
  .sr2-ta-label { position: absolute; left: 12px; top: 14px; font-size: 12px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.05em; pointer-events: none; transition: all 0.15s ease; line-height: 1; }
  .sr2-ta-wrap.floated .sr2-ta-label, .sr2-ta-wrap:focus-within .sr2-ta-label { top: 0; transform: translateY(-50%); font-size: 9px; color: var(--c-blue); background: var(--c-surface); padding: 0 4px; left: 9px; }
  .sr2-ta { width: 100%; padding: 22px 14px 10px 12px; background: transparent; border: none; outline: none; resize: none; font-family: 'Outfit', sans-serif; font-size: 13.5px; color: var(--c-ink); }
  .sr2-ta::placeholder { color: transparent; }
  .sr2-char { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-ink-4); text-align: right; padding: 2px 10px 6px; }

  .sr2-ti-wrap { position: relative; border: 1.5px solid var(--c-border); border-radius: var(--radius-md); background: var(--c-surface); transition: all 0.15s; }
  .sr2-ti-wrap:focus-within { border-color: var(--c-blue); box-shadow: 0 0 0 3px var(--c-blue-glow); }
  .sr2-ti-wrap.err    { border-color: var(--c-red);    background: #fff8f8; }
  .sr2-ti-wrap.edited { border-color: var(--c-violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
  .sr2-ti-label { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.05em; pointer-events: none; transition: all 0.15s ease; line-height: 1; white-space: nowrap; }
  .sr2-ti-wrap.floated .sr2-ti-label, .sr2-ti-wrap:focus-within .sr2-ti-label { top: 0; transform: translateY(-50%); font-size: 9px; color: var(--c-blue); background: var(--c-surface); padding: 0 4px; left: 9px; }
  .sr2-ti { width: 100%; padding: 18px 14px 8px 12px; background: transparent; border: none; outline: none; font-family: 'Outfit', sans-serif; font-size: 13.5px; color: var(--c-ink); min-height: 54px; }
  .sr2-ti::placeholder { color: transparent; }

  .sr2-ref-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 5px; padding: 0 2px; }
  .sr2-ref-text { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-ink-4); display: flex; align-items: center; gap: 4px; }
  .sr2-ref-text span { color: var(--c-violet); font-weight: 600; }

  .sr2-action-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); flex-wrap: wrap; gap: 12px; }
  .sr2-action-hint { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--c-ink-4); }
  .sr2-btn-ghost { display: flex; align-items: center; gap: 7px; padding: 10px 16px; border: 1.5px solid var(--c-border); border-radius: var(--radius-md); background: var(--c-surface); color: var(--c-ink-3); font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.02em; cursor: pointer; transition: all 0.15s; min-height: 42px; }
  .sr2-btn-ghost:hover { border-color: var(--c-ink-2); color: var(--c-ink); background: var(--c-surface-2); }
  .sr2-btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: var(--radius-md); background: var(--c-blue); color: #fff; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.02em; border: none; cursor: pointer; transition: all 0.15s; box-shadow: 0 2px 8px rgba(37,99,235,0.3); min-height: 42px; }
  .sr2-btn-primary:hover  { background: #1d4ed8; box-shadow: 0 4px 14px rgba(37,99,235,0.4); transform: translateY(-1px); }
  .sr2-btn-primary:active { transform: translateY(0); }
  .sr2-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .sr2-btn-primary.edit { background: var(--c-violet); box-shadow: 0 2px 8px rgba(124,58,237,0.3); }
  .sr2-btn-primary.edit:hover { background: #6d28d9; box-shadow: 0 4px 14px rgba(124,58,237,0.4); }
  .sr2-spin-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.7); animation: pulse2 1.5s ease-in-out infinite; }

  .sr2-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; text-align: center; }
  .sr2-empty-icon { width: 56px; height: 56px; background: var(--c-surface-2); border: 1.5px solid var(--c-border); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }

  @media (max-width: 640px) {
    .sr2-patient-form-body { grid-template-columns: 1fr 1fr; }
    .sr2-patient-input-cell:nth-child(2) { border-right: none; }
    .sr2-patient-input-cell:nth-child(3) { border-top: 1px solid var(--c-border); border-right: none; grid-column: 1 / -1; }
    .sr2-stats  { grid-template-columns: 1fr 1fr; }
    .sr2-fields { grid-template-columns: 1fr 1fr; padding: 14px; gap: 10px; }
    .sr2-btn-primary, .sr2-btn-ghost { padding: 10px 14px; font-size: 12px; }
    .sr2-title  { font-size: 20px; }
  }
  @media (max-width: 380px) {
    .sr2-fields { grid-template-columns: 1fr; }
    .sr2-stats  { grid-template-columns: 1fr 1fr; }
  }
`;

function StyleInjector() {
  useEffect(() => {
    const id = "sr2-styles-v1";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
    const el = document.getElementById(id);
    if (el) el.textContent = STYLES;
  }, []);
  return null;
}

// ─── Range Logic ──────────────────────────────────────────────────────────────
// Returns either:
//   { mode: "range", min, max }                      — plain numeric range
//   { mode: "tagged", tiers: [{label,min,max}, ...] } — labeled tiers
//   null                                              — no applicable range
export function getStandardRangeInfo(field, patientAge, patientGender) {
  const sr = field.standardRange;
  if (!sr || sr.type === "none") return null;
  const mode = sr.mode || "range";

  if (mode === "range") {
    if (sr.type === "simple" && sr.data) {
      return { mode, min: parseFloat(sr.data.min), max: parseFloat(sr.data.max) };
    }
    if (sr.type === "age" && patientAge && Array.isArray(sr.data)) {
      const age = parseFloat(patientAge);
      const row = sr.data.find((r) => age >= parseFloat(r.minAge) && age <= parseFloat(r.maxAge));
      if (row) return { mode, min: parseFloat(row.minValue), max: parseFloat(row.maxValue) };
    }
    if (sr.type === "gender" && patientGender && sr.data) {
      const g = sr.data[patientGender];
      if (g) return { mode, min: parseFloat(g.min), max: parseFloat(g.max) };
    }
    if (sr.type === "combined" && patientAge && patientGender && Array.isArray(sr.data)) {
      const age = parseFloat(patientAge);
      const row = sr.data.find(
        (r) => r.gender === patientGender && age >= parseFloat(r.minAge) && age <= parseFloat(r.maxAge),
      );
      if (row) return { mode, min: parseFloat(row.minValue), max: parseFloat(row.maxValue) };
    }
    return null;
  }

  // mode === "tagged"
  let tiers = [];
  if (sr.type === "simple" && Array.isArray(sr.data)) {
    tiers = sr.data;
  } else if (sr.type === "age" && patientAge && Array.isArray(sr.data)) {
    const age = parseFloat(patientAge);
    const bracket = sr.data.find((b) => age >= parseFloat(b.minAge) && age <= parseFloat(b.maxAge));
    tiers = bracket?.tiers || [];
  } else if (sr.type === "gender" && patientGender && sr.data) {
    tiers = sr.data[patientGender] || [];
  } else if (sr.type === "combined" && patientAge && patientGender && Array.isArray(sr.data)) {
    const age = parseFloat(patientAge);
    const bracket = sr.data.find(
      (b) => b.gender === patientGender && age >= parseFloat(b.minAge) && age <= parseFloat(b.maxAge),
    );
    tiers = bracket?.tiers || [];
  }
  if (!tiers || tiers.length === 0) return null;
  return { mode, tiers };
}

// Backwards-compatible alias used by older callers expecting {min,max}
export function getStandardRange(field, patientAge, patientGender) {
  const info = getStandardRangeInfo(field, patientAge, patientGender);
  if (!info || info.mode !== "range") return null;
  return { min: info.min, max: info.max };
}

// Given a value and range info, return a status descriptor.
// { kind: "range", status: "low"|"normal"|"high" }
// { kind: "tagged", status: "low"|"high"|"normal"|"tag", label }
export function evaluateStatus(value, rangeInfo) {
  if (!rangeInfo || value === "" || value === null || value === undefined) return null;
  const v = parseFloat(value);
  if (isNaN(v)) return null;

  if (rangeInfo.mode === "range") {
    let status = "normal";
    if (v < rangeInfo.min) status = "low";
    else if (v > rangeInfo.max) status = "high";
    return { kind: "range", status };
  }

  // tagged
  const tier = rangeInfo.tiers.find((t) => v >= parseFloat(t.min) && v <= parseFloat(t.max));
  if (!tier) return null;
  const label = (tier.label || "").toLowerCase();
  let status = "tag";
  if (/low/.test(label)) status = "low";
  else if (/high/.test(label)) status = "high";
  else if (/normal|unremarkable|negative/.test(label)) status = "normal";
  return { kind: "tagged", status, label: tier.label };
}

// Kept for any external callers that used the old simple status helper.
export function getRangeStatus(value, range) {
  if (!range) return "neutral";
  const res = evaluateStatus(value, { mode: "range", ...range });
  return res ? res.status : "neutral";
}

// ─── Reference Value Logic (text/textarea fields) ─────────────────────────────
export function getReferenceValue(field, patientAge, patientGender) {
  const rv = field.referenceValue;
  if (!rv || rv.type === "none") return null;
  if (rv.type === "simple") return rv.data?.value || null;
  if (rv.type === "age" && patientAge && Array.isArray(rv.data)) {
    const age = parseFloat(patientAge);
    const row = rv.data.find((r) => age >= parseFloat(r.minAge) && age <= parseFloat(r.maxAge));
    return row?.value || null;
  }
  if (rv.type === "gender" && patientGender && rv.data) {
    return rv.data[patientGender]?.value || null;
  }
  if (rv.type === "combined" && patientAge && patientGender && Array.isArray(rv.data)) {
    const age = parseFloat(patientAge);
    const row = rv.data.find(
      (r) => r.gender === patientGender && age >= parseFloat(r.minAge) && age <= parseFloat(r.maxAge),
    );
    return row?.value || null;
  }
  return null;
}

// Hydrates form `values` state from a previously-saved report payload.
// report[sectionName] = { ...fieldEntries, __showTitle }
export function hydrateValuesFromReport(schema, existingReport) {
  if (!existingReport || !schema?.sections) return {};
  const values = {};
  schema.sections.forEach((section, si) => {
    const sectionData = existingReport[section.name];
    if (!sectionData) return;
    section.fields.forEach((field) => {
      const key = `${si}_${field.name}`;
      const fieldData = sectionData[field.name];
      if (!fieldData) return;
      values[key] = fieldData.value ?? fieldData;
    });
  });
  return values;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function RangeTooltip({ field }) {
  const [open, setOpen] = useState(false);
  const sr = field.standardRange;
  if (!sr || sr.type === "none") return null;
  const mode = sr.mode || "range";

  return (
    <div className="sr2-tip-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="sr2-info-btn" type="button">
        <Info style={{ width: 12, height: 12, color: "var(--c-ink-4)" }} />
      </button>
      {open && (
        <div className="sr2-tip-box">
          <div className="sr2-tip-title">{mode === "tagged" ? "Reference Tiers" : "Reference Ranges"}</div>

          {mode === "range" && sr.type === "simple" && sr.data && (
            <div className="sr2-tip-row">
              {sr.data.min} – {sr.data.max} {field.unit || ""}
            </div>
          )}
          {mode === "range" &&
            sr.type === "age" &&
            Array.isArray(sr.data) &&
            sr.data.map((r, i) => (
              <div key={i} className="sr2-tip-row">
                Age {r.minAge}–{r.maxAge === 999 ? "∞" : r.maxAge}:{" "}
                <span>
                  {r.minValue}–{r.maxValue}
                </span>
              </div>
            ))}
          {mode === "range" &&
            sr.type === "gender" &&
            sr.data &&
            Object.entries(sr.data).map(([g, v]) => (
              <div key={g} className="sr2-tip-row" style={{ textTransform: "capitalize" }}>
                {g}:{" "}
                <span>
                  {v.min}–{v.max}
                </span>
              </div>
            ))}
          {mode === "range" &&
            sr.type === "combined" &&
            Array.isArray(sr.data) &&
            sr.data.map((r, i) => (
              <div key={i} className="sr2-tip-row" style={{ textTransform: "capitalize" }}>
                {r.gender} {r.minAge}–{r.maxAge === 999 ? "∞" : r.maxAge}yr:{" "}
                <span>
                  {r.minValue}–{r.maxValue}
                </span>
              </div>
            ))}

          {mode === "tagged" &&
            sr.type === "simple" &&
            Array.isArray(sr.data) &&
            sr.data.map((t, i) => (
              <div key={i} className="sr2-tip-row">
                {t.label}:{" "}
                <span>
                  {t.min}–{t.max}
                </span>
              </div>
            ))}
          {mode === "tagged" &&
            sr.type === "age" &&
            Array.isArray(sr.data) &&
            sr.data.map((b, i) => (
              <div key={i}>
                <div className="sr2-tip-sub">
                  Age {b.minAge}–{b.maxAge === 999 ? "∞" : b.maxAge}
                </div>
                {(b.tiers || []).map((t, j) => (
                  <div key={j} className="sr2-tip-row">
                    {t.label}:{" "}
                    <span>
                      {t.min}–{t.max}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          {mode === "tagged" &&
            sr.type === "gender" &&
            sr.data &&
            Object.entries(sr.data).map(([g, tiers]) => (
              <div key={g}>
                <div className="sr2-tip-sub" style={{ textTransform: "capitalize" }}>
                  {g}
                </div>
                {(tiers || []).map((t, j) => (
                  <div key={j} className="sr2-tip-row">
                    {t.label}:{" "}
                    <span>
                      {t.min}–{t.max}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          {mode === "tagged" &&
            sr.type === "combined" &&
            Array.isArray(sr.data) &&
            sr.data.map((b, i) => (
              <div key={i}>
                <div className="sr2-tip-sub" style={{ textTransform: "capitalize" }}>
                  {b.gender}, {b.minAge}–{b.maxAge === 999 ? "∞" : b.maxAge}yr
                </div>
                {(b.tiers || []).map((t, j) => (
                  <div key={j} className="sr2-tip-row">
                    {t.label}:{" "}
                    <span>
                      {t.min}–{t.max}
                    </span>
                  </div>
                ))}
              </div>
            ))}

          <div className="sr2-tip-arrow" />
        </div>
      )}
    </div>
  );
}

// ─── Patient Form ─────────────────────────────────────────────────────────────

function PatientForm({ patient, onChange }) {
  return (
    <div className="sr2-patient-form">
      <div className="sr2-patient-form-head">
        <User style={{ width: 13, height: 13, color: "#60a5fa" }} />
        <span className="sr2-patient-form-head-label">Patient Info</span>
      </div>
      <div className="sr2-patient-form-body">
        <div className="sr2-patient-input-cell" style={{ gridColumn: "1 / 2" }}>
          <label className="sr2-patient-input-label">Patient Name</label>
          <input
            className="sr2-patient-input"
            type="text"
            placeholder="Enter name"
            value={patient.patientName}
            onChange={(e) => onChange("patientName", e.target.value)}
          />
        </div>
        <div className="sr2-patient-input-cell">
          <label className="sr2-patient-input-label">Age</label>
          <input
            className="sr2-patient-input"
            type="number"
            placeholder="Years"
            value={patient.age}
            onChange={(e) => onChange("age", e.target.value)}
          />
        </div>
        <div className="sr2-patient-input-cell" style={{ borderRight: "none" }}>
          <label className="sr2-patient-input-label">Gender</label>
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            {["male", "female", "other"].map((g) => {
              const sel = patient.gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => onChange("gender", sel ? "" : g)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    border: `1.5px solid ${sel ? "var(--c-ink)" : "var(--c-border)"}`,
                    background: sel ? "var(--c-ink)" : "transparent",
                    color: sel ? "#fff" : "var(--c-ink-3)",
                    cursor: "pointer",
                    transition: "all 0.12s",
                    textTransform: "capitalize",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
        <div className="sr2-patient-input-cell" style={{ borderTop: "1px solid var(--c-border)" }}>
          <label className="sr2-patient-input-label">Sample Collection Date</label>
          <input
            className="sr2-patient-input"
            type="date"
            value={patient.sampleCollectionDate}
            onChange={(e) => onChange("sampleCollectionDate", e.target.value)}
          />
        </div>
        <div
          className="sr2-patient-input-cell"
          style={{ borderTop: "1px solid var(--c-border)", borderRight: "none", gridColumn: "2 / 4" }}
        >
          <label className="sr2-patient-input-label">Report Date</label>
          <input
            className="sr2-patient-input"
            type="date"
            value={patient.reportDate}
            onChange={(e) => onChange("reportDate", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Number Field ─────────────────────────────────────────────────────────────

function NumberField({ field, value, onChange, error, patientAge, patientGender }) {
  const rangeInfo = getStandardRangeInfo(field, patientAge, patientGender);
  const evaluated = evaluateStatus(value, rangeInfo);
  const hasValue = value !== "" && value !== null && value !== undefined;

  let cls = "sr2-field-wrap";
  if (error) cls += " err";
  else if (hasValue && evaluated) cls += ` ${evaluated.status === "normal" ? "ok" : evaluated.status}`;
  if (hasValue) cls += " floated";

  const rangeText =
    rangeInfo?.mode === "range" ? `${rangeInfo.min}–${rangeInfo.max}${field.unit ? ` ${field.unit}` : ""}` : null;

  return (
    <div>
      <div className={cls}>
        <span className="sr2-float-label">
          {field.name}
          {field.required && <span className="sr2-req" />}
        </span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          className="sr2-num-input"
          style={{ paddingRight: field.unit ? "62px" : "14px" }}
        />
        {field.unit && <span className="sr2-unit">{field.unit}</span>}
      </div>
      <div className="sr2-range-row">
        {rangeText ? (
          <span className="sr2-range-text">
            Ref: <span>{rangeText}</span>
          </span>
        ) : rangeInfo?.mode === "tagged" ? (
          <span className="sr2-range-text">Tiered ref.</span>
        ) : (
          <span className="sr2-range-text">—</span>
        )}
        {hasValue && evaluated && evaluated.kind === "range" && evaluated.status !== "normal" && (
          <span className={`sr2-badge ${evaluated.status}`}>
            {evaluated.status === "low" && <TrendingDown style={{ width: 9, height: 9 }} />}
            {evaluated.status === "high" && <TrendingUp style={{ width: 9, height: 9 }} />}
            {evaluated.status === "low" ? "Low" : "High"}
          </span>
        )}
        {hasValue && evaluated && evaluated.kind === "range" && evaluated.status === "normal" && (
          <span className="sr2-badge ok">
            <CheckCircle2 style={{ width: 9, height: 9 }} />
            Normal
          </span>
        )}
        {hasValue && evaluated && evaluated.kind === "tagged" && (
          <span className={`sr2-badge ${evaluated.status === "tag" ? "tag" : evaluated.status}`}>
            {evaluated.status === "low" && <TrendingDown style={{ width: 9, height: 9 }} />}
            {evaluated.status === "high" && <TrendingUp style={{ width: 9, height: 9 }} />}
            {evaluated.status === "normal" && <CheckCircle2 style={{ width: 9, height: 9 }} />}
            {evaluated.status === "tag" && <Tag style={{ width: 9, height: 9 }} />}
            {evaluated.label}
          </span>
        )}
        <RangeTooltip field={field} />
      </div>
    </div>
  );
}

// ─── Radio ────────────────────────────────────────────────────────────────────

function RadioField({ field, options = [], value, onChange, error }) {
  return (
    <div>
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--c-ink-4)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {field.name}
          {field.required && <span className="sr2-req" style={{ marginLeft: 3 }} />}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const sel = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(value === opt ? "" : opt)}
              className={`sr2-toggle ${sel ? "on" : ""}`}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: `2px solid ${sel ? "rgba(255,255,255,0.5)" : "var(--c-border-2)"}`,
                  background: sel ? "#fff" : "transparent",
                  boxShadow: sel ? "inset 0 0 0 2.5px var(--c-ink)" : "none",
                }}
              />
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function DropdownField({ field, options = [], value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const floated = !!value;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest(".sr2-dd-wrap")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div>
      <div className={`sr2-dd-wrap ${floated ? "floated" : ""}`}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`sr2-dd-btn ${!value ? "empty" : ""} ${open ? "open" : ""}`}
        >
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 500 }}>{value || ""}</span>
          <ChevronDown
            className={`sr2-chevron ${open ? "open" : ""}`}
            style={{ width: 15, height: 15, color: "var(--c-ink-4)" }}
          />
        </button>
        <span className="sr2-dd-label">
          {field.name}
          {field.required && <span className="sr2-req" />}
        </span>
        {open && (
          <div className="sr2-dd-menu">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`sr2-dd-item ${value === opt ? "selected" : ""}`}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                {opt}
                {value === opt && <CheckCircle2 style={{ width: 13, height: 13 }} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function CheckboxField({ field, options = [], value = [], onChange, error }) {
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  return (
    <div>
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--c-ink-4)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {field.name}
          {field.required && <span className="sr2-req" style={{ marginLeft: 3 }} />}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const checked = value.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)} className={`sr2-toggle ${checked ? "on" : ""}`}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  flexShrink: 0,
                  border: `2px solid ${checked ? "rgba(255,255,255,0.5)" : "var(--c-border-2)"}`,
                  background: checked ? "#fff" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {checked && (
                  <svg width="8" height="7" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="var(--c-ink)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reference-value row (shared by Textarea & Text Input) ───────────────────

function ReferenceValueRow({ field, patientAge, patientGender }) {
  const refValue = getReferenceValue(field, patientAge, patientGender);
  if (!refValue) return null;
  return (
    <div className="sr2-ref-row">
      <span className="sr2-ref-text">
        <Tag style={{ width: 9, height: 9 }} />
        Ref: <span>{refValue}</span>
      </span>
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

function TextareaField({ field, value, onChange, error, patientAge, patientGender }) {
  // Fall back to the same 200-char default the builder assumes, so a schema
  // saved with a missing/invalid maxLength (null, 0, NaN, undefined) doesn't
  // render "12/null" or silently lift the character limit.
  const maxLength = field.maxLength || 200;
  const floated = !!(value && value.length > 0);
  return (
    <div>
      <div className={`sr2-ta-wrap ${error ? "err" : ""} ${floated ? "floated" : ""}`}>
        <span className="sr2-ta-label">
          {field.name}
          {field.required && <span className="sr2-req" />}
        </span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          rows={3}
          placeholder=" "
          className="sr2-ta"
        />
        <div className="sr2-char">
          {(value || "").length}/{maxLength}
        </div>
      </div>
      <ReferenceValueRow field={field} patientAge={patientAge} patientGender={patientGender} />
    </div>
  );
}

// ─── Text Input ───────────────────────────────────────────────────────────────

function TextInputField({ field, value, onChange, error, patientAge, patientGender }) {
  // Same fallback as TextareaField above.
  const maxLength = field.maxLength || 200;
  const floated = !!(value && value.length > 0);
  return (
    <div>
      <div className={`sr2-ti-wrap ${error ? "err" : ""} ${floated ? "floated" : ""}`}>
        <span className="sr2-ti-label">
          {field.name}
          {field.required && <span className="sr2-req" />}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder=" "
          className="sr2-ti"
        />
        <div className="sr2-char" style={{ position: "absolute", right: 0, bottom: 0, padding: "2px 10px 4px" }}>
          {(value || "").length}/{maxLength}
        </div>
      </div>
      <ReferenceValueRow field={field} patientAge={patientAge} patientGender={patientGender} />
    </div>
  );
}

// ─── Section Panel ────────────────────────────────────────────────────────────

function SectionPanel({ section, sectionIndex, values, onChange, errors, patientAge, patientGender }) {
  const [collapsed, setCollapsed] = useState(false);
  const fieldCount = section.fields.length;
  const filledCount = section.fields.filter((f) => {
    const v = values[`${sectionIndex}_${f.name}`];
    return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
  }).length;
  const hasError = section.fields.some((f) => errors[`${sectionIndex}_${f.name}`]);
  const complete = filledCount === fieldCount && fieldCount > 0;
  const pct = fieldCount > 0 ? (filledCount / fieldCount) * 100 : 0;

  const grid = (
    <div className="sr2-fields">
      {section.fields.map((field) => {
        const key = `${sectionIndex}_${field.name}`;
        const val = values[key] ?? (field.type === "checkbox" ? [] : "");
        const err = errors[key];
        const full = field.type === "textarea" || field.type === "checkbox" || field.type === "radio";
        return (
          <div key={key} style={full ? { gridColumn: "1 / -1" } : {}}>
            {field.type === "number" && (
              <NumberField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                patientAge={patientAge}
                patientGender={patientGender}
              />
            )}
            {field.type === "radio" && (
              <RadioField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
              />
            )}
            {field.type === "select" && (
              <DropdownField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
              />
            )}
            {field.type === "checkbox" && (
              <CheckboxField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
              />
            )}
            {field.type === "textarea" && (
              <TextareaField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                patientAge={patientAge}
                patientGender={patientGender}
              />
            )}
            {field.type === "input" && (
              <TextInputField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                patientAge={patientAge}
                patientGender={patientGender}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // NOTE: `section.showTitleInReport` only controls whether the section
  // heading appears in the *generated report* (see buildPayload's
  // `__showTitle`, consumed by the report-rendering view). It must never
  // hide this interactive header, since that's the only way to
  // collapse/expand a section and see its fill/error state while actually
  // entering data — both here in the live preview and in the real
  // ReportUpload data-entry form.
  return (
    <div className={`sr2-section ${hasError ? "has-error" : ""}`}>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`sr2-section-head ${hasError ? "error" : ""}`}
      >
        <div className={`sr2-section-num ${complete ? "done" : hasError ? "err" : ""}`}>{sectionIndex + 1}</div>
        <span className="sr2-section-name">{section.name}</span>
        <span className={`sr2-section-badge ${complete ? "done" : ""}`}>
          {filledCount}/{fieldCount}
        </span>
        <ChevronDown className={`sr2-chevron ${!collapsed ? "open" : ""}`} style={{ width: 15, height: 15 }} />
      </button>
      <div className="sr2-section-bar">
        <div className="sr2-section-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {!collapsed && grid}
    </div>
  );
}

// ─── Build Payload ────────────────────────────────────────────────────────────

function buildPayload(schema, values, patient) {
  const report = {};
  schema.sections.forEach((sec, si) => {
    const sd = {};
    sec.fields.forEach((field) => {
      const key = `${si}_${field.name}`;
      const val = values[key];
      if (val !== "" && val !== undefined && val !== null && !(Array.isArray(val) && val.length === 0)) {
        const entry = {
          value: val,
          ...(field.unit ? { unit: field.unit } : {}),
        };

        if (field.type === "number") {
          const rangeInfo = getStandardRangeInfo(field, patient.age, patient.gender);
          if (rangeInfo?.mode === "range") {
            entry.referenceRange = `${rangeInfo.min}–${rangeInfo.max}`;
          } else if (rangeInfo?.mode === "tagged") {
            const evaluated = evaluateStatus(val, rangeInfo);
            if (evaluated) entry.referenceTag = evaluated.label;
          }
        } else if (field.type === "input" || field.type === "textarea") {
          const refValue = getReferenceValue(field, patient.age, patient.gender);
          if (refValue) entry.referenceValue = refValue;
        }

        sd[field.name] = entry;
      }
    });
    if (Object.keys(sd).length > 0) report[sec.name] = { ...sd, __showTitle: sec.showTitleInReport !== false };
  });

  return {
    schemaId: schema._id,
    patientName: patient.patientName,
    patientAge: patient.age,
    patientGender: patient.gender,
    sampleCollectionDate: patient.sampleCollectionDate,
    reportDate: patient.reportDate,
    report,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

function SchemaRenderer({ schema, onSubmit, loading = false }) {
  const [patient, setPatient] = useState({
    patientName: "",
    age: "",
    gender: "",
    sampleCollectionDate: "",
    reportDate: "",
  });
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues({});
    setErrors({});
  }, [JSON.stringify(schema?.sections)]);

  const handlePatientChange = (field, val) => setPatient((p) => ({ ...p, [field]: val }));
  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    schema.sections.forEach((sec, si) => {
      sec.fields.forEach((field) => {
        if (!field.required) return;
        const key = `${si}_${field.name}`;
        const val = values[key];
        if (field.type === "checkbox") {
          if (!val || val.length === 0) errs[key] = "At least one option is required";
        } else {
          if (val === "" || val === undefined || val === null) errs[key] = "This field is required";
        }
      });
    });
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onSubmit?.(buildPayload(schema, values, patient));
  };

  const handleReset = () => {
    setValues({});
    setPatient({ patientName: "", age: "", gender: "", sampleCollectionDate: "", reportDate: "" });
    setErrors({});
  };

  if (!schema || !schema.sections) return null;

  const allKeys = schema.sections.flatMap((sec, si) => sec.fields.map((f) => `${si}_${f.name}`));
  const hasFields = schema.sections.some((s) => s.fields.length > 0);
  const totalFields = allKeys.length;
  const totalFilled = allKeys.filter((k) => {
    const v = values[k];
    return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
  }).length;
  const progress = totalFields > 0 ? (totalFilled / totalFields) * 100 : null;

  const numEvaluations = schema.sections.flatMap((sec, si) =>
    sec.fields
      .filter((f) => f.type === "number")
      .map((f) => {
        const rangeInfo = getStandardRangeInfo(f, patient.age, patient.gender);
        return evaluateStatus(values[`${si}_${f.name}`], rangeInfo);
      }),
  );
  const abnormalCount = numEvaluations.filter((e) => e && (e.status === "high" || e.status === "low")).length;
  const normalCount = numEvaluations.filter((e) => e && e.status === "normal").length;

  if (!hasFields) {
    return (
      <div className="sr2">
        <StyleInjector />
        <div className="sr2-empty">
          <div className="sr2-empty-icon">
            <Eye style={{ width: 22, height: 22, color: "var(--c-border-2)" }} />
          </div>
          <p style={{ fontWeight: 700, color: "var(--c-ink-3)", fontSize: 14 }}>No fields configured</p>
          <p style={{ color: "var(--c-ink-4)", fontSize: 13, marginTop: 4 }}>Add fields in the Builder to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sr2">
      <StyleInjector />
      <div style={{ maxWidth: 1600, margin: "0 auto", padding: "28px 20px 56px" }}>
        {/* Header card */}
        <div className="sr2-header">
          <div className="sr2-header-top">
            <div className="sr2-icon-box default">
              <Activity style={{ width: 18, height: 18, color: "#60a5fa" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sr2-meta">
                <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>Lab Report Entry</span>
              </div>
              <h1 className="sr2-title">{schema.description || "Lab Report"}</h1>
            </div>
          </div>

          <div className="sr2-stats">
            {progress !== null && (
              <div className="sr2-stat">
                <span className="sr2-stat-label">Progress</span>
                <span className={`sr2-stat-val ${progress === 100 ? "green" : "blue"}`}>{Math.round(progress)}%</span>
              </div>
            )}
            <div className="sr2-stat">
              <span className="sr2-stat-label">Filled</span>
              <span className="sr2-stat-val">
                {totalFilled}
                <span style={{ fontSize: 13, color: "var(--c-ink-4)", fontWeight: 400 }}>/{totalFields}</span>
              </span>
            </div>
            <div className="sr2-stat">
              <span className="sr2-stat-label">In Range</span>
              <span className={`sr2-stat-val ${normalCount > 0 ? "green" : ""}`}>{normalCount}</span>
            </div>
            <div className="sr2-stat">
              <span className="sr2-stat-label">Abnormal</span>
              <span className={`sr2-stat-val ${abnormalCount > 0 ? "red" : ""}`}>{abnormalCount}</span>
            </div>
          </div>

          {progress !== null && (
            <div className="sr2-progress-wrap">
              <div className="sr2-progress-row">
                <span className="sr2-progress-label">Completion</span>
                <span className="sr2-progress-count">
                  {totalFilled} / {totalFields} fields
                </span>
              </div>
              <div className="sr2-track">
                <div className={`sr2-fill ${progress === 100 ? "complete" : ""}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Abnormal alert */}
        {abnormalCount > 0 && (
          <div className="sr2-alert amber">
            <AlertTriangle style={{ width: 16, height: 16, color: "var(--c-amber)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="sr2-alert-title">Abnormal Values Detected</div>
              <div className="sr2-alert-body">
                {abnormalCount} result{abnormalCount > 1 ? "s" : ""} outside the standard reference range — please
                review before submitting.
              </div>
            </div>
          </div>
        )}

        {/* Patient form */}
        <PatientForm patient={patient} onChange={handlePatientChange} />

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {schema.sections.map((section, si) => (
            <SectionPanel
              key={si}
              section={section}
              sectionIndex={si}
              values={values}
              onChange={handleChange}
              errors={errors}
              patientAge={patient.age}
              patientGender={patient.gender}
            />
          ))}
        </div>

        {/* Static range note */}
        {schema.hasStaticStandardRange && schema.staticStandardRange && (
          <div className="sr2-alert amber" style={{ marginBottom: 12 }}>
            <Info style={{ width: 15, height: 15, color: "var(--c-amber)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="sr2-alert-title">Standard Reference</div>
              <div className="sr2-alert-body">{schema.staticStandardRange}</div>
            </div>
          </div>
        )}

        {/* Validation errors */}
        {Object.keys(errors).length > 0 && (
          <div className="sr2-alert red" style={{ marginBottom: 12 }}>
            <XCircle style={{ width: 15, height: 15, color: "var(--c-red)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="sr2-alert-title">Validation Failed</div>
              <div className="sr2-alert-body">
                {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""} require attention before
                submitting.
              </div>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="sr2-action-bar">
          <div className="sr2-action-hint">
            <ShieldCheck style={{ width: 14, height: 14 }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>Form validated on submit</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="sr2-btn-ghost" onClick={handleReset}>
              <RotateCcw style={{ width: 13, height: 13 }} />
              Reset
            </button>
            <button type="button" className="sr2-btn-primary" disabled={loading} onClick={handleSubmit}>
              {loading ? <span className="sr2-spin-dot" /> : <Send style={{ width: 14, height: 14 }} />}
              {loading ? "Submitting…" : "Submit Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchemaRenderer;
