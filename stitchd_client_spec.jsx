import { useState } from "react";

// ─── Design tokens extracted from prototype ───────────────────────────
const DS = {
  colors: {
    bgPrimary:      "#0a0a10",
    bgCard:         "rgba(16, 16, 24, 0.92)",
    bgCardHover:    "rgba(24, 24, 36, 0.98)",
    bgSidebar:      "rgba(14, 14, 22, 0.95)",
    accentPurple:   "#7C3AED",
    accentPurpleL:  "#9F67FF",
    accentGold:     "#FFD700",
    statusSecured:  "#10B981",
    statusBooked:   "#F59E0B",
    statusOptional: "#7C3AED",
    statusRisk:     "#EF4444",
    statusPending:  "#94A3B8",
    textPrimary:    "#FFFFFF",
    textSecondary:  "rgba(255,255,255,0.60)",
    textTertiary:   "rgba(255,255,255,0.35)",
    border:         "rgba(255,255,255,0.08)",
    borderCard:     "rgba(255,255,255,0.12)",
  }
};

const TABS = ["VISION", "LAYOUT", "COMPONENTS", "STATES", "DATA MODEL", "INTERACTIONS", "INTEGRATIONS"];

function Badge({ text, color, bg, pulse }) {
  return (
    <span style={{
      fontSize: 10, padding: "2px 8px", borderRadius: 4,
      background: bg || "#1a1a2e", color: color || "#fff",
      fontWeight: 600, letterSpacing: ".04em", whiteSpace: "nowrap",
      boxShadow: pulse ? `0 0 0 2px ${color}40` : "none",
      display: "inline-block"
    }}>{text}</span>
  );
}

function Swatch({ name, hex, note }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: hex, border: "1px solid rgba(255,255,255,.1)", flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#fff", fontFamily: "monospace" }}>{hex}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>{name}{note ? ` — ${note}` : ""}</div>
      </div>
    </div>
  );
}

function PropRow({ prop, type, required, desc, example }) {
  return (
    <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,.06)" }}>
      <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: 11, color: "#9F67FF" }}>{prop}</td>
      <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: 11, color: "#FFD700" }}>{type}</td>
      <td style={{ padding: "6px 8px", fontSize: 10 }}>{required ? <Badge text="required" color="#EF4444" bg="#3f0000" /> : <Badge text="optional" color="#6b7280" bg="#1f2937" />}</td>
      <td style={{ padding: "6px 8px", fontSize: 11, color: "rgba(255,255,255,.6)", lineHeight: 1.4 }}>{desc}</td>
      {example && <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,.4)" }}>{example}</td>}
    </tr>
  );
}

function PropsTable({ rows, showExample }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 8, border: "0.5px solid rgba(255,255,255,.1)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "rgba(255,255,255,.04)", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
            <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em" }}>Prop</th>
            <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em" }}>Type</th>
            <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em" }}>Required</th>
            <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em" }}>Description</th>
            {showExample && <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 10, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em" }}>Example</th>}
          </tr>
        </thead>
        <tbody>{rows.map((r, i) => <PropRow key={i} {...r} />)}</tbody>
      </table>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#7C3AED" }}>{title}</div>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #7C3AED40, transparent)" }} />
      </div>
      {children}
    </div>
  );
}

function CodeBlock({ code, lang = "tsx" }) {
  return (
    <pre style={{
      background: "rgba(0,0,0,.6)", borderRadius: 8, padding: "12px 14px",
      fontSize: 11, color: "#e2e8f0", overflowX: "auto", lineHeight: 1.6,
      border: "0.5px solid rgba(255,255,255,.08)", fontFamily: "monospace",
      margin: "8px 0"
    }}>{code}</pre>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,.04)", border: "0.5px solid rgba(255,255,255,.1)",
      borderRadius: 10, padding: "12px 14px", ...style
    }}>{children}</div>
  );
}

function ComponentSpec({ name, desc, from, props, notes = [], children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "0.5px solid rgba(255,255,255,.1)", borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer",
        background: open ? "rgba(124,58,237,.1)" : "rgba(255,255,255,.03)"
      }}>
        <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: "#9F67FF" }}>{name}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)", flex: 1 }}>{desc}</span>
        {from && <Badge text={from} color="#7C3AED" bg="#1e0a3c" />}
        <span style={{ color: "rgba(255,255,255,.3)", fontSize: 14 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "12px 14px", borderTop: "0.5px solid rgba(255,255,255,.06)" }}>
          {props && <><div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Props</div><PropsTable rows={props} /><br /></>}
          {notes.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 11, color: "rgba(255,255,255,.6)", lineHeight: 1.5 }}>
              <span style={{ color: "#7C3AED", flexShrink: 0 }}>→</span><span>{n}</span>
            </div>
          ))}
          {children}
        </div>
      )}
    </div>
  );
}

// ─── TAB CONTENT ────────────────────────────────────────────────────────

function VisionTab() {
  return (
    <div>
      <Section title="Design aesthetic — extracted from prototype">
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#fff", marginBottom: 8 }}>Theme: Premium dark — "luxury event intelligence"</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11, color: "rgba(255,255,255,.6)", lineHeight: 1.6 }}>
            <div><span style={{ color: "#FFD700", fontWeight: 500 }}>Background:</span> Near-black (#0a0a10) with bokeh/fairy lights atmospheric background image. Cards sit on top with semi-transparent dark backgrounds.</div>
            <div><span style={{ color: "#FFD700", fontWeight: 500 }}>Accent:</span> Purple (#7C3AED) is primary accent — nav underline, status badges, progress bars, glow effects. Gold (#FFD700) for stars, section headers, alerts.</div>
            <div><span style={{ color: "#FFD700", fontWeight: 500 }}>Cards:</span> Full-bleed background images with a gradient overlay (dark bottom 60%). Text always on the dark gradient portion.</div>
            <div><span style={{ color: "#FFD700", fontWeight: 500 }}>Typography:</span> Logo uses a custom dot/pixel-style display font. Nav in wide-tracked uppercase. OVR numbers very large bold. All other text in a clean sans-serif (e.g. Inter or DM Sans).</div>
          </div>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <Card>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Core palette</div>
            {[
              ["#0a0a10", "Background primary"],
              ["rgba(16,16,24,.92)", "Card background"],
              ["#7C3AED", "Accent purple (primary)"],
              ["#9F67FF", "Accent purple light"],
              ["#FFD700", "Gold / stars / alerts"],
            ].map(([hex, name]) => <Swatch key={hex} hex={hex} name={name} />)}
          </Card>
          <Card>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Status colours</div>
            {[
              ["#10B981", "SECURED (green)"],
              ["#F59E0B", "BOOKED (amber)"],
              ["#7C3AED", "OPTIONAL (purple)"],
              ["#EF4444", "AT RISK (red)"],
              ["#94A3B8", "PENDING (slate)"],
            ].map(([hex, name]) => <Swatch key={name} hex={hex} name={name} />)}
          </Card>
        </div>
      </Section>

      <Section title="Design tokens (CSS variables)">
        <CodeBlock code={`/* _tokens.css */
:root {
  /* Backgrounds */
  --bg-primary:        #0a0a10;
  --bg-card:           rgba(16, 16, 24, 0.92);
  --bg-card-hover:     rgba(24, 24, 36, 0.98);
  --bg-sidebar:        rgba(14, 14, 22, 0.95);
  --bg-overlay:        rgba(0, 0, 0, 0.65);
  --bg-glass:          rgba(255, 255, 255, 0.04);

  /* Accents */
  --accent:            #7C3AED;
  --accent-light:      #9F67FF;
  --accent-glow:       rgba(124, 58, 237, 0.35);
  --gold:              #FFD700;
  --gold-dim:          rgba(255, 215, 0, 0.7);

  /* Status */
  --status-secured:    #10B981;
  --status-booked:     #F59E0B;
  --status-optional:   #7C3AED;
  --status-risk:       #EF4444;
  --status-pending:    #94A3B8;
  --status-recommended:#9F67FF;

  /* Text */
  --text-primary:      #FFFFFF;
  --text-secondary:    rgba(255, 255, 255, 0.60);
  --text-tertiary:     rgba(255, 255, 255, 0.35);
  --text-disabled:     rgba(255, 255, 255, 0.20);

  /* Borders */
  --border:            rgba(255, 255, 255, 0.08);
  --border-card:       rgba(255, 255, 255, 0.12);
  --border-active:     rgba(124, 58, 237, 0.60);

  /* Spacing */
  --space-xs:  4px;  --space-sm:  8px;  --space-md:  14px;
  --space-lg:  20px; --space-xl:  28px; --space-2xl: 40px;

  /* Radius */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-xl: 20px;

  /* Shadows */
  --shadow-card:   0 4px 24px rgba(0, 0, 0, 0.50);
  --shadow-glow:   0 0 0 2px var(--accent), 0 0 20px var(--accent-glow);
  --shadow-gold:   0 0 12px rgba(255, 215, 0, 0.25);

  /* Transitions */
  --transition:    all 0.18s ease;
  --transition-slow: all 0.35s ease;
}`} />
      </Section>
    </div>
  );
}

function LayoutTab() {
  return (
    <div>
      <Section title="Page structure">
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>
            <div style={{ color: "#fff", fontWeight: 500, marginBottom: 6 }}>Grid layout: 3 columns</div>
            <div>→ <strong style={{ color: "#9F67FF" }}>Left + Centre (main):</strong> flex: 1 — squad sections, event content</div>
            <div>→ <strong style={{ color: "#FFD700" }}>Right sidebar:</strong> fixed width 280px — time, budget, weather widgets</div>
            <div style={{ marginTop: 8, color: "rgba(255,255,255,.4)" }}>Responsive: sidebar collapses below 1100px. Cards reflow to 2-col at 768px, 1-col at 480px.</div>
          </div>
        </Card>
        <CodeBlock code={`/* App shell layout */
.stitchd-app {
  min-height: 100vh;
  background: var(--bg-primary);
  background-image: url('/assets/bokeh-bg.jpg'); /* atmospheric background */
  background-size: cover;
  background-attachment: fixed;
}

.page-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "main   sidebar"
    "statusbar statusbar";
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header    { grid-area: header; }
.page-main      { grid-area: main;   padding: 20px 20px 20px 24px; }
.page-sidebar   { grid-area: sidebar; padding: 20px 20px 20px 0; }
.page-statusbar { grid-area: statusbar; }

@media (max-width: 1100px) {
  .page-layout { grid-template-columns: 1fr; }
  .page-sidebar { display: none; } /* collapsed — show as bottom sheet */
}`} />
      </Section>

      <Section title="Navigation tabs — 5 screens">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { tab: "SQUAD", path: "/event/:id/squad", desc: "Main event planning view. Core Squad + Support Squad cards. This is the prototype screen — the home base.", primary: true },
            { tab: "SUPPLIERS", path: "/event/:id/suppliers", desc: "Browse full supplier catalogue. Filter by category, price, vibe, rating, availability. Search. Compare. FIFA card grid view." },
            { tab: "BUDGET", path: "/event/:id/budget", desc: "Detailed budget breakdown. Per-slot allocation vs actual. Spend tracking. Payment schedule. Outstanding deposits. Family contribution wallet." },
            { tab: "INSPIRATION", path: "/event/:id/inspiration", desc: "Mood board builder. Style references. AI vibe analysis. Saved looks. Links to matching suppliers. Social sharing." },
            { tab: "MARKETPLACE", path: "/marketplace", desc: "Open vendor discovery across all events. Not event-specific. Browse all verified suppliers. Cross-event supplier ads. Venue tours." },
          ].map(item => (
            <div key={item.tab} style={{
              border: `0.5px solid ${item.primary ? "#7C3AED" : "rgba(255,255,255,.1)"}`,
              borderTop: `2px solid ${item.primary ? "#7C3AED" : "rgba(255,255,255,.15)"}`,
              borderRadius: 10, padding: "10px 12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: item.primary ? "#9F67FF" : "#fff" }}>{item.tab}</span>
                {item.primary && <Badge text="Phase 1" color="#10B981" bg="#052e1a" />}
              </div>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,.35)", marginBottom: 5 }}>{item.path}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sidebar widgets — right panel">
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", lineHeight: 1.7, marginBottom: 10 }}>3 stacked widgets. Each is a self-contained component. Coach card sits above in the header.</div>
        {[
          { name: "TimeToEventWidget", order: 1, desc: "Countdown in days. Event date. Purple progress bar (% of total planning window elapsed). Clock icon." },
          { name: "BudgetOverviewWidget", order: 2, desc: "Total budget (large number). Allocated amount. % allocated (progress bar). Remaining amount. Briefcase icon." },
          { name: "WeatherForecastWidget", order: 3, desc: "Current day weather + temp. 5-day mini forecast with cloud icons + rain %. Chance of rain % highlighted in purple. If rain > 50% on event day → triggers WeatherAlertCard in Support Squad." },
        ].map(w => (
          <div key={w.name} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "0.5px solid rgba(255,255,255,.06)" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#7C3AED", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{w.order}</div>
            <div>
              <div style={{ fontSize: 12, fontFamily: "monospace", color: "#9F67FF", marginBottom: 2 }}>{w.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", lineHeight: 1.4 }}>{w.desc}</div>
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function ComponentsTab() {
  return (
    <div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginBottom: 16, lineHeight: 1.5 }}>
        Click any component to expand its full spec, props, and implementation notes.
      </div>

      <Section title="AppHeader">
        <ComponentSpec name="AppHeader" desc="Top navigation bar — logo, nav tabs, coach card" from="Global"
          props={[
            { prop: "eventId", type: "string", required: true, desc: "Current event ID for nav links" },
            { prop: "activeTab", type: "NavTab", required: true, desc: "'squad' | 'suppliers' | 'budget' | 'inspiration' | 'marketplace'" },
            { prop: "coach", type: "Coach", required: false, desc: "Assigned coach object. If null, show 'Find a Coach' CTA" },
            { prop: "onTabChange", type: "(tab: NavTab) => void", required: true, desc: "Navigation handler" },
          ]}
          notes={[
            "STITCHD logo uses custom dot/pixel-style font — implement as SVG or use a custom font like 'Silkscreen' from Google Fonts as closest match",
            "'WEDDING LABOUR' subtitle in wide-tracked uppercase — update dynamically based on event.type ('LOBOLA COORDINATION', 'BIRTHDAY PLANNING', etc.)",
            "Active nav tab shows purple underline border-bottom. No background fill — underline only.",
            "Coach card: photo (circle crop), 'COACH' label in small caps, name bold, role subdued. 'View Profile >' button with right chevron.",
            "On mobile: hamburger menu replaces nav tabs. Coach card collapses to avatar only.",
          ]} />
      </Section>

      <Section title="VendorCard — Core Squad (large)">
        <ComponentSpec name="VendorCard" desc="Primary squad card — full image, OVR, status, actions, price" from="Squad page"
          props={[
            { prop: "vendor", type: "Vendor", required: true, desc: "Full vendor object" },
            { prop: "slot", type: "EventSlot", required: true, desc: "The slot this card fills (determines category label)" },
            { prop: "status", type: "SlotStatus", required: true, desc: "'secured' | 'booked' | 'optional' | 'recommended' | 'at_risk' | 'pending'" },
            { prop: "onSwap", type: "() => void", required: true, desc: "Opens supplier swap drawer/modal" },
            { prop: "onMessage", type: "() => void", required: true, desc: "Opens message thread with supplier" },
            { prop: "onViewContract", type: "() => void", required: false, desc: "Opens contract/quote document" },
            { prop: "onViewCalendar", type: "() => void", required: false, desc: "Opens shared calendar/availability" },
          ]}
          notes={[
            "Card dimensions: ~200px wide × 300px tall (core squad). Adjust to fit 6 cards in one row with 12px gap on 1200px canvas.",
            "Background: vendor.heroImage as CSS background-image. Gradient overlay: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0) 100%)",
            "OVR number: top-left, 48px bold white. Category label below OVR: 10px uppercase tracking, white/70.",
            "Status badge: top-left below OVR area — see Status States section for exact styling per status.",
            "Bottom section (on dark gradient): vendor.name bold 15px, vendor.subcategory 11px secondary, star rating row, 5 action icons, price bold.",
            "Action icons row (5 icons from the prototype): 1) Contacts/Team (view contacts), 2) Chat bubble (message), 3) Document (contract/quote), 4) Calendar check (timeline), 5) Bell or Settings. Use react-feather or heroicons.",
            "Hover state: card lifts slightly (transform: translateY(-3px)), border brightens to rgba(255,255,255,.2).",
            "RECOMMENDED status: pulsing purple border + glow. Animate with @keyframes pulse-border.",
          ]}>
          <CodeBlock code={`// Status badge variants
const STATUS_CONFIG = {
  secured:     { label: "SECURED",     color: "#10B981", bg: "rgba(16,185,129,.15)" },
  booked:      { label: "BOOKED",      color: "#F59E0B", bg: "rgba(245,158,11,.15)" },
  optional:    { label: "OPTIONAL",    color: "#7C3AED", bg: "rgba(124,58,237,.15)" },
  recommended: { label: "RECOMMENDED", color: "#9F67FF", bg: "rgba(124,58,237,.20)", pulse: true },
  at_risk:     { label: "AT RISK",     color: "#EF4444", bg: "rgba(239,68,68,.15)" },
  pending:     { label: "PENDING",     color: "#94A3B8", bg: "rgba(148,163,184,.12)" },
};

// Pulse animation for RECOMMENDED
@keyframes pulse-border {
  0%   { box-shadow: 0 0 0 0px rgba(124,58,237,0.5); }
  50%  { box-shadow: 0 0 0 4px rgba(124,58,237,0.2); }
  100% { box-shadow: 0 0 0 0px rgba(124,58,237,0); }
}
.card-recommended { animation: pulse-border 2s infinite; }`} />
        </ComponentSpec>
      </Section>

      <Section title="SupportVendorCard (smaller)">
        <ComponentSpec name="SupportVendorCard" desc="Support squad card — smaller, same anatomy as VendorCard" from="Squad page — support squad"
          props={[
            { prop: "vendor", type: "Vendor", required: true, desc: "Vendor object" },
            { prop: "slot", type: "EventSlot", required: true, desc: "Support slot" },
            { prop: "status", type: "SlotStatus", required: true, desc: "Usually 'optional' or 'recommended'" },
            { prop: "onAdd", type: "() => void", required: true, desc: "Add this vendor to the event (for optional slots)" },
          ]}
          notes={[
            "Dimensions: ~160px wide × 240px tall. 5 in a row with an ADD SUPPLIER card at the end.",
            "Same image + gradient overlay approach as VendorCard but scaled down.",
            "Shows a '+' icon button bottom-right to add to squad (for optional status).",
            "RECOMMENDED card gets purple glow border + 'RECOMMENDED' badge with ⚡ lightning icon prefix.",
            "OVR number slightly smaller: 38px bold.",
          ]} />
      </Section>

      <Section title="AddSupplierCard">
        <ComponentSpec name="AddSupplierCard" desc="Empty state card — plus icon, 'ADD SUPPLIER' label" from="Squad page — support squad"
          props={[
            { prop: "onAdd", type: "() => void", required: true, desc: "Opens supplier browse/search modal" },
            { prop: "slotType", type: "string", required: false, desc: "If set, opens browse pre-filtered to that category" },
          ]}
          notes={[
            "Same dimensions as SupportVendorCard.",
            "Dashed border: border: 1.5px dashed rgba(255,255,255,.2)",
            "Center: large + icon (32px, rgba(255,255,255,.3)) above 'ADD SUPPLIER' text (10px uppercase tracking).",
            "Hover: border brightens, + icon becomes white, subtle background fill.",
          ]} />
      </Section>

      <Section title="WeatherAlertCard">
        <ComponentSpec name="WeatherAlertCard" desc="AI-driven contextual recommendation card in support squad" from="Squad page — support squad (conditional)"
          props={[
            { prop: "alertType", type: "WeatherAlertType", required: true, desc: "'rain' | 'heat' | 'wind' | 'cold'" },
            { prop: "probability", type: "number", required: true, desc: "e.g. 65 (for 65% rain chance)" },
            { prop: "recommendation", type: "string", required: true, desc: "AI-generated recommendation text" },
            { prop: "ctaLabel", type: "string", required: true, desc: "e.g. 'View Tent Suppliers'" },
            { prop: "onCta", type: "() => void", required: true, desc: "CTA action — opens filtered supplier browse" },
          ]}
          notes={[
            "Only renders when weather conditions cross a threshold: rain > 40%, heat > 35°C, wind > 30km/h.",
            "Styled differently from vendor cards: no image background. Dark card with gold star/sparkle icon.",
            "Header: ✦ WEATHER ALERT in gold bold uppercase.",
            "Body text: white primary weight. Recommendation text: secondary weight.",
            "CTA button: 'View Tent Suppliers >' — purple text, no background, right chevron.",
            "This card is injected into the support squad grid (not a sidebar card).",
          ]} />
      </Section>

      <Section title="Sidebar widgets">
        <ComponentSpec name="TimeToEventWidget" desc="Countdown to event date" from="Right sidebar"
          props={[
            { prop: "eventDate", type: "Date", required: true, desc: "Target event date" },
            { prop: "planningStartDate", type: "Date", required: true, desc: "When planning began — for progress bar calculation" },
          ]}
          notes={[
            "Large countdown number: 56px bold white. 'DAYS TO GO' in 10px uppercase tracking below.",
            "Progress bar: purple, full width. Value = (days elapsed / total planning days) × 100.",
            "Event date formatted as: '24 MAY 2025' in secondary text.",
            "Clock icon (⏱) top-left, 'TIME TO WEDDING' label — update based on event type.",
          ]} />

        <ComponentSpec name="BudgetOverviewWidget" desc="Budget allocation at a glance" from="Right sidebar"
          props={[
            { prop: "budgetTotal", type: "number", required: true, desc: "Total event budget in ZAR" },
            { prop: "budgetAllocated", type: "number", required: true, desc: "Sum of all confirmed/booked slot costs" },
          ]}
          notes={[
            "Allocated amount: 32px bold white (e.g. 'R320,000'). 'of R400,000' in secondary below.",
            "Progress bar: purple. Value = (allocated / total) × 100. Turn red when > 95%.",
            "Two-line footer: '80% Allocated' left + 'R80,000 Left' right.",
            "Briefcase icon top-left, 'BUDGET OVERVIEW' label.",
          ]} />

        <ComponentSpec name="WeatherForecastWidget" desc="Event day weather + 5-day forecast" from="Right sidebar"
          props={[
            { prop: "forecast", type: "WeatherForecast[]", required: true, desc: "Array of 5 daily forecasts from weather API" },
            { prop: "eventDate", type: "Date", required: true, desc: "Used to highlight the event day in the forecast" },
          ]}
          notes={[
            "Current conditions: large weather icon (48px) + temp + condition string.",
            "'Chance of Rain: 65%' — percentage in accent purple if > 40%, green if < 20%.",
            "5-day strip: day abbreviation, cloud/sun icon, temperature, rain %. Event day highlighted.",
            "Data source: OpenWeatherMap API or WeatherAPI.com. Cache for 3h. Only load when event date is < 10 days away.",
          ]} />
      </Section>

      <Section title="StatusBar (bottom)">
        <ComponentSpec name="StatusBar" desc="Full-width bottom metrics bar — 5 KPIs + messages button" from="Global — Squad page"
          props={[
            { prop: "event", type: "Event", required: true, desc: "Full event object for metric computation" },
          ]}
          notes={[
            "Dark full-width bar: background rgba(0,0,0,.7) with subtle top border.",
            "5 metric items + 1 action button (View Messages).",
            "Each metric: icon (24px), metric title (10px uppercase tracking), bold value, subtitle text.",
            "TIMELINE SYNC value: 'On Track' in green or 'Behind' in amber or 'At Risk' in red.",
            "COMMUNICATION value: 'Centralised' in purple.",
            "View Messages button: pill shape, primary purple background, white badge with unread count.",
          ]}>
          <CodeBlock code={`// 5 StatusBar metrics (computed from event object)
const METRICS = [
  {
    id: "secured",
    icon: "ShieldCheck",
    label: "SECURED",
    value: (e) => \`\${e.slots.filter(s => s.status === 'secured').length}/\${e.slots.length}\`,
    sub:   "Essential suppliers are locked in.",
  },
  {
    id: "chemistry",
    icon: "Users",
    label: "SQUAD CHEMISTRY",
    value: (e) => \`\${e.compatibilityScore}%\`,
    sub:   "Strong connections for a seamless day.",
    color: (v) => parseInt(v) >= 80 ? "var(--status-secured)" : "var(--status-booked)",
  },
  {
    id: "labour",
    icon: "UserCheck",
    label: "LABOUR TRACKER",
    value: (e) => \`\${e.confirmedContacts}/\${e.totalRequiredContacts}\`,
    sub:   "Your team is almost complete.",
  },
  {
    id: "timeline",
    icon: "CalendarCheck",
    label: "TIMELINE SYNC",
    value: (e) => e.timelineStatus, // "On Track" | "Behind" | "At Risk"
    sub:   "All suppliers aligned with your schedule.",
    colorMap: { "On Track": "var(--status-secured)", "Behind": "var(--status-booked)", "At Risk": "var(--status-risk)" },
  },
  {
    id: "comms",
    icon: "MessageSquare",
    label: "COMMUNICATION",
    value: () => "Centralised",
    sub:   "All conversations in one place.",
    color: () => "var(--accent-light)",
  },
];`} />
        </ComponentSpec>
      </Section>

      <Section title="CoachProfileCard">
        <ComponentSpec name="CoachProfileCard" desc="Assigned Event Coach — top right header card" from="AppHeader"
          props={[
            { prop: "coach", type: "Coach | null", required: true, desc: "Assigned coach. If null, show 'Assign Coach' prompt." },
            { prop: "onViewProfile", type: "() => void", required: true, desc: "Opens coach profile modal" },
          ]}
          notes={[
            "Layout: photo circle (48px) left, text right: 'COACH' label tiny, name bold, role secondary.",
            "'View Profile >' button with right chevron arrow.",
            "Dark card background, subtle border: rgba(255,255,255,.1).",
            "If no coach assigned: show purple 'Find a Coach' CTA button instead.",
          ]} />
      </Section>
    </div>
  );
}

function StatesTab() {
  const statuses = [
    { status: "SECURED", color: "#10B981", bg: "rgba(16,185,129,.15)", desc: "Vendor confirmed, contract signed, deposit paid. Final state.", icon: "✓", badgeStyle: "solid" },
    { status: "BOOKED", color: "#F59E0B", bg: "rgba(245,158,11,.15)", desc: "Vendor selected and contacted. Awaiting contract or deposit.", icon: "⏳", badgeStyle: "solid" },
    { status: "OPTIONAL", color: "#7C3AED", bg: "rgba(124,58,237,.15)", desc: "Support squad slot not yet committed. User can add.", icon: "+", badgeStyle: "solid" },
    { status: "RECOMMENDED", color: "#9F67FF", bg: "rgba(124,58,237,.20)", desc: "AI-recommended. Pulsing purple border. Lightning bolt icon prefix.", icon: "⚡", badgeStyle: "pulse" },
    { status: "AT RISK", color: "#EF4444", bg: "rgba(239,68,68,.15)", desc: "Vendor confirmed but flagged: no response, conflict detected, or deadline missed.", icon: "⚠", badgeStyle: "solid" },
    { status: "PENDING", color: "#94A3B8", bg: "rgba(148,163,184,.12)", desc: "Enquiry sent, awaiting vendor response.", icon: "◷", badgeStyle: "solid" },
    { status: "EMPTY", color: "rgba(255,255,255,.3)", bg: "rgba(255,255,255,.05)", desc: "Required slot not filled. Red warning dot on slot. High urgency if event < 60 days.", icon: "!", badgeStyle: "dashed" },
  ];

  return (
    <div>
      <Section title="Slot status states">
        {statuses.map(s => (
          <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,.06)" }}>
            <div style={{
              fontSize: 10, padding: "3px 10px", borderRadius: 5, fontWeight: 700, letterSpacing: ".05em",
              color: s.color, background: s.bg, minWidth: 110, textAlign: "center",
              border: s.badgeStyle === "dashed" ? `1px dashed ${s.color}` : `1px solid ${s.color}40`,
              boxShadow: s.badgeStyle === "pulse" ? `0 0 8px ${s.color}50` : "none"
            }}>{s.icon} {s.status}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", flex: 1, lineHeight: 1.4 }}>{s.desc}</div>
          </div>
        ))}
      </Section>

      <Section title="Event completion score logic">
        <CodeBlock code={`// Computed field: event.completionScore (0–100)
function calcCompletionScore(event: Event): number {
  const slots = event.slots;
  const required = slots.filter(s => s.isRequired);
  const optional = slots.filter(s => !s.isRequired);

  const filledRequired  = required.filter(s => s.status !== 'empty').length;
  const confirmedSlots  = slots.filter(s => ['secured','booked'].includes(s.status)).length;
  const depositsPaid    = slots.filter(s => s.depositPaid).length;

  const score =
    (filledRequired / required.length)         * 50 +  // slot coverage
    (confirmedSlots / slots.length)             * 30 +  // confirmation rate
    (depositsPaid   / (confirmedSlots || 1))   * 20;   // financial commitment

  return Math.round(score);
}

// Squad Chemistry = avg compatibility_score of all vendor pairs in the event
// Fetched from DB table: compatibility_scores(vendor_a, vendor_b, event_type)`} />
      </Section>

      <Section title="Card action states">
        {[
          { state: "Default", desc: "Static card. Subtle border rgba(255,255,255,.12). No glow." },
          { state: "Hover", desc: "translateY(-3px). Border brightens to rgba(255,255,255,.25). Transition 180ms." },
          { state: "Active / click", desc: "translateY(-1px). Slight scale(0.98). Ripple effect on click." },
          { state: "RECOMMENDED pulsing", desc: "CSS animation: 2s infinite pulse. Border: 0 0 0 2px #9F67FF. Glow: 0 0 20px rgba(124,58,237,.4)." },
          { state: "AT RISK", desc: "Subtle red glow on border. Small ⚠ icon overlay top-right." },
          { state: "Loading skeleton", desc: "Dark shimmer placeholder. Same card dimensions. Animate background gradient." },
        ].map(item => (
          <div key={item.state} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "0.5px solid rgba(255,255,255,.06)" }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#9F67FF", minWidth: 150 }}>{item.state}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)", lineHeight: 1.4 }}>{item.desc}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}

function DataModelTab() {
  return (
    <div>
      <Section title="TypeScript interfaces — client-side">
        <CodeBlock code={`// types/stitchd.ts

export type EventType =
  | 'wedding' | 'lobola' | 'umembeso' | 'umabo'
  | 'birthday' | 'baby_shower' | 'kids_party'
  | 'funeral' | 'corporate' | 'church';

export type SlotType =
  | 'planner' | 'venue' | 'catering' | 'photography'
  | 'florals' | 'entertainment' | 'mc' | 'hair_makeup'
  | 'transport' | 'decor' | 'tents' | 'sound'
  | 'cattle_sourcing' | 'elders_host' | 'traditional_attire';

export type SlotStatus =
  | 'empty' | 'pending' | 'booked' | 'secured' | 'at_risk' | 'optional' | 'recommended';

export type NavTab = 'squad' | 'suppliers' | 'budget' | 'inspiration' | 'marketplace';

export interface Event {
  id:                string;
  userId:            string;
  coachId?:          string;
  type:              EventType;
  name:              string;           // "Merc & Edna's Wedding"
  date:              string;           // ISO date
  guestCount:        number;
  location:          string;
  budgetTotal:       number;
  vibeTags:          string[];
  culturalFlags:     Record<string, boolean>;
  slots:             EventSlot[];
  completionScore:   number;           // computed 0–100
  compatibilityScore:number;           // computed 0–100
  timelineStatus:    'on_track' | 'behind' | 'at_risk';
  confirmedContacts: number;
  totalRequiredContacts: number;
  unreadMessages:    number;
  createdAt:         string;
}

export interface EventSlot {
  id:           string;
  eventId:      string;
  slotType:     SlotType;
  label:        string;               // "Wedding Planner", "Venue", etc.
  isRequired:   boolean;
  isCore:       boolean;              // true = Core Squad, false = Support Squad
  budgetPct:    number;               // 0–1
  budgetAmount: number;               // derived from event.budgetTotal * budgetPct
  vendor?:      Vendor;
  status:       SlotStatus;
  confirmedAt?: string;
  depositPaid:  boolean;
  sequenceOrder:number;
}

export interface Vendor {
  id:           string;
  name:         string;
  subcategory:  string;               // "Premium Venue", "Photo & Video", etc.
  category:     SlotType;
  heroImage:    string;               // URL for card background
  ovrScore:     number;               // 0–100
  stats: {
    rel: number; pre: number; val: number;
    com: number; cre: number; exp: number;
  };
  cardTier:     'bronze' | 'silver' | 'gold' | 'elite';
  isInForm:     boolean;
  rating:       number;               // 0–5
  reviewCount:  number;
  priceFrom:    number;
  suburb:       string;
  vibeTags:     string[];
  form:         number[];             // last 5 event scores [4,5,5,4,5]
  totalEvents:  number;
  isVerified:   boolean;
}

export interface Coach {
  id:           string;
  name:         string;
  role:         string;               // "Lead Planner & Strategist"
  photo:        string;               // URL
  rating:       number;
  eventsCompleted: number;
  specialisations: EventType[];
  ratePerEvent: number;
}

export interface WeatherForecast {
  date:         string;
  dayAbbr:      string;               // "WED", "THU"
  condition:    string;               // "Partly Cloudy"
  icon:         string;               // icon key
  tempC:        number;
  rainChancePct:number;
}

export interface WeatherData {
  current:      WeatherForecast;
  forecast:     WeatherForecast[];    // 5-day
  isEventDay:   boolean;
  shouldAlert:  boolean;              // rain > 40% OR heat > 35 OR wind > 30
  alertType?:   'rain' | 'heat' | 'wind';
  alertMessage?:string;
}`} />
      </Section>
    </div>
  );
}

function InteractionsTab() {
  return (
    <div>
      <Section title="Key user interactions">
        {[
          {
            action: "Swap vendor",
            trigger: "Click 'Swap' on any vendor card action row",
            behavior: "Opens a bottom sheet / modal: 'Swap [Category]'. Shows alternative vendors for that slot filtered by: same category, similar budget, compatible vibe tags. Cards show compatibility score vs current squad.",
            components: "SwapDrawer (bottom sheet) → VendorCard (compact) × N",
          },
          {
            action: "Add support supplier",
            trigger: "Click '+' on SupportVendorCard or AddSupplierCard",
            behavior: "Opens supplier browse modal pre-filtered to that slot's category. User picks vendor. Card animates into squad with 'BOOKED' status. Budget updates live.",
            components: "SupplierBrowseModal → VendorCard (compact)",
          },
          {
            action: "Auto-pick",
            trigger: "Button: 'AI Auto-Pick Squad' (on empty event or from squad header)",
            behavior: "Calls AI matching endpoint. Loading state on all cards simultaneously. Cards populate with a staggered animation (150ms delay per card). Shows 'AI picked your squad' toast.",
            components: "LoadingCard × N → VendorCard with entrance animation",
          },
          {
            action: "Vendor clash",
            trigger: "Long press or right-click on vendor card → 'Compare'",
            behavior: "Enters 'compare mode'. First selected card gets purple ring. Tap second card of same category. Clash modal opens: stat bars side by side, winner highlighted, community choice %.",
            components: "ClashModal — full screen dark overlay",
          },
          {
            action: "View weather alert CTA",
            trigger: "Click 'View Tent Suppliers >' on WeatherAlertCard",
            behavior: "Opens SupplierBrowseModal pre-filtered to 'tents' category, sorted by rating. Badge: '⚡ Recommended for your wedding date'.",
            components: "SupplierBrowseModal with filter: slotType='tents'",
          },
          {
            action: "Message supplier",
            trigger: "Chat icon on any vendor card",
            behavior: "Opens message drawer (right-side panel or full modal on mobile). Shows conversation thread. Unread count badge on StatusBar 'COMMUNICATION' metric updates.",
            components: "MessageDrawer → MessageThread",
          },
        ].map(item => (
          <div key={item.action} style={{ marginBottom: 14, padding: "10px 12px", background: "rgba(255,255,255,.03)", borderRadius: 10, border: "0.5px solid rgba(255,255,255,.08)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#9F67FF", marginBottom: 4 }}>{item.action}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 5 }}>Trigger: <span style={{ color: "rgba(255,255,255,.6)" }}>{item.trigger}</span></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", lineHeight: 1.5, marginBottom: 5 }}>{item.behavior}</div>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,.35)" }}>Components: {item.components}</div>
          </div>
        ))}
      </Section>

      <Section title="Animation spec">
        <CodeBlock code={`// Card entrance (squad auto-fill)
@keyframes cardEntrance {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
.vendor-card { animation: cardEntrance 0.35s ease forwards; }
.vendor-card:nth-child(1) { animation-delay: 0ms; }
.vendor-card:nth-child(2) { animation-delay: 80ms; }
/* ... up to nth-child(6) at 400ms */

// Swap card transition
@keyframes cardSwap {
  0%   { opacity: 1; transform: scale(1); }
  40%  { opacity: 0; transform: scale(0.9) rotateY(90deg); }
  60%  { opacity: 0; transform: scale(0.9) rotateY(-90deg); }
  100% { opacity: 1; transform: scale(1); }
}

// Status badge change
@keyframes badgePop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}`} />
      </Section>
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div>
      <Section title="API endpoints — client calls">
        <CodeBlock code={`// API routes the frontend needs
// Base URL: https://api.stitchd.co.za/v1

// Events
GET    /events/:id                      // Full event with slots + vendors
PATCH  /events/:id                      // Update event settings
GET    /events/:id/completion-score     // Recompute score

// Slots
GET    /events/:id/slots                // All slots for event
PATCH  /events/:id/slots/:slotId        // Update slot status / vendor
POST   /events/:id/slots/:slotId/swap   // Swap vendor: { vendorId }

// Vendors / suppliers
GET    /vendors?category=venue&eventType=wedding&budget=85000&vibes=romantic
GET    /vendors/:id                     // Full vendor profile
GET    /vendors/:id/compatibility?withVendorId=xxx&eventType=wedding

// AI matching
POST   /ai/auto-pick                    // { eventId, sentiment, budget } → squad
POST   /ai/clash-summary               // { vendorA, vendorB } → recommendation text
POST   /ai/weather-recommendation      // { weatherData, eventType } → alert text

// Weather
GET    /weather?lat=&lng=&date=         // 10-day forecast for event location + date

// Messages
GET    /messages/event/:id              // All conversations for event
GET    /messages/thread/:vendorId       // Thread with specific vendor
POST   /messages/thread/:vendorId       // Send message
GET    /messages/unread-count/:eventId  // Unread badge count

// Coach
GET    /coaches?eventType=wedding&date= // Available coaches
GET    /coaches/:id                     // Coach profile
POST   /events/:id/assign-coach         // { coachId }`} />
      </Section>

      <Section title="Third-party integrations">
        {[
          {
            name: "Weather API",
            provider: "OpenWeatherMap (openweathermap.org/api) or WeatherAPI.com",
            purpose: "Power WeatherForecastWidget + trigger WeatherAlertCard",
            setup: "Fetch 10-day forecast for event GPS coordinates. Cache for 3h. Only load when event is < 10 days away. Key: process.env.WEATHER_API_KEY",
            endpoint: "GET /forecast?lat={lat}&lon={lon}&appid={key}&cnt=10&units=metric",
          },
          {
            name: "Image CDN",
            provider: "Cloudinary or AWS S3 + CloudFront",
            purpose: "Serve vendor hero images for card backgrounds. Generate responsive sizes.",
            setup: "Upload vendor images at 800×600px minimum. Generate: card (400×300), thumb (200×150). Use Cloudinary auto-format + quality.",
            endpoint: "https://res.cloudinary.com/{cloud}/image/upload/f_auto,q_auto,w_400/{vendor_id}",
          },
          {
            name: "Google Maps",
            provider: "Google Maps JavaScript API + Places API",
            purpose: "Venue location display on Budget tab. Distance from user to venue. Supplier location filtering.",
            setup: "Use Places Autocomplete for location input on event creation. Maps embed for venue display.",
          },
          {
            name: "WhatsApp Business API",
            provider: "Meta Cloud API",
            purpose: "Send notifications to customer: booking confirmed, supplier responded, deadline approaching, event day checklist.",
            setup: "Use official WhatsApp Cloud API. Templates for each notification type. Customer opts in on signup.",
          },
          {
            name: "Peach Payments",
            provider: "peachpayments.com — SA-native payment gateway",
            purpose: "Process deposits and booking payments. ZAR. Card + EFT + SnapScan.",
            setup: "Phase 2. Integrate on Budget tab. Each slot has 'Pay Deposit' button once status = booked.",
          },
        ].map(item => (
          <Card key={item.name} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{item.name}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>— {item.provider}</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", lineHeight: 1.5, marginBottom: 4 }}><strong style={{ color: "rgba(255,255,255,.7)" }}>Purpose:</strong> {item.purpose}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", lineHeight: 1.5, marginBottom: 4 }}><strong style={{ color: "rgba(255,255,255,.7)" }}>Setup:</strong> {item.setup}</div>
            {item.endpoint && <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,.35)", marginTop: 4 }}>{item.endpoint}</div>}
          </Card>
        ))}
      </Section>

      <Section title="Responsive breakpoints">
        <CodeBlock code={`// Tailwind config — custom breakpoints
module.exports = {
  theme: {
    screens: {
      sm:  '480px',   // Mobile
      md:  '768px',   // Tablet — 2-col squad grid
      lg:  '1100px',  // Desktop — sidebar appears
      xl:  '1280px',  // Full 6-col core squad
      '2xl': '1400px' // Max width
    }
  }
}

// Core Squad responsive grid
.core-squad-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;               /* mobile */
  @media (min-width: 768px)  { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1100px) { grid-template-columns: repeat(3, 1fr); }
  @media (min-width: 1280px) { grid-template-columns: repeat(6, 1fr); }
}`} />
      </Section>

      <Section title="Component file structure">
        <CodeBlock code={`src/
├── app/
│   ├── event/[id]/
│   │   ├── squad/page.tsx          ← THIS SCREEN (Phase 1)
│   │   ├── suppliers/page.tsx
│   │   ├── budget/page.tsx
│   │   ├── inspiration/page.tsx
│   │   └── marketplace/page.tsx
│   └── layout.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── StatusBar.tsx
│   │   └── PageLayout.tsx
│   │
│   ├── squad/
│   │   ├── VendorCard.tsx           ← Primary card
│   │   ├── SupportVendorCard.tsx
│   │   ├── AddSupplierCard.tsx
│   │   ├── WeatherAlertCard.tsx
│   │   ├── CoreSquadSection.tsx
│   │   └── SupportSquadSection.tsx
│   │
│   ├── sidebar/
│   │   ├── TimeToEventWidget.tsx
│   │   ├── BudgetOverviewWidget.tsx
│   │   └── WeatherForecastWidget.tsx
│   │
│   ├── modals/
│   │   ├── SwapDrawer.tsx
│   │   ├── ClashModal.tsx
│   │   ├── SupplierBrowseModal.tsx
│   │   └── MessageDrawer.tsx
│   │
│   └── coach/
│       └── CoachProfileCard.tsx
│
├── types/
│   └── stitchd.ts                   ← All interfaces (see Data Model tab)
│
├── hooks/
│   ├── useEvent.ts                  ← SWR/React Query for event data
│   ├── useWeather.ts
│   └── useVendors.ts
│
└── styles/
    └── tokens.css                   ← Design tokens (see Vision tab)`} />
      </Section>
    </div>
  );
}

const TAB_CONTENT = { "VISION": VisionTab, "LAYOUT": LayoutTab, "COMPONENTS": ComponentsTab, "STATES": StatesTab, "DATA MODEL": DataModelTab, "INTERACTIONS": InteractionsTab, "INTEGRATIONS": IntegrationsTab };

export default function StitchdClientSpec() {
  const [active, setActive] = useState("VISION");
  const Content = TAB_CONTENT[active];

  return (
    <div style={{ background: "#0a0a10", minHeight: "100vh", color: "#fff", fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,.08)", padding: "16px 20px", position: "sticky", top: 0, background: "rgba(10,10,16,.98)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: ".05em", color: "#fff" }}>STITCHD</div>
          <div style={{ height: 16, width: 1, background: "rgba(255,255,255,.15)" }} />
          <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.4)" }}>Client App — Frontend Specification</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <Badge text="v1.0" color="#9F67FF" bg="#1e0a3c" />
            <Badge text="Phase 1 — Squad View" color="#10B981" bg="#052e1a" />
            <Badge text="Confidential" color="#F59E0B" bg="#1a0e00" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActive(tab)} style={{
              padding: "6px 14px", fontSize: 11, fontWeight: active === tab ? 600 : 400,
              color: active === tab ? "#9F67FF" : "rgba(255,255,255,.45)",
              background: "none", border: "none",
              borderBottom: active === tab ? "2px solid #7C3AED" : "2px solid transparent",
              cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s", letterSpacing: ".04em"
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 24px", maxWidth: 900, margin: "0 auto" }}>
        <Content />
      </div>
    </div>
  );
}
