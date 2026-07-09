export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
:root{
  --bg:#F8FAFC;--card:#FFFFFF;--teal:#2563EB;--teal2:#1D4ED8;--red:#DC2626;--orange:#EA580C;--purple:#7C3AED;
  --sep:#E2E8F0;--t1:#0F172A;--t2:#334155;--t3:#64748B;--t4:#94A3B8;
  --safe-bottom:env(safe-area-inset-bottom,0px);--safe-top:env(safe-area-inset-top,0px);
  --rr:12px;--rl:16px;--rxl:24px;
  --bar:rgba(255,255,255,0.8);--hover:#F1F5F9;--sel:rgba(37,99,235,0.12);
  --input:#FFFFFF;--card-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.06);
  --card-border:1px solid rgba(0,0,0,.04);--card-hover:0 8px 30px rgba(0,0,0,.08);
  --ib1:#DCFCE7;--ib2:#DBEAFE;--ib3:#FEF3C7;--ib4:#F3E8FF;--ib5:#CCFBF1;--ib6:#FEE2E2;
}
html,body{height:100%;background:var(--bg)}
body{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;color:var(--t1);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overscroll-behavior:none;-webkit-touch-callout:none;font-feature-settings:'cv02','cv03','cv04','cv11'}
::selection{background:var(--teal);color:white}
.tabbar{position:fixed;bottom:0;left:0;right:0;height:calc(56px + var(--safe-bottom));background:var(--bar);backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);border-top:0.5px solid var(--sep);display:flex;align-items:flex-start;padding-top:4px;z-index:200}
.tbi{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 4px 0;position:relative;transition:transform .2s cubic-bezier(.34,1.56,.64,1)}
.tbi:active{transform:scale(.92)}
.tbi svg{width:24px;height:24px;transition:color .2s}
.tbi span{font-size:10px;font-weight:500;color:var(--t4);transition:color .2s}
.tbi.on svg{color:var(--teal)}.tbi.on svg path,.tbi.on svg circle,.tbi.on svg rect{fill:var(--teal)}
.tbi.on span{color:var(--teal);font-weight:600}
.navbar{position:sticky;top:0;z-index:100;background:var(--bar);backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);border-bottom:0.5px solid var(--sep);padding:calc(var(--safe-top) + 10px) 16px 10px;display:flex;align-items:center;justify-content:space-between;min-height:48px}
.nav-title{font-size:17px;font-weight:600;color:var(--t1);letter-spacing:-.2px}
.nav-large{font-size:34px;font-weight:700;letter-spacing:-.5px;padding:12px 16px 4px;color:var(--t1)}
.nav-action{background:none;border:none;color:var(--teal);font-size:16px;font-weight:600;cursor:pointer;font-family:inherit;padding:4px 0;transition:opacity .15s}
.nav-action:active{opacity:.6}
.scroll{overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding-bottom:calc(80px + var(--safe-bottom));padding-top:0;overscroll-behavior:contain}
.section{padding:0 16px;margin-bottom:12px}
.section-header{font-size:13px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.8px;padding:20px 4px 8px}
.list{background:var(--card);border-radius:var(--rl);overflow:hidden;box-shadow:var(--card-shadow);border:var(--card-border)}
.row{display:flex;align-items:center;padding:14px 16px;min-height:48px;gap:12px;border-bottom:0.5px solid var(--sep);cursor:pointer;transition:background .15s ease}
.row:last-child{border-bottom:none}
.row:active{background:var(--hover)}
.row-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;font-size:17px;transition:transform .2s}
.row:active .row-icon{transform:scale(.92)}
.row-body{flex:1;min-width:0}
.row-title{font-size:16px;color:var(--t1);font-weight:500;letter-spacing:-.1px}
.row-sub{font-size:13px;color:var(--t3);margin-top:2px;line-height:1.4}
.row-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.row-value{font-size:16px;color:var(--t3);font-weight:500}
.chevron{color:var(--t4);font-size:16px;font-weight:300}
.row-check{width:24px;height:24px;border-radius:50%;border:2px solid var(--sep);display:grid;place-items:center;flex-shrink:0;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
.row-check.done{background:var(--teal2);border-color:var(--teal2);transform:scale(1.05)}
.row-check.done::after{content:'✓';color:white;font-size:12px;font-weight:700}
.hero-card{margin:16px 16px 12px;background:linear-gradient(145deg,#2563EB 0%,#1D4ED8 40%,#1E3A8A 100%);border-radius:var(--rxl);padding:24px;color:white;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(37,99,235,.25),0 2px 8px rgba(0,0,0,.1)}
.hero-card::before{content:'';position:absolute;top:-60px;right:-40px;width:200px;height:200px;background:radial-gradient(circle,rgba(255,255,255,.15) 0%,transparent 70%);border-radius:50%;pointer-events:none}
.hero-card::after{content:'';position:absolute;bottom:-80px;left:-20px;width:160px;height:160px;background:radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%);border-radius:50%;pointer-events:none}
.hero-label{font-size:14px;font-weight:500;opacity:.85;margin-bottom:6px;letter-spacing:.2px}
.hero-big{font-size:52px;font-weight:800;line-height:1;letter-spacing:-1.5px}
.hero-sub{font-size:15px;opacity:.8;margin-top:4px;font-weight:400}
.hero-row{display:flex;gap:12px;margin-top:20px}
.hero-stat{flex:1;background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border-radius:12px;padding:12px 10px;text-align:center;border:1px solid rgba(255,255,255,.08)}
.hero-stat-val{font-size:22px;font-weight:700;letter-spacing:-.3px}
.hero-stat-lbl{font-size:11px;opacity:.75;margin-top:3px;font-weight:500;text-transform:uppercase;letter-spacing:.5px}
.chips{display:flex;gap:10px;margin:0 16px 16px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{flex-shrink:0;background:var(--card);border-radius:var(--rl);padding:16px 18px;min-width:110px;box-shadow:var(--card-shadow);border:var(--card-border);transition:transform .2s,box-shadow .2s}
.chip:active{transform:scale(.97);box-shadow:var(--card-hover)}
.chip-val{font-size:26px;font-weight:800;color:var(--t1);letter-spacing:-.5px}
.chip-lbl{font-size:12px;color:var(--t3);margin-top:3px;font-weight:500}
.chip.green .chip-val{color:var(--teal2)}
.chip.blue .chip-val{color:var(--teal)}
.chip.orange .chip-val{color:var(--orange)}
.chip.purple .chip-val{color:var(--purple)}
.ring-wrap{position:relative;width:88px;height:88px;flex-shrink:0}
.ring-wrap svg{transform:rotate(-90deg);filter:drop-shadow(0 2px 4px rgba(0,0,0,.1))}
.ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring-pct{font-size:20px;font-weight:800;color:var(--t1);letter-spacing:-.3px}
.ring-of{font-size:10px;color:var(--t3);font-weight:500;text-transform:uppercase;letter-spacing:.3px}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;letter-spacing:.2px}
.badge-green{background:var(--ib2);color:var(--teal2)}
.badge-gray{background:var(--hover);color:var(--t2)}
.badge-blue{background:var(--ib1);color:var(--teal)}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 20px;border-radius:var(--rl);font-size:16px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .15s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden}
.btn:active{transform:scale(.97);opacity:.9}
.btn-primary{background:var(--teal);color:white;width:100%;box-shadow:0 4px 14px rgba(34,197,94,.35)}
.btn-primary:active{box-shadow:0 2px 8px rgba(34,197,94,.25)}
.btn-green{background:var(--teal2);color:white;box-shadow:0 4px 14px rgba(37,99,235,.3)}
.btn-ghost{background:var(--card);color:var(--teal);width:100%;border:1px solid var(--sep)}
.btn-ghost:active{background:var(--hover)}
.btn-red{background:var(--red);color:white;box-shadow:0 4px 14px rgba(239,68,68,.3)}
.btn-disabled{opacity:.4;pointer-events:none}
.btn-sm{padding:8px 14px;font-size:13px;border-radius:10px}
.auth-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:linear-gradient(160deg,#f0fdf4 0%,#dcfce7 30%,#eff6ff 100%)}
.auth-card{background:var(--card);border-radius:28px;padding:32px 24px;width:100%;max-width:400px;box-shadow:0 8px 40px rgba(0,0,0,.06),0 1px 4px rgba(0,0,0,.04);border:1px solid rgba(0,0,0,.04)}
.auth-logo{display:flex;align-items:center;gap:12px;margin-bottom:28px}
.auth-mark{width:48px;height:48px;background:linear-gradient(135deg,var(--teal),var(--teal2));border-radius:14px;display:grid;place-items:center;box-shadow:0 4px 12px rgba(34,197,94,.25)}
.auth-mark svg{fill:white;width:26px;height:26px}
.auth-app-name{font-size:22px;font-weight:700;color:var(--t1);letter-spacing:-.3px}
.auth-title{font-size:26px;font-weight:700;margin-bottom:6px;letter-spacing:-.5px}
.auth-sub{font-size:15px;color:var(--t3);margin-bottom:24px;line-height:1.5}
.oauth-stack{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
.oauth-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 20px;border:1.5px solid var(--sep);border-radius:var(--rl);background:var(--card);cursor:pointer;font-size:15px;font-weight:500;color:var(--t1);font-family:inherit;transition:all .15s;width:100%}
.oauth-btn:active{background:var(--hover);transform:scale(.98)}
.oauth-btn svg{width:20px;height:20px;flex-shrink:0}
.divider{display:flex;align-items:center;gap:12px;margin-bottom:16px;color:var(--t3);font-size:13px;font-weight:500}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--sep)}
.input-group{display:flex;flex-direction:column;gap:14px;margin-bottom:20px}
.input-field{padding:14px 16px;border:1.5px solid var(--sep);border-radius:var(--rl);font-size:16px;color:var(--t1);font-family:inherit;background:var(--input);outline:none;transition:all .2s;
box-shadow:0 1px 2px rgba(0,0,0,.02) inset}
.input-field:focus{border-color:var(--teal);box-shadow:0 0 0 3px var(--sel);background:var(--card)}
.input-field::placeholder{color:var(--t4)}
.pw-wrap{transition:all .2s}
.pw-wrap:focus-within{border-color:var(--teal)!important;box-shadow:0 0 0 3px var(--sel)}
.auth-switch{text-align:center;margin-top:16px;font-size:14px;color:var(--t3)}
.auth-switch button{background:none;border:none;color:var(--teal);font-weight:600;cursor:pointer;font-size:14px;font-family:inherit;transition:opacity .15s}
.auth-switch button:active{opacity:.7}
.err-msg{background:var(--ib6);border:1px solid rgba(239,68,68,.2);color:var(--red);padding:12px 16px;border-radius:12px;font-size:14px;margin-bottom:16px;line-height:1.5}
.ok-msg{background:var(--ib2);border:1px solid rgba(37,99,235,.2);color:var(--teal2);padding:14px;border-radius:12px;font-size:14px;margin-bottom:14px;line-height:1.5}
.ok-msg strong{display:block;font-size:15px;margin-bottom:4px}
.onboard-screen{min-height:100vh;background:var(--bg);display:flex;flex-direction:column}
.ob-progress{display:flex;gap:6px;padding:20px 24px 0}
.ob-dot{flex:1;height:4px;border-radius:99px;background:var(--sep);transition:all .4s ease}
.ob-dot.done{background:var(--teal)}
.ob-body{flex:1;padding:28px 24px;display:flex;flex-direction:column}
.ob-emoji{font-size:64px;margin-bottom:16px;line-height:1}
.ob-title{font-size:28px;font-weight:700;margin-bottom:8px;line-height:1.2;letter-spacing:-.5px}
.ob-sub{font-size:16px;color:var(--t3);margin-bottom:32px;line-height:1.6}
.ob-options{display:flex;flex-direction:column;gap:10px;margin-bottom:auto}
.ob-option{display:flex;align-items:center;gap:16px;padding:16px 18px;background:var(--card);border-radius:var(--rl);cursor:pointer;border:2px solid transparent;transition:all .2s;box-shadow:var(--card-shadow);border:var(--card-border)}
.ob-option:active{transform:scale(.98)}
.ob-option.sel{border-color:var(--teal);background:var(--sel);box-shadow:0 4px 16px rgba(34,197,94,.15)}
.ob-option-icon{font-size:26px;width:44px;text-align:center;flex-shrink:0}
.ob-option-text{flex:1}
.ob-option-title{font-size:16px;font-weight:600;color:var(--t1)}
.ob-option-sub{font-size:13px;color:var(--t3);margin-top:3px;line-height:1.4}
.ob-check{width:24px;height:24px;border-radius:50%;border:2px solid var(--sep);display:grid;place-items:center;flex-shrink:0;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
.ob-check.on{background:var(--teal);border-color:var(--teal);transform:scale(1.05)}
.ob-check.on::after{content:'✓';color:white;font-size:12px;font-weight:700}
.ob-footer{padding:16px 24px calc(20px + var(--safe-bottom))}
.ob-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ob-time-card{background:var(--card);border-radius:var(--rl);padding:16px;cursor:pointer;border:2px solid transparent;transition:all .2s;text-align:center;box-shadow:var(--card-shadow);border:var(--card-border)}
.ob-time-card:active{transform:scale(.97)}
.ob-time-card.sel{border-color:var(--teal);background:var(--sel);box-shadow:0 4px 16px rgba(34,197,94,.15)}
.ob-time-emoji{font-size:32px;margin-bottom:6px}
.ob-time-label{font-size:15px;font-weight:600;color:var(--t1)}
.ob-time-sub{font-size:12px;color:var(--t3);margin-top:3px}
.emoji-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.emoji-opt{font-size:28px;width:54px;height:54px;display:grid;place-items:center;border-radius:14px;cursor:pointer;border:2px solid transparent;transition:all .2s;background:var(--card);box-shadow:var(--card-shadow);border:var(--card-border)}
.emoji-opt:active{transform:scale(.92)}
.emoji-opt.sel{border-color:var(--teal);background:var(--sel);box-shadow:0 4px 12px rgba(34,197,94,.15)}
.sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:300;display:flex;align-items:flex-end;backdrop-filter:blur(4px)}
.sheet{background:var(--card);border-radius:24px 24px 0 0;padding:0 0 calc(16px + var(--safe-bottom));width:100%;max-height:90vh;overflow-y:auto;animation:slideUp .35s cubic-bezier(.32,.72,0,1);will-change:transform;box-shadow:0 -4px 30px rgba(0,0,0,.1)}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sheet-handle{width:40px;height:5px;background:var(--sep);border-radius:99px;margin:12px auto 16px}
.sheet-title{font-size:18px;font-weight:700;text-align:center;padding:0 16px 16px;border-bottom:.5px solid var(--sep);margin-bottom:8px;letter-spacing:-.2px}
.sheet-section{padding:8px 16px}
.sheet-label{color:var(--t3);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;font-size:11px}
select,.sheet-input,.input-field{-webkit-appearance:none;appearance:none}
.sheet-input{width:100%;padding:14px 16px;border:1.5px solid var(--sep);border-radius:var(--rl);font-size:16px;color:var(--t1);font-family:inherit;background:var(--input);outline:none;transition:all .2s}
.sheet-input:focus{border-color:var(--teal);box-shadow:0 0 0 3px var(--sel)}
.sheet-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sheet-actions{padding:16px 16px 0;display:flex;flex-direction:column;gap:10px}
.sheet-seg{display:flex;background:var(--hover);border-radius:10px;padding:3px}
.sheet-seg-btn{flex:1;padding:8px;border:none;background:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;color:var(--t2);transition:all .2s}
.sheet-seg-btn.on{background:var(--card);color:var(--t1);box-shadow:0 2px 8px rgba(0,0,0,.08)}
.notif-banner{margin:0 16px 16px;background:linear-gradient(135deg,#F59E0B,#F97316);border-radius:var(--rl);padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;box-shadow:0 4px 16px rgba(249,115,22,.2)}
.notif-banner-text{flex:1;font-size:14px;font-weight:500;color:white;line-height:1.4}
.notif-banner-btn{background:white;color:#92400E;border:none;border-radius:10px;padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:transform .15s}
.notif-banner-btn:active{transform:scale(.95)}
.prog{height:6px;background:var(--sep);border-radius:99px;overflow:hidden;margin-top:10px}
.prog-fill{height:100%;border-radius:99px;transition:width .5s cubic-bezier(.34,1.56,.64,1);position:relative}
.prog-fill::after{content:'';position:absolute;inset:1px;border-radius:99px;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.2) 100%)}
.empty-state{text-align:center;padding:56px 24px;color:var(--t3)}
.empty-state-icon{font-size:56px;margin-bottom:16px;display:block}
.empty-state-title{font-size:18px;font-weight:600;color:var(--t2);margin-bottom:8px}
.empty-state-sub{font-size:15px;margin-bottom:24px;line-height:1.5}
.loading-screen{min-height:100vh;display:grid;place-items:center;font-size:40px}
.tag{display:inline-flex;align-items:center;gap:4px;background:var(--hover);border-radius:8px;padding:4px 10px;font-size:12px;color:var(--t2);font-weight:500}
.profile-header{padding:28px 16px 20px;display:flex;flex-direction:column;align-items:center;gap:10px}
.profile-avatar{width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--teal2));display:grid;place-items:center;font-size:42px;box-shadow:0 4px 20px rgba(34,197,94,.2);border:3px solid var(--card);transition:transform .2s}
.profile-avatar:active{transform:scale(.95)}
.profile-name{font-size:24px;font-weight:700;color:var(--t1);letter-spacing:-.3px}
.profile-plan{font-size:14px;font-weight:600}
.upgrade-card{margin:0 16px 16px;background:linear-gradient(145deg,#2563EB,#1D4ED8 50%,#1E3A8A);border-radius:var(--rxl);padding:24px;color:white;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(37,99,235,.2)}
.upgrade-card::before{content:'';position:absolute;top:-40px;right:-40px;width:160px;height:160px;background:radial-gradient(circle,rgba(255,255,255,.12),transparent 70%);border-radius:50%}
.upgrade-title{font-size:22px;font-weight:700;margin-bottom:6px;letter-spacing:-.3px}
.upgrade-sub{font-size:14px;opacity:.85;margin-bottom:16px;line-height:1.6}
.upgrade-features{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.upgrade-feature{font-size:14px;opacity:.9;display:flex;align-items:center;gap:6px}
.upgrade-btn{background:white;color:#2563EB;border:none;border-radius:12px;padding:14px 20px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;transition:transform .15s}
.upgrade-btn:active{transform:scale(.97)}
.trans-screen{position:fixed;inset:0;background:linear-gradient(160deg,#2563EB 0%,#1D4ED8 60%,#1E3A8A 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;transition:opacity .5s ease}
.trans-screen.fade-out{opacity:0;pointer-events:none}
.trans-logo{width:96px;height:96px;background:rgba(255,255,255,.15);border-radius:28px;display:grid;place-items:center;margin-bottom:24px;backdrop-filter:blur(16px);animation:logoPop .6s cubic-bezier(.175,.885,.32,1.275) both;border:1px solid rgba(255,255,255,.1)}
@keyframes logoPop{from{transform:scale(.3) rotate(-8deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
.trans-logo svg{fill:white;width:48px;height:48px}
.trans-title{font-size:32px;font-weight:800;color:white;margin-bottom:8px;animation:fadeUp .6s .15s ease both;letter-spacing:-.5px}
.trans-msg{font-size:17px;color:rgba(255,255,255,.8);margin-bottom:48px;animation:fadeUp .6s .25s ease both;text-align:center;padding:0 32px;line-height:1.6;font-weight:400}
@keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
.trans-dots{display:flex;gap:8px;animation:fadeUp .6s .35s ease both}
.trans-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.4)}
.trans-dot:nth-child(1){animation:pulse 1.4s .0s infinite}
.trans-dot:nth-child(2){animation:pulse 1.4s .2s infinite}
.trans-dot:nth-child(3){animation:pulse 1.4s .4s infinite}
@keyframes pulse{0%,80%,100%{background:rgba(255,255,255,.3);transform:scale(.85)}40%{background:white;transform:scale(1.15)}}
.ob-step{animation:obSlide .35s ease both}
@keyframes obSlide{from{transform:translateX(36px);opacity:0}to{transform:translateX(0);opacity:1}}
.goal-chip{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--card);border-radius:var(--rl);cursor:pointer;border:2px solid transparent;transition:all .2s;box-shadow:var(--card-shadow);border:var(--card-border)}
.goal-chip:active{transform:scale(.98)}
.goal-chip.sel{border-color:var(--teal);background:var(--sel);box-shadow:0 4px 16px rgba(34,197,94,.15)}
.goal-chip-icon{font-size:24px;width:40px;text-align:center;flex-shrink:0}
.goal-chip-label{font-size:15px;font-weight:600;color:var(--t1)}
.goal-chip-check{width:22px;height:22px;border-radius:50%;border:2px solid var(--sep);display:grid;place-items:center;flex-shrink:0;margin-left:auto;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
.goal-chip-check.on{background:var(--teal);border-color:var(--teal)}
.theme-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.theme-swatch{width:100%;aspect-ratio:1;border-radius:16px;cursor:pointer;display:grid;place-items:center;border:3px solid transparent;transition:all .2s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden}
.theme-swatch:active{transform:scale(.92)}
.theme-swatch.sel{border-color:var(--t1);transform:scale(1.06)}
.theme-swatch-check{font-size:20px;color:white;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))}
.highlight-card{margin:0 16px 16px;background:linear-gradient(135deg,var(--teal),var(--teal2));border-radius:var(--rxl);padding:20px;color:white;position:relative;box-shadow:0 8px 32px rgba(34,197,94,.2)}
.highlight-title{font-size:18px;font-weight:700;margin-bottom:4px}
.highlight-sub{font-size:14px;opacity:.85}
.streak-badge{display:flex;align-items:center;gap:4px;padding:3px 10px 3px 8px;border-radius:99px;font-size:12px;font-weight:600}
.streak-badge.fire{background:rgba(251,146,60,.15);color:#F97316}
.streak-badge.ice{background:rgba(59,130,246,.12);color:#3B82F6}
.streak-badge.gold{background:rgba(234,179,8,.15);color:#EAB308}
@media(min-width:430px){
  .auth-screen{padding:40px 24px}
  .onboard-screen{max-width:430px;margin:0 auto}
}
@media(min-width:768px){
  .scroll,.auth-screen,.onboard-screen{max-width:480px;margin:0 auto}
  .tabbar{max-width:480px;left:50%;transform:translateX(-50%);border-radius:24px 24px 0 0}
  .hero-card,.upgrade-card,.highlight-card{max-width:480px;margin-left:auto;margin-right:auto}
}
@keyframes bgPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.6}}
@keyframes emojiPop{from{transform:scale(.3) rotate(-15deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.skeleton{background:linear-gradient(90deg,var(--sep) 25%,var(--hover) 50%,var(--sep) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}
`;

export function GIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function Chevron() { return <span style={{color:"var(--t4)",fontSize:13}}>›</span>; }

export function fmtTime(iso) { return new Date(iso).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); }

export function fmtDate(iso) { return new Date(iso).toLocaleDateString([],{month:"short",day:"numeric"}); }

export function fmtDateLong(iso) { return new Date(iso).toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"}); }

export function AuthLogo() {
  return (
    <div className="auth-logo">
      <div className="auth-mark">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="3" strokeOpacity=".3"/>
          <circle cx="50" cy="14" r="6" fill="white"/>
          <circle cx="50" cy="86" r="6" fill="white"/>
          <text x="24" y="58" fontFamily="system-ui,sans-serif" fontSize="34" fontWeight="700" fill="white">A</text>
          <rect x="56" y="38" width="4" height="18" rx="2" fill="white" transform="translate(58,47)"/>
          <rect x="52" y="43" width="16" height="4" rx="2" fill="white" transform="translate(60,45)"/>
        </svg>
      </div>
      <span className="auth-app-name">Adhera</span>
    </div>
  );
}
