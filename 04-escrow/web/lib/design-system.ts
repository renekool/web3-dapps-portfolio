/* ============================================================
   VAULTLINE DESIGN SYSTEM — Centralized token constants
   Single source of truth for the React layer.
   CSS variables in globals.css are generated from these.
   ============================================================ */

export const DS = {
  colors: {
    brand:       "#5B52E5",
    brandHover:  "#4A42D4",
    brandPress:  "#3E37BD",
    brandSoft:   "#EEF0FD",

    okBg:    "#DCFCE7", okFg:    "#16A34A",
    warnBg:  "#FEF3C7", warnFg:  "#D97706",
    errBg:   "#FEE2E2", errFg:   "#DC2626",
    infoBg:  "#DBEAFE", infoFg:  "#2563EB",

    bgPage:   "#F4F5FA",
    surface:  "#FFFFFF",
    surfaceIn:"#F3F4F8",
    border:   "#EBEBF0",

    textPrimary:   "#1A1D2E",
    textSecondary: "#6B7280",
    textMuted:     "#9CA3AF",

    chart: ["#5B52E5", "#8B85F0", "#C4C1F8", "#E2E0FC"],

    avatars: [
      "linear-gradient(135deg,#4ade80,#16a34a)",
      "linear-gradient(135deg,#fb923c,#ea580c)",
      "linear-gradient(135deg,#60a5fa,#2563eb)",
      "linear-gradient(135deg,#a78bfa,#7c3aed)",
      "linear-gradient(135deg,#fde68a,#d97706)",
      "linear-gradient(135deg,#f9a8d4,#db2777)",
    ],
  },

  escrow: {
    active:    { bg: "#FEF3C7", fg: "#D97706", dot: "#F59E0B" },
    completed: { bg: "#DCFCE7", fg: "#16A34A", dot: "#22C55E" },
    cancelled: { bg: "#FEE2E2", fg: "#DC2626", dot: "#EF4444" },
    expired:   { bg: "#F3F4F8", fg: "#6B7280", dot: "#9CA3AF" },
    locked:    { bg: "#EEF0FD", fg: "#5B52E5", dot: "#5B52E5" },
  },

  spacing: {
    sp1: 4,  sp2: 8,  sp3: 12, sp4: 16,
    sp5: 20, sp6: 24, sp8: 32, sp10: 40, sp12: 48,
  },

  radius: {
    xs: "6px",
    sm: "8px",
    md: "10px",
    lg: "16px",
    xl: "20px",
    pill: "9999px",
  },

  shadow: {
    card:   "0 2px 12px rgba(0,0,0,.06)",
    cardH:  "0 4px 20px rgba(0,0,0,.10)",
    pop:    "0 4px 20px rgba(0,0,0,.12)",
    brand:  "0 4px 16px rgba(91,82,229,.40)",
  },

  layout: {
    maxContent: "72rem",  /* 1152px = max-w-6xl */
    gutter:     "1.5rem", /* 24px = px-6 */
    container:  "w-full max-w-6xl mx-auto px-6", /* Utility class pattern */
  },

  type: {
    sizes: [
      { name: "Display / 40",  px: 40, weight: 800, tracking: "-1px",    lh: 1.1,  example: "Calm machinery" },
      { name: "Title / 26",    px: 26, weight: 800, tracking: "-.6px",   lh: 1.2,  example: "Total locked balance" },
      { name: "Heading / 20",  px: 20, weight: 800, tracking: "-.4px",   lh: 1.2,  example: "Hi, Sarah! Welcome back." },
      { name: "Subhead / 15",  px: 15, weight: 800, tracking: "-.2px",   lh: 1.3,  example: "Recent transactions" },
      { name: "Body / 13",     px: 13, weight: 500, tracking: "0",       lh: 1.5,  example: "Default body. Used in cells, labels, descriptions." },
      { name: "Small / 12",    px: 12, weight: 500, tracking: "0",       lh: 1.5,  example: "Supporting text and metadata" },
      { name: "Micro / 10.5",  px: 10.5, weight: 600, tracking: "1.4px", lh: 1.4,  example: "SECTION LABEL", upper: true },
      { name: "Mono / 11",     px: 11, weight: 400, tracking: "0",       lh: 1.5,  example: "0xA42f…8c91 · TX_HASH", mono: true },
    ],
  },

  principles: [
    {
      num: "P · 01",
      title: "One brand color, used sparingly",
      body: "Indigo #5B52E5 is the only saturated color in the system. It marks active states, primary actions, and the brand mark. If you find yourself reaching for a second hue, you are wrong.",
    },
    {
      num: "P · 02",
      title: "Soft neutrals over hard lines",
      body: "Surfaces float on a warm-leaning gray (#F4F5FA). Borders are #EBEBF0 — visible, never harsh. We never use pure black; #1A1D2E is our deepest text.",
    },
    {
      num: "P · 03",
      title: "Round, not boxy",
      body: "Cards are 16px radius. The sidebar is 20px. Pills are fully round. Right angles only appear inside data — never on chrome. Roundness signals approachability for a high-stakes product.",
    },
    {
      num: "P · 04",
      title: "Density follows hierarchy",
      body: "Body type is 13px — tight, scannable, financial. Display type goes up to 26px and slams hard with negative tracking. The contrast between data and headlines is the rhythm.",
    },
    {
      num: "P · 05",
      title: "State is signaled with color",
      body: "Locked, pending, released, disputed — each escrow state has a fixed semantic color. Never invent new ones. The user learns the palette once and reads the dashboard at a glance.",
    },
    {
      num: "P · 06",
      title: "Motion is a whisper",
      body: "Transitions are 150–200ms. Cards fade in with an 8px translate. Hover lifts by 1px. Nothing bounces. Money apps that bounce feel like games — and games lose trust.",
    },
  ],

  swatches: {
    brand: [
      { name: "Brand · Indigo",     hex: "#5B52E5", dark: true },
      { name: "Brand · Hover",      hex: "#4A42D4", dark: true },
      { name: "Brand · Soft",       hex: "#EEF0FD", dark: false },
      { name: "Text · Primary",     hex: "#1A1D2E", dark: true },
      { name: "Text · Secondary",   hex: "#6B7280", dark: true },
      { name: "Text · Muted",       hex: "#9CA3AF", dark: false },
      { name: "Bg · Page",          hex: "#F4F5FA", dark: false },
      { name: "Border",             hex: "#EBEBF0", dark: false },
    ],
    semantic: [
      { name: "Released · OK",  hex: "#16A34A", dark: true },
      { name: "Active · Warn",  hex: "#D97706", dark: true },
      { name: "Disputed · Err", hex: "#DC2626", dark: true },
      { name: "Locked · Brand", hex: "#5B52E5", dark: true },
    ],
    chart: [
      { name: "Chart 01", hex: "#5B52E5", dark: true },
      { name: "Chart 02", hex: "#8B85F0", dark: true },
      { name: "Chart 03", hex: "#C4C1F8", dark: false },
      { name: "Chart 04", hex: "#E2E0FC", dark: false },
    ],
  },

  tokens: [
    { variable: "--brand",               desc: "Primary brand action color",                value: "#5B52E5" },
    { variable: "--brand-hover",         desc: "Hover state of brand",                     value: "#4A42D4" },
    { variable: "--brand-soft",          desc: "Tinted brand background",                  value: "#EEF0FD" },
    { variable: "--brand-glow",          desc: "Brand drop-shadow color",                  value: "rgba(91,82,229,.40)" },
    { variable: "--ok-bg / --ok-fg",     desc: "Success surface + text",                   value: "#DCFCE7 / #16A34A" },
    { variable: "--warn-bg / --warn-fg", desc: "Warning surface + text",                   value: "#FEF3C7 / #D97706" },
    { variable: "--err-bg / --err-fg",   desc: "Error surface + text",                     value: "#FEE2E2 / #DC2626" },
    { variable: "--info-bg / --info-fg", desc: "Info surface + text",                      value: "#DBEAFE / #2563EB" },
    { variable: "--link",                desc: "Hyperlink / anchor text color",             value: "#4F8EF7" },
    { variable: "--chart-1…4",           desc: "Purple data-viz ramp",                     value: "#5B52E5 → #E2E0FC" },
    { variable: "--background  (--bg)",  desc: "App page background",                      value: "#F4F5FA" },
    { variable: "--card  (--surface)",   desc: "Card / panel surface",                     value: "#FFFFFF" },
    { variable: "--input-bg  (--surface-sunk)", desc: "Input fill, table head",            value: "#F3F4F8" },
    { variable: "--border  (--line)",    desc: "Standard border",                          value: "#EBEBF0" },
    { variable: "--border-soft  (--line-soft)", desc: "Row separator",                     value: "#F3F4F8" },
    { variable: "--foreground  (--fg)",  desc: "Primary text",                             value: "#1A1D2E" },
    { variable: "--fg-2",                desc: "Secondary / label text",                   value: "#6B7280" },
    { variable: "--fg-3",                desc: "Muted / placeholder text",                 value: "#9CA3AF" },
    { variable: "--sh-card",             desc: "Card resting shadow",                      value: "0 2px 12px rgba(0,0,0,.06)" },
    { variable: "--sh-brand",            desc: "Brand CTA shadow",                         value: "0 4px 16px rgba(91,82,229,.40)" },
    { variable: "--radius-lg",           desc: "Card / modal radius",                      value: "16px" },
    { variable: "--radius-md",           desc: "Input / nav item radius",                  value: "10px" },
    { variable: "--radius-sm",           desc: "Tag / badge radius",                       value: "8px" },
    { variable: "--t-fast / --t-base",   desc: "Transition durations",                     value: "150ms / 200ms" },
  ],
} as const;

export type EscrowState = keyof typeof DS.escrow;
