import { useState } from "react";

const DS = {
  colors: {
    bg: "#f6f7f4",
    surface: "#ffffff",
    surfaceAlt: "#eef2ea",
    ink: "#111111",
    inkSoft: "#425044",
    inkMute: "#6a766d",
    border: "#d9e1d6",
    borderStrong: "#b9c7b7",
    green: "#006b3c",
    greenDark: "#0a3f29",
    greenSoft: "#dfeee5",
    gold: "#ffb81c",
    goldSoft: "#fff2cc",
    red: "#cf3f32",
    redSoft: "#fde7e4",
    blue: "#2b6cb0",
    blueSoft: "#e5eef9",
    shadow: "0 18px 60px rgba(17, 17, 17, 0.08)",
  },
};

const TABS = [
  "PRODUCT",
  "SCREENS",
  "COMPONENTS",
  "STATES",
  "DATA MODEL",
  "API",
  "DELIVERY",
];

const tableHeadStyle = {
  padding: "8px 10px",
  textAlign: "left",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  color: DS.colors.inkMute,
};

const miniTitle = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: DS.colors.inkMute,
  marginBottom: 10,
};

function Badge({ text, color, bg }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 9px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        color: color || DS.colors.ink,
        background: bg || DS.colors.surfaceAlt,
      }}
    >
      {text}
    </span>
  );
}

function Swatch({ name, hex, note }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: hex,
          border: `1px solid ${DS.colors.border}`,
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: DS.colors.ink, fontFamily: "monospace" }}>{hex}</div>
        <div style={{ fontSize: 11, color: DS.colors.inkMute }}>{name}{note ? ` - ${note}` : ""}</div>
      </div>
    </div>
  );
}

function PropRow({ prop, type, required, desc, example }) {
  return (
    <tr style={{ borderBottom: `1px solid ${DS.colors.border}` }}>
      <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11, color: DS.colors.greenDark }}>{prop}</td>
      <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11, color: DS.colors.blue }}>{type}</td>
      <td style={{ padding: "8px 10px", fontSize: 10 }}>
        {required ? (
          <Badge text="required" color="#7a231c" bg="#fde7e4" />
        ) : (
          <Badge text="optional" color={DS.colors.inkMute} bg={DS.colors.surfaceAlt} />
        )}
      </td>
      <td style={{ padding: "8px 10px", fontSize: 11, color: DS.colors.inkSoft, lineHeight: 1.5 }}>{desc}</td>
      {example ? <td style={{ padding: "8px 10px", fontSize: 10, color: DS.colors.inkMute, fontFamily: "monospace" }}>{example}</td> : null}
    </tr>
  );
}

function PropsTable({ rows, showExample }) {
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${DS.colors.border}`, borderRadius: 16 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: DS.colors.surfaceAlt }}>
            <th style={tableHeadStyle}>Prop</th>
            <th style={tableHeadStyle}>Type</th>
            <th style={tableHeadStyle}>Required</th>
            <th style={tableHeadStyle}>Description</th>
            {showExample ? <th style={tableHeadStyle}>Example</th> : null}
          </tr>
        </thead>
        <tbody>{rows.map((row, index) => <PropRow key={index} {...row} />)}</tbody>
      </table>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 34 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", color: DS.colors.green, textTransform: "uppercase" }}>{title}</div>
        <div style={{ flex: 1, height: 2, background: `linear-gradient(to right, ${DS.colors.greenSoft}, rgba(223,238,229,0))` }} />
      </div>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: DS.colors.surface,
        border: `1px solid ${DS.colors.border}`,
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow: DS.colors.shadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CodeBlock({ code }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: "14px 16px",
        borderRadius: 16,
        overflowX: "auto",
        background: "#10261a",
        color: "#e9fff3",
        fontSize: 11,
        lineHeight: 1.6,
        border: "1px solid rgba(0, 107, 60, 0.18)",
      }}
    >
      {code}
    </pre>
  );
}

function BulletList({ items }) {
  return (
    <div>
      {items.map((item) => (
        <div key={item} style={{ display: "flex", gap: 10, marginBottom: 8, color: DS.colors.inkSoft, fontSize: 11, lineHeight: 1.5 }}>
          <span style={{ color: DS.colors.green, fontWeight: 800 }}>+</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function ComponentSpec({ name, desc, from, props, notes = [], children }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ border: `1px solid ${DS.colors.border}`, borderRadius: 18, overflow: "hidden", marginBottom: 12, background: DS.colors.surface }}>
      <button
        onClick={() => setOpen((value) => !value)}
        style={{
          width: "100%",
          border: "none",
          textAlign: "left",
          padding: "14px 16px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          background: open ? DS.colors.greenSoft : DS.colors.surface,
          cursor: "pointer",
        }}
      >
        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: DS.colors.greenDark }}>{name}</span>
        <span style={{ fontSize: 11, color: DS.colors.inkMute, flex: 1 }}>{desc}</span>
        {from ? <Badge text={from} color={DS.colors.greenDark} bg={DS.colors.goldSoft} /> : null}
        <span style={{ color: DS.colors.inkMute }}>{open ? "-" : "+"}</span>
      </button>
      {open ? (
        <div style={{ padding: "14px 16px 18px", borderTop: `1px solid ${DS.colors.border}` }}>
          {props ? (
            <>
              <div style={{ fontSize: 10, fontWeight: 800, color: DS.colors.inkMute, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Props</div>
              <PropsTable rows={props} />
            </>
          ) : null}
          {notes.length ? <div style={{ height: 14 }} /> : null}
          {notes.length ? <BulletList items={notes} /> : null}
          {children ? <div style={{ marginTop: 12 }}>{children}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function ProductTab() {
  return (
    <div>
      <Section title="Product frame">
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: DS.colors.ink, marginBottom: 8 }}>STITCHD customer app specification</div>
          <div style={{ fontSize: 12, color: DS.colors.inkSoft, lineHeight: 1.7 }}>
            The product is a South Africa-first on-demand services app. The customer should be able to discover services,
            book a vetted provider, track fulfilment, pay securely, review the outcome, and rebook without needing admin intervention.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            <Badge text="Customer app" color="#ffffff" bg={DS.colors.green} />
            <Badge text="Mobile first" color={DS.colors.greenDark} bg={DS.colors.greenSoft} />
            <Badge text="Realtime booking" color={DS.colors.greenDark} bg={DS.colors.goldSoft} />
            <Badge text="South Africa" color={DS.colors.greenDark} bg="#eef6ff" />
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <Card>
            <div style={miniTitle}>Primary users</div>
            <BulletList
              items={[
                "Busy homeowners booking urgent and scheduled help.",
                "Customers comparing trusted providers by rating, ETA, and price.",
                "Repeat users managing multiple active and past bookings.",
              ]}
            />
          </Card>
          <Card>
            <div style={miniTitle}>Core outcomes</div>
            <BulletList
              items={[
                "Book in under 3 minutes from home screen to payment confirmation.",
                "Keep every status change visible: accepted, en route, started, completed.",
                "Reduce support load with transparent pricing, messaging, and proof of service.",
              ]}
            />
          </Card>
        </div>
      </Section>

      <Section title="Visual direction">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <Card>
            <div style={miniTitle}>Brand palette</div>
            <Swatch name="Primary green" hex="#006b3c" note="Primary CTA, trust markers" />
            <Swatch name="Accent gold" hex="#ffb81c" note="Badges, promos, urgency highlight" />
            <Swatch name="Surface" hex="#ffffff" note="Main cards and sheets" />
            <Swatch name="Warm background" hex="#f6f7f4" note="App shell" />
            <Swatch name="Ink" hex="#111111" note="High-contrast text" />
          </Card>
          <Card>
            <div style={miniTitle}>Design rules</div>
            <BulletList
              items={[
                "Use bright, daylight surfaces instead of dark dashboard treatments.",
                "Large service imagery should feel practical and local, not generic stock-tech.",
                "Priority hierarchy: task status first, money second, support actions third.",
                "Bottom sheets and sticky action bars should do most of the work on mobile.",
              ]}
            />
          </Card>
        </div>
      </Section>

      <Section title="Tokens">
        <CodeBlock
          code={`:root {
  --bg-app: #f6f7f4;
  --bg-surface: #ffffff;
  --bg-surface-alt: #eef2ea;
  --text-primary: #111111;
  --text-secondary: #425044;
  --text-muted: #6a766d;

  --brand-primary: #006b3c;
  --brand-primary-strong: #0a3f29;
  --brand-primary-soft: #dfeee5;
  --brand-accent: #ffb81c;
  --brand-accent-soft: #fff2cc;

  --state-success: #006b3c;
  --state-warning: #c88300;
  --state-danger: #cf3f32;
  --state-info: #2b6cb0;

  --border-default: #d9e1d6;
  --border-strong: #b9c7b7;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --shadow-card: 0 18px 60px rgba(17, 17, 17, 0.08);
}`}
        />
      </Section>
    </div>
  );
}

function ScreensTab() {
  const screens = [
    {
      name: "Home",
      route: "/home",
      desc: "Personalised landing screen with service shortcuts, current booking card, recent addresses, and promoted categories.",
    },
    {
      name: "Search and category",
      route: "/services/:slug",
      desc: "Service listing with filters for ETA, price band, rating, and availability. Card stack should prioritise nearest viable options.",
    },
    {
      name: "Service detail",
      route: "/services/:slug/:providerId",
      desc: "Provider profile, service inclusions, exclusions, pricing rules, reviews, and primary booking CTA.",
    },
    {
      name: "Booking composer",
      route: "/bookings/new",
      desc: "Step flow for address, schedule, notes, add-ons, payment method, and confirmation summary.",
    },
    {
      name: "Live booking",
      route: "/bookings/:id/live",
      desc: "Realtime status, ETA, provider card, chat, call shortcut, support escalation, and proof-of-arrival updates.",
    },
    {
      name: "Wallet and payments",
      route: "/wallet",
      desc: "Stored payment methods, wallet balance, refunds, credits, invoices, and transaction history.",
    },
    {
      name: "Profile and support",
      route: "/profile",
      desc: "Saved places, household preferences, notification preferences, issue reporting, and account security.",
    },
  ];

  return (
    <div>
      <Section title="Primary navigation">
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: DS.colors.inkSoft, lineHeight: 1.7, marginBottom: 10 }}>
            Bottom navigation should carry the highest-frequency tasks only: Home, Explore, Bookings, Wallet, Profile.
            Search remains inline inside Home and category screens. Support actions live in sheets, not as a primary tab.
          </div>
          <CodeBlock
            code={`type CustomerNavTab =
  | 'home'
  | 'explore'
  | 'bookings'
  | 'wallet'
  | 'profile';`}
          />
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {screens.map((screen) => (
            <Card key={screen.name}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: DS.colors.ink }}>{screen.name}</div>
                <Badge text={screen.route} color={DS.colors.greenDark} bg={DS.colors.greenSoft} />
              </div>
              <div style={{ fontSize: 11, color: DS.colors.inkSoft, lineHeight: 1.55 }}>{screen.desc}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Home screen composition">
        <CodeBlock
          code={`HomeScreen
|- Header: greeting, current location, alerts bell
|- SearchField: 'What do you need done today?'
|- QuickActionRow: Cleaning, Plumbing, Electrical, Beauty, Auto, Moving
|- ActiveBookingBanner (conditional)
|- FeaturedCategoriesGrid
|- NearbyProvidersCarousel
|- PromoCard / wallet credit banner
|- RecentBookingsList
|- SupportFAB`}
        />
      </Section>

      <Section title="Booking flow rules">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <Card>
            <div style={miniTitle}>Instant jobs</div>
            <BulletList
              items={[
                "Default when service category supports immediate dispatch.",
                "Show live ETA and provider response timeout before payment confirmation.",
                "If no provider accepts in the SLA window, prompt retry, schedule, or support help.",
              ]}
            />
          </Card>
          <Card>
            <div style={miniTitle}>Scheduled jobs</div>
            <BulletList
              items={[
                "Calendar and time-slot selector should respect provider availability and business rules.",
                "Price summary recalculates with after-hours, weekend, or distance surcharges.",
                "Confirmation screen must restate cancellation terms and reschedule policy.",
              ]}
            />
          </Card>
        </div>
      </Section>
    </div>
  );
}

function ComponentsTab() {
  return (
    <div>
      <Section title="Core surfaces">
        <ComponentSpec
          name="AppShell"
          desc="Global mobile shell with sticky bottom navigation and route-level sheets"
          from="Global"
          props={[
            { prop: "activeTab", type: "CustomerNavTab", required: true, desc: "Current active root tab" },
            { prop: "hasUnreadNotifications", type: "boolean", required: true, desc: "Controls bell badge" },
            { prop: "activeBooking", type: "Booking | null", required: false, desc: "Shows persistent booking banner when present" },
          ]}
          notes={[
            "Sticky top area should collapse on scroll but keep the search affordance reachable.",
            "Bottom nav labels stay visible; do not use icon-only navigation for the primary app shell.",
            "If an active booking exists, surface it above the bottom nav across Home and Explore.",
          ]}
        />

        <ComponentSpec
          name="ServiceCategoryCard"
          desc="Primary discovery card for category entry points"
          from="Home"
          props={[
            { prop: "category", type: "ServiceCategory", required: true, desc: "Service category metadata" },
            { prop: "startingPrice", type: "number", required: true, desc: "Lowest advertised price in cents" },
            { prop: "etaLabel", type: "string", required: false, desc: "Optional fast-availability label" },
            { prop: "onSelect", type: "() => void", required: true, desc: "Navigates into service listing" },
          ]}
          notes={[
            "Image treatment should feel local and practical: homes, tools, salons, workshops, not abstract gradients.",
            "Badge stack supports Instant, Scheduled, Verified, and Promo states.",
            "Price line should always lead with 'From R...' to avoid implying a fixed quote.",
          ]}
        />

        <ComponentSpec
          name="ProviderResultCard"
          desc="Search result card showing the most important booking decision signals"
          from="Explore"
          props={[
            { prop: "provider", type: "ProviderSummary", required: true, desc: "Provider snapshot for list display" },
            { prop: "availability", type: "ProviderAvailability", required: true, desc: "Instant or scheduled availability state" },
            { prop: "distanceKm", type: "number", required: false, desc: "Distance from customer location" },
            { prop: "onSelect", type: "() => void", required: true, desc: "Open provider detail" },
          ]}
          notes={[
            "Card hierarchy: name, verified status, rating, ETA, price band, short trust proof, then CTA.",
            "Support for warning banners such as 'Limited availability tonight' or 'High demand surge'.",
            "Desktop web can show 2-column cards; mobile remains single-column with clear thumb target sizes.",
          ]}
        />

        <ComponentSpec
          name="BookingComposerSheet"
          desc="Multi-step bottom sheet for creating or editing a booking"
          from="Booking flow"
          props={[
            { prop: "service", type: "ServiceOffering", required: true, desc: "Chosen service" },
            { prop: "draft", type: "BookingDraft", required: true, desc: "Current booking draft" },
            { prop: "step", type: "BookingStep", required: true, desc: "address | schedule | details | payment | review" },
            { prop: "onChange", type: "(patch: Partial<BookingDraft>) => void", required: true, desc: "Persist local edits" },
            { prop: "onSubmit", type: "() => void", required: true, desc: "Confirm booking request" },
          ]}
          notes={[
            "Keep price summary and primary CTA pinned to the bottom of the viewport.",
            "Address entry should support saved addresses, map pin adjustment, and access notes.",
            "Service details step supports optional photos, issue notes, and preferred provider instructions.",
          ]}
        />

        <ComponentSpec
          name="LiveBookingCard"
          desc="Realtime booking status surface used on Home and Booking detail"
          from="Bookings"
          props={[
            { prop: "booking", type: "Booking", required: true, desc: "Active booking payload" },
            { prop: "provider", type: "ProviderSummary", required: true, desc: "Assigned provider summary" },
            { prop: "onOpenChat", type: "() => void", required: true, desc: "Open in-app message thread" },
            { prop: "onOpenSupport", type: "() => void", required: true, desc: "Open support actions" },
          ]}
          notes={[
            "State layout changes by milestone: accepted, en route, arrived, in progress, completed.",
            "Proof events such as arrival and completion should be timestamped and easy to scan.",
            "If tracking is unavailable, degrade gracefully to timestamp-based text updates rather than blank maps.",
          ]}
        />

        <ComponentSpec
          name="PriceSummaryCard"
          desc="Charge breakdown shared by booking, wallet, and receipt surfaces"
          from="Shared"
          props={[
            { prop: "lineItems", type: "PriceLineItem[]", required: true, desc: "Base charge, add-ons, fees, credits" },
            { prop: "currency", type: "'ZAR'", required: true, desc: "Fixed for current rollout" },
            { prop: "total", type: "number", required: true, desc: "Total charge in cents" },
          ]}
          notes={[
            "Avoid hidden fees. Platform fee and provider subtotal must both be visible when applicable.",
            "Credits and promo reductions use green-positive treatment, not red-negative treatment.",
            "Receipt version can expand taxes, refunds, and settlement timestamps.",
          ]}
        />
      </Section>
    </div>
  );
}

function StatesTab() {
  const states = [
    ["draft", DS.colors.blue, DS.colors.blueSoft, "Customer has not submitted the booking yet."],
    ["requested", DS.colors.gold, DS.colors.goldSoft, "Booking is submitted and waiting for provider acceptance."],
    ["accepted", DS.colors.green, DS.colors.greenSoft, "Provider accepted. ETA or scheduled slot is confirmed."],
    ["en_route", DS.colors.blue, DS.colors.blueSoft, "Provider is travelling to the customer."],
    ["arrived", DS.colors.greenDark, "#e2f4ea", "Provider has arrived and can start the job."],
    ["in_progress", DS.colors.greenDark, "#edf6ef", "Work has started. Customer can still chat or raise issues."],
    ["completed", DS.colors.green, DS.colors.greenSoft, "Service finished. Customer is prompted for review and tip."],
    ["cancelled", DS.colors.red, DS.colors.redSoft, "Booking ended before service completion."],
    ["disputed", DS.colors.red, "#fff2f0", "Issue raised. Support workflow takes over."],
  ];

  return (
    <div>
      <Section title="Booking lifecycle">
        {states.map(([name, color, bg, desc]) => (
          <div key={name} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${DS.colors.border}` }}>
            <div style={{ minWidth: 130 }}>
              <Badge text={name} color={color} bg={bg} />
            </div>
            <div style={{ fontSize: 11, color: DS.colors.inkSoft, lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </Section>

      <Section title="UI rules by state">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <Card>
            <div style={miniTitle}>Requested and accepted</div>
            <BulletList
              items={[
                "Show countdown until provider response expiry while still requested.",
                "Primary action is cancel or edit only until accepted.",
                "After acceptance, surface provider card, ETA, and directions immediately.",
              ]}
            />
          </Card>
          <Card>
            <div style={miniTitle}>En route and in progress</div>
            <BulletList
              items={[
                "Pin live status card to top of booking detail with map or fallback timeline.",
                "Support escalation must remain one tap away; do not hide it behind overflow menus.",
                "Completion cannot be silent; customer must see proof and payment finalisation summary.",
              ]}
            />
          </Card>
          <Card>
            <div style={miniTitle}>Cancelled and disputed</div>
            <BulletList
              items={[
                "Always show who triggered the cancellation and which policy applied.",
                "Refund status should be separate from booking status.",
                "Dispute state locks rebooking nudges until support workflow is resolved or dismissed.",
              ]}
            />
          </Card>
          <Card>
            <div style={miniTitle}>Offline and degraded states</div>
            <BulletList
              items={[
                "Use optimistic UI for chat send and booking note edits, then reconcile visibly if sync fails.",
                "Map failures fall back to text milestones and timestamp rows.",
                "If wallet or payment endpoints degrade, preserve booking view and isolate only the failing payment actions.",
              ]}
            />
          </Card>
        </div>
      </Section>
    </div>
  );
}

function DataModelTab() {
  return (
    <div>
      <Section title="Frontend types">
        <CodeBlock
          code={`export type ServiceCategorySlug =
  | 'home-cleaning'
  | 'maid-service'
  | 'plumbing'
  | 'electrical'
  | 'handyman'
  | 'beauty'
  | 'massage'
  | 'mechanic'
  | 'appliance-repair'
  | 'garden';

export type BookingStatus =
  | 'draft'
  | 'requested'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface Address {
  id?: string;
  label?: string;
  line1: string;
  suburb: string;
  city: string;
  province: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  accessNotes?: string;
}

export interface ServiceCategory {
  id: string;
  slug: ServiceCategorySlug;
  name: string;
  heroImage: string;
  shortDescription: string;
  startingPriceCents: number;
  supportsInstant: boolean;
  supportsScheduled: boolean;
}

export interface ServiceOffering {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  basePriceCents: number;
  estimatedDurationMinutes: number;
  addOns: Array<{ id: string; name: string; priceCents: number }>;
}

export interface ProviderSummary {
  id: string;
  displayName: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  etaMinutes?: number;
  distanceKm?: number;
  completedJobs: number;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId?: string;
  serviceId: string;
  status: BookingStatus;
  address: Address;
  scheduledFor?: string;
  notes?: string;
  totalCents: number;
  currency: 'ZAR';
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WalletLedgerItem {
  id: string;
  type: 'charge' | 'refund' | 'credit' | 'topup';
  amountCents: number;
  currency: 'ZAR';
  bookingId?: string;
  createdAt: string;
  status: 'pending' | 'settled' | 'failed';
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  payload?: Record<string, string>;
}`}
        />
      </Section>

      <Section title="Derived client rules">
        <Card>
          <BulletList
            items={[
              "Money is stored and transported in cents across the app.",
              "Address always carries coordinates because booking, ETA, and maps depend on them.",
              "A completed booking without a review should trigger a review prompt on Home and Bookings.",
              "Notification payloads must be string-safe because push transport is string-based.",
            ]}
          />
        </Card>
      </Section>
    </div>
  );
}

function ApiTab() {
  return (
    <div>
      <Section title="Client API contract">
        <CodeBlock
          code={`// Auth
POST   /api/v1/auth/send-otp
POST   /api/v1/auth/verify-otp
POST   /api/v1/auth/refresh

// Services and providers
GET    /api/v1/services
GET    /api/v1/services/:id
GET    /api/v1/providers
GET    /api/v1/providers/:id

// Bookings
POST   /api/v1/bookings
GET    /api/v1/bookings/mine
GET    /api/v1/bookings/:id
PATCH  /api/v1/bookings/:id/cancel
PATCH  /api/v1/bookings/:id/reschedule

// Payments and wallet
POST   /api/v1/payments/checkout
GET    /api/v1/wallet
GET    /api/v1/wallet/ledger

// Chat and notifications
GET    /api/v1/chat/booking/:bookingId
POST   /api/v1/chat/booking/:bookingId/messages
GET    /api/v1/notifications/mine
PATCH  /api/v1/notifications/:id/read

// Reviews
POST   /api/v1/reviews
GET    /api/v1/reviews/mine
GET    /api/v1/reviews/providers/:providerUserId`}
        />
      </Section>

      <Section title="Integration boundaries">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <Card>
            <div style={miniTitle}>Payments</div>
            <BulletList
              items={[
                "Frontend treats the checkout handoff as redirect or hosted session based on gateway response.",
                "Wallet and refund surfaces must tolerate delayed settlement states.",
                "Never hardcode gateway secrets or merchant settings in client code.",
              ]}
            />
          </Card>
          <Card>
            <div style={miniTitle}>Realtime</div>
            <BulletList
              items={[
                "Chat, live status, and location updates should reuse one booking-scoped polling or socket strategy.",
                "Push notifications complement live UI; they do not replace in-app state refresh.",
                "A stale live session falls back to manual refresh and support CTA without blocking the booking screen.",
              ]}
            />
          </Card>
          <Card>
            <div style={miniTitle}>Maps and location</div>
            <BulletList
              items={[
                "Address capture uses autocomplete plus manual pin drag correction.",
                "Distance and ETA labels are advisory only and should be marked as estimates.",
                "If map SDK fails, preserve address details and route support with text fallback.",
              ]}
            />
          </Card>
          <Card>
            <div style={miniTitle}>Notifications</div>
            <BulletList
              items={[
                "Push types: booking accepted, provider arriving, job completed, refund update, support message.",
                "Notification center mirrors push content so the app remains usable without OS delivery.",
                "Read state sync should be batched when possible.",
              ]}
            />
          </Card>
        </div>
      </Section>
    </div>
  );
}

function DeliveryTab() {
  const checklist = [
    "Home, Explore, Booking flow, Live booking, Wallet, Profile, and Notifications all specified.",
    "Component contracts cover app shell, discovery cards, provider cards, booking composer, live card, and price summary.",
    "Booking lifecycle, degraded states, and dispute paths are explicitly defined.",
    "Frontend type model covers services, providers, bookings, wallet, notifications, and address data.",
    "API expectations are aligned with the existing backend module layout for auth, bookings, payments, wallet, chat, notifications, and reviews.",
  ];

  return (
    <div>
      <Section title="Definition of done">
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: DS.colors.ink, marginBottom: 8 }}>Spec completion statement</div>
          <div style={{ fontSize: 11, color: DS.colors.inkSoft, lineHeight: 1.6, marginBottom: 12 }}>
            This file now describes the STITCHD customer application rather than the earlier event-planning prototype.
            It is complete enough to guide UX design, component implementation, API wiring, and QA acceptance for the customer-facing mobile app.
          </div>
          <BulletList items={checklist} />
        </Card>
      </Section>

      <Section title="Implementation order">
        <CodeBlock
          code={`Phase 1
1. App shell + navigation + home discovery
2. Service listing + provider detail + booking composer
3. Booking detail + live tracking + chat entry points

Phase 2
4. Wallet + payment receipts + cancellation/refund handling
5. Reviews + rebook flows + notification center
6. QA hardening: offline, empty, slow-network, and dispute states`}
        />
      </Section>
    </div>
  );
}

const TAB_CONTENT = {
  PRODUCT: ProductTab,
  SCREENS: ScreensTab,
  COMPONENTS: ComponentsTab,
  STATES: StatesTab,
  "DATA MODEL": DataModelTab,
  API: ApiTab,
  DELIVERY: DeliveryTab,
};

export default function StitchdClientSpec() {
  const [active, setActive] = useState("PRODUCT");
  const Content = TAB_CONTENT[active];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at top left, #ffffff 0%, ${DS.colors.bg} 55%, #edf2ea 100%)`,
        color: DS.colors.ink,
        fontFamily: "'Sora', 'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(18px)",
          background: "rgba(246, 247, 244, 0.88)",
          borderBottom: `1px solid ${DS.colors.border}`,
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: ".04em", color: DS.colors.green }}>STITCHD</div>
            <div style={{ width: 1, height: 18, background: DS.colors.borderStrong }} />
            <div style={{ fontSize: 11, color: DS.colors.inkMute, textTransform: "uppercase", letterSpacing: ".12em" }}>Customer App Frontend Specification</div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge text="v2" color="#ffffff" bg={DS.colors.green} />
              <Badge text="STITCHD aligned" color={DS.colors.greenDark} bg={DS.colors.greenSoft} />
              <Badge text="Complete" color={DS.colors.greenDark} bg={DS.colors.goldSoft} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                style={{
                  border: `1px solid ${active === tab ? DS.colors.green : DS.colors.border}`,
                  background: active === tab ? DS.colors.green : DS.colors.surface,
                  color: active === tab ? "#ffffff" : DS.colors.inkSoft,
                  padding: "8px 12px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".05em",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 22px 40px" }}>
        <Content />
      </div>
    </div>
  );
}