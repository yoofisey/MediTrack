export const CSS = `
:root{
  --bg:#F5F6FA;--card:#FFFFFF;--teal:#007AFF;--teal2:#0055CC;--red:#FF3B30;--orange:#FF9500;--purple:#AF52DE;--green:#34C759;--green2:#248A3D;
  --sep:rgba(60,60,67,.07);--t1:#1C1C1E;--t2:#3A3A3C;--t3:#8E8E93;--t4:#C7C7CC;
  --safe-bottom:env(safe-area-inset-bottom,0px);--safe-top:env(safe-area-inset-top,0px);
  --rr:14px;--rl:18px;--rxl:24px;
  --bar:rgba(252,252,253,0.86);--hover:#F2F3F7;--sel:rgba(0,122,255,0.08);
  --input:#F3F4F8;
  --card-shadow:0 0 0 0.5px rgba(0,0,0,.015),0 2px 6px rgba(15,30,60,.03),0 8px 24px rgba(15,30,60,.045);
  --card-border:0.5px solid rgba(0,0,0,.035);
  --card-hover:0 0 0 0.5px rgba(0,0,0,.03),0 4px 12px rgba(15,30,60,.05),0 12px 28px rgba(15,30,60,.07);
  --ib1:#E8F4FD;--ib2:#E8F4FD;--ib3:#FFF4E5;--ib4:#F5E8FF;--ib5:#E0F7F4;--ib6:#FFEBEE;
  --glass:rgba(255,255,255,0.78);--glass-border:rgba(255,255,255,0.65);--glass-hi:rgba(255,255,255,0.28);--glass-sh:0 8px 28px rgba(15,30,60,.06),0 0 0 0.5px rgba(0,0,0,.02) inset,0 1px 0 rgba(255,255,255,.55) inset;
  --section-gap:26px;
  --ios-radii:14px;
}
*,*::before,*::after{box-sizing:border-box}
html,body{min-height:100%;background:var(--bg);overflow-x:clip;max-width:100vw}
body{font-family:var(--app-font-sans,'Plus Jakarta Sans'),-apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:var(--t1);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overscroll-behavior:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;text-rendering:optimizeLegibility}
::selection{background:rgba(0,122,255,.18);color:var(--t1)}

.navbar{position:sticky;top:0;z-index:100;background:var(--bar);backdrop-filter:blur(28px) saturate(1.7);-webkit-backdrop-filter:blur(28px) saturate(1.7);border-bottom:0.5px solid var(--sep);padding:calc(var(--safe-top) + 10px) 20px 10px;display:flex;align-items:flex-end;justify-content:space-between;min-height:56px}
.nav-title{font-size:28px;font-weight:800;letter-spacing:-.4px;color:var(--t1);line-height:1.1}
.nav-action{background:none;border:none;color:var(--teal);font-size:16px;font-weight:600;cursor:pointer;font-family:inherit;padding:6px 4px;border-radius:10px;transition:opacity .15s,background .15s;letter-spacing:-.1px}
.nav-action:active{opacity:.6;background:var(--sel)}
.nav-large{font-size:34px;font-weight:800;letter-spacing:-.8px;color:var(--t1);padding:22px 20px 8px;line-height:1.05}

.tabbar{position:fixed;bottom:0;left:0;right:0;height:calc(56px + var(--safe-bottom));background:var(--bar);backdrop-filter:blur(28px) saturate(1.7);-webkit-backdrop-filter:blur(28px) saturate(1.7);border-top:0.5px solid var(--sep);display:flex;align-items:flex-start;padding-top:6px;z-index:200}
.tbi{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:4px 4px 0;position:relative;transition:transform .18s cubic-bezier(.34,1.56,.64,1)}
.tbi:active{transform:scale(.88)}
.tbi svg{width:24px;height:24px;color:var(--t4);transition:color .2s ease,transform .2s ease}
.tbi span{font-size:10px;font-weight:600;color:var(--t4);transition:color .2s ease;letter-spacing:.15px}
.tbi.on svg{color:var(--teal);transform:translateY(-1px)}
.tbi.on svg path,.tbi.on svg circle,.tbi.on svg rect{fill:var(--teal)}
.tbi.on span{color:var(--teal);font-weight:700}

.scroll{overflow-x:clip;padding-bottom:calc(64px + var(--safe-bottom));padding-top:calc(4px + var(--safe-top));max-width:100vw}

.section{padding:0 20px;margin-bottom:var(--section-gap)}
.section-header{font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;padding:26px 4px 10px}
.list{background:var(--card);border-radius:var(--rxl);overflow:hidden;box-shadow:var(--card-shadow);border:var(--card-border);position:relative;transition:box-shadow .25s ease,transform .2s ease}
.row{display:flex;align-items:center;padding:15px 20px;min-height:52px;gap:14px;cursor:pointer;transition:background .12s ease;position:relative}
.row::after{content:'';position:absolute;left:68px;right:0;bottom:0;height:0.5px;background:var(--sep);pointer-events:none}
.row:last-child::after{display:none}
.row:active{background:var(--hover)}
.row-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;font-size:16px}
.row-body{flex:1;min-width:0}
.row-title{font-size:16px;color:var(--t1);font-weight:600;letter-spacing:-.15px}
.row-sub{font-size:13px;color:var(--t3);margin-top:2px;line-height:1.4}
.row-value{font-size:14px;font-weight:600;color:var(--t1);flex-shrink:0}
.chevron{color:var(--t4);font-size:18px;font-weight:500}

.card{background:var(--card);border-radius:var(--rl);box-shadow:var(--card-shadow);border:var(--card-border);padding:16px}
.card:active{box-shadow:var(--card-hover)}

.seg{display:flex;background:var(--hover);border-radius:10px;padding:2px}
.seg-btn{flex:1;padding:8px;border:none;background:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;color:var(--t2);transition:all .15s}
.seg-btn.on{background:var(--card);color:var(--t1);box-shadow:0 1px 4px rgba(0,0,0,.06);font-weight:600}

.insight-card{background:var(--card);border-radius:var(--rl);padding:14px 16px;box-shadow:var(--card-shadow);border:var(--card-border);cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}
.insight-card:active{transform:scale(.985);box-shadow:var(--card-hover)}
.insight-head{display:flex;align-items:center;justify-content:space-between;gap:8px}

.hero-card{margin:18px 20px 16px;background:linear-gradient(180deg,rgba(255,255,255,1) 0%,rgba(252,253,255,1) 100%);border-radius:var(--rxl);padding:28px 24px 26px;box-shadow:var(--card-shadow);border:var(--card-border);position:relative;transition:transform .18s ease,box-shadow .18s ease}
.hero-card:active{transform:scale(.992)}
.hero-label{font-size:13px;font-weight:700;color:var(--t3);margin-bottom:8px;letter-spacing:.6px;text-transform:uppercase}
.hero-big{font-size:54px;font-weight:800;line-height:1;letter-spacing:-2.5px;color:var(--t1)}
.hero-sub{font-size:14px;color:var(--t3);margin-top:6px;font-weight:500}
.hero-row{display:flex;gap:10px;margin-top:24px}
.hero-stat{flex:1;background:var(--hover);border-radius:16px;padding:14px 8px;text-align:center;border:0.5px solid rgba(0,0,0,.02)}
.hero-stat-val{font-size:20px;font-weight:800;letter-spacing:-.4px;color:var(--t1)}
.hero-stat-lbl{font-size:11px;color:var(--t3);margin-top:4px;font-weight:600}

.ring-wrap{position:relative;width:80px;height:80px;flex-shrink:0}
.ring-wrap svg{transform:rotate(-90deg)}
.ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring-pct{font-size:18px;font-weight:700;letter-spacing:-.3px;color:var(--teal)}
.ring-of{font-size:9px;color:var(--t3);font-weight:500;text-transform:uppercase;letter-spacing:.3px}

.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;letter-spacing:.1px;transition:all .15s ease}
.badge-green{background:rgba(0,122,255,.08);color:var(--teal2)}
.badge-gray{background:var(--sep);color:var(--t2)}
.badge-blue{background:rgba(0,122,255,.08);color:var(--teal)}

.btn{display:flex;align-items:center;justify-content:center;gap:7px;padding:15px 22px;border-radius:var(--ios-radii);font-size:16px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:all .18s cubic-bezier(.25,.1,.25,1);position:relative;letter-spacing:-.1px}
.btn:active{transform:scale(.98)}
.btn-primary{background:linear-gradient(135deg,#007AFF 0%,#0062E0 100%);color:white;width:100%;box-shadow:0 6px 18px rgba(0,122,255,.22),inset 0 1px 0 rgba(255,255,255,.14)}
.btn-primary:active{box-shadow:0 3px 10px rgba(0,122,255,.18);background:linear-gradient(135deg,#006EEF 0%,#0058D4 100%)}
.btn-ghost{background:var(--card);color:var(--teal);width:100%;border:0.5px solid var(--sep);box-shadow:0 1px 2px rgba(0,0,0,.02)}
.btn-ghost:active{background:var(--hover)}
.btn-red{background:linear-gradient(135deg,#FF453A 0%,#E8382F 100%);color:white;box-shadow:0 6px 18px rgba(255,59,48,.2)}
.btn-disabled{opacity:.45;pointer-events:none}
.btn-sm{padding:8px 14px;font-size:13px;border-radius:12px;font-weight:700}

.chips{display:flex;gap:10px;margin:0 20px 14px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{flex-shrink:0;background:var(--card);border-radius:var(--rxl);padding:16px 18px;min-width:100px;box-shadow:var(--card-shadow);border:var(--card-border);transition:transform .2s,box-shadow .2s}
.chip:active{transform:scale(.97)}
.chip-val{font-size:22px;font-weight:700;letter-spacing:-.3px;color:var(--t1)}
.chip-lbl{font-size:11px;color:var(--t3);margin-top:3px;font-weight:500}

.prog{height:4px;background:var(--sep);border-radius:99px;overflow:hidden;margin-top:10px}
.prog-fill{height:100%;border-radius:99px;transform-origin:left;transition:transform .5s cubic-bezier(.34,1.56,.64,1);will-change:transform}

.empty-state{text-align:center;padding:60px 28px;color:var(--t3)}
.empty-state-icon{width:64px;height:64px;border-radius:20px;background:var(--hover);display:inline-grid;place-items:center;font-size:30px;margin-bottom:18px;border:0.5px solid rgba(0,0,0,.03)}
.empty-state-title{font-size:18px;font-weight:800;color:var(--t1);margin-bottom:8px;letter-spacing:-.3px}
.empty-state-sub{font-size:14px;margin-bottom:24px;line-height:1.55;color:var(--t3);max-width:280px;margin-left:auto;margin-right:auto}

.loading-screen{min-height:100dvh;display:grid;place-items:center;font-size:36px}

.tag{display:inline-flex;align-items:center;gap:4px;background:var(--sep);border-radius:8px;padding:4px 10px;font-size:12px;color:var(--t2);font-weight:500}

.streak-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px 2px 6px;border-radius:99px;font-size:11px;font-weight:600}
.streak-badge.fire{background:rgba(255,149,0,.12);color:var(--orange)}
.streak-badge.ice{background:rgba(0,122,255,.10);color:var(--teal)}
.streak-badge.gold{background:rgba(255,204,0,.12);color:var(--orange)}

.profile-header{background:linear-gradient(180deg,rgba(255,255,255,.92) 0%,rgba(255,255,255,.82) 100%);backdrop-filter:blur(28px) saturate(1.7);-webkit-backdrop-filter:blur(28px) saturate(1.7);border:0.5px solid var(--glass-border);margin:0 20px 16px;border-radius:var(--rxl);padding:34px 20px 28px;display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:var(--glass-sh)}
.profile-avatar{width:92px;height:92px;border-radius:50%;background:var(--hover);display:grid;place-items:center;font-size:40px;box-shadow:0 8px 24px rgba(15,30,60,.1);border:3px solid rgba(255,255,255,.9);transition:transform .2s}
.profile-avatar:active{transform:scale(.96)}
.profile-name{font-size:24px;font-weight:800;color:var(--t1);letter-spacing:-.5px}

.upgrade-card{background:linear-gradient(145deg,#007AFF 0%,#5856D6 100%);border-radius:var(--rxl);padding:28px 24px;color:white;position:relative;overflow:hidden;box-shadow:0 14px 40px rgba(0,122,255,.28),0 0 0 1px rgba(255,255,255,.1) inset}
.upgrade-card::before{content:'';position:absolute;top:-45%;right:-18%;width:58%;height:95%;background:radial-gradient(circle,rgba(255,255,255,.12) 0%,transparent 62%);border-radius:50%;pointer-events:none;animation:premiumGlow 7s ease-in-out infinite}
.upgrade-card::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,.08) 50%,transparent 75%);background-size:200% 100%;animation:shimmer 3.5s infinite;pointer-events:none}
@keyframes premiumGlow{0%,100%{transform:translate(0,0) scale(1);opacity:.5}50%{transform:translate(-8%,12%) scale(1.12);opacity:.9}}
.upgrade-title{font-size:22px;font-weight:800;margin-bottom:6px;letter-spacing:-.4px}
.upgrade-sub{font-size:14px;opacity:.9;margin-bottom:18px;line-height:1.55}
.upgrade-features{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
.upgrade-feature{font-size:14px;opacity:.95;display:flex;align-items:center;gap:6px;font-weight:500}
.upgrade-btn{background:rgba(255,255,255,.98);color:var(--teal);border:none;border-radius:var(--ios-radii);padding:14px 22px;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit;width:100%;transition:transform .18s cubic-bezier(.34,1.56,.64,1),box-shadow .18s;box-shadow:0 6px 20px rgba(15,30,60,.14)}
.upgrade-btn:active{transform:scale(.98);box-shadow:0 3px 10px rgba(15,30,60,.12)}

.glass-card{background:var(--glass);backdrop-filter:blur(24px) saturate(1.8);-webkit-backdrop-filter:blur(24px) saturate(1.8);border:0.5px solid var(--glass-border);border-radius:var(--rxl);box-shadow:var(--glass-sh);position:relative;overflow:hidden;transition:box-shadow .25s ease,transform .2s ease}
.glass-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--glass-hi) 0%,rgba(255,255,255,0) 50%,var(--glass-hi) 100%);pointer-events:none;border-radius:inherit}
.glass-card:active{box-shadow:0 6px 28px rgba(0,0,0,.08),0 0 0 0.5px rgba(0,0,0,.03) inset}

.premium-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;background:var(--sel);color:var(--teal);border:0.5px solid var(--sep);position:relative;overflow:hidden}
.premium-badge::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,var(--glass-hi),transparent);background-size:200% 100%;animation:shimmer 4s infinite;pointer-events:none}

.stat-glow{position:relative;overflow:hidden;border-radius:var(--rxl)}
.stat-glow::after{content:'';position:absolute;top:-40%;right:-30%;width:50%;height:80%;background:radial-gradient(circle,rgba(0,122,255,.06) 0%,transparent 60%);border-radius:50%;pointer-events:none;animation:premiumGlow 8s ease-in-out infinite}

.highlight-card{background:linear-gradient(135deg,var(--teal),var(--teal2));border-radius:var(--rxl);padding:20px 22px;color:white;position:relative}
.highlight-title{font-size:17px;font-weight:700;margin-bottom:3px}
.highlight-sub{font-size:13px;opacity:.85}

.notif-banner{margin:0 20px 12px;background:linear-gradient(135deg,var(--orange),#FF6B00);border-radius:var(--rxl);padding:16px 18px;display:flex;align-items:center;gap:12px;cursor:pointer;box-shadow:0 4px 16px rgba(255,149,0,.2)}
.notif-banner-text{flex:1;font-size:14px;font-weight:500;color:white;line-height:1.35}
.notif-banner-btn{background:white;color:#994D00;border:none;border-radius:var(--ios-radii);padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:transform .15s}
.notif-banner-btn:active{transform:scale(.95)}

.sheet-overlay{position:fixed;inset:0;background:rgba(15,20,30,.38);z-index:300;display:flex;align-items:flex-end;backdrop-filter:blur(6px) saturate(1.2);-webkit-backdrop-filter:blur(6px) saturate(1.2);animation:overlayFadeIn .25s ease both}
.sheet{background:linear-gradient(180deg,rgba(255,255,255,1) 0%,rgba(252,253,255,1) 100%);border-radius:28px 28px 0 0;padding:0 0 calc(14px + var(--safe-bottom));width:100%;max-height:88dvh;overflow-y:auto;animation:slideUp .38s cubic-bezier(.16,1,.3,1);will-change:transform;box-shadow:0 -12px 48px rgba(15,30,60,.14),0 0 0 0.5px rgba(255,255,255,.6) inset}
.sheet.closing{animation:slideDown .3s ease both}
.sheet-overlay.closing{animation:overlayFadeOut .25s ease both}
.sheet-handle{width:40px;height:5px;background:rgba(60,60,67,.18);border-radius:99px;margin:10px auto 18px;cursor:grab}
.sheet-title{font-size:18px;font-weight:800;text-align:center;padding:0 20px 18px;border-bottom:0.5px solid var(--sep);margin-bottom:10px;letter-spacing:-.3px;color:var(--t1)}
.sheet-section{padding:8px 20px}
.sheet-section+.sheet-section{border-top:0.5px solid var(--sep)}
.sheet-label{color:var(--t3);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;font-size:11px}
select,.sheet-input,.input-field{-webkit-appearance:none;appearance:none}
.sheet-input{width:100%;padding:14px 16px;border:1px solid var(--sep);border-radius:var(--ios-radii);font-size:16px;color:var(--t1);font-family:inherit;background:var(--card);outline:none;transition:all .2s cubic-bezier(.25,.1,.25,1);box-shadow:0 1px 0 rgba(0,0,0,.03)}
.sheet-input::placeholder{color:var(--t4);font-weight:400}
.sheet-input:focus{border-color:var(--teal);box-shadow:0 0 0 3.5px var(--sel),0 1px 0 rgba(0,0,0,.03);background:var(--card)}
.sheet-input:hover:not(:focus){border-color:rgba(60,60,67,.15)}
textarea.sheet-input{min-height:80px;line-height:1.5;resize:vertical}
select.sheet-input{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238E8E93' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px}
.form-group{display:flex;flex-direction:column;gap:4px;margin-bottom:18px}
.form-label{font-size:13px;font-weight:600;color:var(--t2);letter-spacing:-.1px;padding-left:2px}
.form-hint{font-size:12px;color:var(--t3);padding-left:2px;margin-top:2px}
.form-error{font-size:12px;color:var(--red);padding-left:2px;margin-top:2px}
.sheet-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sheet-actions{padding:16px 20px 0;display:flex;flex-direction:column;gap:10px}
.sheet-seg{display:flex;background:var(--hover);border-radius:12px;padding:3px}
.sheet-seg-btn{flex:1;padding:9px;border:none;background:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:var(--t2);transition:all .2s cubic-bezier(.25,.1,.25,1)}
.sheet-seg-btn.on{background:var(--card);color:var(--t1);box-shadow:0 1px 4px rgba(0,0,0,.08),0 0.5px 1px rgba(0,0,0,.04)}
.chip-group{display:flex;flex-wrap:wrap;gap:8px}
.chip{padding:8px 16px;border-radius:99px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid var(--sep);background:var(--card);color:var(--t2);transition:all .18s cubic-bezier(.25,.1,.25,1);user-select:none;-webkit-user-select:none}
.pill:active{transform:scale(.95)}
.pill.on{background:rgba(0,122,255,.08);border-color:var(--teal);color:var(--teal);box-shadow:0 0 0 1px var(--teal)}
.chip.blue{background:rgba(0,122,255,.08);color:var(--teal)}
.chip.green{background:rgba(52,199,89,.08);color:var(--green)}
.chip.purple{background:rgba(175,82,222,.08);color:var(--purple)}
.chip.orange{background:rgba(255,149,0,.08);color:var(--orange)}
.chip.red{background:rgba(255,59,48,.08);color:var(--red)}

.input-group{display:flex;flex-direction:column;gap:14px;margin-bottom:20px}
.input-field{padding:14px 16px;border:0.5px solid var(--sep);border-radius:var(--ios-radii);font-size:16px;color:var(--t1);font-family:inherit;background:var(--input);outline:none;transition:all .18s;box-shadow:0 1px 2px rgba(0,0,0,.02) inset}
.input-field:focus{border-color:var(--teal);box-shadow:0 0 0 3px var(--sel);background:var(--card)}
.input-field::placeholder{color:var(--t4)}

.auth-screen{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;padding-top:calc(24px + env(safe-area-inset-top,0px));padding-bottom:calc(24px + env(safe-area-inset-bottom,0px));background:radial-gradient(ellipse 120% 80% at 50% 0%, rgba(0,122,255,.08) 0%, transparent 55%), radial-gradient(ellipse 100% 60% at 80% 100%, rgba(88,86,214,.07) 0%, transparent 50%), linear-gradient(180deg,#F8FAFF 0%,#F6F7FB 40%,#F2F2F7 100%);position:relative;overflow-x:hidden;overflow-y:auto}
.auth-screen::before{content:'';position:absolute;top:-20%;right:-15%;width:70%;height:70%;background:radial-gradient(circle,rgba(0,122,255,.12) 0%,transparent 65%);border-radius:50%;pointer-events:none;animation:aurora1 14s ease-in-out infinite;filter:blur(60px)}
.auth-screen::after{content:'';position:absolute;bottom:-18%;left:-12%;width:58%;height:58%;background:radial-gradient(circle,rgba(88,86,214,.10) 0%,transparent 62%);border-radius:50%;pointer-events:none;animation:aurora2 16s ease-in-out infinite;filter:blur(70px)}
.auth-card{background:rgba(255,255,255,.98);backdrop-filter:blur(20px) saturate(1.6);-webkit-backdrop-filter:blur(20px) saturate(1.6);border:0.5px solid rgba(0,0,0,.03);border-radius:32px;padding:38px 30px;width:100%;max-width:380px;margin:auto 0;box-shadow:0 20px 60px -20px rgba(0,30,80,.18),0 0 0 0.5px rgba(255,255,255,.8) inset;animation:authCardIn .6s cubic-bezier(.16,1,.3,1) both;position:relative;z-index:1}
.auth-welcome-card{background:linear-gradient(180deg,rgba(255,255,255,.96) 0%,rgba(255,255,255,.92) 100%);backdrop-filter:blur(28px) saturate(1.9);-webkit-backdrop-filter:blur(28px) saturate(1.9);border-top:0.5px solid rgba(0,0,0,.04);border-radius:32px 32px 0 0;padding:30px 26px calc(32px + env(safe-area-inset-bottom,0px));width:100%;box-shadow:0 -12px 60px rgba(30,60,120,.14);position:relative;z-index:1}
@keyframes authCardIn{from{transform:translateY(18px);opacity:0;filter:blur(4px)}to{transform:translateY(0);opacity:1;filter:blur(0)}}
.auth-logo{display:flex;align-items:center;gap:12px;margin-bottom:22px;justify-content:center}
.auth-mark{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;overflow:hidden;box-shadow:0 4px 14px rgba(0,122,255,.22);flex-shrink:0;background:var(--hover)}
.auth-mark img{display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit}
.auth-app-name{font-size:22px;font-weight:700;color:var(--t1);letter-spacing:-.3px}
.auth-title{font-size:26px;font-weight:800;margin-bottom:6px;letter-spacing:-.5px;color:var(--t1)}
.auth-sub{font-size:14px;color:var(--t2);margin-bottom:22px;line-height:1.5}
.oauth-stack{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.oauth-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:15px 18px;border:0.5px solid rgba(0,0,0,.05);border-radius:var(--ios-radii);background:linear-gradient(180deg,rgba(255,255,255,1) 0%,rgba(248,249,252,1) 100%);cursor:pointer;font-size:15px;font-weight:600;color:var(--t1);font-family:inherit;transition:all .18s cubic-bezier(.25,.1,.25,1);width:100%;box-shadow:0 1px 2px rgba(0,0,0,.02),0 4px 12px rgba(30,60,120,.04)}
.oauth-btn:hover{border-color:rgba(60,60,67,.12);box-shadow:0 2px 6px rgba(30,60,120,.06)}
.oauth-btn:active{background:linear-gradient(180deg,rgba(246,247,250,1) 0%,rgba(242,243,247,1) 100%);transform:scale(.985);box-shadow:0 1px 2px rgba(0,0,0,.02)}
.oauth-btn svg{width:18px;height:18px;flex-shrink:0}
.divider{display:flex;align-items:center;gap:12px;margin-bottom:16px;color:var(--t3);font-size:13px;font-weight:600}
.divider::before,.divider::after{content:'';flex:1;height:0.5px;background:var(--sep)}
.pw-wrap{border-radius:var(--ios-radii);transition:all .18s;border:0.5px solid var(--sep);background:var(--input);box-shadow:0 1px 2px rgba(0,0,0,.02) inset}
.pw-wrap:focus-within{border-color:var(--teal)!important;box-shadow:0 0 0 3px var(--sel),0 1px 2px rgba(0,0,0,.02) inset;background:var(--card)}
input[type=password]::-ms-reveal{display:none}
input[type=password]::-webkit-credentials-auto-fill-button{display:none!important;visibility:hidden;pointer-events:none;width:0;height:0}
.auth-switch{text-align:center;margin-top:18px;font-size:14px;color:var(--t2);line-height:1.5}
.auth-switch button{background:none;border:none;color:var(--teal);font-weight:700;cursor:pointer;font-size:14px;font-family:inherit;transition:opacity .12s}
.auth-switch button:active{opacity:.6}
.err-msg{background:var(--ib6);border:0.5px solid rgba(255,59,48,.22);color:var(--red);padding:12px 16px;border-radius:var(--ios-radii);font-size:13px;margin-bottom:16px;line-height:1.4}
.ok-msg{background:var(--ib1);border:0.5px solid rgba(0,122,255,.22);color:var(--teal2);padding:14px 18px;border-radius:var(--ios-radii);font-size:13px;margin-bottom:14px;line-height:1.4}
.ok-msg strong{display:block;font-size:14px;margin-bottom:2px;color:var(--t1)}
.auth-input{padding:15px 16px;border:0.5px solid rgba(0,0,0,.05);border-radius:var(--ios-radii);font-size:16px;color:var(--t1);font-family:inherit;background:linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(248,249,252,.98) 100%);outline:none;transition:all .18s cubic-bezier(.25,.1,.25,1);box-shadow:0 1px 2px rgba(0,0,0,.01) inset}
.auth-input:focus{border-color:rgba(0,122,255,.6);box-shadow:0 0 0 3.5px var(--sel),0 1px 2px rgba(0,0,0,.01) inset;background:var(--card)}
.auth-input::placeholder{color:var(--t4)}
.auth-select{padding:15px 16px;border:0.5px solid rgba(0,0,0,.05);border-radius:var(--ios-radii);font-size:16px;color:var(--t1);font-family:inherit;background:linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(248,249,252,.98) 100%);outline:none;transition:all .18s cubic-bezier(.25,.1,.25,1);width:100%;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;-webkit-appearance:none;appearance:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 1px 2px rgba(0,0,0,.01) inset}
.auth-select option{background:var(--card);color:var(--t1)}
.auth-select:focus{border-color:rgba(0,122,255,.6);box-shadow:0 0 0 3.5px var(--sel),0 1px 2px rgba(0,0,0,.01) inset;background:var(--card)}
.auth-btn{display:flex;align-items:center;justify-content:center;width:100%;padding:15px;border:none;border-radius:var(--ios-radii);font-size:16px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s;letter-spacing:-.1px}
.auth-btn:active{transform:scale(.98)}
.auth-btn-primary{background:linear-gradient(135deg,#007AFF 0%,#5856D6 100%);color:white;box-shadow:0 6px 20px rgba(0,122,255,.28),inset 0 1px 0 rgba(255,255,255,.18);position:relative;overflow:hidden}
.auth-btn-primary::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,.14) 50%,transparent 80%);background-size:200% 100%;animation:shimmer 3s infinite;pointer-events:none}
.auth-btn-primary:active{background:linear-gradient(135deg,#0066EE 0%,#4F4DD8 100%);box-shadow:0 4px 14px rgba(0,122,255,.24);transform:scale(.985)}
.auth-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;animation:none}
.auth-btn-ghost{background:linear-gradient(180deg,rgba(255,255,255,1) 0%,rgba(248,249,252,1) 100%);color:var(--t1);border:0.5px solid rgba(0,0,0,.05);box-shadow:0 1px 2px rgba(0,0,0,.02),0 4px 12px rgba(30,60,120,.04)}
.auth-btn-ghost:active{background:linear-gradient(180deg,rgba(246,247,250,1) 0%,rgba(242,243,247,1) 100%);transform:scale(.985)}
.auth-plan-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.auth-plan{border-radius:12px;padding:12px 10px;border:1.5px solid var(--sep);background:var(--card);cursor:pointer;transition:all .2s;text-align:center}
.auth-plan.selected{border-color:var(--teal);background:var(--sel);box-shadow:0 0 0 1px var(--teal)}
.auth-plan-name{font-size:11px;color:var(--t3);margin-bottom:2px;font-weight:500}
.auth-plan-price{font-size:16px;font-weight:700;color:var(--t1)}
.auth-plan-desc{font-size:9px;color:var(--t4);margin-top:2px}
.auth-pw-bar{display:flex;gap:4px;margin-bottom:8px}
.auth-pw-segment{flex:1;height:4px;border-radius:99px;transition:background .25s}
.auth-pw-check{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:500;transition:color .2s}
.auth-feature-pill{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.94);border:0.5px solid rgba(0,0,0,.04);border-radius:99px;padding:8px 16px;font-size:13px;font-weight:600;color:var(--t1);box-shadow:0 2px 10px rgba(30,60,120,.08)}

.onboard-screen{min-height:100dvh;padding-top:env(safe-area-inset-top,0px);background:var(--bg);display:flex;flex-direction:column}
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
.ob-check.on::after{content:'';width:6px;height:10px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg);margin-top:-2px}
.ob-footer{padding:14px 20px calc(16px + var(--safe-bottom))}
.ob-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ob-time-card{background:var(--card);border-radius:var(--rxl);padding:16px;cursor:pointer;border:0.5px solid transparent;transition:all .15s;text-align:center;box-shadow:var(--card-shadow)}
.ob-time-card:active{transform:scale(.97)}
.ob-time-card.sel{border-color:var(--teal);background:var(--sel);box-shadow:0 2px 12px rgba(0,122,255,.12)}
.ob-time-emoji{font-size:28px;margin-bottom:5px}
.ob-time-label{font-size:14px;font-weight:600;color:var(--t1)}
.ob-time-sub{font-size:11px;color:var(--t3);margin-top:2px}
.ob-step{animation:obSlide .35s ease both}

.avatar-preview{width:84px;height:84px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.12);border:3px solid var(--card);transition:transform .2s}
.avatar-preview:active{transform:scale(.95)}
.avatar-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.avatar-tile{position:relative;aspect-ratio:1;border-radius:var(--ios-radii);display:grid;place-items:center;cursor:pointer;transition:transform .16s cubic-bezier(.34,1.56,.64,1),box-shadow .16s;box-shadow:0 3px 10px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.25);overflow:hidden}
.avatar-tile::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,0) 50%)}
.avatar-tile svg{position:relative;filter:drop-shadow(0 1px 2px rgba(0,0,0,.18))}
.avatar-tile:active{transform:scale(.9)}
.avatar-tile.sel{box-shadow:0 0 0 2.5px var(--card),0 0 0 4.5px var(--teal),0 6px 18px rgba(0,122,255,.28);transform:scale(1.08);z-index:1}
.avatar-tick{position:absolute;top:3px;right:3px;width:18px;height:18px;border-radius:50%;background:var(--teal);display:grid;place-items:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.avatar-upload{border:1.5px dashed var(--sep);background:var(--ib1);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--t3);cursor:pointer;box-shadow:none}
.avatar-upload svg{filter:none;opacity:.7}
.avatar-upload-label{font-size:8.5px;font-weight:600;line-height:1.1;text-align:center;padding:0 2px;text-transform:uppercase;letter-spacing:.2px}

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

.trans-screen{position:fixed;inset:0;background:radial-gradient(ellipse 120% 70% at 50% 0%, rgba(0,122,255,.10) 0%, transparent 55%), radial-gradient(ellipse 90% 60% at 50% 100%, rgba(88,86,214,.08) 0%, transparent 60%), linear-gradient(180deg,#F8FAFF 0%,#F6F7FB 48%,#F2F2F7 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;overflow:hidden;transition:opacity .6s cubic-bezier(.4,0,.2,1)}
.trans-screen::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 38% at 50% 18%,rgba(0,122,255,.09) 0%,rgba(88,86,214,.06) 40%,transparent 72%);pointer-events:none;z-index:0}
.trans-screen::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.28'/%3E%3C/svg%3E");mix-blend-mode:soft-light;opacity:.24;pointer-events:none;z-index:0}
.trans-screen.fade-out{opacity:0;pointer-events:none}

.trans-aurora{position:absolute;border-radius:50%;pointer-events:none;filter:blur(70px)}
@keyframes aurora1{0%,100%{transform:translate(0,0) scale(1);opacity:.55}50%{transform:translate(6%,-8%) scale(1.15);opacity:.9}}
@keyframes aurora2{0%,100%{transform:translate(0,0) scale(1);opacity:.5}50%{transform:translate(-8%,6%) scale(1.1);opacity:.8}}

.trans-logo-wrap{position:relative;width:208px;height:208px;display:grid;place-items:center;margin-bottom:-4px;animation:logoPop .9s cubic-bezier(.16,1,.3,1) both}
.trans-logo-glow{position:absolute;inset:8px;border-radius:50%;background:radial-gradient(circle,rgba(0,122,255,.18) 0%,rgba(88,86,214,.10) 44%,transparent 72%);animation:logoBreathe 3.6s ease-in-out infinite;z-index:0;filter:blur(2px)}
@keyframes logoBreathe{0%,100%{transform:scale(.95);opacity:.7}50%{transform:scale(1.09);opacity:1}}
.trans-logo{width:96px;height:96px;border-radius:26px;position:relative;z-index:2;overflow:hidden;display:grid;place-items:center;box-shadow:0 18px 44px rgba(0,86,255,.26),0 6px 18px rgba(30,60,120,.08),inset 0 1px 0 rgba(255,255,255,.32);animation:logoFloat 3.6s ease-in-out infinite}
@keyframes logoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.trans-logo svg{width:48px;height:48px}
.trans-logo img{width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block}

.trans-title{display:flex;align-items:baseline;gap:1px;margin:16px 0 0}
.trans-title-letter{font-size:32px;font-weight:800;color:#1D1D1F;letter-spacing:-.5px;display:inline-block;animation:letterIn .75s cubic-bezier(.16,1,.3,1) both}
.trans-title-letter:nth-child(1){animation-delay:.14s}
.trans-title-letter:nth-child(2){animation-delay:.2s}
.trans-title-letter:nth-child(3){animation-delay:.26s}
.trans-title-letter:nth-child(4){animation-delay:.32s}
.trans-title-letter:nth-child(5){animation-delay:.38s}
.trans-title-letter:nth-child(6){animation-delay:.44s}
.trans-title-letter:nth-child(7){animation-delay:.5s}
@keyframes letterIn{from{transform:translateY(16px);opacity:0;filter:blur(6px)}to{transform:translateY(0);opacity:1;filter:blur(0)}}
.trans-underline{width:64px;height:3px;border-radius:99px;background:linear-gradient(90deg,#007AFF 0%,#5856D6 100%);margin-top:12px;transform-origin:left;animation:underlineIn .7s .7s cubic-bezier(.16,1,.3,1) both;box-shadow:0 2px 10px rgba(0,122,255,.18)}
@keyframes underlineIn{from{transform:scaleX(0)}to{transform:scaleX(1)}}

.trans-msg{font-size:15px;color:rgba(60,60,67,.68);margin:18px 0 0;text-align:center;padding:0 40px;line-height:1.6;font-weight:500;letter-spacing:.1px;animation:fadeUp .7s .6s cubic-bezier(.16,1,.3,1) both}
.trans-status{font-size:13px;color:rgba(60,60,67,.58);font-weight:500;letter-spacing:.2px;margin-top:20px;animation:fadeUp .6s .85s cubic-bezier(.16,1,.3,1) both;position:relative;height:18px;z-index:1}
.trans-status-inner{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:opacity .4s ease,transform .4s ease,filter .4s ease}
.trans-status-inner.out{opacity:0;transform:translateY(10px);filter:blur(8px)}
.trans-loader{margin-top:24px;width:128px;height:5px;border-radius:99px;background:rgba(60,60,67,.08);overflow:hidden;position:relative;animation:fadeUp .6s .9s cubic-bezier(.16,1,.3,1) both;border:0.5px solid rgba(255,255,255,.5)}
.trans-loader-bar{position:absolute;inset:0 auto 0 0;width:40%;border-radius:99px;background:linear-gradient(90deg,#007AFF 0%,#5856D6 100%);box-shadow:0 0 16px rgba(0,122,255,.26);animation:transLoad 1.4s cubic-bezier(.4,0,.2,1) infinite}
@keyframes transLoad{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}
.trans-content{animation:fadeUp .7s cubic-bezier(.16,1,.3,1) both;position:relative;z-index:1}
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
.content-reveal{animation:contentReveal .45s cubic-bezier(.22,1,.36,1) backwards}
@keyframes contentReveal{from{opacity:0}to{opacity:1}}
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
        <img src="/icon.svg?v=3" alt="Adherly" width="46" height="46" />
      </div>
      <span className="auth-app-name">Adherly</span>
    </div>
  );
}

export const RE_HAS_LOWER = /[a-z]/;
export const RE_HAS_UPPER = /[A-Z]/;
export const RE_HAS_DIGIT = /\d/;
export const RE_HAS_SYMBOL = /[^a-zA-Z0-9]/;
export const RE_EMAIL = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
export const RE_HTML_TAG = /<[^>]*>/g;
export const RE_DIGITS = /[^0-9]/g;

// Currencies available wherever medication cost appears (MedSheet picker, ReportsTab).
export const CURRENCIES = [
  { code: "GHS", label: "₵ GHS", symbol: "₵" },
  { code: "NGN", label: "₦ NGN", symbol: "₦" },
  { code: "KES", label: "KSh KES", symbol: "KSh" },
  { code: "TZS", label: "TSh TZS", symbol: "TSh" },
  { code: "UGX", label: "USh UGX", symbol: "USh" },
  { code: "RWF", label: "FRw RWF", symbol: "FRw" },
  { code: "ETB", label: "Br ETB", symbol: "Br" },
  { code: "ZAR", label: "R ZAR", symbol: "R" },
  { code: "BWP", label: "P BWP", symbol: "P" },
  { code: "ZMW", label: "K ZMW", symbol: "K" },
  { code: "MWK", label: "MK MWK", symbol: "MK" },
  { code: "MAD", label: "MAD", symbol: "MAD" },
  { code: "EGP", label: "E£ EGP", symbol: "E£" },
  { code: "DZD", label: "DA DZD", symbol: "DA" },
  { code: "TND", label: "DT TND", symbol: "DT" },
  { code: "XOF", label: "FCFA XOF", symbol: "FCFA" },
  { code: "XAF", label: "FCFA XAF", symbol: "FCFA" },
  { code: "GMD", label: "D GMD", symbol: "D" },
  { code: "SLE", label: "Le SLE", symbol: "Le" },
  { code: "GNF", label: "FG GNF", symbol: "FG" },
  { code: "USD", label: "$ USD", symbol: "$" },
  { code: "EUR", label: "€ EUR", symbol: "€" },
  { code: "GBP", label: "£ GBP", symbol: "£" },
  { code: "INR", label: "₹ INR", symbol: "₹" },
  { code: "AUD", label: "A$ AUD", symbol: "A$" },
  { code: "CAD", label: "C$ CAD", symbol: "C$" },
  { code: "CHF", label: "CHF", symbol: "CHF" },
  { code: "AED", label: "AED", symbol: "AED" },
  { code: "SAR", label: "SAR", symbol: "SAR" },
  { code: "CNY", label: "CN¥ CNY", symbol: "CN¥" },
  { code: "JPY", label: "¥ JPY", symbol: "¥" },
  { code: "BRL", label: "R$ BRL", symbol: "R$" },
  { code: "MXN", label: "$ MXN", symbol: "$" },
];

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function currencySymbol(code) {
  if (!code) return null;
  const c = CURRENCIES.find(x => x.code === code);
  return c ? c.symbol : code;
}
