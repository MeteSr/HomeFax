export const CSS = `
  .hfl * { margin: 0; padding: 0; box-sizing: border-box; }
  .hfl {
    --sage: #7AAF76; --sage-light: #E5F0E4; --sage-mid: #C4DCC2;
    --blush: #F0CDBA; --sky: #BAD5E8; --butter: #F5E9BB;
    --plum: #2E2540; --plum-mid: #6B5B7B; --plum-light: #3D3254;
    --white: #FDFCFA; --charcoal: #1E1928; --rule: rgba(46,37,64,0.1);
    background: var(--white); color: var(--charcoal);
    font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden;
  }

  /* ── NAV ──────────────────────────────────────────────────────────────── */
  .hfl-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 56px; height: 70px;
    background: rgba(253,252,250,0.96); backdrop-filter: blur(16px);
  }
  .hfl-logo {
    font-family: 'Fraunces', serif; font-size: 22px; font-weight: 900;
    color: var(--plum); text-decoration: none; letter-spacing: -0.5px; flex-shrink: 0;
  }
  .hfl-logo span { color: var(--sage); font-style: italic; font-weight: 300; }
  .hfl-nav-links {
    display: flex; gap: 24px; list-style: none;
    margin-left: 32px;
  }
  .hfl-nav-links a {
    font-size: 15px; color: var(--plum-mid); text-decoration: none;
    font-weight: 500; cursor: pointer; padding: 6px 2px; border-radius: 4px;
    transition: color .15s;
  }
  .hfl-nav-links a:hover { color: var(--plum); }
  .hfl-nav-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .hfl-nav-signin {
    font-size: 14px; font-weight: 600; color: var(--plum-mid);
    background: none; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; padding: 8px 14px;
    transition: color .15s; border-radius: 8px;
  }
  .hfl-nav-signin:hover { color: var(--plum); background: rgba(46,37,64,0.05); }
  .hfl-nav-pill {
    display: flex; align-items: center; gap: 6px;
    background: var(--plum); color: white; padding: 10px 22px;
    border-radius: 100px; font-size: 14px; font-weight: 600;
    border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: transform .2s, box-shadow .2s;
  }
  .hfl-nav-pill:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(46,37,64,0.25); }
  .hfl-hamburger {
    display: none; background: none; border: none; cursor: pointer; padding: 4px;
  }
  .hfl-hamburger span {
    display: block; width: 22px; height: 2px; background: var(--plum);
    margin: 5px 0; border-radius: 2px; transition: transform .2s, opacity .2s;
  }

  /* ── HERO ─────────────────────────────────────────────────────────────── */
  .hfl-hero {
    min-height: 100vh; padding: 70px 56px 0;
    display: grid; grid-template-columns: 1fr 1.4fr; gap: 48px;
    align-items: center; position: relative; overflow: hidden;
  }
  .hfl-hero::before {
    content: ''; position: absolute; top: -10%; right: -8%; width: 54%; height: 110%;
    pointer-events: none; z-index: 0;
    background: radial-gradient(ellipse at 65% 35%, var(--sage-light) 0%, var(--sage-mid) 28%, var(--sky) 55%, transparent 70%);
    opacity: 0.6;
  }
  .hfl-hero-left { position: relative; z-index: 1; padding-bottom: 56px; }
  .hfl-eyebrow {
    display: inline-flex; align-items: center; gap: 10px;
    background: var(--butter); color: var(--plum); padding: 7px 18px;
    border-radius: 100px; font-size: 13px; font-weight: 600; margin-bottom: 28px;
    border: 1px solid rgba(46,37,64,0.1);
    animation: hfl-fadeUp .5s ease both;
  }
  .hfl-dot {
    width: 8px; height: 8px; background: var(--sage); border-radius: 50%;
    animation: hfl-pulse 2s infinite;
  }
  @keyframes hfl-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.7} }
  .hfl h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(52px, 6vw, 84px);
    font-weight: 900; line-height: 1.01; letter-spacing: -2.5px; margin-bottom: 24px;
    animation: hfl-fadeUp .5s .1s ease both;
  }
  .hfl h1 em { font-style: italic; color: var(--sage); font-weight: 300; }
  .hfl-sub {
    font-size: 18px; line-height: 1.75; color: var(--plum-mid);
    max-width: 480px; margin-bottom: 40px;
    animation: hfl-fadeUp .5s .2s ease both;
  }
  .hfl-actions {
    display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-bottom: 44px;
    animation: hfl-fadeUp .5s .3s ease both;
  }
  .hfl-btn-main {
    background: var(--plum); color: white; padding: 17px 38px; border-radius: 100px;
    font-size: 16px; font-weight: 700; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: transform .2s, box-shadow .2s;
  }
  .hfl-btn-main:hover { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(46,37,64,0.28); }
  .hfl-btn-soft {
    background: transparent; color: var(--plum); padding: 17px 30px; border-radius: 100px;
    font-size: 16px; font-weight: 600; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    border: 2px solid var(--sage-mid); transition: border-color .2s, background .2s;
  }
  .hfl-btn-soft:hover { border-color: var(--sage); background: var(--sage-light); }
  .hfl-hero-trust {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    animation: hfl-fadeUp .5s .4s ease both;
  }
  .hfl-hero-trust-lbl { font-size: 13px; color: var(--plum-mid); font-weight: 500; }
  .hfl-hero-city {
    display: flex; align-items: center; gap: 5px;
    background: white; border: 1px solid var(--rule); border-radius: 100px;
    padding: 5px 14px; font-size: 12px; font-weight: 700; color: var(--plum);
    box-shadow: 0 2px 8px rgba(46,37,64,0.06);
  }

  /* HERO VISUAL */
  .hfl-hero-right {
    position: relative; z-index: 1; display: flex; align-items: center;
    justify-content: center; padding: 40px 0;
  }
  .hfl-hero-img {
    width: 100%; height: auto; display: block;
    mix-blend-mode: multiply;
  }
  .hfl-blob-wrap {
    position: relative; width: 440px; height: 500px;
    display: flex; align-items: center; justify-content: center;
    animation: hfl-fadeUp .7s .15s ease both;
  }
  .hfl-blob-bg {
    position: absolute; inset: 0;
    background: radial-gradient(circle at 35% 45%, var(--blush) 0%, var(--butter) 40%, var(--sky) 80%);
    border-radius: 58% 42% 52% 48% / 46% 54% 46% 54%;
    animation: hfl-morph 9s ease-in-out infinite;
  }
  @keyframes hfl-morph {
    0%,100%{border-radius:58% 42% 52% 48%/46% 54% 46% 54%}
    33%{border-radius:40% 60% 60% 40%/60% 38% 62% 40%}
    66%{border-radius:52% 48% 42% 58%/48% 58% 42% 52%}
  }
  .hfl-dash-card {
    position: relative; z-index: 2; background: white; width: 340px;
    box-shadow: 0 32px 80px rgba(46,37,64,0.2); overflow: hidden;
    border: 1px solid var(--rule);
  }
  .hfl-dc-header { background: var(--plum); padding: 20px 24px; }
  .hfl-dc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .hfl-dc-title { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 700; color: white; }
  .hfl-dc-ver {
    display: flex; align-items: center; gap: 5px;
    background: rgba(122,175,118,0.3); border: 1px solid rgba(122,175,118,0.5);
    border-radius: 100px; padding: 4px 10px; font-size: 10px; color: #A8DCA5; font-weight: 600; letter-spacing: 0.5px;
  }
  .hfl-dc-addr { font-size: 12px; color: rgba(255,255,255,0.6); }
  .hfl-dc-score-row { display: flex; align-items: center; gap: 14px; margin-top: 12px; }
  .hfl-dc-num { font-family: 'Fraunces', serif; font-size: 44px; font-weight: 900; color: var(--sage); line-height: 1; }
  .hfl-dc-score-lbl { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
  .hfl-dc-bar-wrap { flex: 1; height: 6px; background: rgba(255,255,255,0.15); border-radius: 100px; overflow: hidden; }
  .hfl-dc-bar { height: 100%; width: 91%; background: linear-gradient(90deg, var(--sage), #A8E8A0); border-radius: 100px; }
  .hfl-dc-body { padding: 18px 22px; }
  .hfl-dc-sec-lbl { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--plum-mid); margin-bottom: 12px; }
  .hfl-dc-items { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
  .hfl-dc-item { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; background: var(--sage-light); border-radius: 10px; font-size: 12px; }
  .hfl-dc-item-l { display: flex; align-items: center; gap: 8px; color: var(--plum); font-weight: 500; }
  .hfl-status-done { font-size: 11px; font-weight: 600; color: var(--sage); }
  .hfl-status-due  { font-size: 11px; font-weight: 600; color: #D4843A; }
  .hfl-status-ok   { font-size: 11px; font-weight: 600; color: var(--plum-mid); }
  .hfl-dc-ver-row {
    background: var(--sage-light); border: 1px solid var(--sage-mid);
    border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 10px;
  }
  .hfl-dc-ver-text { font-size: 11px; line-height: 1.4; color: var(--plum-mid); }
  .hfl-dc-ver-text strong { color: var(--plum); }
  .hfl-badge {
    position: absolute; z-index: 3; background: white;
    box-shadow: 0 8px 28px rgba(46,37,64,0.14); padding: 11px 16px;
    display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--plum);
    white-space: nowrap; border: 1px solid var(--rule);
  }
  .hfl-badge-1 { top: 8%; right: -20px; }
  .hfl-badge-2 { bottom: 12%; left: -24px; }
  .hfl-badge-icon { font-size: 18px; }

  /* ── TRUST STRIP ──────────────────────────────────────────────────────── */
  .hfl-trust-strip {
    padding: 20px 56px; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
    display: flex; align-items: center; gap: 28px;
    background: rgba(122,175,118,0.04);
  }
  .hfl-trust-label {
    font-size: 11px; font-weight: 700; color: var(--plum-mid); letter-spacing: 1.5px;
    text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
  }
  .hfl-trust-divider { width: 1px; height: 20px; background: var(--rule); flex-shrink: 0; }
  .hfl-trust-cities { display: flex; flex: 1; }
  .hfl-trust-city {
    font-size: 13px; font-weight: 600; color: var(--plum); padding: 0 18px;
    border-right: 1px solid var(--rule); white-space: nowrap;
  }
  .hfl-trust-city:first-child { padding-left: 0; }
  .hfl-trust-city:last-child { border-right: none; }
  .hfl-trust-rating {
    margin-left: auto; display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 700; color: var(--plum); flex-shrink: 0;
  }
  .hfl-trust-stars { color: #F4B942; letter-spacing: 1px; }

  /* ── HOW IT WORKS ─────────────────────────────────────────────────────── */
  .hfl-how { padding: 9px 56px 100px; display: flex; flex-direction: column; align-items: center; }
  .hfl-section-header { max-width: 600px; margin-bottom: 72px; }
  .hfl-how > .hfl-section-header { padding-left: 0; text-align: center; margin-left: auto; margin-right: auto; }
  .hfl-kicker {
    font-size: 12px; font-weight: 700; color: var(--sage);
    letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;
  }
  .hfl h2 {
    font-family: 'Fraunces', serif; font-size: clamp(36px, 4.5vw, 56px);
    font-weight: 900; letter-spacing: -1.5px; line-height: 1.04; margin-bottom: 18px;
    color: var(--plum);
  }
  .hfl h2 em { font-style: italic; font-weight: 300; color: var(--sage); }
  .hfl-sec-sub { font-size: 17px; color: var(--plum-mid); line-height: 1.7; }
  .hfl-flow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0 24px; position: relative; width: 100%; }
  .hfl-flow::before {
    content: ''; position: absolute;
    top: 110px; left: 12.5%; right: 12.5%;
    height: 2px; background: var(--sage); z-index: 0;
  }
  .hfl-step { text-align: center; position: relative; z-index: 1; padding: 0 8px; }
  .hfl-step-num {
    position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
    font-size: 14px; font-weight: 800; letter-spacing: 1px; color: white;
    background: var(--sage); border-radius: 100px; padding: 4px 12px; z-index: 2;
  }
  .hfl-step-icon {
    width: 220px; height: 220px; margin: 0 auto 20px;
    position: relative; z-index: 1;
  }
  .hfl-step-icon img {
    width: 100%; height: 100%; object-fit: contain; display: block;
  }
  .hfl-step h3 {
    font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700;
    margin-bottom: 10px; color: var(--plum);
  }
  .hfl-step p { font-size: 14px; color: var(--plum-mid); line-height: 1.65; }

  /* ── FEATURE SECTIONS ─────────────────────────────────────────────────── */
  .hfl-feat {
    padding: 100px 56px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center;
  }
  .hfl-feat-2 { background: var(--plum); }
  .hfl-feat-2 .hfl-feat-text { order: 2; }
  .hfl-feat-2 .hfl-feat-visual { order: 1; }
  .hfl-feat-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--butter); color: var(--plum); padding: 6px 16px;
    border-radius: 100px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
    margin-bottom: 24px; border: 1px solid rgba(46,37,64,0.1);
  }
  .hfl-feat-2 .hfl-feat-eyebrow {
    background: rgba(122,175,118,0.2); color: var(--sage); border-color: rgba(122,175,118,0.3);
  }
  .hfl-feat-text h2 { color: var(--plum); margin-bottom: 20px; }
  .hfl-feat-2 .hfl-feat-text h2 { color: white; }
  .hfl-feat-lead {
    font-size: 17px; color: var(--plum-mid); line-height: 1.75; margin-bottom: 32px;
  }
  .hfl-feat-2 .hfl-feat-lead { color: rgba(253,252,250,0.65); }
  .hfl-feat-checklist {
    list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 38px;
  }
  .hfl-feat-checklist li {
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 15px; color: var(--plum); line-height: 1.5;
  }
  .hfl-feat-2 .hfl-feat-checklist li { color: rgba(253,252,250,0.85); }
  .hfl-feat-check {
    width: 22px; height: 22px; background: var(--sage-light); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--sage); flex-shrink: 0; margin-top: 1px; font-weight: 700;
  }
  .hfl-feat-2 .hfl-feat-check { background: rgba(122,175,118,0.25); }
  .hfl-feat-cta {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 15px; font-weight: 700; color: var(--plum);
    border: 2px solid var(--plum); border-radius: 100px; padding: 14px 28px;
    cursor: pointer; background: transparent; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background .2s, color .2s;
  }
  .hfl-feat-cta:hover { background: var(--plum); color: white; }
  .hfl-feat-2 .hfl-feat-cta { border-color: var(--sage); color: var(--sage); }
  .hfl-feat-2 .hfl-feat-cta:hover { background: var(--sage); color: var(--plum); }

  /* Feature visual panels */
  .hfl-feat-panel {
    background: white; overflow: hidden;
    box-shadow: 0 32px 80px rgba(46,37,64,0.14);
    border: 1px solid var(--rule);
  }
  .hfl-feat-2 .hfl-feat-panel {
    background: rgba(253,252,250,0.06); border: 1px solid rgba(253,252,250,0.12);
    box-shadow: none;
  }
  /* Record panel */
  .hfl-rec-hdr { background: var(--plum); padding: 22px 26px; }
  .hfl-rec-hdr-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .hfl-rec-title { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; color: white; }
  .hfl-rec-verified { display: flex; align-items: center; gap: 5px; background: rgba(122,175,118,0.3); border: 1px solid rgba(122,175,118,0.5); border-radius: 100px; padding: 3px 10px; font-size: 10px; color: #A8DCA5; font-weight: 700; }
  .hfl-rec-addr { font-size: 12px; color: rgba(255,255,255,0.55); }
  .hfl-rec-score-row { display: flex; align-items: center; gap: 14px; margin-top: 14px; }
  .hfl-rec-score-num { font-family: 'Fraunces', serif; font-size: 48px; font-weight: 900; color: var(--sage); line-height: 1; }
  .hfl-rec-score-right { flex: 1; }
  .hfl-rec-score-lbl { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .hfl-rec-bar-wrap { height: 6px; background: rgba(255,255,255,0.15); border-radius: 100px; overflow: hidden; }
  .hfl-rec-bar { height: 100%; width: 91%; background: linear-gradient(90deg, var(--sage), #A8E8A0); border-radius: 100px; }
  .hfl-rec-body { padding: 20px 26px; }
  .hfl-rec-section-lbl { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--plum-mid); margin-bottom: 12px; }
  .hfl-rec-items { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
  .hfl-rec-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--sage-light); border-radius: 10px; font-size: 12px; }
  .hfl-rec-item-l { display: flex; align-items: center; gap: 8px; color: var(--plum); font-weight: 600; }
  .hfl-rec-pass { font-size: 11px; font-weight: 700; color: var(--sage); }
  .hfl-rec-due { font-size: 11px; font-weight: 700; color: #D4843A; }
  .hfl-rec-footer { padding: 14px 26px; background: var(--sage-light); border-top: 1px solid var(--sage-mid); font-size: 11px; color: var(--plum-mid); font-weight: 600; display: flex; align-items: center; gap: 8px; }
  /* AI panel */
  .hfl-ai-panel-hdr {
    background: rgba(253,252,250,0.1); padding: 16px 22px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid rgba(253,252,250,0.08);
  }
  .hfl-ai-panel-hdr-l { display: flex; align-items: center; gap: 10px; }
  .hfl-ai-panel-name { font-size: 14px; font-weight: 700; color: white; }
  .hfl-ai-panel-live { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--sage); font-weight: 600; }
  .hfl-ai-panel-dot { width: 6px; height: 6px; background: var(--sage); border-radius: 50%; animation: hfl-pulse 2s infinite; }
  .hfl-ai-panel-body { padding: 22px; display: flex; flex-direction: column; gap: 16px; }
  .hfl-ai-notice {
    background: rgba(245,233,187,0.12); border: 1px solid rgba(245,233,187,0.25);
    border-radius: 14px; padding: 16px;
  }
  .hfl-ai-notice-tag { font-size: 10px; font-weight: 700; color: #F5E9BB; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .hfl-ai-notice p { font-size: 13px; color: rgba(253,252,250,0.85); line-height: 1.6; margin-bottom: 12px; }
  .hfl-ai-notice-btn { background: var(--sage); color: var(--plum); font-size: 12px; font-weight: 700; padding: 7px 16px; border-radius: 100px; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
  .hfl-ai-user-msg { display: flex; align-items: flex-start; gap: 10px; }
  .hfl-ai-user-icon { width: 30px; height: 30px; background: rgba(253,252,250,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 2px; }
  .hfl-ai-user-msg p { font-size: 13px; color: rgba(253,252,250,0.55); line-height: 1.55; font-style: italic; }
  .hfl-ai-reply { background: rgba(122,175,118,0.15); border-radius: 14px; padding: 14px 16px; }
  .hfl-ai-reply-tag { font-size: 10px; font-weight: 700; color: var(--sage); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
  .hfl-ai-reply p { font-size: 13px; color: rgba(253,252,250,0.85); line-height: 1.6; }
  .hfl-ai-panel-footer {
    padding: 14px 22px; border-top: 1px solid rgba(253,252,250,0.08);
    display: flex; align-items: center; gap: 12px;
  }
  .hfl-ai-mic { width: 40px; height: 40px; background: var(--sage); border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 0 0 8px rgba(122,175,118,0.15); }
  .hfl-ai-mic-hint { font-size: 12px; color: rgba(253,252,250,0.4); }
  /* Agent compete panel */
  .hfl-compete-hdr { background: var(--plum); padding: 22px 26px; }
  .hfl-compete-title { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; color: white; margin-bottom: 4px; }
  .hfl-compete-sub { font-size: 12px; color: rgba(255,255,255,0.5); }
  .hfl-compete-body { padding: 20px 26px; display: flex; flex-direction: column; gap: 12px; }
  .hfl-compete-agent {
    background: var(--sage-light); border-radius: 14px; padding: 14px 16px;
    display: flex; align-items: center; gap: 14px;
  }
  .hfl-compete-agent-featured {
    background: var(--butter); border: 2px solid rgba(46,37,64,0.12);
  }
  .hfl-compete-avi { width: 40px; height: 40px; border-radius: 50%; background: white; overflow: hidden; flex-shrink: 0; }
  .hfl-compete-avi img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hfl-compete-info { flex: 1; }
  .hfl-compete-name { font-size: 13px; font-weight: 700; color: var(--plum); margin-bottom: 2px; }
  .hfl-compete-detail { font-size: 11px; color: var(--plum-mid); line-height: 1.4; }
  .hfl-compete-comm { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 900; color: var(--plum); flex-shrink: 0; }
  .hfl-compete-best {
    display: inline-flex; align-items: center; gap: 4px; margin-top: 4px;
    background: var(--sage); color: var(--plum); font-size: 10px; font-weight: 700;
    padding: 3px 8px; border-radius: 100px;
  }
  .hfl-compete-footer { padding: 14px 26px; background: var(--sage-light); border-top: 1px solid var(--sage-mid); font-size: 11px; color: var(--plum-mid); font-weight: 600; display: flex; align-items: center; gap: 8px; }

  /* ── REPORT CTA ───────────────────────────────────────────────────────── */
  .hfl-report {
    padding: 0 56px 100px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
  }
  .hfl-rc-label { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--plum); margin-bottom: 18px; }
  .hfl-report h2 { color: var(--plum); margin-bottom: 18px; }
  .hfl-report h2 em { color: var(--sage); font-style: italic; font-weight: 300; }
  .hfl-report > div:first-child { order: 2; }
  .hfl-report > div:last-child { order: 1; }
  .hfl-report p { font-size: 16px; color: rgba(46,37,64,0.7); line-height: 1.7; margin-bottom: 36px; }
  .hfl-rc-actions { display: flex; gap: 14px; flex-wrap: wrap; }
  .hfl-rc-btn {
    background: var(--plum); color: white; padding: 16px 32px; border-radius: 100px;
    font-weight: 700; font-size: 15px; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; transition: transform .2s, box-shadow .2s;
  }
  .hfl-rc-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(46,37,64,0.3); }
  .hfl-rc-ghost {
    background: rgba(46,37,64,0.08); color: var(--plum); padding: 16px 24px; border-radius: 100px;
    font-weight: 600; font-size: 15px; border: 1px solid rgba(46,37,64,0.2); cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; transition: background .2s;
  }
  .hfl-rc-ghost:hover { background: rgba(46,37,64,0.14); }
  .hfl-report-mock { background: white; overflow: hidden; box-shadow: 0 20px 60px rgba(46,37,64,0.18); border: 1px solid var(--rule); }
  .hfl-mock-top { background: var(--plum); padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
  .hfl-mock-addr { font-family: 'Fraunces', serif; font-size: 15px; color: white; font-weight: 700; }
  .hfl-mock-badge { background: var(--sage); color: var(--plum); font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 100px; letter-spacing: 1px; }
  .hfl-mock-score { background: var(--sage-light); padding: 14px 20px; display: flex; align-items: center; gap: 14px; }
  .hfl-mock-num { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 900; color: var(--sage); line-height: 1; }
  .hfl-mock-score-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--plum-mid); margin-bottom: 6px; }
  .hfl-mock-bar { height: 8px; background: var(--sage-mid); border-radius: 100px; overflow: hidden; }
  .hfl-mock-bar-fill { height: 100%; width: 91%; background: linear-gradient(90deg, var(--sage), #A8E8A0); border-radius: 100px; }
  .hfl-mock-rows { padding: 8px 20px 16px; }
  .hfl-mock-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #F0EDE8; font-size: 12px; }
  .hfl-mock-row:last-child { border-bottom: none; }
  .hfl-mock-row-lbl { color: var(--plum-mid); display: flex; align-items: center; gap: 6px; }
  .hfl-mock-pass { font-weight: 700; color: var(--sage); }
  .hfl-mock-flag { font-weight: 700; color: #D4843A; }
  .hfl-mock-info { font-weight: 700; color: var(--plum-mid); }
  .hfl-mock-footer { padding: 10px 20px 14px; display: flex; align-items: center; gap: 8px; background: var(--sage-light); border-top: 1px solid var(--sage-mid); font-size: 11px; color: var(--plum-mid); font-weight: 600; }

  /* ── FEATURE DEEP DIVE ───────────────────────────────────────────────── */
  .hfl-fdd { padding: 0 56px 100px; }
  .hfl-fdd-inner {
    background: var(--sage-light);
    border: 1px solid var(--sage-mid);
    padding: 64px 72px 40px;
    position: relative; overflow: hidden;
    display: grid; grid-template-columns: 340px 1fr; gap: 72px; align-items: start;
  }
  .hfl-fdd-inner::before {
    content: "";
    position: absolute; top: -100px; right: -100px;
    width: 480px; height: 480px; border-radius: 50%;
    background: radial-gradient(circle, rgba(122,175,118,0.25) 0%, transparent 65%);
    pointer-events: none;
  }
  .hfl-fdd-inner::after {
    content: "";
    position: absolute; bottom: -80px; left: -80px;
    width: 320px; height: 320px; border-radius: 50%;
    background: radial-gradient(circle, rgba(186,213,232,0.18) 0%, transparent 65%);
    pointer-events: none;
  }
  .hfl-fdd-header { position: relative; }
  .hfl-fdd-header h2 { color: var(--plum); margin-bottom: 16px; }
  .hfl-fdd-header h2 em { color: var(--sage); }
  .hfl-fdd-header p { font-size: 16px; color: var(--plum-mid); line-height: 1.7; }
  .hfl-fdd-cols {
    display: flex; flex-direction: column; position: relative;
  }
  .hfl-fdd-row {
    display: flex; align-items: flex-start; gap: 20px;
    padding: 26px 0; border-bottom: 1px solid rgba(46,37,64,0.1);
    transition: opacity .2s;
  }
  .hfl-fdd-row:last-child { border-bottom: none; }
  .hfl-fdd-row:hover .hfl-fdd-icon-wrap { background: rgba(122,175,118,0.45); border-color: var(--sage); }
  .hfl-fdd-icon-wrap {
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(122,175,118,0.25);
    border: 1px solid rgba(122,175,118,0.55);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 2px;
    transition: background .2s, border-color .2s;
  }
  .hfl-fdd-text { display: flex; flex-direction: column; gap: 4px; }
  .hfl-fdd-title {
    font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700;
    color: var(--plum); line-height: 1.2; margin-bottom: 2px;
  }
  .hfl-fdd-tagline {
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase; color: var(--sage);
    margin-bottom: 6px;
  }
  .hfl-fdd-desc { font-size: 13px; color: var(--plum-mid); line-height: 1.65; }

  /* ── TESTIMONIALS ─────────────────────────────────────────────────────── */
  .hfl-testimonials { padding: 0 56px 100px; }
  .hfl-tcard {
    display: flex; align-items: stretch; min-height: 480px;
    border: 1px solid var(--rule); overflow: hidden; background: white;
  }
  .hfl-tcard-img { flex: 0 0 60%; }
  .hfl-tcard-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hfl-tcard-body {
    flex: 1; padding: 52px 48px; display: flex; flex-direction: column; justify-content: center;
  }
  .hfl-tcard-openquote {
    font-family: 'Fraunces', serif; font-size: 88px; line-height: 0.65;
    color: var(--sage-mid); margin-bottom: 20px; font-weight: 900;
  }
  .hfl-tcard-headline {
    font-family: 'Fraunces', serif; font-size: clamp(26px, 2.8vw, 36px); font-weight: 900;
    color: var(--plum); line-height: 1.15; margin-bottom: 18px;
  }
  .hfl-tcard-green { color: var(--sage); }
  .hfl-tcard-text { font-size: 15px; color: var(--plum-mid); line-height: 1.75; margin-bottom: 28px; }
  .hfl-tcard-meta { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
  .hfl-tcard-stars { color: #F4B942; font-size: 17px; letter-spacing: 2px; }
  .hfl-tcard-verified {
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--sage); border: 1px solid var(--sage-mid); padding: 3px 9px;
  }
  .hfl-tcard-author { display: flex; align-items: center; gap: 12px; }
  .hfl-tcard-name { font-size: 14px; font-weight: 700; color: var(--plum); }
  .hfl-tcard-divider { width: 1px; height: 14px; background: var(--rule); flex-shrink: 0; }
  .hfl-tcard-location { font-size: 13px; color: var(--plum-mid); }
  .hfl-featured-quote {
    background: linear-gradient(135deg, var(--blush), var(--butter)); padding: 52px 60px;
    margin-bottom: 22px; position: relative; overflow: hidden;
    border: 1px solid rgba(46,37,64,0.1);
  }
  .hfl-featured-quote-text {
    font-family: 'Fraunces', serif; font-size: clamp(20px, 2.5vw, 28px);
    font-weight: 600; color: var(--plum); line-height: 1.5; margin-bottom: 32px;
    position: relative;
  }
  .hfl-featured-quote-text em { color: var(--plum); font-style: italic; font-weight: 900; }
  .hfl-featured-author { display: flex; align-items: center; gap: 16px; }
  .hfl-featured-avi {
    width: 52px; height: 52px; border-radius: 50%; background: rgba(46,37,64,0.1);
    display: flex; align-items: center; justify-content: center; font-size: 26px;
    border: 2px solid rgba(46,37,64,0.15); flex-shrink: 0;
  }
  .hfl-featured-name { font-size: 15px; font-weight: 700; color: var(--plum); margin-bottom: 3px; }
  .hfl-featured-role { font-size: 13px; color: var(--plum-mid); }
  .hfl-featured-result { margin-left: auto; text-align: right; flex-shrink: 0; }
  .hfl-featured-result-num {
    font-family: 'Fraunces', serif; font-size: 38px; font-weight: 900;
    color: var(--plum); line-height: 1; margin-bottom: 4px;
  }
  .hfl-featured-result-lbl { font-size: 12px; color: var(--plum-mid); }
  .hfl-test-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .hfl-test-card {
    background: white; padding: 30px;
    border: 1.5px solid rgba(122,175,118,0.2); transition: border-color .2s, box-shadow .2s;
  }
  .hfl-test-card:hover { border-color: var(--sage); box-shadow: 0 8px 32px rgba(122,175,118,0.15); }
  .hfl-stars { color: #F4B942; font-size: 16px; margin-bottom: 14px; }
  .hfl-test-card blockquote { font-size: 14px; line-height: 1.75; color: var(--plum-mid); margin-bottom: 20px; font-style: italic; }
  .hfl-test-author { display: flex; align-items: center; gap: 12px; }
  .hfl-avi { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .hfl-avi-1 { background: var(--blush); }
  .hfl-avi-2 { background: var(--sky); }
  .hfl-avi-3 { background: var(--butter); }
  .hfl-test-name { font-weight: 700; font-size: 13px; color: var(--plum); }
  .hfl-test-role { font-size: 11px; color: var(--plum-mid); }

  /* ── PERSONA CTA ──────────────────────────────────────────────────────── */
  .hfl-cta { padding: 0 56px 100px; }
  .hfl-cta-inner {
    background: var(--sage-light); border-radius: 28px; padding: 80px;
    text-align: center; border: 2px solid var(--sage-mid); position: relative; overflow: hidden;
  }
  .hfl-cta-blob1 { position: absolute; top: -60px; right: -60px; width: 300px; height: 300px; background: radial-gradient(circle, var(--blush), transparent 70%); pointer-events: none; }
  .hfl-cta-blob2 { position: absolute; bottom: -80px; left: -40px; width: 280px; height: 280px; background: radial-gradient(circle, var(--sky), transparent 70%); pointer-events: none; }
  .hfl-cta h2 { letter-spacing: -2px; margin-bottom: 14px; position: relative; }
  .hfl-cta-sub { font-size: 18px; color: var(--plum-mid); margin-bottom: 52px; max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.65; position: relative; }
  .hfl-personas { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; max-width: 1020px; margin: 0 auto; position: relative; }
  .hfl-persona {
    background: white; border-radius: 20px; padding: 32px 24px;
    border: 2px solid transparent; transition: border-color .2s, box-shadow .2s, transform .2s;
    text-align: left; cursor: pointer;
  }
  .hfl-persona:hover { border-color: var(--sage); box-shadow: 0 12px 36px rgba(46,37,64,0.12); transform: translateY(-4px); }
  .hfl-persona-icon { font-size: 36px; margin-bottom: 16px; }
  .hfl-persona-role { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--sage); margin-bottom: 8px; }
  .hfl-persona-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; color: var(--plum); margin-bottom: 10px; }
  .hfl-persona-desc { font-size: 13px; color: var(--plum-mid); line-height: 1.6; margin-bottom: 22px; }
  .hfl-persona-cta { font-size: 14px; font-weight: 700; color: var(--plum); display: flex; align-items: center; gap: 6px; }
  .hfl-persona-arrow { transition: transform .2s; display: inline-block; }
  .hfl-persona:hover .hfl-persona-arrow { transform: translateX(4px); }

  /* ── DATA SECTION ─────────────────────────────────────────────────────── */
  .hfl-data { padding: 0 56px 100px; }
  .hfl-data-inner {
    background: var(--white);
    padding: 72px 80px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
  }
  .hfl-data-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(122,175,118,0.18); color: var(--sage);
    padding: 6px 16px; border-radius: 100px;
    font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    margin-bottom: 24px;
  }
  .hfl-data h2 { color: var(--plum); letter-spacing: -1px; margin-bottom: 20px; }
  .hfl-data h2 em { color: var(--sage); }
  .hfl-data-lead { font-size: 17px; color: var(--plum-mid); line-height: 1.7; margin-bottom: 36px; }
  .hfl-data-cards { display: flex; flex-direction: column; gap: 14px; }
  .hfl-data-card {
    background: var(--sage-light); border: 1px solid var(--sage-mid);
    padding: 22px 24px; display: flex; gap: 18px; align-items: flex-start;
    transition: background .2s, border-color .2s;
  }
  .hfl-data-card:hover { background: var(--sage-mid); border-color: var(--sage); }
  .hfl-data-card-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; color: var(--plum); }
  .hfl-data-card-img { width: 48px; height: 48px; object-fit: contain; flex-shrink: 0; mix-blend-mode: multiply; }
  .hfl-data-card-title { font-weight: 700; color: var(--plum); font-size: 15px; margin-bottom: 4px; }
  .hfl-data-card-body { font-size: 13px; color: var(--plum-mid); line-height: 1.6; }
  .hfl-data-note {
    margin-top: 28px; font-size: 12px; color: rgba(253,252,250,0.35);
    display: flex; align-items: center; gap: 8px;
  }
  .hfl-data-note::before { content: ""; display: block; width: 20px; height: 1px; background: rgba(253,252,250,0.2); }

  /* ── FREE TOOLS ───────────────────────────────────────────────────────── */
  .hfl-tools { padding: 0 56px 100px; }
  .hfl-tools-inner {
    background: var(--sage-light); padding: 64px 72px;
    border: 2px solid var(--sage-mid); position: relative; overflow: hidden;
  }
  .hfl-tools-header { text-align: center; margin-bottom: 48px; }
  .hfl-tools-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--sage-mid); color: var(--plum); padding: 5px 16px;
    border-radius: 100px; font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
    margin-bottom: 16px;
  }
  .hfl-tools h2 { font-size: clamp(28px, 4vw, 42px); color: var(--plum); }
  .hfl-tools-sub { font-size: 16px; color: var(--plum-mid); margin-top: 12px; line-height: 1.7; }
  .hfl-tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; position: relative; z-index: 1; }
  .hfl-tool-card {
    background: white; padding: 28px 24px;
    display: flex; flex-direction: column; gap: 12px;
    border: 1.5px solid var(--sage-mid); cursor: pointer;
    transition: transform .2s, box-shadow .2s; text-decoration: none; color: inherit;
  }
  .hfl-tool-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(46,37,64,0.1); }
  .hfl-tool-icon { font-size: 28px; }
  .hfl-tool-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sage); margin-bottom: 2px; }
  .hfl-tool-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: var(--plum); line-height: 1.2; }
  .hfl-tool-desc { font-size: 13px; color: var(--plum-mid); line-height: 1.65; flex: 1; }
  .hfl-tool-cta { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--plum); margin-top: 4px; }

  /* ── FEATURE SHOWCASE ────────────────────────────────────────────────── */
  .hfl-showcase { padding: 0 56px 100px; }
  .hfl-showcase-header { max-width: 540px; margin-bottom: 40px; }
  .hfl-showcase-inner {
    background: var(--plum);
    display: flex; overflow: hidden;
    border: 1px solid rgba(122,175,118,0.15);
  }
  /* Left nav */
  .hfl-sc-nav {
    width: 248px; flex-shrink: 0;
    background: rgba(253,252,250,0.04);
    border-right: 1px solid rgba(253,252,250,0.08);
    padding: 28px 16px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .hfl-sc-nav-label {
    font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: var(--sage); padding: 0 12px; margin-bottom: 12px;
  }
  .hfl-sc-tab {
    width: 100%; background: none; border: none; cursor: pointer; text-align: left;
    padding: 12px 14px; border-radius: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background .15s;
  }
  .hfl-sc-tab:hover:not(.hfl-sc-tab-active) { background: rgba(253,252,250,0.06); }
  .hfl-sc-tab-active { background: rgba(253,252,250,0.1); }
  .hfl-sc-tab-row { display: flex; align-items: center; gap: 10px; }
  .hfl-sc-tab-icon { font-size: 16px; flex-shrink: 0; }
  .hfl-sc-tab-title {
    font-size: 13px; font-weight: 600; color: rgba(253,252,250,0.45); line-height: 1.3;
  }
  .hfl-sc-tab-active .hfl-sc-tab-title { color: white; }
  .hfl-sc-progress-track {
    height: 2px; background: rgba(253,252,250,0.08); border-radius: 100px;
    overflow: hidden; margin-top: 10px;
  }
  .hfl-sc-progress-bar {
    height: 100%; background: var(--sage); border-radius: 100px;
    animation: hfl-sc-fill 8s linear forwards;
  }
  @keyframes hfl-sc-fill { from { width: 0 } to { width: 100% } }
  /* Content panel */
  .hfl-sc-content {
    flex: 1; min-width: 0; padding: 48px 52px 56px;
    display: grid; grid-template-columns: 1fr 280px; gap: 44px; align-items: start;
    position: relative; overflow: hidden;
  }
  .hfl-sc-content::before {
    content: ''; position: absolute; top: -30%; right: -5%; width: 380px; height: 380px;
    background: radial-gradient(circle, rgba(122,175,118,0.1), transparent 65%);
    pointer-events: none;
  }
  .hfl-sc-kicker {
    font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: var(--sage); margin-bottom: 14px;
  }
  .hfl-sc-heading {
    font-family: 'Fraunces', serif; font-size: clamp(26px, 2.8vw, 36px);
    font-weight: 900; color: white; line-height: 1.1;
    letter-spacing: -0.5px; margin-bottom: 14px;
  }
  .hfl-sc-heading em { color: var(--sage); font-style: italic; font-weight: 300; }
  .hfl-sc-desc {
    font-size: 15px; color: rgba(253,252,250,0.62); line-height: 1.75; margin-bottom: 24px;
  }
  .hfl-sc-bullets {
    list-style: none; display: flex; flex-direction: column; gap: 9px; margin-bottom: 28px;
  }
  .hfl-sc-bullets li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: rgba(253,252,250,0.78); line-height: 1.5;
  }
  .hfl-sc-bullet-dot {
    width: 18px; height: 18px; background: rgba(122,175,118,0.22); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: var(--sage); flex-shrink: 0; margin-top: 2px; font-weight: 700;
  }
  .hfl-sc-cta {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--sage); color: var(--plum);
    padding: 11px 22px; border-radius: 100px;
    font-size: 13px; font-weight: 700; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: transform .2s, box-shadow .2s;
  }
  .hfl-sc-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(122,175,118,0.3); }
  /* Slide-in animation */
  .hfl-sc-slide { animation: hfl-sc-in .35s ease both; }
  .hfl-sc-ai-row {
    display: flex; align-items: center; gap: 16px; margin-bottom: 28px;
  }
  .hfl-sc-ai-row .hfl-sc-bullets { margin-bottom: 0; flex: 1; }
  .hfl-sc-ai-buddy {
    width: 130px; height: auto; flex-shrink: 0;
    mix-blend-mode: lighten; opacity: 0.9;
  }
  @keyframes hfl-sc-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  /* Visual column */
  .hfl-sc-visual {
    overflow: hidden; height: 360px; position: relative; background: white;
    box-shadow: 0 20px 60px rgba(0,0,0,0.35); flex-shrink: 0;
    border: 1px solid rgba(253,252,250,0.08);
  }
  .hfl-sc-vis-inner {
    position: absolute; top: 0; left: 0;
    width: calc(100% / 0.75);
    transform: scale(0.75);
    transform-origin: top left;
  }
  /* Mobile showcase */
  @media (max-width: 900px) {
    .hfl-showcase { padding: 0 24px 64px; }
    .hfl-showcase-inner { flex-direction: column; min-height: auto; }
    .hfl-sc-nav { width: 100%; flex-direction: row; gap: 6px; overflow-x: auto; padding: 16px; border-right: none; border-bottom: 1px solid rgba(253,252,250,0.08); }
    .hfl-sc-nav-label { display: none; }
    .hfl-sc-tab { padding: 10px 14px; white-space: nowrap; flex-shrink: 0; width: auto; }
    .hfl-sc-progress-track { display: none; }
    .hfl-sc-content { grid-template-columns: 1fr; padding: 28px 24px; gap: 28px; }
    .hfl-sc-visual { display: none; }
  }

  /* ── FOOTER ───────────────────────────────────────────────────────────── */
  .hfl-footer { background: var(--charcoal); padding: 64px 56px 32px; }
  .hfl-footer-top {
    display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 52px;
  }
  .hfl-footer-logo { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 900; color: white; margin-bottom: 14px; display: block; text-decoration: none; }
  .hfl-footer-logo span { color: var(--sage); font-style: italic; font-weight: 300; }
  .hfl-footer-tagline { font-size: 14px; color: rgba(253,252,250,0.45); line-height: 1.65; max-width: 220px; margin-bottom: 24px; }
  .hfl-footer-social { display: flex; gap: 10px; }
  .hfl-footer-social a {
    color: rgba(253,252,250,0.4); transition: color .2s; display: flex; align-items: center;
    width: 36px; height: 36px; background: rgba(253,252,250,0.06); border-radius: 50%;
    justify-content: center; transition: color .2s, background .2s;
  }
  .hfl-footer-social a:hover { color: var(--sage); background: rgba(122,175,118,0.15); }
  .hfl-footer-col-title {
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    color: rgba(253,252,250,0.35); margin-bottom: 20px;
  }
  .hfl-footer-col-links { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .hfl-footer-col-links a {
    font-size: 14px; color: rgba(253,252,250,0.6); text-decoration: none;
    transition: color .2s; cursor: pointer;
  }
  .hfl-footer-col-links a:hover { color: rgba(253,252,250,0.95); }
  .hfl-footer-bottom {
    border-top: 1px solid rgba(253,252,250,0.08); padding-top: 24px;
    display: flex; align-items: center; justify-content: space-between;
    font-size: 13px; color: rgba(253,252,250,0.35);
  }
  .hfl-footer-bottom-links { display: flex; gap: 24px; }
  .hfl-footer-bottom-links a { color: rgba(253,252,250,0.35); text-decoration: none; transition: color .2s; }
  .hfl-footer-bottom-links a:hover { color: rgba(253,252,250,0.65); }

  /* ── ENTRANCE ANIMATIONS ──────────────────────────────────────────────── */
  @keyframes hfl-fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

  /* ── MOBILE ───────────────────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .hfl-nav { padding: 0 24px; }
    .hfl-nav-links {
      display: none; position: fixed; top: 70px; left: 0; right: 0;
      transform: none; flex-direction: column; gap: 0;
      background: var(--white); border-top: 1px solid var(--rule);
      padding: 8px 24px 24px; z-index: 99;
    }
    .hfl-nav-links.hfl-menu-open { display: flex; }
    .hfl-nav-links.hfl-menu-open li { width: 100%; }
    .hfl-nav-links.hfl-menu-open li a {
      display: block; padding: 14px 0; font-size: 15px; border-radius: 0;
      border-bottom: 1px solid var(--rule);
    }
    .hfl-nav-links.hfl-menu-open li:last-child a { border-bottom: none; }
    .hfl-nav-signin { display: none; }
    .hfl-hamburger { display: block; }
    .hfl-hamburger.hfl-menu-open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hfl-hamburger.hfl-menu-open span:nth-child(2) { opacity: 0; }
    .hfl-hamburger.hfl-menu-open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .hfl-hero { grid-template-columns: 1fr; min-height: auto; padding: 90px 24px 48px; }
    .hfl-hero-right { display: none; }
    .hfl h1 { font-size: clamp(38px, 10vw, 54px); letter-spacing: -1.5px; }
    .hfl-sub { font-size: 16px; max-width: 100%; }
    .hfl-hero-trust { display: none; }

    .hfl-trust-strip { padding: 16px 24px; gap: 16px; }
    .hfl-trust-city { padding: 0 12px; font-size: 12px; }
    .hfl-trust-rating { display: none; }

    .hfl-metrics { grid-template-columns: 1fr 1fr; padding: 44px 24px; gap: 16px; }
    .hfl-metric-num { font-size: 38px; }

    .hfl-how { padding: 32px 24px 64px; }
    .hfl-section-header { margin-bottom: 48px; }
    .hfl-flow::before { display: none; }
    .hfl-step-icon { width: 160px; height: 160px; font-size: 28px; }

    .hfl-feat { grid-template-columns: 1fr; padding: 64px 24px; gap: 40px; }
    .hfl-feat-2 .hfl-feat-text { order: 0; }
    .hfl-feat-2 .hfl-feat-visual { order: 0; }

    .hfl-report { padding: 0 24px 64px; grid-template-columns: 1fr; gap: 36px; }
    .hfl-report h2 { font-size: 32px; }
    .hfl-report > div:last-child { display: none; }

    .hfl-fdd { padding: 0 24px 64px; }
    .hfl-fdd-inner { padding: 40px 28px; grid-template-columns: 1fr; gap: 36px; }
    .hfl-fdd-row:last-child { border-bottom: 1px solid rgba(253,252,250,0.08); }
    .hfl-testimonials { padding: 0 24px 64px; }
    .hfl-tcard { flex-direction: column; }
    .hfl-tcard-img { flex: none; width: 100%; max-height: 320px; }
    .hfl-tcard-body { padding: 36px 28px; }
    .hfl-featured-quote { padding: 36px 28px; }
    .hfl-featured-result { display: none; }
    .hfl-test-grid { grid-template-columns: 1fr; }

    .hfl-cta { padding: 0 24px 64px; }
    .hfl-cta-inner { padding: 48px 24px; }
    .hfl-cta h2 { font-size: 34px; letter-spacing: -1px; }
    .hfl-cta-sub { font-size: 15px; }
    .hfl-personas { grid-template-columns: 1fr 1fr; max-width: 100%; }
    .hfl-personas > *:last-child:nth-child(odd) { grid-column: span 2; max-width: 340px; margin: 0 auto; }

    .hfl-data { padding: 0 24px 64px; }
    .hfl-data-inner { grid-template-columns: 1fr; padding: 40px 28px; gap: 48px; }
    .hfl-data h2 { font-size: 34px; }

    .hfl-tools { padding: 0 24px 64px; }
    .hfl-tools-inner { padding: 40px 28px; }
    .hfl-tools-grid { grid-template-columns: 1fr 1fr; }

    .hfl-footer { padding: 48px 24px 28px; }
    .hfl-footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
    .hfl-footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
    .hfl-footer-bottom-links { flex-wrap: wrap; justify-content: center; gap: 16px; }
  }

  @media (max-width: 480px) {
    .hfl h1 { font-size: clamp(32px, 10vw, 44px); letter-spacing: -1px; }
    .hfl-actions { flex-direction: column; align-items: stretch; }
    .hfl-btn-main, .hfl-btn-soft { text-align: center; padding: 15px 20px; }
    .hfl-trust-strip { display: none; }
    .hfl-metrics { grid-template-columns: 1fr; padding: 36px 16px; }
    .hfl-flow { grid-template-columns: 1fr; gap: 28px; }
    .hfl-step { display: flex; align-items: flex-start; gap: 20px; text-align: left; }
    .hfl-step-icon { width: 60px; height: 60px; font-size: 24px; flex-shrink: 0; margin: 0; }
    .hfl h2 { font-size: 28px; }
    .hfl-tools-grid { grid-template-columns: 1fr; }
    .hfl-footer-top { grid-template-columns: 1fr; }
    .hfl-report { margin: 0 16px 48px; padding: 32px 20px; }
  }

  @media (min-width: 901px) and (max-width: 1100px) {
    .hfl-nav { padding: 0 32px; }
    .hfl-hero { padding: 20px 32px 0; gap: 32px; }
    .hfl-blob-wrap { width: 360px; height: 420px; }
    .hfl-dash-card { width: 290px; }
    .hfl-trust-strip { padding: 18px 32px; }
    .hfl-metrics { padding: 56px 32px; }
    .hfl-how { padding: 40px 32px 80px; }
    .hfl-feat { padding: 72px 32px; gap: 48px; }
    .hfl-report { padding: 0 32px 80px; }
    .hfl-fdd { padding: 0 32px 80px; }
    .hfl-fdd-inner { padding: 56px 48px; grid-template-columns: 1fr; gap: 40px; }
    .hfl-testimonials { padding-left: 32px; padding-right: 32px; }
    .hfl-tcard-img { flex: 0 0 50%; }
    .hfl-tools { padding: 0 32px 80px; }
    .hfl-tools-inner { padding: 52px 48px; }
    .hfl-data { padding: 0 32px 80px; }
    .hfl-data-inner { padding: 56px 48px; }
    .hfl-footer { padding: 52px 32px 28px; }
    .hfl-problem { padding: 0 32px 80px; }
    .hfl-problem-img { flex: 0 0 44%; }
    .hfl-problem-text { padding: 48px 40px; }
    .hfl-pricing { padding: 0 32px 80px; }
    .hfl-pricing-inner { padding: 56px 48px; }
    .hfl-final-cta { padding: 0 32px 80px; }
    .hfl-final-cta-inner { padding: 72px 48px; }
  }

  /* ── SOCIAL PROOF BAR ────────────────────────────────────────────────── */
  .hfl-proof-bar {
    margin-top: 70px;
    background: var(--sage-light); border-bottom: 1px solid rgba(46,37,64,0.1);
    padding: 10px 56px; display: flex; align-items: center; justify-content: center; gap: 12px;
    font-size: 13px; font-weight: 500; color: var(--plum);
  }
  .hfl-proof-stars { color: #F4B942; letter-spacing: 1px; }
  .hfl-proof-sep { color: var(--plum-mid); opacity: 0.4; }
  .hfl-proof-quote { font-style: italic; color: var(--plum); }
  .hfl-proof-stat { font-weight: 700; color: var(--plum); }

  /* ── HERO — updated padding + new elements ───────────────────────────── */
  .hfl-hero { padding: 20px 56px 0; }
  .hfl-hero-bullets {
    list-style: none; display: flex; flex-direction: column; gap: 14px;
    margin-bottom: 40px; max-width: 480px;
    animation: hfl-fadeUp .5s .2s ease both;
  }
  .hfl-hero-bullets li {
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 17px; color: var(--plum); font-weight: 500; line-height: 1.5;
  }
  .hfl-hb-dot {
    width: 22px; height: 22px; background: var(--sage-light); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: var(--sage); flex-shrink: 0; margin-top: 2px; font-weight: 800;
  }
  .hfl-price-anchor {
    font-size: 13px; font-weight: 700; color: var(--plum-mid);
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 8px 16px; background: rgba(46,37,64,0.06); border-radius: 100px;
    border: 1px solid rgba(46,37,64,0.1); white-space: nowrap;
  }
  .hfl-demo-link {
    display: inline-block; font-size: 15px; font-weight: 600; color: var(--plum-mid);
    text-decoration: none; cursor: pointer; margin-bottom: 32px; margin-top: 4px;
    border-bottom: 1px solid rgba(46,37,64,0.2);
    transition: color .15s, border-color .15s;
    animation: hfl-fadeUp .5s .35s ease both;
  }
  .hfl-demo-link:hover { color: var(--plum); border-color: var(--plum); }
  .hfl-stat-chip {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--sage-light); border: 1px solid var(--sage-mid); border-radius: 100px;
    padding: 6px 16px; font-size: 13px; font-weight: 700; color: var(--plum);
  }
  .hfl-hero-micro-quote {
    margin-top: 16px; display: flex; flex-direction: column; gap: 4px;
    max-width: 420px; animation: hfl-fadeUp .5s .45s ease both;
  }
  .hfl-hmq-stars { color: #F4B942; font-size: 13px; letter-spacing: 1px; }
  .hfl-hmq-text { font-size: 13px; color: var(--plum-mid); line-height: 1.55; font-style: italic; }
  .hfl-hmq-attr { font-size: 12px; font-weight: 700; color: var(--plum); }
  /* Hero card phase indicator */
  .hfl-dc-phase-dots { display: flex; justify-content: center; gap: 6px; padding: 10px 0 4px; }
  .hfl-dc-phase-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(46,37,64,0.12); transition: background .3s; }
  .hfl-dc-phase-dot-active { background: var(--sage); }

  /* ── PROBLEM SECTION ─────────────────────────────────────────────────── */
  .hfl-problem { padding: 0 56px 48px; }
  .hfl-problem-inner { background: white; border: 1px solid var(--rule); overflow: hidden; display: flex; align-items: stretch; min-height: 480px; }
  .hfl-problem-img { flex: 0 0 40%; overflow: hidden; }
  .hfl-problem-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hfl-problem-text { flex: 1; padding: 52px 48px; display: flex; flex-direction: column; justify-content: center; }

  /* ── PRICING SECTION ─────────────────────────────────────────────────── */
  .hfl-pricing { padding: 0 56px 100px; }
  .hfl-pricing-inner { background: #FAF7F2; padding: 72px 80px; border: 1px solid var(--rule); }
  .hfl-pricing-header { max-width: 540px; margin-bottom: 56px; }
  .hfl-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 36px; }
  .hfl-plan-card {
    background: white; padding: 36px 32px;
    border: 1.5px solid var(--rule); position: relative;
    display: flex; flex-direction: column;
    transition: border-color .2s, box-shadow .2s;
  }
  .hfl-plan-card:hover { border-color: var(--sage); box-shadow: 0 8px 32px rgba(122,175,118,0.12); }
  .hfl-plan-featured { border-color: var(--plum); border-width: 2px; }
  .hfl-plan-featured:hover { border-color: var(--plum); box-shadow: 0 8px 32px rgba(46,37,64,0.18); }
  .hfl-plan-badge {
    position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
    background: var(--plum); color: white; font-size: 10px; font-weight: 800;
    letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 16px; border-radius: 100px;
    white-space: nowrap;
  }
  .hfl-plan-tier { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: var(--plum-mid); margin-bottom: 12px; }
  .hfl-plan-price { font-family: 'Fraunces', serif; font-size: 52px; font-weight: 900; color: var(--plum); line-height: 1; margin-bottom: 28px; }
  .hfl-plan-period { font-size: 18px; font-weight: 400; color: var(--plum-mid); }
  .hfl-plan-features {
    list-style: none; display: flex; flex-direction: column; gap: 10px;
    font-size: 14px; line-height: 1.5; flex: 1; margin-bottom: 28px;
  }
  .hfl-plan-features li { display: flex; gap: 8px; color: var(--plum); }
  .hfl-plan-cta {
    width: 100%; padding: 14px 0; background: var(--sage-light);
    border: 1.5px solid var(--sage-mid); border-radius: 0; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700;
    color: var(--plum); transition: background .2s, border-color .2s;
  }
  .hfl-plan-cta:hover { background: var(--sage-mid); border-color: var(--sage); }
  .hfl-plan-featured .hfl-plan-cta { background: var(--plum); color: white; border-color: var(--plum); }
  .hfl-plan-featured .hfl-plan-cta:hover { background: var(--plum-light); }
  .hfl-pricing-note { text-align: center; font-size: 14px; color: var(--plum-mid); font-weight: 500; }
  .hfl-pricing-note a { color: var(--plum); font-weight: 700; text-decoration: none; border-bottom: 1px solid rgba(46,37,64,0.3); }
  .hfl-pricing-note a:hover { border-color: var(--plum); }

  /* ── FINAL CTA ───────────────────────────────────────────────────────── */
  .hfl-final-cta { padding: 0 56px 100px; }
  .hfl-final-cta-inner {
    background: var(--plum); padding: 96px 80px;
    text-align: center; position: relative; overflow: hidden;
  }
  .hfl-final-cta-inner::before {
    content: ''; position: absolute; top: -60px; right: -60px;
    width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,76,46,0.25), transparent 70%);
    pointer-events: none;
  }
  .hfl-final-cta-inner::after {
    content: ''; position: absolute; bottom: -80px; left: -80px;
    width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(122,175,118,0.12), transparent 70%);
    pointer-events: none;
  }
  .hfl-final-cta .hfl-kicker { position: relative; }
  .hfl-final-cta h2 { color: white; margin-bottom: 20px; max-width: 620px; margin-left: auto; margin-right: auto; position: relative; }
  .hfl-final-cta h2 em { color: var(--sage); }
  .hfl-final-cta-sub { font-size: 17px; color: rgba(253,252,250,0.65); line-height: 1.7; max-width: 520px; margin: 0 auto 44px; position: relative; }
  .hfl-final-cta-btn {
    background: #C94C2E; color: white; padding: 20px 52px; border-radius: 0;
    font-size: 17px; font-weight: 700; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background .2s, box-shadow .2s; position: relative;
  }
  .hfl-final-cta-btn:hover { background: #B54228; box-shadow: 0 12px 36px rgba(201,76,46,0.4); }
  .hfl-final-cta-fine { margin-top: 20px; font-size: 12px; color: rgba(253,252,250,0.35); position: relative; }

  /* ── MOBILE — new elements ───────────────────────────────────────────── */
  @media (max-width: 900px) {
    .hfl-proof-bar { padding: 8px 24px; gap: 8px; flex-wrap: wrap; justify-content: center; font-size: 12px; }
    .hfl-hero { padding: 16px 24px 48px; }
    .hfl-hero-bullets li { font-size: 15px; }
    .hfl-hero-micro-quote { display: none; }
    .hfl-problem { padding: 0 24px 64px; }
    .hfl-problem-inner { flex-direction: column; }
    .hfl-problem-img { flex: none; width: 100%; max-height: 320px; }
    .hfl-problem-text { padding: 36px 28px; }
    .hfl-pricing { padding: 0 24px 64px; }
    .hfl-pricing-inner { padding: 40px 28px; }
    .hfl-pricing-grid { grid-template-columns: 1fr; gap: 32px; }
    .hfl-plan-card { padding: 28px 24px; }
    .hfl-final-cta { padding: 0 24px 64px; }
    .hfl-final-cta-inner { padding: 60px 28px; }
    .hfl-final-cta h2 { font-size: 28px; }
    .hfl-final-cta-sub { font-size: 15px; }
    .hfl-final-cta-btn { padding: 16px 32px; font-size: 15px; width: 100%; }
  }
  @media (max-width: 480px) {
    .hfl-proof-bar { font-size: 11px; padding: 8px 16px; }
    .hfl-proof-quote { display: none; }
  }
`;
