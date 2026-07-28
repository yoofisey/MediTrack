export const CSS = `
:root{
  --bg:#F2F2F7;--card:#FFFFFF;--teal:#007AFF;--teal2:#0055CC;--red:#FF3B30;--orange:#FF9500;--purple:#AF52DE;
  --sep:rgba(60,60,67,.08);--t1:#1C1C1E;--t2:#3A3A3C;--t3:#8E8E93;--t4:#D1D1D6;
  --safe-bottom:env(safe-area-inset-bottom,0px);--safe-top:env(safe-area-inset-top,0px);
  --rr:12px;--rl:16px;--rxl:22px;
  --bar:rgba(249,249,249,0.94);--hover:#F2F2F7;--sel:rgba(0,122,255,0.08);
  --input:#F2F2F7;
  --card-shadow:0 0 0 0.5px rgba(0,0,0,.02),0 1px 2px rgba(0,0,0,.02),0 4px 8px rgba(0,0,0,.03),0 12px 24px rgba(0,0,0,.04);
  --card-border:0.5px solid rgba(0,0,0,.04);
  --card-hover:0 0 0 0.5px rgba(0,0,0,.04),0 2px 4px rgba(0,0,0,.04),0 8px 16px rgba(0,0,0,.06);
  --ib1:#E8F4FD;--ib2:#E8F4FD;--ib3:#FFF4E5;--ib4:#F5E8FF;--ib5:#E0F7F4;--ib6:#FFEBEE;
  --section-gap:24px;
  --ios-radii:12px;
}
*,*::before,*::after{box-sizing:border-box}
html,body{height:100%;background:var(--bg);overflow-x:hidden;max-width:100vw}
body{font-family:var(--app-font-sans),'Helvetica Neue',system-ui,sans-serif;color:var(--t1);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overscroll-behavior:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
::selection{background:var(--teal);color:white}

.navbar{position:sticky;top:0;z-index:100;background:var(--bar);backdrop-filter:blur(40px) saturate(1.8) brightness(1.02);-webkit-backdrop-filter:blur(40px) saturate(1.8) brightness(1.02);border-bottom:0.5px solid rgba(0,0,0,.08);padding:calc(var(--safe-top) + 10px) 20px 8px;display:flex;align-items:flex-end;justify-content:space-between;min-height:56px}
.nav-title{font-size:28px;font-weight:700;letter-spacing:.3px;color:var(--t1);line-height:1.1}
.nav-action{background:none;border:none;color:var(--teal);font-size:17px;font-weight:600;cursor:pointer;font-family:inherit;padding:4px 2px;transition:opacity .15s;letter-spacing:-.2px}
.nav-action:active{opacity:.5}
.nav-large{font-size:34px;font-weight:800;letter-spacing:-.6px;color:var(--t1);padding:20px 20px 6px;line-height:1.1}

.tabbar{position:fixed;bottom:0;left:0;right:0;height:calc(54px + var(--safe-bottom));background:var(--bar);backdrop-filter:blur(40px) saturate(1.8) brightness(1.02);-webkit-backdrop-filter:blur(40px) saturate(1.8) brightness(1.02);border-top:0.5px solid rgba(0,0,0,.08);display:flex;align-items:flex-start;padding-top:6px;z-index:200}
.tbi{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:2px 4px 0;position:relative;transition:transform .2s cubic-bezier(.34,1.56,.64,1)}
.tbi:active{transform:scale(.85)}
.tbi svg{width:25px;height:25px;color:var(--t4);transition:color .2s ease}
.tbi span{font-size:10px;font-weight:500;color:var(--t4);transition:color .2s ease;letter-spacing:.1px}
.tbi.on svg{color:var(--teal)}
.tbi.on svg path,.tbi.on svg circle,.tbi.on svg rect{fill:var(--teal)}
.tbi.on span{color:var(--teal);font-weight:600}

.scroll{overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding-bottom:calc(84px + var(--safe-bottom));padding-top:4px;overscroll-behavior:contain;max-width:100vw}

.section{padding:0 20px;margin-bottom:var(--section-gap)}
.section-header{font-size:13px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.8px;padding:24px 4px 8px}
.list{background:var(--card);border-radius:var(--rxl);overflow:hidden;box-shadow:var(--card-shadow);border:var(--card-border);position:relative;transition:box-shadow .25s ease}
.list:active{box-shadow:var(--card-hover)}
.row{display:flex;align-items:center;padding:14px 20px;min-height:50px;gap:14px;cursor:pointer;transition:background .12s ease,transform .12s ease;position:relative}
.row::after{content:'';position:absolute;left:20px;right:0;bottom:0;height:0.5px;background:var(--sep);pointer-events:none}
.row:last-child::after{display:none}
.row:active{background:var(--hover);transform:scale(.985)}
.row-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;font-size:16px}
.row-body{flex:1;min-width:0}
.row-title{font-size:16px;color:var(--t1);font-weight:400;letter-spacing:-.1px}
.row-sub{font-size:13px;color:var(--t3);margin-top:2px;line-height:1.35}
.row-value{font-size:14px;font-weight:600;color:var(--t1);flex-shrink:0}
.chevron{color:var(--t4);font-size:18px;font-weight:400;font-family:system-ui}

.hero-card{margin:16px 20px 14px;background:var(--card);border-radius:var(--rxl);padding:26px 24px 24px;box-shadow:var(--card-shadow);border:var(--card-border);position:relative;transition:transform .15s ease,box-shadow .15s ease}
.hero-card:active{transform:scale(.985);box-shadow:0 1px 4px rgba(0,0,0,.04)}
.hero-label{font-size:14px;font-weight:500;color:var(--t3);margin-bottom:6px;letter-spacing:.1px}
.hero-big{font-size:52px;font-weight:700;line-height:1;letter-spacing:-2px;color:var(--t1)}
.hero-sub{font-size:14px;color:var(--t3);margin-top:4px}
.hero-row{display:flex;gap:10px;margin-top:22px}
.hero-stat{flex:1;background:var(--hover);border-radius:16px;padding:14px 8px;text-align:center}
.hero-stat-val{font-size:20px;font-weight:700;letter-spacing:-.3px;color:var(--t1)}
.hero-stat-lbl{font-size:11px;color:var(--t3);margin-top:3px;font-weight:500}

.ring-wrap{position:relative;width:80px;height:80px;flex-shrink:0}
.ring-wrap svg{transform:rotate(-90deg)}
.ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring-pct{font-size:18px;font-weight:700;letter-spacing:-.3px;color:var(--teal)}
.ring-of{font-size:9px;color:var(--t3);font-weight:500;text-transform:uppercase;letter-spacing:.3px}

.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;letter-spacing:.1px;transition:all .15s ease}
.badge-green{background:rgba(0,122,255,.08);color:var(--teal2)}
.badge-gray{background:rgba(0,0,0,.04);color:var(--t2)}
.badge-blue{background:rgba(0,122,255,.08);color:var(--teal)}

.btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:15px 22px;border-radius:var(--ios-radii);font-size:16px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .18s cubic-bezier(.34,1.56,.64,1);position:relative}
.btn:active{transform:scale(.97)}
.btn-primary{background:var(--teal);color:white;width:100%;box-shadow:0 2px 8px rgba(0,122,255,.2),inset 0 1px 0 rgba(255,255,255,.12)}
.btn-primary:active{box-shadow:0 1px 4px rgba(0,122,255,.15);background:#0068D6}
.btn-ghost{background:var(--card);color:var(--teal);width:100%;border:0.5px solid var(--sep)}
.btn-ghost:active{background:var(--hover)}
.btn-red{background:var(--red);color:white;box-shadow:0 2px 8px rgba(255,59,48,.2)}
.btn-disabled{opacity:.4;pointer-events:none}
.btn-sm{padding:7px 14px;font-size:13px;border-radius:var(--ios-radii);font-weight:600}

.chips{display:flex;gap:10px;margin:0 20px 14px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{flex-shrink:0;background:var(--card);border-radius:var(--rxl);padding:16px 18px;min-width:100px;box-shadow:var(--card-shadow);border:var(--card-border);transition:transform .2s,box-shadow .2s}
.chip:active{transform:scale(.97)}
.chip-val{font-size:22px;font-weight:700;letter-spacing:-.3px;color:var(--t1)}
.chip-lbl{font-size:11px;color:var(--t3);margin-top:3px;font-weight:500}

.prog{height:4px;background:var(--sep);border-radius:99px;overflow:hidden;margin-top:10px}
.prog-fill{height:100%;border-radius:99px;transition:width .5s cubic-bezier(.34,1.56,.64,1)}

.empty-state{text-align:center;padding:56px 28px;color:var(--t3)}
.empty-state-icon{font-size:52px;margin-bottom:14px;display:block}
.empty-state-title{font-size:17px;font-weight:600;color:var(--t2);margin-bottom:6px}
.empty-state-sub{font-size:14px;margin-bottom:24px;line-height:1.5}

.loading-screen{min-height:100vh;display:grid;place-items:center;font-size:36px}

.tag{display:inline-flex;align-items:center;gap:4px;background:rgba(0,0,0,.04);border-radius:8px;padding:4px 10px;font-size:12px;color:var(--t2);font-weight:500}

.streak-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px 2px 6px;border-radius:99px;font-size:11px;font-weight:600}
.streak-badge.fire{background:rgba(255,149,0,.12);color:#FF9500}
.streak-badge.ice{background:rgba(0,122,255,.10);color:#007AFF}
.streak-badge.gold{background:rgba(255,204,0,.12);color:#FFCC00}

.profile-header{background:var(--card);margin:0 20px 14px;border-radius:var(--rxl);padding:32px 20px 26px;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:var(--card-shadow);border:var(--card-border)}
.profile-avatar{width:88px;height:88px;border-radius:50%;background:var(--hover);display:grid;place-items:center;font-size:40px;box-shadow:0 4px 20px rgba(0,0,0,.08);border:3px solid var(--card);transition:transform .2s}
.profile-avatar:active{transform:scale(.95)}
.profile-name{font-size:22px;font-weight:700;color:var(--t1);letter-spacing:-.3px}

.upgrade-card{background:linear-gradient(145deg,#007AFF 0%,#0055CC 50%,#003399 100%);border-radius:var(--rxl);padding:28px 24px;color:white;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(0,122,255,.25)}
.upgrade-card::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,.06) 50%,transparent 75%);background-size:200% 100%;animation:shimmer 3s infinite;pointer-events:none}
.upgrade-title{font-size:22px;font-weight:700;margin-bottom:4px;letter-spacing:-.2px}
.upgrade-sub{font-size:14px;opacity:.85;margin-bottom:16px;line-height:1.5}
.upgrade-features{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.upgrade-feature{font-size:14px;opacity:.9;display:flex;align-items:center;gap:6px}
.upgrade-btn{background:white;color:#007AFF;border:none;border-radius:var(--ios-radii);padding:14px 22px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;transition:transform .18s cubic-bezier(.34,1.56,.64,1),box-shadow .18s;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.upgrade-btn:active{transform:scale(.97);box-shadow:0 1px 4px rgba(0,0,0,.08)}

.highlight-card{background:linear-gradient(135deg,var(--teal),var(--teal2));border-radius:var(--rxl);padding:20px 22px;color:white;position:relative}
.highlight-title{font-size:17px;font-weight:700;margin-bottom:3px}
.highlight-sub{font-size:13px;opacity:.85}

.notif-banner{margin:0 20px 12px;background:linear-gradient(135deg,#FF9500,#FF6B00);border-radius:var(--rxl);padding:16px 18px;display:flex;align-items:center;gap:12px;cursor:pointer;box-shadow:0 4px 16px rgba(255,149,0,.2)}
.notif-banner-text{flex:1;font-size:14px;font-weight:500;color:white;line-height:1.35}
.notif-banner-btn{background:white;color:#994D00;border:none;border-radius:var(--ios-radii);padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:transform .15s}
.notif-banner-btn:active{transform:scale(.95)}

.sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:300;display:flex;align-items:flex-end;backdrop-filter:blur(1px);-webkit-backdrop-filter:blur(1px);animation:overlayFadeIn .25s ease both}
.sheet{background:var(--card);border-radius:22px 22px 0 0;padding:0 0 calc(12px + var(--safe-bottom));width:100%;max-height:85vh;overflow-y:auto;animation:slideUp .35s cubic-bezier(.32,.72,0,1);will-change:transform;box-shadow:0 -4px 24px rgba(0,0,0,.08)}
.sheet.closing{animation:slideDown .3s ease both}
.sheet-overlay.closing{animation:overlayFadeOut .25s ease both}
.sheet-handle{width:36px;height:5px;background:var(--t4);border-radius:99px;margin:10px auto 16px;opacity:.5}
.sheet-title{font-size:17px;font-weight:600;text-align:center;padding:0 20px 16px;border-bottom:0.5px solid var(--sep);margin-bottom:8px}
.sheet-section{padding:8px 20px}
.sheet-label{color:var(--t3);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;font-size:11px}
select,.sheet-input,.input-field{-webkit-appearance:none;appearance:none}
.sheet-input{width:100%;padding:13px 16px;border:0.5px solid var(--sep);border-radius:var(--ios-radii);font-size:16px;color:var(--t1);font-family:inherit;background:var(--input);outline:none;transition:all .18s}
.sheet-input:focus{border-color:var(--teal);box-shadow:0 0 0 3px var(--sel);background:var(--card)}
.sheet-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sheet-actions{padding:16px 20px 0;display:flex;flex-direction:column;gap:8px}
.sheet-seg{display:flex;background:var(--hover);border-radius:10px;padding:2px}
.sheet-seg-btn{flex:1;padding:8px;border:none;background:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;color:var(--t2);transition:all .15s}
.sheet-seg-btn.on{background:var(--card);color:var(--t1);box-shadow:0 1px 4px rgba(0,0,0,.06)}

.input-group{display:flex;flex-direction:column;gap:14px;margin-bottom:20px}
.input-field{padding:14px 16px;border:0.5px solid var(--sep);border-radius:var(--ios-radii);font-size:16px;color:var(--t1);font-family:inherit;background:var(--input);outline:none;transition:all .18s;box-shadow:0 1px 2px rgba(0,0,0,.02) inset}
.input-field:focus{border-color:var(--teal);box-shadow:0 0 0 3px var(--sel);background:var(--card)}
.input-field::placeholder{color:var(--t4)}

.auth-screen{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:linear-gradient(160deg,#0b1a30 0%,#0d2b5e 30%,#0a1f4a 60%,#061233 100%);position:relative;overflow:hidden}
.auth-screen::before{content:'';position:absolute;top:-30%;right:-20%;width:80%;height:80%;background:radial-gradient(circle,rgba(0,122,255,.15) 0%,transparent 60%);border-radius:50%;pointer-events:none;animation:aurora1 12s ease-in-out infinite}
.auth-screen::after{content:'';position:absolute;bottom:-25%;left:-15%;width:60%;height:60%;background:radial-gradient(circle,rgba(0,180,255,.08) 0%,transparent 55%);border-radius:50%;pointer-events:none;animation:aurora2 14s ease-in-out infinite}
.auth-card{background:rgba(255,255,255,.1);backdrop-filter:blur(24px) saturate(1.6);-webkit-backdrop-filter:blur(24px) saturate(1.6);border:1px solid rgba(255,255,255,.12);border-radius:28px;padding:36px 28px;width:100%;max-width:380px;box-shadow:0 8px 40px rgba(0,0,0,.15),0 0 0 1px rgba(255,255,255,.05) inset;animation:slideUp .5s cubic-bezier(.22,1,.36,1) both;position:relative;z-index:1}
.auth-welcome-card{background:rgba(255,255,255,.08);backdrop-filter:blur(20px) saturate(1.4);-webkit-backdrop-filter:blur(20px) saturate(1.4);border:1px solid rgba(255,255,255,.1);border-radius:28px 28px 0 0;padding:32px 24px calc(32px + env(safe-area-inset-bottom,0px));width:100%;box-shadow:0 -4px 32px rgba(0,0,0,.12);position:relative;z-index:1}
.auth-logo{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.auth-mark{width:42px;height:42px;background:rgba(255,255,255,.15);border-radius:12px;display:grid;place-items:center;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12);box-shadow:0 4px 12px rgba(0,0,0,.1)}
.auth-mark svg{width:22px;height:22px}
.auth-app-name{font-size:20px;font-weight:700;color:white;letter-spacing:-.2px}
.auth-title{font-size:26px;font-weight:700;margin-bottom:4px;letter-spacing:-.4px;color:white}
.auth-sub{font-size:14px;color:rgba(255,255,255,.6);margin-bottom:22px;line-height:1.4}
.oauth-stack{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.oauth-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 18px;border:1px solid rgba(255,255,255,.15);border-radius:var(--ios-radii);background:rgba(255,255,255,.1);cursor:pointer;font-size:15px;font-weight:500;color:white;font-family:inherit;transition:all .15s;width:100%;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.oauth-btn:active{background:rgba(255,255,255,.18);transform:scale(.98)}
.oauth-btn svg{width:18px;height:18px;flex-shrink:0}
.divider{display:flex;align-items:center;gap:12px;margin-bottom:16px;color:rgba(255,255,255,.4);font-size:13px;font-weight:500}
.divider::before,.divider::after{content:'';flex:1;height:0.5px;background:rgba(255,255,255,.12)}
.pw-wrap{border-radius:var(--ios-radii);transition:all .18s;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06)}
.pw-wrap:focus-within{border-color:rgba(0,122,255,.6)!important;box-shadow:0 0 0 3px rgba(0,122,255,.15);background:rgba(255,255,255,.1)}
input[type=password]::-ms-reveal{display:none}
input[type=password]::-webkit-credentials-auto-fill-button{display:none!important;visibility:hidden;pointer-events:none;width:0;height:0}
.auth-switch{text-align:center;margin-top:18px;font-size:14px;color:rgba(255,255,255,.5)}
.auth-switch button{background:none;border:none;color:rgba(255,255,255,.85);font-weight:600;cursor:pointer;font-size:14px;font-family:inherit;transition:opacity .12s}
.auth-switch button:active{opacity:.6}
.err-msg{background:rgba(255,59,48,.12);border:1px solid rgba(255,59,48,.2);color:rgba(255,255,255,.9);padding:12px 16px;border-radius:var(--ios-radii);font-size:13px;margin-bottom:16px;line-height:1.4;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.ok-msg{background:rgba(0,180,255,.12);border:1px solid rgba(0,180,255,.2);color:rgba(255,255,255,.9);padding:14px 18px;border-radius:var(--ios-radii);font-size:13px;margin-bottom:14px;line-height:1.4;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.ok-msg strong{display:block;font-size:14px;margin-bottom:2px;color:white}
.auth-input{padding:14px 16px;border:1px solid rgba(255,255,255,.1);border-radius:var(--ios-radii);font-size:16px;color:white;font-family:inherit;background:rgba(255,255,255,.06);outline:none;transition:all .18s;box-shadow:none}
.auth-input:focus{border-color:rgba(0,122,255,.6);box-shadow:0 0 0 3px rgba(0,122,255,.15);background:rgba(255,255,255,.1)}
.auth-input::placeholder{color:rgba(255,255,255,.35)}
.auth-select{padding:14px 16px;border:1px solid rgba(255,255,255,.1);border-radius:var(--ios-radii);font-size:16px;color:white;font-family:inherit;background:rgba(255,255,255,.06);outline:none;transition:all .18s;width:100%;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px}
.auth-select option{background:#1a2744;color:white}
.auth-select:focus{border-color:rgba(0,122,255,.6);box-shadow:0 0 0 3px rgba(0,122,255,.15)}
.auth-btn{display:flex;align-items:center;justify-content:center;width:100%;padding:14px;border:none;border-radius:var(--ios-radii);font-size:16px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s;letter-spacing:-.1px}
.auth-btn:active{transform:scale(.98)}
.auth-btn-primary{background:linear-gradient(135deg,#007AFF,#0055CC);color:white;box-shadow:0 4px 16px rgba(0,122,255,.3),0 0 0 1px rgba(0,122,255,.2) inset}
.auth-btn-primary:active{background:linear-gradient(135deg,#0055CC,#003d99)}
.auth-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
.auth-btn-ghost{background:rgba(255,255,255,.08);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.1)}
.auth-btn-ghost:active{background:rgba(255,255,255,.15)}
.auth-plan-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.auth-plan{border-radius:12px;padding:12px 10px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);cursor:pointer;transition:all .2s;text-align:center}
.auth-plan.selected{border-color:rgba(0,122,255,.7);background:rgba(0,122,255,.12);box-shadow:0 0 0 1px rgba(0,122,255,.3)}
.auth-plan-name{font-size:11px;color:rgba(255,255,255,.5);margin-bottom:2px;font-weight:500}
.auth-plan-price{font-size:16px;font-weight:700;color:white}
.auth-plan-desc{font-size:9px;color:rgba(255,255,255,.4);margin-top:2px}
.auth-pw-bar{display:flex;gap:4px;margin-bottom:6px}
.auth-pw-segment{flex:1;height:3px;border-radius:2px;transition:background .25s}
.auth-pw-check{display:flex;align-items:center;gap:4px;font-size:11px;transition:color .2s}
.auth-feature-pill{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.1);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08);border-radius:99px;padding:8px 16px;font-size:13px;font-weight:500;color:rgba(255,255,255,.9)}

.onboard-screen{min-height:100vh;background:var(--bg);display:flex;flex-direction:column}
.ob-progress{display:flex;gap:5px;padding:16px 20px 0}
.ob-dot{flex:1;height:3px;border-radius:99px;background:var(--sep);transition:all .4s ease}
.ob-dot.done{background:var(--teal)}
.ob-body{flex:1;padding:28px 24px;display:flex;flex-direction:column}
.ob-emoji{font-size:56px;margin-bottom:16px;line-height:1}
.ob-title{font-size:26px;font-weight:700;margin-bottom:6px;line-height:1.2;letter-spacing:-.4px}
.ob-sub{font-size:15px;color:var(--t3);margin-bottom:28px;line-height:1.5}
.ob-options{display:flex;flex-direction:column;gap:10px;margin-bottom:auto}
.ob-option{display:flex;align-items:center;gap:14px;padding:16px 18px;background:var(--card);border-radius:var(--rxl);cursor:pointer;border:0.5px solid transparent;transition:all .15s;box-shadow:var(--card-shadow)}
.ob-option:active{transform:scale(.98)}
.ob-option.sel{border-color:var(--teal);background:var(--sel);box-shadow:0 2px 12px rgba(0,122,255,.12)}
.ob-option-icon{font-size:24px;width:40px;text-align:center;flex-shrink:0}
.ob-option-text{flex:1}
.ob-option-title{font-size:15px;font-weight:600;color:var(--t1)}
.ob-option-sub{font-size:12px;color:var(--t3);margin-top:2px;line-height:1.3}
.ob-check{width:22px;height:22px;border-radius:50%;border:2px solid var(--sep);display:grid;place-items:center;flex-shrink:0;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
.ob-check.on{background:var(--teal);border-color:var(--teal);transform:scale(1.05)}
.ob-check.on::after{content:'✓';color:white;font-size:11px;font-weight:700}
.ob-footer{padding:14px 20px calc(16px + var(--safe-bottom))}
.ob-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ob-time-card{background:var(--card);border-radius:var(--rxl);padding:16px;cursor:pointer;border:0.5px solid transparent;transition:all .15s;text-align:center;box-shadow:var(--card-shadow)}
.ob-time-card:active{transform:scale(.97)}
.ob-time-card.sel{border-color:var(--teal);background:var(--sel);box-shadow:0 2px 12px rgba(0,122,255,.12)}
.ob-time-emoji{font-size:28px;margin-bottom:5px}
.ob-time-label{font-size:14px;font-weight:600;color:var(--t1)}
.ob-time-sub{font-size:11px;color:var(--t3);margin-top:2px}
.ob-step{animation:obSlide .35s ease both}

.emoji-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.emoji-opt{font-size:26px;width:52px;height:52px;display:grid;place-items:center;border-radius:var(--ios-radii);cursor:pointer;border:0.5px solid transparent;transition:all .15s;background:var(--card);box-shadow:var(--card-shadow)}
.emoji-opt:active{transform:scale(.92)}
.emoji-opt.sel{border-color:var(--teal);background:var(--sel);box-shadow:0 2px 10px rgba(0,122,255,.12)}

.goal-chip{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--card);border-radius:var(--rxl);cursor:pointer;border:0.5px solid transparent;transition:all .15s;box-shadow:var(--card-shadow)}
.goal-chip:active{transform:scale(.98)}
.goal-chip.sel{border-color:var(--teal);background:var(--sel)}
.goal-chip-icon{font-size:22px;width:36px;text-align:center;flex-shrink:0}
.goal-chip-label{font-size:15px;font-weight:600;color:var(--t1)}
.goal-chip-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--sep);display:grid;place-items:center;flex-shrink:0;margin-left:auto;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
.goal-chip-check.on{background:var(--teal);border-color:var(--teal)}

.theme-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.theme-swatch{width:100%;aspect-ratio:1;border-radius:var(--rxl);cursor:pointer;display:grid;place-items:center;border:3px solid transparent;transition:all .2s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden}
.theme-swatch:active{transform:scale(.92)}
.theme-swatch.sel{border-color:var(--t1);transform:scale(1.04)}
.theme-swatch-check{font-size:18px;color:white;filter:drop-shadow(0 1px 3px rgba(0,0,0,.3))}

.trans-screen{position:fixed;inset:0;background:linear-gradient(160deg,#0b1a30 0%,#0d2b5e 30%,#0a1f4a 60%,#061233 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;overflow:hidden;transition:opacity .5s cubic-bezier(.4,0,.2,1)}
.trans-screen::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 35%,rgba(0,122,255,.08) 0%,transparent 70%);pointer-events:none}
.trans-screen::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 30%,rgba(0,0,0,.25) 100%);pointer-events:none}
.trans-screen.fade-out{opacity:0;pointer-events:none}

.trans-aurora{position:absolute;border-radius:50%;pointer-events:none;filter:blur(60px)}
@keyframes aurora1{0%{transform:translate(0,0) scale(1)}50%{transform:translate(8%,-6%) scale(1.12)}100%{transform:translate(-4%,8%) scale(.95)}}
@keyframes aurora2{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-10%,5%) scale(1.08)}100%{transform:translate(6%,-4%) scale(1.15)}}
@keyframes aurora3{0%{transform:translate(0,0) scale(1)}50%{transform:translate(5%,8%) scale(.92)}100%{transform:translate(-7%,-5%) scale(1.06)}}

.trans-particle{position:absolute;border-radius:50%;background:white;pointer-events:none}
@keyframes particleRise{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-100vh) translateX(20px);opacity:0}}

.trans-beam{position:absolute;top:-10%;width:2px;height:120%;pointer-events:none;background:linear-gradient(180deg,transparent 0%,rgba(255,255,255,.03) 30%,rgba(255,255,255,.06) 50%,rgba(255,255,255,.03) 70%,transparent 100%);animation:beamPulse 4s ease-in-out infinite}
@keyframes beamPulse{0%,100%{opacity:.4}50%{opacity:1}}

.trans-logo-wrap{position:relative;margin-bottom:28px;animation:logoPop 1s cubic-bezier(.175,.885,.32,1.275) both}
.trans-logo-glow{position:absolute;inset:-40px;border-radius:50%;background:radial-gradient(circle,rgba(0,122,255,.2) 0%,rgba(0,122,255,.06) 40%,transparent 70%);animation:logoBreathe 3s ease-in-out infinite;z-index:0}
@keyframes logoBreathe{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.15);opacity:1}}
.trans-logo{width:108px;height:108px;background:rgba(255,255,255,.1);border-radius:32px;display:grid;place-items:center;backdrop-filter:blur(24px) saturate(1.6);-webkit-backdrop-filter:blur(24px) saturate(1.6);border:1px solid rgba(255,255,255,.12);box-shadow:0 0 0 1px rgba(255,255,255,.06) inset,0 8px 40px rgba(0,0,0,.15),0 2px 12px rgba(0,0,0,.1),0 0 80px rgba(0,122,255,.1),0 0 120px rgba(0,122,255,.05);position:relative;z-index:1}
.trans-ring{position:absolute;border-radius:50%;pointer-events:none;z-index:0}
.trans-ring-outer{inset:-6px;border:1.5px solid transparent;border-top-color:rgba(255,255,255,.18);border-right-color:rgba(255,255,255,.08);animation:ringRotate 4s linear infinite}
.trans-ring-inner{inset:-2px;border:1px solid transparent;border-bottom-color:rgba(255,255,255,.12);border-left-color:rgba(255,255,255,.06);animation:ringRotate 6s linear infinite reverse}
@keyframes ringRotate{to{transform:rotate(360deg)}}
.trans-logo svg{width:52px;height:52px}

.trans-title{display:flex;gap:2px;margin-bottom:10px}
.trans-title-letter{font-size:36px;font-weight:700;color:white;letter-spacing:-.5px;text-shadow:0 0 20px rgba(0,122,255,.3),0 1px 3px rgba(0,0,0,.15);display:inline-block;animation:letterIn .6s cubic-bezier(.22,1,.36,1) both}
.trans-title-letter:nth-child(1){animation-delay:.15s}
.trans-title-letter:nth-child(2){animation-delay:.22s}
.trans-title-letter:nth-child(3){animation-delay:.29s}
.trans-title-letter:nth-child(4){animation-delay:.36s}
.trans-title-letter:nth-child(5){animation-delay:.43s}
.trans-title-letter:nth-child(6){animation-delay:.50s}
@keyframes letterIn{from{transform:translateY(20px) scale(.8);opacity:0;filter:blur(4px)}to{transform:translateY(0) scale(1);opacity:1;filter:blur(0)}}

.trans-msg{font-size:15px;color:rgba(255,255,255,.55);margin-bottom:48px;animation:fadeUp .7s .6s cubic-bezier(.22,1,.36,1) both;text-align:center;padding:0 32px;line-height:1.5;font-weight:400;letter-spacing:.2px}
.trans-bar-wrap{width:140px;height:3px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;animation:fadeUp .6s .75s cubic-bezier(.22,1,.36,1) both;position:relative}
.trans-bar-wrap::after{content:'';position:absolute;inset:-2px;border-radius:99px;background:radial-gradient(ellipse,rgba(0,122,255,.2),transparent);pointer-events:none;filter:blur(4px)}
.trans-bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,rgba(255,255,255,.08),rgba(255,255,255,.5),rgba(0,180,255,.4),rgba(255,255,255,.5),rgba(255,255,255,.08));background-size:300% 100%;animation:transShimmer 2s ease-in-out infinite}
@keyframes transShimmer{0%{background-position:300% 0}100%{background-position:-300% 0}}
.trans-status{font-size:12px;color:rgba(255,255,255,.35);font-weight:500;letter-spacing:.3px;text-transform:uppercase;margin-top:18px;animation:fadeUp .5s .9s cubic-bezier(.22,1,.36,1) both;position:relative;height:18px}
.trans-status-inner{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:opacity .4s ease,transform .4s ease}
.trans-status-inner.out{opacity:0;transform:translateY(6px)}
.trans-content{animation:fadeUp .6s cubic-bezier(.22,1,.36,1) both}
@keyframes logoPop{from{transform:scale(.2) rotate(-12deg);opacity:0;filter:blur(8px)}to{transform:scale(1) rotate(0deg);opacity:1;filter:blur(0)}}
@keyframes fadeUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes obSlide{from{transform:translateX(36px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes bgPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.6}}
@keyframes emojiPop{from{transform:scale(.3) rotate(-15deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes overlayFadeIn{from{opacity:0}to{opacity:1}}
@keyframes overlayFadeOut{from{opacity:1}to{opacity:0}}
@keyframes slideDown{from{transform:translateY(0);opacity:1}to{transform:translateY(100%);opacity:0}}
@keyframes fadeUpCard{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
.skeleton{background:linear-gradient(90deg,var(--sep) 25%,var(--hover) 50%,var(--sep) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}
.skel-hero{margin:16px 20px 14px;background:var(--card);border-radius:var(--rxl);padding:26px 24px 24px;box-shadow:var(--card-shadow);border:var(--card-border)}
.skel-line{border-radius:8px;background:var(--sep)}
.skel-pulse{animation:skelPulse 1.8s ease-in-out infinite}
@keyframes skelPulse{0%,100%{opacity:.5}50%{opacity:1}}
.content-reveal{animation:contentReveal .45s cubic-bezier(.22,1,.36,1) both}
@keyframes contentReveal{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.tab-enter{animation:tabFadeIn .25s ease both}
@keyframes tabFadeIn{from{opacity:0}to{opacity:1}}

@media(max-width:374px){.auth-card{padding:24px 16px!important}.auth-input,.sheet-input{padding:12px 12px!important;font-size:16px!important}.auth-title{font-size:22px!important}}
@media(min-width:430px){.auth-screen{padding:40px 24px}.onboard-screen{max-width:400px;margin:0 auto}}
@media(min-width:768px){
  .scroll,.auth-screen,.onboard-screen{max-width:420px;margin:0 auto}
  .tabbar{max-width:420px;left:50%;transform:translateX(-50%);border-radius:16px 16px 0 0}
}
`;

export function GIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function Chevron() { return <span className="chevron">›</span>; }

export function fmtTime(iso) { return new Date(iso).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); }
export function fmtDate(iso) { return new Date(iso).toLocaleDateString([],{month:"short",day:"numeric"}); }
export function fmtDateLong(iso) { return new Date(iso).toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"}); }

export function AuthLogo() {
  return (
    <div className="auth-logo">
      <div className="auth-mark">
        <svg viewBox="0 0 48 48" fill="white">
          <rect x="17" y="4" width="14" height="40" rx="5" fill="white"/>
          <rect x="4" y="17" width="40" height="14" rx="5" fill="white"/>
        </svg>
      </div>
      <span className="auth-app-name">Adhera</span>
    </div>
  );
}

export const RE_HAS_LOWER = /[a-z]/;
export const RE_HAS_UPPER = /[A-Z]/;
export const RE_HAS_DIGIT = /\d/;
export const RE_HAS_SYMBOL = /[^a-zA-Z0-9]/;
export const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const RE_HTML_TAG = /<[^>]*>/g;
export const RE_DIGITS = /[^0-9]/g;
