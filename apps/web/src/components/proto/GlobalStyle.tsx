import { rgba } from "../../theme/theme";
import type { Theme } from "../../theme/theme";

// Ported exactly from stitchd-v9.jsx lines 1546-1579 (minus the @import,
// which lives in index.html instead so it's not re-fetched on every render).
export function GlobalStyle({ T }: { T: Theme }) {
  return (
    <style>{`
      *{scrollbar-width:thin;scrollbar-color:${rgba(T.accent, 0.4)} transparent}
      ::-webkit-scrollbar{height:6px;width:6px}::-webkit-scrollbar-thumb{background:${rgba(T.accent, 0.35)};border-radius:3px}
      @keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes riseIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      .rise{animation:rise .3s cubic-bezier(.16,1,.3,1)}
      .stagger>*{animation:riseIn .34s cubic-bezier(.16,1,.3,1) backwards}
      .stagger>*:nth-child(1){animation-delay:.02s}.stagger>*:nth-child(2){animation-delay:.06s}
      .stagger>*:nth-child(3){animation-delay:.1s}.stagger>*:nth-child(4){animation-delay:.14s}
      .stagger>*:nth-child(5){animation-delay:.18s}.stagger>*:nth-child(6){animation-delay:.22s}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
      @keyframes sheen{0%{background-position:-160% 0}100%{background-position:260% 0}}
      .shimmer{background:linear-gradient(100deg,transparent 20%,${rgba(T.mode === "dark" ? "#ffffff" : "#000000", 0.06)} 40%,transparent 60%);background-size:220% 100%;animation:sheen 1.3s ease-in-out infinite}
      .tnum{font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
      .lift{transition:transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s ease-out}
      .lift:hover{transform:translateY(-2px)}
      .press{transition:transform .12s cubic-bezier(.16,1,.3,1)}
      .press:active{transform:scale(.97)}
      button{cursor:pointer}
      button:focus-visible,input:focus-visible,a:focus-visible,[tabindex]:focus-visible{outline:2px solid ${T.accent};outline-offset:2px;border-radius:6px}
      input[type=range]{accent-color:${T.accent}}
      @media (prefers-reduced-motion:reduce){
        *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
        .lift:hover{transform:none}
      }
      @media print{
        body{background:#fff!important}
        body *{visibility:hidden!important}
        .print-area,.print-area *{visibility:visible!important}
        .print-area{position:absolute!important;left:0;top:0;width:100%!important;padding:0!important;color:#111!important}
        .no-print{display:none!important}
      }
    `}</style>
  );
}
