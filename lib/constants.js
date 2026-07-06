export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
:root{
  --bg:#F2F2F7;
  --card:#FFFFFF;
  --teal:#0A84FF;
  --teal2:#34C759;
  --red:#FF3B30;
  --orange:#FF9500;
  --purple:#AF52DE;
  --sep:#C6C6C8;
  --t1:#000000;
  --t2:#3C3C43;
  --t3:#8E8E93;
  --t4:#AEAEB2;
  --safe-bottom:env(safe-area-inset-bottom,0px);
  --safe-top:env(safe-area-inset-top,0px);
  --rr:12px;--rl:16px;--rxl:20px;
  --bar:rgba(249,249,249,0.94);
  --hover:#E5E5EA;
  --sel:#EFF6FF;
  --input:#FFFFFF;
  --ib1:#EFF6FF;--ib2:#D1FAE5;--ib3:#FEF3C7;--ib4:#F3E8FF;--ib5:#F0FDF4;--ib6:#FEE2E2;
}
html,body{height:100%;background:var(--bg)}
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Inter','Helvetica Neue',sans-serif;color:var(--t1);-webkit-font-smoothing:antialiased;overscroll-behavior:none;-webkit-touch-callout:none}
.tabbar{position:fixed;bottom:0;left:0;right:0;height:calc(49px + var(--safe-bottom));background:var(--bar);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:0.5px solid var(--sep);display:flex;align-items:flex-start;padding-top:6px;z-index:200;will-change:transform}
.tbi{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;-webkit-tap-highlight-color:transparent;padding:0 4px}
.tbi svg{width:24px;height:24px}
.tbi span{font-size:10px;font-weight:500;color:var(--t3)}
.tbi.on svg path,.tbi.on svg circle,.tbi.on svg rect{fill:var(--teal)}
.tbi.on span{color:var(--teal)}
.navbar{position:sticky;top:0;z-index:100;background:var(--bar);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:0.5px solid var(--sep);padding:calc(var(--safe-top) + 8px) 16px 8px;display:flex;align-items:center;justify-content:space-between;min-height:44px}
.nav-title{font-size:17px;font-weight:600;color:var(--t1)}
.nav-large{font-size:34px;font-weight:700;letter-spacing:-.5px;padding:8px 16px 4px;color:var(--t1)}
.nav-action{background:none;border:none;color:var(--teal);font-size:16px;font-weight:500;cursor:pointer;font-family:inherit;padding:4px 0;-webkit-tap-highlight-color:transparent}
.scroll{overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding-bottom:calc(70px + var(--safe-bottom));padding-top:0;overscroll-behavior:contain;content-visibility:auto;contain-intrinsic-size:500px}
.section{padding:0 16px;margin-bottom:8px}
.section-header{font-size:13px;font-weight:500;color:var(--t3);text-transform:uppercase;letter-spacing:.4px;padding:16px 4px 6px}
.list{background:var(--card);border-radius:var(--rl);overflow:hidden}
.row{display:flex;align-items:center;padding:12px 16px;min-height:44px;gap:12px;border-bottom:0.5px solid var(--sep);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .1s}
.row:last-child{border-bottom:none}
.row:active{background:var(--hover)}
.row-icon{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;flex-shrink:0;font-size:16px}
.row-body{flex:1;min-width:0}
.row-title{font-size:16px;color:var(--t1);font-weight:400}
.row-sub{font-size:13px;color:var(--t3);margin-top:1px}
.row-right{display:flex;align-items:center;gap:6px;flex-shrink:0}
.row-value{font-size:16px;color:var(--t3)}
.chevron{color:var(--t4);font-size:13px}
.row-check{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--sep);display:grid;place-items:center;flex-shrink:0}
.row-check.done{background:var(--teal2);border-color:var(--teal2)}
.hero-card{margin:0 16px 16px;background:linear-gradient(135deg,#0A84FF 0%,#32ADE6 100%);border-radius:var(--rxl);padding:20px;color:white;position:relative;overflow:hidden}
.hero-card::after{content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:rgba(255,255,255,.1);border-radius:50%}
.hero-card::before{content:'';position:absolute;bottom:-20px;left:60px;width:80px;height:80px;background:rgba(255,255,255,.07);border-radius:50%}
.hero-label{font-size:13px;font-weight:500;opacity:.85;margin-bottom:4px}
.hero-big{font-size:48px;font-weight:700;line-height:1;letter-spacing:-1px}
.hero-sub{font-size:14px;opacity:.85;margin-top:6px}
.hero-row{display:flex;gap:16px;margin-top:16px}
.hero-stat{flex:1;background:rgba(255,255,255,.15);border-radius:10px;padding:10px 12px}
.hero-stat-val{font-size:22px;font-weight:700}
.hero-stat-lbl{font-size:11px;opacity:.8;margin-top:2px}
.chips{display:flex;gap:10px;margin:0 16px 16px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{flex-shrink:0;background:var(--card);border-radius:var(--rl);padding:14px 16px;min-width:100px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.chip-val{font-size:24px;font-weight:700;color:var(--t1)}
.chip-lbl{font-size:12px;color:var(--t3);margin-top:2px}
.chip.green .chip-val{color:var(--teal2)}
.chip.blue .chip-val{color:var(--teal)}
.chip.orange .chip-val{color:var(--orange)}
.chip.purple .chip-val{color:var(--purple)}
.ring-wrap{position:relative;width:80px;height:80px;flex-shrink:0}
.ring-wrap svg{transform:rotate(-90deg)}
.ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring-pct{font-size:18px;font-weight:700;color:var(--t1)}
.ring-of{font-size:10px;color:var(--t3)}
.badge{display:inline-flex;align-items:center;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600}
.badge-green{background:#D1FAE5;color:#065F46}
.badge-gray{background:#E5E7EB;color:#374151}
.badge-blue{background:#DBEAFE;color:#1E40AF}
.btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:14px 20px;border-radius:var(--rl);font-size:16px;font-weight:600;cursor:pointer;border:none;font-family:inherit;-webkit-tap-highlight-color:transparent;transition:opacity .15s}
.btn:active{opacity:.7}
.btn-primary{background:var(--teal);color:white;width:100%}
.btn-green{background:var(--teal2);color:white}
.btn-ghost{background:var(--card);color:var(--teal);width:100%}
.btn-red{background:var(--red);color:white}
.btn-disabled{opacity:.45;pointer-events:none}
.btn-sm{padding:8px 16px;font-size:14px;border-radius:10px}
.auth-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:linear-gradient(160deg,#f0f9ff 0%,#e0f2fe 50%,#f0fdf4 100%)}
.auth-card{background:var(--card);border-radius:24px;padding:28px 24px;width:100%;max-width:390px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.auth-logo{display:flex;align-items:center;gap:10px;margin-bottom:24px}
.auth-mark{width:44px;height:44px;background:var(--teal);border-radius:12px;display:grid;place-items:center}
.auth-mark svg{fill:white;width:24px;height:24px}
.auth-app-name{font-size:20px;font-weight:700}
.auth-title{font-size:24px;font-weight:700;margin-bottom:6px}
.auth-sub{font-size:15px;color:var(--t3);margin-bottom:22px}
.oauth-stack{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
.oauth-btn{display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 20px;border:1.5px solid var(--sep);border-radius:var(--rl);background:var(--card);cursor:pointer;font-size:15px;font-weight:500;color:var(--t1);font-family:inherit;transition:background .1s;-webkit-tap-highlight-color:transparent;width:100%}
.oauth-btn:active{background:var(--hover)}
.oauth-btn svg{width:20px;height:20px;flex-shrink:0}
.divider{display:flex;align-items:center;gap:12px;margin-bottom:16px;color:var(--t3);font-size:14px}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--sep)}
.input-group{display:flex;flex-direction:column;gap:12px;margin-bottom:16px}
.input-field{padding:13px 14px;border:1.5px solid var(--sep);border-radius:var(--rl);font-size:16px;color:var(--t1);font-family:inherit;background:var(--input);outline:none;transition:border-color .15s;-webkit-appearance:none;appearance:none}
.input-field:focus{border-color:var(--teal)}
.auth-switch{text-align:center;margin-top:16px;font-size:15px;color:var(--t3)}
.auth-switch button{background:none;border:none;color:var(--teal);font-weight:600;cursor:pointer;font-size:15px;font-family:inherit}
.err-msg{background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C;padding:10px 14px;border-radius:10px;font-size:14px;margin-bottom:14px}
.ok-msg{background:#F0FDF4;border:1px solid #BBF7D0;color:#166534;padding:14px;border-radius:12px;font-size:14px;margin-bottom:14px;line-height:1.5}
.ok-msg strong{display:block;font-size:15px;margin-bottom:3px}
.onboard-screen{min-height:100vh;background:var(--bg);display:flex;flex-direction:column}
.ob-progress{display:flex;gap:6px;padding:16px 24px 0}
.ob-dot{flex:1;height:4px;border-radius:99px;background:var(--sep);transition:background .3s}
.ob-dot.done{background:var(--teal)}
.ob-body{flex:1;padding:24px;display:flex;flex-direction:column}
.ob-emoji{font-size:56px;margin-bottom:16px;line-height:1}
.ob-title{font-size:28px;font-weight:700;margin-bottom:8px;line-height:1.2}
.ob-sub{font-size:16px;color:var(--t3);margin-bottom:28px;line-height:1.5}
.ob-options{display:flex;flex-direction:column;gap:10px;margin-bottom:auto}
.ob-option{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--card);border-radius:var(--rl);cursor:pointer;border:2px solid transparent;transition:all .15s;-webkit-tap-highlight-color:transparent}
.ob-option.sel{border-color:var(--teal);background:var(--sel)}
.ob-option-icon{font-size:24px;width:40px;text-align:center;flex-shrink:0}
.ob-option-text{flex:1}
.ob-option-title{font-size:16px;font-weight:500;color:var(--t1)}
.ob-option-sub{font-size:13px;color:var(--t3);margin-top:2px}
.ob-check{width:22px;height:22px;border-radius:50%;border:2px solid var(--sep);display:grid;place-items:center;flex-shrink:0;transition:all .15s}
.ob-check.on{background:var(--teal);border-color:var(--teal)}
.ob-footer{padding:16px 24px calc(16px + var(--safe-bottom))}
.ob-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ob-time-card{background:var(--card);border-radius:var(--rl);padding:14px 16px;cursor:pointer;border:2px solid transparent;transition:all .15s;text-align:center}
.ob-time-card.sel{border-color:var(--teal);background:var(--sel)}
.ob-time-emoji{font-size:28px;margin-bottom:6px}
.ob-time-label{font-size:14px;font-weight:600;color:var(--t1)}
.ob-time-sub{font-size:12px;color:var(--t3);margin-top:2px}
.emoji-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.emoji-opt{font-size:28px;width:52px;height:52px;display:grid;place-items:center;border-radius:12px;cursor:pointer;border:2px solid transparent;transition:all .15s;background:var(--card)}
.emoji-opt.sel{border-color:var(--teal);background:var(--sel)}
.sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:300;display:flex;align-items:flex-end}
.sheet{background:var(--card);border-radius:20px 20px 0 0;padding:0 0 calc(16px + var(--safe-bottom));width:100%;max-height:92vh;overflow-y:auto;animation:slideUp .25s ease;will-change:transform}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sheet-handle{width:36px;height:4px;background:var(--sep);border-radius:99px;margin:12px auto 16px}
.sheet-title{font-size:17px;font-weight:600;text-align:center;padding:0 16px 16px;border-bottom:.5px solid var(--sep);margin-bottom:8px}
.sheet-section{padding:8px 16px}
.sheet-label{font-size:13px;color:var(--t3);margin-bottom:6px;font-weight:500;text-transform:uppercase;letter-spacing:.3px;font-size:12px}
select,.sheet-input,.input-field{-webkit-appearance:none;appearance:none}
.sheet-input{width:100%;padding:13px 14px;border:1.5px solid var(--sep);border-radius:var(--rl);font-size:16px;color:var(--t1);font-family:inherit;background:var(--input);outline:none;transition:border-color .15s}
.sheet-input:focus{border-color:var(--teal)}
.sheet-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sheet-actions{padding:12px 16px 0;display:flex;flex-direction:column;gap:10px}
.sheet-seg{display:flex;background:var(--hover);border-radius:9px;padding:2px;gap:2px}
.sheet-seg-btn{flex:1;padding:7px;border:none;background:none;border-radius:7px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;color:var(--t2);transition:all .15s}
.sheet-seg-btn.on{background:var(--card);color:var(--t1);box-shadow:0 1px 3px rgba(0,0,0,.12)}
.notif-banner{margin:0 16px 12px;background:linear-gradient(135deg,#FF9500,#FFCC00);border-radius:var(--rl);padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer}
.notif-banner-text{flex:1;font-size:14px;font-weight:500;color:white}
.notif-banner-btn{background:white;color:#92400E;border:none;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}
.prog{height:5px;background:var(--sep);border-radius:99px;overflow:hidden;margin-top:8px}
.prog-fill{height:100%;border-radius:99px;transition:width .4s ease}
.empty-state{text-align:center;padding:48px 24px;color:var(--t3)}
.empty-state-icon{font-size:48px;margin-bottom:12px}
.empty-state-title{font-size:17px;font-weight:600;color:var(--t2);margin-bottom:6px}
.empty-state-sub{font-size:15px;margin-bottom:20px}
.loading-screen{min-height:100vh;display:grid;place-items:center;font-size:32px}
.tag{display:inline-flex;align-items:center;gap:4px;background:var(--hover);border-radius:6px;padding:2px 8px;font-size:12px;color:var(--t2)}
.profile-header{padding:24px 16px 16px;display:flex;flex-direction:column;align-items:center;gap:8px}
.profile-avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#0A84FF,#32ADE6);display:grid;place-items:center;font-size:40px}
.profile-name{font-size:22px;font-weight:700}
.profile-plan{font-size:14px;color:var(--t3)}
.upgrade-card{margin:0 16px 16px;background:linear-gradient(135deg,#AF52DE,#FF2D55);border-radius:var(--rxl);padding:20px;color:white}
.upgrade-title{font-size:20px;font-weight:700;margin-bottom:6px}
.upgrade-sub{font-size:14px;opacity:.9;margin-bottom:16px;line-height:1.5}
.upgrade-features{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
.upgrade-feature{font-size:14px;opacity:.95}
.upgrade-btn{background:white;color:#AF52DE;border:none;border-radius:10px;padding:12px 20px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;width:100%}
.trans-screen{position:fixed;inset:0;background:linear-gradient(160deg,#0A84FF 0%,#32ADE6 60%,#34C759 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;transition:opacity .4s ease}
.trans-screen.fade-out{opacity:0;pointer-events:none}
.trans-logo{width:88px;height:88px;background:rgba(255,255,255,.2);border-radius:26px;display:grid;place-items:center;margin-bottom:20px;backdrop-filter:blur(10px);animation:logoPop .5s cubic-bezier(.175,.885,.32,1.275) both}
@keyframes logoPop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
.trans-logo svg{fill:white;width:48px;height:48px}
.trans-title{font-size:28px;font-weight:700;color:white;margin-bottom:8px;animation:fadeUp .5s .1s ease both}
.trans-msg{font-size:16px;color:rgba(255,255,255,.85);margin-bottom:40px;animation:fadeUp .5s .2s ease both;text-align:center;padding:0 24px}
@keyframes fadeUp{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
.trans-dots{display:flex;gap:8px;animation:fadeUp .5s .3s ease both}
.trans-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.5)}
.trans-dot:nth-child(1){animation:pulse 1.2s .0s infinite}
.trans-dot:nth-child(2){animation:pulse 1.2s .2s infinite}
.trans-dot:nth-child(3){animation:pulse 1.2s .4s infinite}
@keyframes pulse{0%,80%,100%{background:rgba(255,255,255,.35);transform:scale(.8)}40%{background:white;transform:scale(1.1)}}
.ob-step{animation:obSlide .3s ease both}
@keyframes obSlide{from{transform:translateX(32px);opacity:0}to{transform:translateX(0);opacity:1}}
.goal-chip{display:flex;align-items:center;gap:10px;padding:13px 16px;background:var(--card);border-radius:var(--rl);cursor:pointer;border:2px solid transparent;transition:all .15s;-webkit-tap-highlight-color:transparent}
.goal-chip.sel{border-color:var(--teal);background:var(--sel)}
.goal-chip-icon{font-size:22px;width:36px;text-align:center;flex-shrink:0}
.goal-chip-label{font-size:15px;font-weight:500;color:var(--t1)}
.goal-chip-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--sep);display:grid;place-items:center;flex-shrink:0;margin-left:auto;transition:all .15s}
.goal-chip-check.on{background:var(--teal);border-color:var(--teal)}
.theme-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.theme-swatch{width:100%;aspect-ratio:1;border-radius:14px;cursor:pointer;display:grid;place-items:center;border:3px solid transparent;transition:all .15s;position:relative}
.theme-swatch.sel{border-color:var(--t1);transform:scale(1.05)}
.theme-swatch-check{font-size:18px;color:white;text-shadow:0 1px 3px rgba(0,0,0,.3)}
@media(min-width:430px){
  .auth-screen{padding:40px 24px}
  .onboard-screen{max-width:430px;margin:0 auto}
}
@media(min-width:768px){
  .scroll,.auth-screen,.onboard-screen{max-width:480px;margin:0 auto}
  .tabbar{max-width:480px;left:50%;transform:translateX(-50%);border-radius:20px 20px 0 0}
}
@keyframes bgPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.7}}
@keyframes emojiPop{from{transform:scale(.3) rotate(-15deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
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
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
      </div>
      <span className="auth-app-name">MediTrack</span>
    </div>
  );
}
