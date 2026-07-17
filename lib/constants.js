export const CSS = `
:root{
  --bg:#F2F2F7;--card:#FFFFFF;--teal:#007AFF;--teal2:#0055CC;--red:#FF3B30;--orange:#FF9500;--purple:#AF52DE;
  --sep:#E5E5EA;--t1:#1C1C1E;--t2:#3A3A3C;--t3:#8E8E93;--t4:#C7C7CC;
  --safe-bottom:env(safe-area-inset-bottom,0px);--safe-top:env(safe-area-inset-top,0px);
  --rr:10px;--rl:14px;--rxl:20px;
  --bar:rgba(255,255,255,0.72);--hover:#F2F2F7;--sel:rgba(0,122,255,0.10);
  --input:#F2F2F7;--card-shadow:0 0 0 0.5px rgba(0,0,0,.04),0 2px 8px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.06);--card-border:none;--card-hover:0 4px 16px rgba(0,0,0,.08);
  --ib1:#E8F0FE;--ib2:#E8F0FE;--ib3:#FFF4E5;--ib4:#F5E8FF;--ib5:#E0F7F4;--ib6:#FFEBEE;
}
html,body{height:100%;background:var(--bg)}
body{font-family:var(--app-font-sans),'Helvetica Neue',sans-serif;color:var(--t1);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overscroll-behavior:none;-webkit-touch-callout:none}
::selection{background:var(--teal);color:white}

.navbar{position:sticky;top:0;z-index:100;background:var(--bar);backdrop-filter:blur(40px) saturate(1.5);-webkit-backdrop-filter:blur(40px) saturate(1.5);border-bottom:0.5px solid rgba(0,0,0,.08);padding:calc(var(--safe-top) + 8px) 16px 6px;display:flex;align-items:flex-end;justify-content:space-between;min-height:52px}
.nav-title{font-size:28px;font-weight:700;letter-spacing:.3px;color:var(--t1);line-height:1.1}
.nav-action{background:none;border:none;color:var(--teal);font-size:17px;font-weight:600;cursor:pointer;font-family:inherit;padding:4px 2px;transition:opacity .15s;letter-spacing:-.2px}
.nav-action:active{opacity:.5}
.nav-large{font-size:28px;font-weight:700;letter-spacing:.3px;color:var(--t1);padding:16px 16px 8px;line-height:1.1}

.tabbar{position:fixed;bottom:0;left:0;right:0;height:calc(50px + var(--safe-bottom));background:var(--bar);backdrop-filter:blur(40px) saturate(1.5);-webkit-backdrop-filter:blur(40px) saturate(1.5);border-top:0.5px solid rgba(0,0,0,.08);display:flex;align-items:flex-start;padding-top:4px;z-index:200}
.tbi{flex:1;display:flex;flex-direction:column;align-items:center;gap:1px;cursor:pointer;padding:2px 4px 0;position:relative;transition:transform .2s cubic-bezier(.34,1.56,.64,1)}
.tbi:active{transform:scale(.88)}
.tbi svg{width:25px;height:25px;color:var(--t4);transition:color .2s}
.tbi span{font-size:10px;font-weight:500;color:var(--t4);transition:color .15s;letter-spacing:.1px}
.tbi.on svg{color:var(--teal)}
.tbi.on svg path,.tbi.on svg circle,.tbi.on svg rect{fill:var(--teal)}
.tbi.on span{color:var(--teal);font-weight:600}

.scroll{overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding-bottom:calc(80px + var(--safe-bottom));padding-top:4px;overscroll-behavior:contain}

.section{padding:0 16px;margin-bottom:8px}
.section-header{font-size:13px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;padding:18px 4px 6px}
.list{background:var(--card);border-radius:var(--rxl);overflow:hidden;box-shadow:var(--card-shadow)}
.row{display:flex;align-items:center;padding:13px 16px;min-height:46px;gap:12px;cursor:pointer;transition:background .12s ease}
.row::after{content:'';position:absolute;left:16px;right:0;bottom:0;height:0.5px;background:var(--sep);pointer-events:none}
.row:last-child::after{display:none}
.row:active{background:var(--hover)}
.row-icon{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;flex-shrink:0;font-size:15px}
.row-body{flex:1;min-width:0}
.row-title{font-size:16px;color:var(--t1);font-weight:400;letter-spacing:-.1px}
.row-sub{font-size:13px;color:var(--t3);margin-top:1px;line-height:1.3}
.chevron{color:var(--t4);font-size:18px;font-weight:400;font-family:system-ui}

.hero-card{margin:12px 16px 8px;background:var(--card);border-radius:var(--rxl);padding:22px 20px 20px;box-shadow:var(--card-shadow);position:relative}
.hero-label{font-size:14px;font-weight:500;color:var(--t3);margin-bottom:4px;letter-spacing:.1px}
.hero-big{font-size:48px;font-weight:700;line-height:1;letter-spacing:-1.5px;color:var(--t1)}
.hero-sub{font-size:14px;color:var(--t3);margin-top:2px}
.hero-row{display:flex;gap:8px;margin-top:18px}
.hero-stat{flex:1;background:var(--hover);border-radius:12px;padding:12px 8px;text-align:center}
.hero-stat-val{font-size:20px;font-weight:700;letter-spacing:-.2px;color:var(--t1)}
.hero-stat-lbl{font-size:11px;color:var(--t3);margin-top:2px;font-weight:500}

.ring-wrap{position:relative;width:80px;height:80px;flex-shrink:0}
.ring-wrap svg{transform:rotate(-90deg)}
.ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring-pct{font-size:18px;font-weight:700;letter-spacing:-.3px;color:var(--teal)}
.ring-of{font-size:9px;color:var(--t3);font-weight:500;text-transform:uppercase;letter-spacing:.3px}

.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;letter-spacing:.1px}
.badge-green{background:var(--ib1);color:var(--teal2)}
.badge-gray{background:var(--hover);color:var(--t2)}
.badge-blue{background:var(--ib2);color:var(--teal)}

.btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:14px 20px;border-radius:14px;font-size:16px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .15s cubic-bezier(.34,1.56,.64,1);position:relative}
.btn:active{transform:scale(.96)}
.btn-primary{background:var(--teal);color:white;width:100%}
.btn-ghost{background:var(--card);color:var(--teal);width:100%;border:1px solid var(--sep)}
.btn-ghost:active{background:var(--hover)}
.btn-red{background:var(--red);color:white}
.btn-disabled{opacity:.4;pointer-events:none}
.btn-sm{padding:6px 12px;font-size:13px;border-radius:9px;font-weight:600}

.chips{display:flex;gap:8px;margin:0 16px 8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{flex-shrink:0;background:var(--card);border-radius:14px;padding:14px 16px;min-width:100px;box-shadow:var(--card-shadow);transition:transform .2s,box-shadow .2s}
.chip:active{transform:scale(.96)}
.chip-val{font-size:22px;font-weight:700;letter-spacing:-.3px;color:var(--t1)}
.chip-lbl{font-size:11px;color:var(--t3);margin-top:2px;font-weight:500}

.prog{height:5px;background:var(--hover);border-radius:99px;overflow:hidden;margin-top:8px}
.prog-fill{height:100%;border-radius:99px;transition:width .5s cubic-bezier(.34,1.56,.64,1)}

.empty-state{text-align:center;padding:48px 24px;color:var(--t3)}
.empty-state-icon{font-size:48px;margin-bottom:12px;display:block}
.empty-state-title{font-size:17px;font-weight:600;color:var(--t2);margin-bottom:6px}
.empty-state-sub{font-size:14px;margin-bottom:20px;line-height:1.5}

.loading-screen{min-height:100vh;display:grid;place-items:center;font-size:36px}

.tag{display:inline-flex;align-items:center;gap:4px;background:var(--hover);border-radius:7px;padding:3px 8px;font-size:12px;color:var(--t2);font-weight:500}

.streak-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px 2px 6px;border-radius:99px;font-size:11px;font-weight:600}
.streak-badge.fire{background:rgba(255,149,0,.12);color:#FF9500}
.streak-badge.ice{background:rgba(0,122,255,.10);color:#007AFF}
.streak-badge.gold{background:rgba(255,204,0,.12);color:#FFCC00}

.profile-header{background:var(--card);margin:0 16px 8px;border-radius:var(--rxl);padding:24px 16px 20px;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:var(--card-shadow)}
.profile-avatar{width:86px;height:86px;border-radius:50%;background:var(--hover);display:grid;place-items:center;font-size:40px;box-shadow:0 2px 12px rgba(0,0,0,.08);border:3px solid var(--card);transition:transform .2s}
.profile-avatar:active{transform:scale(.95)}
.profile-name{font-size:22px;font-weight:700;color:var(--t1);letter-spacing:-.2px}

.upgrade-card{background:linear-gradient(145deg,#007AFF 0%,#0055CC 50%,#003399 100%);border-radius:var(--rxl);padding:22px 20px;color:white;position:relative;overflow:hidden}
.upgrade-title{font-size:20px;font-weight:700;margin-bottom:4px;letter-spacing:-.2px}
.upgrade-sub{font-size:13px;opacity:.85;margin-bottom:14px;line-height:1.5}
.upgrade-features{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.upgrade-feature{font-size:13px;opacity:.9;display:flex;align-items:center;gap:5px}
.upgrade-btn{background:white;color:#007AFF;border:none;border-radius:12px;padding:13px 20px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;transition:transform .15s}
.upgrade-btn:active{transform:scale(.97)}

.highlight-card{background:linear-gradient(135deg,var(--teal),var(--teal2));border-radius:var(--rxl);padding:18px 20px;color:white;position:relative}
.highlight-title{font-size:17px;font-weight:700;margin-bottom:3px}
.highlight-sub{font-size:13px;opacity:.85}

.notif-banner{margin:0 16px 8px;background:linear-gradient(135deg,#FF9500,#FF6B00);border-radius:14px;padding:13px 16px;display:flex;align-items:center;gap:10px;cursor:pointer}
.notif-banner-text{flex:1;font-size:14px;font-weight:500;color:white;line-height:1.3}
.notif-banner-btn{background:white;color:#994D00;border:none;border-radius:9px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:transform .15s}
.notif-banner-btn:active{transform:scale(.95)}

.sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:300;display:flex;align-items:flex-end;backdrop-filter:blur(6px)}
.sheet{background:var(--card);border-radius:20px 20px 0 0;padding:0 0 calc(12px + var(--safe-bottom));width:100%;max-height:85vh;overflow-y:auto;animation:slideUp .4s cubic-bezier(.32,.72,0,1);will-change:transform}
.sheet-handle{width:36px;height:4px;background:var(--sep);border-radius:99px;margin:10px auto 14px}
.sheet-title{font-size:17px;font-weight:600;text-align:center;padding:0 16px 14px;border-bottom:.5px solid var(--sep);margin-bottom:6px}
.sheet-section{padding:6px 16px}
.sheet-label{color:var(--t3);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;font-size:11px}
select,.sheet-input,.input-field{-webkit-appearance:none;appearance:none}
.sheet-input{width:100%;padding:12px 14px;border:1.5px solid var(--sep);border-radius:12px;font-size:16px;color:var(--t1);font-family:inherit;background:var(--input);outline:none;transition:all .15s}
.sheet-input:focus{border-color:var(--teal);box-shadow:0 0 0 3px var(--sel);background:var(--card)}
.sheet-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sheet-actions{padding:14px 16px 0;display:flex;flex-direction:column;gap:8px}
.sheet-seg{display:flex;background:var(--hover);border-radius:9px;padding:2px}
.sheet-seg-btn{flex:1;padding:7px;border:none;background:none;border-radius:7px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;color:var(--t2);transition:all .15s}
.sheet-seg-btn.on{background:var(--card);color:var(--t1);box-shadow:0 1px 4px rgba(0,0,0,.05)}

.input-group{display:flex;flex-direction:column;gap:14px;margin-bottom:20px}
.input-field{padding:14px 16px;border:1.5px solid var(--sep);border-radius:14px;font-size:16px;color:var(--t1);font-family:inherit;background:var(--input);outline:none;transition:all .15s;box-shadow:0 1px 2px rgba(0,0,0,.02) inset}
.input-field:focus{border-color:var(--teal);box-shadow:0 0 0 3px var(--sel);background:var(--card)}
.input-field::placeholder{color:var(--t4)}

.auth-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:var(--bg)}
.auth-card{background:var(--card);border-radius:24px;padding:32px 24px;width:100%;max-width:380px;box-shadow:0 4px 24px rgba(0,0,0,.06);animation:slideUp .45s cubic-bezier(.22,1,.36,1) both}
.auth-logo{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.auth-mark{width:42px;height:42px;background:var(--teal);border-radius:10px;display:grid;place-items:center;box-shadow:0 4px 10px rgba(0,122,255,.25)}
.auth-mark svg{fill:white;width:22px;height:22px}
.auth-app-name{font-size:20px;font-weight:700;color:var(--t1);letter-spacing:-.2px}
.auth-title{font-size:26px;font-weight:700;margin-bottom:4px;letter-spacing:-.4px}
.auth-sub{font-size:14px;color:var(--t3);margin-bottom:22px;line-height:1.4}
.oauth-stack{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.oauth-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 18px;border:1.5px solid var(--sep);border-radius:14px;background:var(--card);cursor:pointer;font-size:15px;font-weight:500;color:var(--t1);font-family:inherit;transition:all .12s;width:100%}
.oauth-btn:active{background:var(--hover);transform:scale(.98)}
.oauth-btn svg{width:18px;height:18px;flex-shrink:0}
.divider{display:flex;align-items:center;gap:12px;margin-bottom:16px;color:var(--t3);font-size:13px;font-weight:500}
.divider::before,.divider::after{content:'';flex:1;height:0.5px;background:var(--sep)}
.pw-wrap{border-radius:14px;transition:all .15s}
.pw-wrap:focus-within{border-color:var(--teal)!important;box-shadow:0 0 0 3px var(--sel);background:var(--card)}
input[type=password]::-ms-reveal{display:none}
input[type=password]::-webkit-credentials-auto-fill-button{display:none!important;visibility:hidden;pointer-events:none;width:0;height:0}
.auth-switch{text-align:center;margin-top:18px;font-size:14px;color:var(--t3)}
.auth-switch button{background:none;border:none;color:var(--teal);font-weight:600;cursor:pointer;font-size:14px;font-family:inherit;transition:opacity .12s}
.auth-switch button:active{opacity:.6}
.err-msg{background:var(--ib6);border:1px solid rgba(255,59,48,.12);color:var(--red);padding:12px 16px;border-radius:12px;font-size:13px;margin-bottom:16px;line-height:1.4}
.ok-msg{background:var(--ib2);border:1px solid rgba(0,122,255,.12);color:var(--teal);padding:14px 16px;border-radius:12px;font-size:13px;margin-bottom:14px;line-height:1.4}
.ok-msg strong{display:block;font-size:14px;margin-bottom:2px}

.onboard-screen{min-height:100vh;background:var(--bg);display:flex;flex-direction:column}
.ob-progress{display:flex;gap:5px;padding:16px 20px 0}
.ob-dot{flex:1;height:3px;border-radius:99px;background:var(--sep);transition:all .4s ease}
.ob-dot.done{background:var(--teal)}
.ob-body{flex:1;padding:24px 20px;display:flex;flex-direction:column}
.ob-emoji{font-size:56px;margin-bottom:14px;line-height:1}
.ob-title{font-size:26px;font-weight:700;margin-bottom:6px;line-height:1.2;letter-spacing:-.4px}
.ob-sub{font-size:15px;color:var(--t3);margin-bottom:28px;line-height:1.5}
.ob-options{display:flex;flex-direction:column;gap:8px;margin-bottom:auto}
.ob-option{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--card);border-radius:14px;cursor:pointer;border:1.5px solid transparent;transition:all .15s;box-shadow:var(--card-shadow)}
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
.ob-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ob-time-card{background:var(--card);border-radius:14px;padding:14px;cursor:pointer;border:1.5px solid transparent;transition:all .15s;text-align:center;box-shadow:var(--card-shadow)}
.ob-time-card:active{transform:scale(.97)}
.ob-time-card.sel{border-color:var(--teal);background:var(--sel);box-shadow:0 2px 12px rgba(0,122,255,.12)}
.ob-time-emoji{font-size:28px;margin-bottom:5px}
.ob-time-label{font-size:14px;font-weight:600;color:var(--t1)}
.ob-time-sub{font-size:11px;color:var(--t3);margin-top:2px}
.ob-step{animation:obSlide .35s ease both}

.emoji-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.emoji-opt{font-size:26px;width:52px;height:52px;display:grid;place-items:center;border-radius:12px;cursor:pointer;border:1.5px solid transparent;transition:all .15s;background:var(--card);box-shadow:var(--card-shadow)}
.emoji-opt:active{transform:scale(.92)}
.emoji-opt.sel{border-color:var(--teal);background:var(--sel);box-shadow:0 2px 10px rgba(0,122,255,.12)}

.goal-chip{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--card);border-radius:14px;cursor:pointer;border:1.5px solid transparent;transition:all .15s;box-shadow:var(--card-shadow)}
.goal-chip:active{transform:scale(.98)}
.goal-chip.sel{border-color:var(--teal);background:var(--sel)}
.goal-chip-icon{font-size:22px;width:36px;text-align:center;flex-shrink:0}
.goal-chip-label{font-size:14px;font-weight:600;color:var(--t1)}
.goal-chip-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--sep);display:grid;place-items:center;flex-shrink:0;margin-left:auto;transition:all .2s cubic-bezier(.34,1.56,.64,1)}
.goal-chip-check.on{background:var(--teal);border-color:var(--teal)}

.theme-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.theme-swatch{width:100%;aspect-ratio:1;border-radius:14px;cursor:pointer;display:grid;place-items:center;border:3px solid transparent;transition:all .2s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden}
.theme-swatch:active{transform:scale(.92)}
.theme-swatch.sel{border-color:var(--t1);transform:scale(1.04)}
.theme-swatch-check{font-size:18px;color:white;filter:drop-shadow(0 1px 3px rgba(0,0,0,.3))}

.trans-screen{position:fixed;inset:0;background:linear-gradient(160deg,#007AFF 0%,#0055CC 60%,#003399 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;overflow:hidden}
.trans-bg-orb{position:absolute;border-radius:50%;pointer-events:none;animation:orbFloat 8s ease-in-out infinite alternate}
@keyframes orbFloat{from{transform:translate(0,0) scale(1)}to{transform:translate(3%,2%) scale(1.05)}}
.trans-screen.fade-out{opacity:0;pointer-events:none}
.trans-logo{width:80px;height:80px;background:rgba(255,255,255,.18);border-radius:24px;display:grid;place-items:center;margin-bottom:16px;backdrop-filter:blur(16px);animation:logoPop .7s cubic-bezier(.175,.885,.32,1.275) both;border:1px solid rgba(255,255,255,.12);box-shadow:0 8px 32px rgba(0,0,0,.1)}
.trans-logo svg{fill:white;width:40px;height:40px}
.trans-title{font-size:32px;font-weight:800;color:white;animation:fadeUp .6s .1s ease both;letter-spacing:-.5px}
.trans-msg{font-size:16px;color:rgba(255,255,255,.8);margin-bottom:40px;animation:fadeUp .6s .25s ease both;text-align:center;padding:0 32px;line-height:1.5;font-weight:400}
.trans-dots{display:flex;gap:6px;animation:fadeUp .6s .35s ease both}
.trans-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.4)}
.trans-dot:nth-child(1){animation:pulse 1.4s .0s infinite}
.trans-dot:nth-child(2){animation:pulse 1.4s .2s infinite}
.trans-dot:nth-child(3){animation:pulse 1.4s .4s infinite}
@keyframes logoPop{from{transform:scale(.3) rotate(-8deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes pulse{0%,80%,100%{background:rgba(255,255,255,.3);transform:scale(.85)}40%{background:white;transform:scale(1.15)}}
@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes obSlide{from{transform:translateX(36px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes bgPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.6}}
@keyframes emojiPop{from{transform:scale(.3) rotate(-15deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.skeleton{background:linear-gradient(90deg,var(--sep) 25%,var(--hover) 50%,var(--sep) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}

@media(min-width:430px){.auth-screen{padding:40px 24px}.onboard-screen{max-width:400px;margin:0 auto}}
@media(min-width:768px){
  .scroll,.auth-screen,.onboard-screen{max-width:420px;margin:0 auto}
  .tabbar{max-width:420px;left:50%;transform:translateX(-50%);border-radius:16px 16px 0 0}
}
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

export function Chevron() { return <span className="chevron">›</span>; }

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

export const RE_HAS_LOWER = /[a-z]/;
export const RE_HAS_UPPER = /[A-Z]/;
export const RE_HAS_DIGIT = /\d/;
export const RE_HAS_SYMBOL = /[^a-zA-Z0-9]/;
export const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const RE_HTML_TAG = /<[^>]*>/g;
export const RE_DIGITS = /[^0-9]/g;
