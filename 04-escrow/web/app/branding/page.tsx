"use client";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2, AlertCircle, Info, AlertTriangle,
  Lock, Network, Clock, XCircle, ArrowRight, ChevronRight,
  Wallet, Zap, Shield, ArrowLeftRight,
  Copy, Check, ExternalLink, Search,
  ShieldAlert, Bell, Loader2, TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/modern-ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/modern-ui/alert";
import { Avatar, AvatarFallback } from "@/components/modern-ui/avatar";
import { Badge } from "@/components/modern-ui/badge";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/modern-ui/breadcrumb";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/modern-ui/card";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/modern-ui/dialog";
import { Input } from "@/components/modern-ui/input";
import { Label } from "@/components/modern-ui/label";
import { Switch } from "@/components/modern-ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/modern-ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/modern-ui/accordion";
import { Textarea } from "@/components/modern-ui/textarea";
import { Stepper } from "@/components/modern-ui/stepper";
import { Slider } from "@/components/modern-ui/slider";

import { DS } from "@/lib/design-system";
import {
  DocSection, Demo, ColorSwatch, TokenRow,
  TypeSpecimen, PrincipleCard, SpacingBar, RadiusChip,
  ShadowChip, Tok, StatusBadge,
} from "@/components/design-system";

/* ═══════════════ HOOKS ═══════════════ */
function useTypewriter(phrases: string[], speed = 60) {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const phrase = phrases[phraseIdx];
    const delay = deleting ? speed / 2 : speed;
    const t = setTimeout(() => {
      if (!deleting) {
        setText(phrase.slice(0, charIdx + 1));
        if (charIdx + 1 === phrase.length) setTimeout(() => setDeleting(true), 1400);
        else setCharIdx((c) => c + 1);
      } else {
        setText(phrase.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) {
          setDeleting(false);
          setPhraseIdx((i) => (i + 1) % phrases.length);
          setCharIdx(0);
        } else setCharIdx((c) => c - 1);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [charIdx, deleting, phraseIdx, phrases, speed]);
  return text;
}

function useCounter(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  const [running, setRunning] = useState(false);
  const run = () => {
    setRunning(true); setVal(0);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(tick);
      else { setVal(target); setRunning(false); }
    };
    requestAnimationFrame(tick);
  };
  return { val, run, running };
}

function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    });
  };
  return { copied, copy };
}

/* ═══════════════ TOC ═══════════════ */
const TOC_SECTIONS = [
  { id: "principles",   label: "01 · Principles" },
  { id: "brand",        label: "02 · Brand" },
  { id: "color",        label: "03 · Color" },
  { id: "typography",   label: "04 · Typography" },
  { id: "geometry",     label: "05 · Geometry" },
  { id: "tokens",       label: "06 · Tokens" },
  { id: "transition",   label: "·   ·   ·", divider: true },
  { id: "buttons",      label: "07 · Buttons" },
  { id: "alerts",       label: "08 · Alerts" },
  { id: "badges",       label: "09 · Badges" },
  { id: "cards",        label: "10 · Cards" },
  { id: "table",        label: "11 · Table" },
  { id: "accordion",    label: "12 · Accordion" },
  { id: "navigation",   label: "13 · Navigation" },
  { id: "forms",        label: "14 · Forms" },
  { id: "stepper",      label: "15 · Stepper" },
  { id: "dialogs",      label: "16 · Dialogs" },
  { id: "utilities",    label: "17 · Utilities" },
  { id: "avatars",      label: "18 · Avatars" },
  { id: "animations",   label: "19 · Animations" },
  { id: "escrow",       label: "20 · Escrow Patterns" },
];

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function BrandingPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeId, setActiveId] = useState("principles");
  const [stepperStep, setStepperStep] = useState(1);
  const [sliderVal, setSliderVal] = useState([48]);
  const [fancyTab, setFancyTab] = useState("all");
  const [ulTab, setUlTab] = useState("details");
  const { val: counterVal, run: runCounter } = useCounter(487250);
  const { copied: addrCopied, copy: copyAddr } = useCopy();
  const typeText = useTypewriter([
    "Creating swap op #24…",
    "Awaiting MetaMask signature…",
    "TX pending in mempool…",
    "Block 18,421,312 confirmed ✓",
    "Funds locked in escrow…",
  ]);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };

  /* Intersection Observer for TOC highlight */
  useEffect(() => {
    const ids = TOC_SECTIONS.filter((s) => !("divider" in s)).map((s) => s.id);
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setActiveId(e.target.id); break; }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const txSteps = [
    { id: 1, title: "Approve" },
    { id: 2, title: "Sign TX" },
    { id: 3, title: "Mining" },
    { id: 4, title: "Confirmed" },
  ];

  const fancyTabs = [
    { key: "all",       label: "All",       content: "23 operations across all states." },
    { key: "active",    label: "Active",    content: "7 active swaps locking funds in escrow." },
    { key: "completed", label: "Completed", content: "14 successfully settled swaps." },
    { key: "expired",   label: "Expired",   content: "2 expired — funds returned to creators." },
  ];
  const ulTabs = [
    { key: "details",  label: "Details",  content: "500 TKA → 1,000 TKB · Deadline: 48h remaining" },
    { key: "history",  label: "History",  content: "Created 2h ago · Block 18,421,304 · Gas: 0.003 ETH" },
    { key: "parties",  label: "Parties",  content: "Creator: 0xf39F…2266 · Executor: Awaiting" },
  ];

  return (
    <TooltipProvider>
      {/* ── THEME TOGGLE ── */}
      <div className="fixed top-5 right-5 z-50">
        <Button size="sm" variant="secondary" onClick={toggleDark} className="gap-2 shadow-md">
          {darkMode ? "☀ Light" : "☾ Dark"}
        </Button>
      </div>

      <main className="min-h-screen bg-background">

        {/* ════════════════════════════════
            HERO
            ════════════════════════════════ */}
        <header className="border-b border-border bg-card">
          <div className="max-w-[1180px] mx-auto px-8 py-20 flex flex-col gap-6">
            <Badge variant="outline" className="w-fit text-[11px] px-3 py-1 tracking-widest uppercase">
              Dezentra · Design System v1.0
            </Badge>
            <h1 className="text-[clamp(28px,4.4vw,44px)] font-extrabold tracking-[-1px] leading-[1.1] max-w-[640px]">
              Calm machinery for{" "}
              <span style={{ color: DS.colors.brand }}>
                moving tokens under glass.
              </span>
            </h1>
            <p className="text-[16px] text-muted-foreground max-w-[640px] leading-relaxed">
              Foundation, tokens, and components for SwapEscrow — a P2P ERC20 swap DApp.
              Every decision is documented. Every component is an implementation of DESIGN.md.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {["Plus Jakarta Sans", "#5B52E5 brand", "Light + Dark", "Modern UI"].map((tag) => (
                <span key={tag} className="text-[12px] font-mono text-muted-foreground bg-input px-3 py-1 rounded-full border border-border">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* ════════════════════════════════
            TWO-COLUMN BODY
            ════════════════════════════════ */}
        <div className="max-w-[1180px] mx-auto px-8 py-8 grid gap-16" style={{ gridTemplateColumns: "1fr 220px" }}>

          {/* ── CONTENT ── */}
          <div>

            {/* ════ 01 PRINCIPLES ════ */}
            <DocSection id="principles" eyebrow="Foundation · 01"
              title="Design Principles"
              sub="Six invariants that govern every pixel. They exist because a financial product has no room for improvised decisions.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DS.principles.map((p) => (
                  <PrincipleCard key={p.num} {...p} />
                ))}
              </div>
            </DocSection>

            {/* ════ 02 BRAND ════ */}
            <DocSection id="brand" eyebrow="Foundation · 02"
              title="Brand Identity"
              sub="The Dezentra wordmark in three contexts. The brand color is the only saturated hue in the system.">
              <div className="flex flex-col gap-6">
                {/* Large lockup */}
                <Demo label="Primary lockup — on white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                         style={{ background: DS.colors.brand }}>
                      <Network className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[26px] font-extrabold tracking-[-0.6px]" style={{ color: DS.colors.textPrimary }}>
                      Dezentra
                    </span>
                  </div>
                </Demo>
                {/* On dark */}
                <Demo label="Reversed — on dark surface">
                  <div className="rounded-[10px] p-6 flex items-center gap-3" style={{ background: DS.colors.textPrimary }}>
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                         style={{ background: DS.colors.brand }}>
                      <Network className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[26px] font-extrabold tracking-[-0.6px] text-white">Dezentra</span>
                  </div>
                </Demo>
                {/* Compact */}
                <Demo label="Compact / monogram">
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                         style={{ background: DS.colors.brand }}>
                      <Network className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center border-2"
                         style={{ borderColor: DS.colors.brand }}>
                      <Network className="w-5 h-5" style={{ color: DS.colors.brand }} />
                    </div>
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                         style={{ background: DS.colors.brandSoft }}>
                      <Network className="w-5 h-5" style={{ color: DS.colors.brand }} />
                    </div>
                  </div>
                </Demo>
              </div>
            </DocSection>

            {/* ════ 03 COLOR ════ */}
            <DocSection id="color" eyebrow="Foundation · 03"
              title="Color Palette"
              sub="One brand hue. Semantic state colors. Neutral surfaces. The system never adds a second saturated color.">
              <div className="flex flex-col gap-8">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground mb-4">Brand & Neutrals</p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                    {DS.swatches.brand.map((s) => <ColorSwatch key={s.name} {...s} />)}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground mb-4">Semantic</p>
                  <div className="grid grid-cols-4 gap-4">
                    {DS.swatches.semantic.map((s) => <ColorSwatch key={s.name} {...s} />)}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground mb-4">Chart</p>
                  <div className="grid grid-cols-4 gap-4">
                    {DS.swatches.chart.map((s) => <ColorSwatch key={s.name} {...s} />)}
                  </div>
                </div>
                {/* Escrow state palette */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground mb-4">Escrow States</p>
                  <div className="grid grid-cols-5 gap-3">
                    {(["active","completed","cancelled","expired","locked"] as const).map((st) => (
                      <div key={st} className="flex flex-col gap-2">
                        <div className="h-10 rounded-[8px] flex items-center justify-center"
                             style={{ background: DS.escrow[st].bg }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: DS.escrow[st].dot }} />
                        </div>
                        <p className="text-[11px] font-semibold capitalize">{st}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{DS.escrow[st].fg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DocSection>

            {/* ════ 04 TYPOGRAPHY ════ */}
            <DocSection id="typography" eyebrow="Foundation · 04"
              title="Type Scale"
              sub="Plus Jakarta Sans for UI, JetBrains Mono for addresses and code. Body is 13px — tight, scannable, financial.">
              <Demo>
                {DS.type.sizes.map((t) => <TypeSpecimen key={t.name} {...t} />)}
              </Demo>
            </DocSection>

            {/* ════ 05 GEOMETRY ════ */}
            <DocSection id="geometry" eyebrow="Foundation · 05"
              title="Geometry Tokens"
              sub="Spacing, radius, and shadow. Right angles only appear inside data tables — never on chrome.">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Spacing */}
                <Demo label="Spacing">
                  <div className="flex flex-col gap-3">
                    {Object.entries(DS.spacing).map(([k, v]) => (
                      <SpacingBar key={k} label={k} px={v} />
                    ))}
                  </div>
                </Demo>
                {/* Radius */}
                <Demo label="Border Radius">
                  <div className="flex flex-wrap gap-5">
                    {Object.entries(DS.radius).map(([k, v]) => (
                      <RadiusChip key={k} label={k} radius={v} />
                    ))}
                  </div>
                </Demo>
                {/* Shadows */}
                <Demo label="Elevation">
                  <div className="flex flex-wrap gap-6">
                    {Object.entries(DS.shadow).map(([k, v]) => (
                      <ShadowChip key={k} label={k} shadow={v} />
                    ))}
                  </div>
                </Demo>
              </div>
            </DocSection>

            {/* ════ 06 TOKENS ════ */}
            <DocSection id="tokens" eyebrow="Foundation · 06"
              title="Design Tokens"
              sub="CSS custom properties. Declared in globals.css and mirrored in lib/design-system.ts. Change in one place, update everywhere.">
              <Demo>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-[11px] uppercase tracking-[0.8px] text-muted-foreground pb-3 pr-6">Variable</th>
                      <th className="text-left text-[11px] uppercase tracking-[0.8px] text-muted-foreground pb-3 pr-6">Description</th>
                      <th className="text-left text-[11px] uppercase tracking-[0.8px] text-muted-foreground pb-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DS.tokens.map((t) => <TokenRow key={t.variable} {...t} />)}
                  </tbody>
                </table>
              </Demo>
            </DocSection>

            {/* ════ TRANSITION ════ */}
            <section id="transition" className="py-16 scroll-mt-6">
              <div className="rounded-[20px] border border-border overflow-hidden"
                   style={{ background: "var(--brand-soft)" }}>
                <div className="p-10 flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-[1px] opacity-50" style={{ background: "var(--accent-foreground)" }} />
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[1.4px]" style={{ color: "var(--accent-foreground)" }}>
                      Foundation → Components
                    </p>
                    <div className="flex-1 h-[1px] opacity-50" style={{ background: "var(--accent-foreground)" }} />
                  </div>
                  <h2 className="text-[26px] font-extrabold tracking-[-0.6px] max-w-[560px] leading-[1.2]">
                    Tokens become interfaces.
                    <span style={{ color: "var(--accent-foreground)" }}> Rules become components.</span>
                  </h2>
                  <p className="text-[14px] text-muted-foreground max-w-[540px] leading-relaxed">
                    Everything below is a direct expression of the six principles and the token set above.
                    No component invents a new color, shadow, or radius. The system is closed.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {["nonReentrant", "approve → transferFrom", "FSM: Idle→Confirm", "errors.ts mapper"].map((tag) => (
                      <Tok key={tag}>{tag}</Tok>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ════ 07 BUTTONS ════ */}
            <DocSection id="buttons" eyebrow="Components · 07"
              title="Buttons"
              sub="Primary uses brand indigo. Secondary is neutral surface. Ghost for tertiary actions. Destructive for irreversible ops.">
              <div className="flex flex-col gap-6">
                <Demo label="Variants">
                  <div className="flex flex-wrap gap-3">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </Demo>
                <Demo label="With Icons">
                  <div className="flex flex-wrap gap-3">
                    <Button className="gap-2"><Lock className="w-4 h-4" /> Lock Funds</Button>
                    <Button variant="outline" className="gap-2"><ArrowLeftRight className="w-4 h-4" /> Swap</Button>
                    <Button variant="ghost" className="gap-2"><ExternalLink className="w-4 h-4" /> View TX</Button>
                  </div>
                </Demo>
                <Demo label="Sizes">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="lg">Large</Button>
                    <Button>Default</Button>
                    <Button size="sm">Small</Button>
                  </div>
                </Demo>
                <Demo label="States">
                  <div className="flex flex-wrap gap-3">
                    <Button disabled>Disabled</Button>
                    <Button className="gap-2">
                      <span className="inline-block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Mining…
                    </Button>
                    {/* Shimmer button — brand-only tone */}
                    <button
                      className="relative inline-flex h-9 items-center justify-center rounded-[9px] px-5 text-[13px] font-semibold text-white overflow-hidden"
                      style={{ background: DS.colors.brand }}
                      onClick={() => toast.success("Action confirmed")}
                    >
                      <span className="absolute inset-0 rounded-[9px] opacity-0 hover:opacity-100 transition-opacity duration-300"
                            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)" }} />
                      <span className="relative">Confirm ✦</span>
                    </button>
                  </div>
                </Demo>
              </div>
            </DocSection>

            {/* ════ 08 ALERTS ════ */}
            <DocSection id="alerts" eyebrow="Components · 08"
              title="Alerts"
              sub="Four semantic states. Used for inline feedback — not for toasts. Never use raw hex for these backgrounds.">
              <div className="flex flex-col gap-3">
                <Alert style={{ background: "var(--info-bg)", borderColor: "var(--info-fg)", color: "var(--info-fg)" }}>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Info — Escrow deployed</AlertTitle>
                  <AlertDescription style={{ color: "var(--info-fg)", opacity: 0.8 }}>Contract at 0x5FbDB…1aa3 · Chain 31337</AlertDescription>
                </Alert>
                <Alert style={{ background: "var(--ok-bg)", borderColor: "var(--ok-fg)", color: "var(--ok-fg)" }}>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Success — Swap settled</AlertTitle>
                  <AlertDescription style={{ color: "var(--ok-fg)", opacity: 0.8 }}>
                    500 TKA → 1000 TKB · Block 18,421,312
                  </AlertDescription>
                </Alert>
                <Alert style={{ background: "var(--warn-bg)", borderColor: "var(--warn-fg)", color: "var(--warn-fg)" }}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning — Deadline in 2h</AlertTitle>
                  <AlertDescription style={{ color: "var(--warn-fg)", opacity: 0.8 }}>
                    Complete the swap before expiry to avoid fund return.
                  </AlertDescription>
                </Alert>
                <Alert style={{ background: "var(--err-bg)", borderColor: "var(--err-fg)", color: "var(--err-fg)" }}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error — Insufficient allowance</AlertTitle>
                  <AlertDescription style={{ color: "var(--err-fg)", opacity: 0.8 }}>
                    Please approve the token transfer first.
                  </AlertDescription>
                </Alert>
              </div>
            </DocSection>

            {/* ════ 09 BADGES ════ */}
            <DocSection id="badges" eyebrow="Components · 09"
              title="Badges"
              sub="Status indicators and label tags. Pills for escrow state, compact for metadata.">
              <div className="flex flex-col gap-6">
                <Demo label="Default variants">
                  <div className="flex flex-wrap gap-3">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Error</Badge>
                  </div>
                </Demo>
                <Demo label="Escrow state badges">
                  <div className="flex flex-wrap gap-3">
                    {(["active","completed","cancelled","expired","locked"] as const).map((s) => (
                      <StatusBadge key={s} state={s} />
                    ))}
                  </div>
                </Demo>
              </div>
            </DocSection>

            {/* ════ 10 CARDS ════ */}
            <DocSection id="cards" eyebrow="Components · 10"
              title="Cards"
              sub="Surface #FFF on bg #F4F5FA. 16px radius. Shadow on hover lifts by 1px. No hard outlines in data-dense layouts.">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Stat card — locked balance with delta */}
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-px" style={{ boxShadow: DS.shadow.card }}>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--brand-soft)" }}>
                          <Lock className="w-4 h-4" style={{ color: "var(--brand)" }} />
                        </div>
                        <p className="text-[13px] font-semibold" style={{ color: "var(--fg-2)" }}>Locked balance</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 mb-1">
                      <p className="text-[26px] font-extrabold tracking-tight leading-none">$487,250</p>
                      <span className="mb-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--ok-bg)", color: "var(--ok-fg)" }}>↑ 12.4%</span>
                    </div>
                    <p className="text-[12px]" style={{ color: "var(--fg-3)" }}>Across <span style={{ color: "var(--link)", fontWeight: 600 }}>23 active deals</span></p>
                  </CardContent>
                </Card>

                {/* Deal card — awaiting signature state */}
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-px" style={{ boxShadow: DS.shadow.card }}>
                  <CardContent className="p-0">
                    {/* Card header row */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                      <div>
                        <p className="font-mono text-[10px]" style={{ color: "var(--fg-3)" }}>DEAL · VLN-7283</p>
                        <p className="text-[13px] font-bold mt-0.5">UI retainer — Helio</p>
                      </div>
                      <StatusBadge state="active" />
                    </div>
                    {/* Amount */}
                    <div className="px-4 pb-3">
                      <span className="text-[22px] font-extrabold tracking-tight">$8,200</span>
                      <span className="text-[12px] font-semibold ml-1" style={{ color: "var(--fg-3)" }}>USDC</span>
                    </div>
                    {/* Progress steps */}
                    <div className="px-4 pb-3 flex items-center gap-1.5 text-[11px]">
                      {["Funded","Delivered","Sign to release"].map((step, i) => (
                        <div key={step} className="flex items-center gap-1.5">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0`}
                               style={{ background: i < 2 ? "var(--brand)" : "var(--border)", }}>
                            {i < 2 && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span style={{ color: i === 2 ? "var(--foreground)" : "var(--fg-3)", fontWeight: i === 2 ? 600 : 400 }}>{step}</span>
                          {i < 2 && <div className="w-5 h-px" style={{ background: "var(--brand)" }} />}
                        </div>
                      ))}
                    </div>
                    {/* Parties */}
                    <div className="flex items-center justify-between px-4 pb-3 border-t pt-2.5" style={{ borderColor: "var(--border-soft)" }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center" style={{ background: DS.colors.avatars[2] }}>JK</div>
                        <span className="text-[11px]" style={{ color: "var(--fg-2)" }}>Jamie K.</span>
                        <span style={{ color: "var(--fg-3)" }}>→</span>
                        <div className="w-6 h-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center" style={{ background: DS.colors.avatars[3] }}>HL</div>
                        <span className="text-[11px]" style={{ color: "var(--fg-2)" }}>Helio</span>
                      </div>
                      <span className="font-mono text-[10px]" style={{ color: "var(--fg-3)" }}>0x8Ac4…8c91</span>
                    </div>
                    {/* Action */}
                    <div className="px-3 pb-3">
                      <Button size="sm" className="w-full" style={{ boxShadow: "var(--sh-brand)" }}>Sign &amp; release</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Token balance card */}
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-px" style={{ boxShadow: DS.shadow.card }}>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: DS.colors.brand }}>TKA</div>
                      <div>
                        <p className="text-[13px] font-bold">Token A</p>
                        <p className="text-[11px]" style={{ color: "var(--fg-3)" }}>ERC20 · Anvil 31337</p>
                      </div>
                    </div>
                    <p className="text-[24px] font-extrabold tracking-tight">1,500 TKA</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[12px]" style={{ color: "var(--fg-3)" }}>Wallet balance</p>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--surface-sunk)", color: "var(--fg-2)" }}>18 dec</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </DocSection>

            {/* ════ 11 TABLE ════ */}
            <DocSection id="table" eyebrow="Components · 11"
              title="Table"
              sub="Financial tables: monospaced amounts, row-hover, status pill, minimal chrome. Header uses surface-sunk #F3F4F8.">
              <Demo>
                <div className="overflow-auto">
                  <table className="w-full min-w-[600px] text-[13px]">
                    <thead>
                      <tr style={{ background: "var(--table-head)" }} className="border-b border-border">
                        {["#", "Pair", "Amount A", "Amount B", "Deadline", "Status"].map((h) => (
                          <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground px-4 py-3 first:rounded-tl-[10px] last:rounded-tr-[10px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: 24, pair: "TKA / TKB", a: "500",  b: "1,000", dl: "47h 12m", state: "active"    as const },
                        { id: 23, pair: "TKB / TKA", a: "200",  b: "400",   dl: "Expired",  state: "expired"   as const },
                        { id: 22, pair: "TKA / TKB", a: "1,000",b: "2,100", dl: "Done",     state: "completed" as const },
                        { id: 21, pair: "TKB / TKA", a: "75",   b: "150",   dl: "Cancelled",state: "cancelled" as const },
                      ].map((row) => (
                        <tr key={row.id} style={{ "--tw-bg-opacity": "1" } as React.CSSProperties}
                            className="border-b border-border hover:bg-[var(--row-hover)] transition-colors cursor-pointer">
                          <td className="px-4 py-3 font-mono text-muted-foreground">#{row.id}</td>
                          <td className="px-4 py-3 font-semibold">{row.pair}</td>
                          <td className="px-4 py-3 font-mono">{row.a}</td>
                          <td className="px-4 py-3 font-mono">{row.b}</td>
                          <td className="px-4 py-3 text-muted-foreground">{row.dl}</td>
                          <td className="px-4 py-3"><StatusBadge state={row.state} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Demo>
            </DocSection>

            {/* ════ 12 ACCORDION ════ */}
            <DocSection id="accordion" eyebrow="Components · 12"
              title="Accordion"
              sub="Used for operation details, FAQs, and collapsible audit info. Smooth 200ms transitions. Never bounces.">
              <Demo>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="op">
                    <AccordionTrigger className="text-[14px] font-semibold">Operation #24 — Details</AccordionTrigger>
                    <AccordionContent className="text-[13px] text-muted-foreground space-y-1">
                      <p>Creator: <span className="font-mono">0xf39F…2266</span></p>
                      <p>Token A: <span className="font-mono">500 TKA</span> · Token B: <span className="font-mono">1,000 TKB</span></p>
                      <p>Created: Block 18,421,304 · Deadline: 47h 12m</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="contract">
                    <AccordionTrigger className="text-[14px] font-semibold">Smart Contract Info</AccordionTrigger>
                    <AccordionContent className="text-[13px] text-muted-foreground">
                      <p>Escrow: <span className="font-mono">0x5FbDB…1aa3</span> · Chain 31337 (Anvil)</p>
                      <p>Solidity 0.8.13 · ReentrancyGuard · Ownable · Pausable</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="security">
                    <AccordionTrigger className="text-[14px] font-semibold">Security Guarantees</AccordionTrigger>
                    <AccordionContent className="text-[13px] text-muted-foreground">
                      Atomic settlement. Neither party can claim funds without fulfilling their obligation.
                      Fee-on-transfer tokens are rejected at deposit (I7). Approval is reset before re-approving (I14).
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Demo>
            </DocSection>

            {/* ════ 13 NAVIGATION ════ */}
            <DocSection id="navigation" eyebrow="Components · 13"
              title="Navigation"
              sub="Breadcrumbs for deep pages. Fancy tabs for primary filtering. Underline tabs for detail views.">
              <div className="flex flex-col gap-6">
                <Demo label="Breadcrumb">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem><BreadcrumbLink href="#">Dashboard</BreadcrumbLink></BreadcrumbItem>
                      <BreadcrumbSeparator><ChevronRight className="w-4 h-4" /></BreadcrumbSeparator>
                      <BreadcrumbItem><BreadcrumbLink href="#">Operations</BreadcrumbLink></BreadcrumbItem>
                      <BreadcrumbSeparator><ChevronRight className="w-4 h-4" /></BreadcrumbSeparator>
                      <BreadcrumbItem><BreadcrumbPage>Op #24</BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </Demo>
                <Demo label="Fancy tabs (primary filter)">
                  <div className="flex gap-2 flex-wrap mb-4">
                    {fancyTabs.map((t) => (
                      <button key={t.key} onClick={() => setFancyTab(t.key)}
                        className="px-4 py-2 rounded-[9999px] text-[13px] font-semibold transition-all duration-150"
                        style={fancyTab === t.key
                          ? { background: DS.colors.brand, color: "#fff", boxShadow: DS.shadow.brand }
                          : { background: "var(--surface-sunk,var(--muted))", color: "var(--fg-2,var(--muted-foreground))" }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[13px] text-muted-foreground">{fancyTabs.find((t) => t.key === fancyTab)?.content}</p>
                </Demo>
                <Demo label="Underline tabs (detail view)">
                  <div className="flex gap-6 border-b border-border mb-4">
                    {ulTabs.map((t) => (
                      <button key={t.key} onClick={() => setUlTab(t.key)}
                        className="pb-3 text-[13px] font-semibold transition-all duration-150 border-b-2"
                        style={ulTab === t.key
                          ? { borderColor: DS.colors.brand, color: DS.colors.brand }
                          : { borderColor: "transparent", color: "var(--fg-2,var(--muted-foreground))" }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[13px] text-muted-foreground">{ulTabs.find((t) => t.key === ulTab)?.content}</p>
                </Demo>
              </div>
            </DocSection>

            {/* ════ 14 FORMS ════ */}
            <DocSection id="forms" eyebrow="Components · 14"
              title="Forms"
              sub="Input, Textarea, Switch, Slider. Surface-sunk fill #F3F4F8. No right-angle borders. Focus ring is brand indigo.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Demo label="Text inputs">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="amount-a">Amount A</Label>
                      <div className="relative">
                        <Input id="amount-a" placeholder="0.00" className="pr-14" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted-foreground">TKA</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="amount-b">Amount B</Label>
                      <div className="relative">
                        <Input id="amount-b" placeholder="0.00" className="pr-14" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted-foreground">TKB</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="deadline">Deadline (hours)</Label>
                      <Input id="deadline" type="number" placeholder="48" />
                    </div>
                  </div>
                </Demo>
                <Demo label="Controls">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" placeholder="Optional memo for this swap…" rows={3} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-complete on match</Label>
                      <Switch />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Label>Deadline</Label>
                        <span className="font-mono text-[12px] text-muted-foreground">{sliderVal[0]}h</span>
                      </div>
                      <Slider value={sliderVal} onValueChange={setSliderVal} min={1} max={168} step={1} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="search">Search operations</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="search" placeholder="Address, token, amount…" className="pl-9" />
                      </div>
                    </div>
                  </div>
                </Demo>
              </div>
            </DocSection>

            {/* ════ 15 STEPPER ════ */}
            <DocSection id="stepper" eyebrow="Components · 15"
              title="Transaction Stepper"
              sub="Every on-chain TX follows: Approve → Sign → Mining → Confirmed. The double-signature flow (approve then op) is enforced — second step only starts once first is mined.">
              <Demo>
                <div className="flex flex-col gap-6">
                  <Stepper steps={txSteps} activeStep={stepperStep - 1} />
                  <div className="flex gap-3">
                    <Button size="sm" variant="outline" onClick={() => setStepperStep((s) => Math.max(1, s - 1))} disabled={stepperStep === 1}>Back</Button>
                    <Button size="sm" onClick={() => setStepperStep((s) => Math.min(txSteps.length, s + 1))} disabled={stepperStep === txSteps.length}>
                      {stepperStep === txSteps.length ? "Done" : "Next"}
                    </Button>
                  </div>
                  <div className="p-4 rounded-[10px] font-mono text-[12px] text-[var(--ok-fg)] border"
                       style={{ background: "var(--ok-bg)", borderColor: "var(--ok-fg)" }}>
                    <span className="animate-pulse">▶ </span>{typeText}<span style={{ animation: "blink 1s step-end infinite" }}>|</span>
                  </div>
                </div>
              </Demo>
            </DocSection>

            {/* ════ 16 DIALOGS & FEEDBACK ════ */}
            <DocSection id="dialogs" eyebrow="Components · 16"
              title="Overlays & Critical Feedback"
              sub="Modal system for financial operations. Blocks background on every critical confirm — never slide-in. Each modal follows the same header / body / footer contract. Toast layer handles non-blocking async events.">

              {/* ── Trigger grid ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* 1 · SWAP CONFIRMATION */}
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "var(--info-bg)" }}>
                      <Lock className="h-3.5 w-3.5" style={{ color: "var(--info-fg)" }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold leading-none" style={{ color: "var(--fg-1, var(--foreground))" }}>Swap Confirmation</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>Double-sig: approve then lock</p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-9 text-[12px] font-medium">Confirm Swap</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[440px]">
                      {/* Icon header */}
                      <div className="flex flex-col items-center gap-3 pt-2 pb-1">
                        <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--info-bg)" }}>
                          <Lock className="h-6 w-6" style={{ color: "var(--info-fg)" }} />
                        </div>
                        <div className="text-center">
                          <DialogTitle className="text-[18px] font-bold tracking-tight">Confirm Escrow Lock</DialogTitle>
                          <DialogDescription className="text-[13px] mt-1" style={{ color: "var(--fg-2)" }}>
                            Review your swap. This requires two wallet signatures.
                          </DialogDescription>
                        </div>
                      </div>

                      {/* Transaction summary */}
                      <div className="mt-3 rounded-xl p-4 space-y-3" style={{ background: "var(--muted, #f5f5f7)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between">
                          <div className="text-center flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--fg-3)" }}>You lock</p>
                            <p className="text-[22px] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>500 TKA</p>
                          </div>
                          <ArrowRight className="h-4 w-4 mx-2 flex-shrink-0" style={{ color: "var(--fg-3)" }} />
                          <div className="text-center flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--fg-3)" }}>You receive</p>
                            <p className="text-[22px] font-bold tracking-tight" style={{ color: "var(--foreground)" }}>1,000 TKB</p>
                          </div>
                        </div>
                        <div className="border-t pt-3 space-y-2" style={{ borderColor: "var(--border)" }}>
                          <div className="flex justify-between text-[12px]">
                            <span style={{ color: "var(--fg-2)" }}>Counterparty deadline</span>
                            <span className="font-medium" style={{ color: "var(--foreground)" }}>48 h from now</span>
                          </div>
                          <div className="flex justify-between text-[12px]">
                            <span style={{ color: "var(--fg-2)" }}>Contract</span>
                            <span className="font-mono text-[11px]" style={{ color: "var(--foreground)" }}>0x5FbD…1aa3</span>
                          </div>
                          <div className="flex justify-between text-[12px]">
                            <span style={{ color: "var(--fg-2)" }}>Network</span>
                            <span className="font-medium" style={{ color: "var(--foreground)" }}>Anvil · Chain 31337</span>
                          </div>
                        </div>
                      </div>

                      {/* Step hint */}
                      <div className="flex items-start gap-2 px-1 mt-1">
                        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--info-fg)" }} />
                        <p className="text-[11px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
                          Step 1 of 2 — wallet will ask to <strong>approve</strong> TKA spend. Step 2 triggers automatically once mined.
                        </p>
                      </div>

                      <DialogFooter className="flex-col gap-2 mt-2">
                        <Button
                          className="w-full h-11 text-[13px] font-semibold"
                          onClick={() => toast.success("Awaiting wallet signature — Step 1/2", { description: "Approve TKA spend in MetaMask." })}
                        >
                          <Lock className="h-3.5 w-3.5 mr-2" /> Approve & Lock Tokens
                        </Button>
                        <DialogClose asChild>
                          <Button variant="ghost" className="w-full h-9 text-[12px]" style={{ color: "var(--fg-2)" }}>Cancel</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* 2 · SUCCESS */}
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "var(--ok-bg)" }}>
                      <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--ok-fg)" }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold leading-none" style={{ color: "var(--fg-1, var(--foreground))" }}>Swap Settled</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>On-chain confirmation receipt</p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-9 text-[12px] font-medium" style={{ borderColor: "var(--ok-fg)", color: "var(--ok-fg)" }}>
                        View Receipt
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                      <div className="flex flex-col items-center gap-3 pt-2 pb-1">
                        <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: "var(--ok-bg)" }}>
                          <CheckCircle2 className="h-7 w-7" style={{ color: "var(--ok-fg)" }} />
                        </div>
                        <div className="text-center">
                          <DialogTitle className="text-[18px] font-bold tracking-tight">Swap Settled</DialogTitle>
                          <DialogDescription className="text-[13px] mt-1" style={{ color: "var(--fg-2)" }}>
                            Tokens transferred atomically on-chain.
                          </DialogDescription>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl divide-y" style={{ border: "1px solid var(--border)" }}>
                        <div className="flex justify-between items-center px-4 py-3">
                          <span className="text-[12px]" style={{ color: "var(--fg-2)" }}>You received</span>
                          <span className="text-[14px] font-bold" style={{ color: "var(--ok-fg)" }}>1,000 TKB</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3">
                          <span className="text-[12px]" style={{ color: "var(--fg-2)" }}>Operation</span>
                          <span className="text-[12px] font-mono" style={{ color: "var(--foreground)" }}>#24</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3">
                          <span className="text-[12px]" style={{ color: "var(--fg-2)" }}>Block</span>
                          <span className="text-[12px] font-mono" style={{ color: "var(--foreground)" }}>18,421,312</span>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3">
                          <span className="text-[12px]" style={{ color: "var(--fg-2)" }}>TX hash</span>
                          <span className="text-[11px] font-mono" style={{ color: "var(--foreground)" }}>0x82f…a292</span>
                        </div>
                      </div>

                      <DialogFooter className="flex-col gap-2 mt-3">
                        <Button className="w-full h-11 text-[13px] font-semibold" style={{ background: "var(--ok-fg)", color: "#fff" }}>
                          <ExternalLink className="h-3.5 w-3.5 mr-2" /> View on Explorer
                        </Button>
                        <DialogClose asChild>
                          <Button variant="ghost" className="w-full h-9 text-[12px]" style={{ color: "var(--fg-2)" }}>Back to Dashboard</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* 3 · ERROR */}
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "var(--err-bg)" }}>
                      <AlertCircle className="h-3.5 w-3.5" style={{ color: "var(--err-fg)" }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold leading-none" style={{ color: "var(--fg-1, var(--foreground))" }}>Error State</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>Revert / insufficient allowance</p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-9 text-[12px] font-medium" style={{ borderColor: "var(--err-fg)", color: "var(--err-fg)" }}>
                        Trigger Error
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                      <div className="flex flex-col items-center gap-3 pt-2 pb-1">
                        <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: "var(--err-bg)" }}>
                          <AlertCircle className="h-7 w-7" style={{ color: "var(--err-fg)" }} />
                        </div>
                        <div className="text-center">
                          <DialogTitle className="text-[18px] font-bold tracking-tight">Transaction Reverted</DialogTitle>
                          <DialogDescription className="text-[13px] mt-1" style={{ color: "var(--fg-2)" }}>
                            The contract rejected this operation.
                          </DialogDescription>
                        </div>
                      </div>

                      {/* Error detail box */}
                      <div className="mt-3 rounded-xl p-4 space-y-2" style={{ background: "var(--err-bg)", border: "1px solid var(--err-fg)" }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--err-fg)" }}>Revert reason</p>
                        <p className="font-mono text-[12px] font-medium" style={{ color: "var(--err-fg)" }}>Insufficient allowance</p>
                        <p className="text-[12px] leading-relaxed" style={{ color: "var(--err-fg)", opacity: 0.8 }}>
                          Please approve the token transfer first. Reset allowance to 0 before re-approving.
                        </p>
                      </div>

                      <DialogFooter className="flex-col gap-2 mt-3">
                        <Button
                          className="w-full h-11 text-[13px] font-semibold"
                          style={{ background: "var(--err-fg)", color: "#fff" }}
                          onClick={() => toast.info("Re-approving allowance…", { description: "Step 1/2 — reset to 0 first." })}
                        >
                          Re-approve Allowance
                        </Button>
                        <DialogClose asChild>
                          <Button variant="ghost" className="w-full h-9 text-[12px]" style={{ color: "var(--fg-2)" }}>Dismiss</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* 4 · MINING / LOADING */}
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "var(--info-bg)" }}>
                      <Clock className="h-3.5 w-3.5" style={{ color: "var(--info-fg)" }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold leading-none" style={{ color: "var(--fg-1, var(--foreground))" }}>Mining State</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>Blockchain wait with FSM steps</p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-9 text-[12px] font-medium">View Loading</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[380px]" hideClose>
                      <div className="py-8 flex flex-col items-center gap-6">
                        {/* Animated icon */}
                        <div className="relative h-16 w-16">
                          <div className="absolute inset-0 rounded-full opacity-20 animate-ping" style={{ background: "var(--info-fg)" }} />
                          <div className="relative h-16 w-16 rounded-full flex items-center justify-center" style={{ background: "var(--info-bg)" }}>
                            <Loader2 className="h-7 w-7 animate-spin" style={{ color: "var(--info-fg)" }} />
                          </div>
                        </div>

                        <div className="text-center space-y-1">
                          <DialogTitle className="text-[17px] font-bold">Mining Transaction…</DialogTitle>
                          <DialogDescription className="text-[12px]" style={{ color: "var(--fg-2)" }}>
                            Waiting for block confirmation. Do not close this window.
                          </DialogDescription>
                        </div>

                        {/* FSM steps */}
                        <div className="w-full space-y-2">
                          {[
                            { label: "Allowance approved", done: true },
                            { label: "Signature submitted", done: true },
                            { label: "Awaiting block inclusion", done: false, active: true },
                            { label: "Confirmed", done: false },
                          ].map((step, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                                step.done ? "text-white" : step.active ? "border-2" : "border"
                              }`}
                                style={{
                                  background: step.done ? "var(--ok-fg)" : "transparent",
                                  borderColor: step.active ? "var(--info-fg)" : "var(--border)",
                                  color: step.active ? "var(--info-fg)" : undefined,
                                }}
                              >
                                {step.done ? <Check className="h-3 w-3" /> : step.active ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              </div>
                              <span className="text-[12px]" style={{
                                color: step.done ? "var(--ok-fg)" : step.active ? "var(--foreground)" : "var(--fg-3)",
                                fontWeight: step.active ? 600 : 400,
                              }}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        <DialogClose asChild>
                          <Button variant="ghost" size="sm" className="text-[11px] uppercase tracking-widest opacity-40 hover:opacity-70">
                            Force Quit
                          </Button>
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* 5 · CANCEL / DESTRUCTIVE */}
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "var(--warn-bg)" }}>
                      <ShieldAlert className="h-3.5 w-3.5" style={{ color: "var(--warn-fg)" }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold leading-none" style={{ color: "var(--fg-1, var(--foreground))" }}>Cancel Operation</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>Destructive — funds returned to wallet</p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-9 text-[12px] font-medium" style={{ borderColor: "var(--warn-fg)", color: "var(--warn-fg)" }}>
                        Cancel Op #24
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[420px]">
                      <div className="flex flex-col items-center gap-3 pt-2 pb-1">
                        <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: "var(--warn-bg)" }}>
                          <TriangleAlert className="h-6 w-6" style={{ color: "var(--warn-fg)" }} />
                        </div>
                        <div className="text-center">
                          <DialogTitle className="text-[18px] font-bold tracking-tight">Cancel Operation #24?</DialogTitle>
                          <DialogDescription className="text-[13px] mt-1" style={{ color: "var(--fg-2)" }}>
                            This action is irreversible. The escrow will be dissolved.
                          </DialogDescription>
                        </div>
                      </div>

                      {/* Return summary */}
                      <div className="mt-3 rounded-xl p-4" style={{ background: "var(--warn-bg)", border: "1px solid var(--warn-fg)" }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--warn-fg)" }}>What happens</p>
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2 text-[12px]" style={{ color: "var(--warn-fg)" }}>
                            <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span>500 TKA returned to your wallet</span>
                          </div>
                          <div className="flex items-start gap-2 text-[12px]" style={{ color: "var(--warn-fg)" }}>
                            <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span>Operation #24 permanently closed</span>
                          </div>
                          <div className="flex items-start gap-2 text-[12px]" style={{ color: "var(--warn-fg)" }}>
                            <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span>Counterparty notified via on-chain event</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-3">
                        <DialogClose asChild>
                          <Button className="w-full h-11 text-[13px] font-semibold">Keep Operation Active</Button>
                        </DialogClose>
                        <button
                          className="w-full h-9 text-[12px] font-semibold rounded-lg transition-opacity hover:opacity-70"
                          style={{ color: "var(--warn-fg)", background: "transparent", border: "none", cursor: "pointer" }}
                          onClick={() => toast.warning("Operation #24 cancelled", { description: "500 TKA returned to your wallet." })}
                        >
                          Yes, Cancel &amp; Withdraw Tokens
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* 6 · TOAST SYSTEM */}
                <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "var(--muted, #f5f5f7)" }}>
                      <Bell className="h-3.5 w-3.5" style={{ color: "var(--fg-2)" }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold leading-none" style={{ color: "var(--fg-1, var(--foreground))" }}>Toast Notifications</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>Non-blocking async feedback</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="h-9 rounded-lg text-[11px] font-semibold uppercase tracking-wider border transition-colors hover:opacity-80"
                      style={{ borderColor: "var(--info-fg)", color: "var(--info-fg)", background: "var(--info-bg)" }}
                      onClick={() => toast.info("Awaiting wallet signature", { description: "Approve TKA spend in MetaMask to continue." })}
                    >
                      Info
                    </button>
                    <button
                      className="h-9 rounded-lg text-[11px] font-semibold uppercase tracking-wider border transition-colors hover:opacity-80"
                      style={{ borderColor: "var(--ok-fg)", color: "var(--ok-fg)", background: "var(--ok-bg)" }}
                      onClick={() => toast.success("Swap settled · Block 18,421,312", { description: "1,000 TKB deposited in your wallet." })}
                    >
                      Success
                    </button>
                    <button
                      className="h-9 rounded-lg text-[11px] font-semibold uppercase tracking-wider border transition-colors hover:opacity-80"
                      style={{ borderColor: "var(--warn-fg)", color: "var(--warn-fg)", background: "var(--warn-bg)" }}
                      onClick={() => toast.warning("Deadline in 2 h", { description: "Complete Op #24 before expiry or funds are auto-returned." })}
                    >
                      Warning
                    </button>
                    <button
                      className="h-9 rounded-lg text-[11px] font-semibold uppercase tracking-wider border transition-colors hover:opacity-80"
                      style={{ borderColor: "var(--err-fg)", color: "var(--err-fg)", background: "var(--err-bg)" }}
                      onClick={() => toast.error("TX reverted — insufficient allowance", { description: "Reset allowance to 0, then re-approve." })}
                    >
                      Error
                    </button>
                  </div>
                </div>
              </div>
            </DocSection>

            {/* ════ 17 UTILITIES ════ */}
            <DocSection id="utilities" eyebrow="Components · 17"
              title="Utilities"
              sub="Tooltips for contextual help. Copy button for addresses. Inline code tokens for contract data.">
              <div className="flex flex-col gap-6">
                <Demo label="Tooltips">
                  <div className="flex flex-wrap gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm"><Info className="w-4 h-4 mr-1.5" />What is escrow?</Button>
                      </TooltipTrigger>
                      <TooltipContent>The contract holds tokens until both parties fulfill their obligations.</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm"><Shield className="w-4 h-4 mr-1.5" />ReentrancyGuard</Button>
                      </TooltipTrigger>
                      <TooltipContent>Prevents reentrancy attacks on all mutating functions (I7).</TooltipContent>
                    </Tooltip>
                  </div>
                </Demo>
                <Demo label="Address copy">
                  <div className="flex items-center gap-3 p-3 rounded-[10px] border border-border bg-[var(--input-bg,var(--muted))] w-fit">
                    <span className="font-mono text-[12px] text-muted-foreground">0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</span>
                    <button onClick={() => copyAddr("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                      {addrCopied ? <Check className="w-4 h-4 text-[var(--ok-fg)]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </Demo>
                <Demo label="Inline tokens">
                  <p className="text-[13px] text-muted-foreground leading-loose">
                    Use <Tok>--brand</Tok> for interactive elements. Use <Tok>--ok-fg</Tok> for success states.
                    Errors go through <Tok>errors.ts</Tok> — never raw hex.
                    The <Tok>nonReentrant</Tok> modifier wraps all mutating functions.
                  </p>
                </Demo>
              </div>
            </DocSection>

            {/* ════ 18 AVATARS ════ */}
            <DocSection id="avatars" eyebrow="Components · 18"
              title="Avatars"
              sub="Gradient-based wallet avatars. Color is deterministic by address index — the user learns to recognize their own instantly.">
              <Demo>
                <div className="flex flex-col gap-6">
                  <div className="flex gap-3 flex-wrap">
                    {DS.colors.avatars.map((grad, i) => (
                      <Avatar key={i}>
                        <AvatarFallback style={{ background: grad, color: "#fff", fontWeight: 700 }}>
                          {String.fromCharCode(65 + i)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {/* Overlap group */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-muted-foreground mb-3">Overlap group — 4 active parties</p>
                    <div className="flex">
                      {DS.colors.avatars.slice(0, 4).map((grad, i) => (
                        <div key={i} className="w-9 h-9 rounded-full border-2 border-card -ml-2 first:ml-0 flex items-center justify-center text-[12px] font-bold text-white"
                             style={{ background: grad, zIndex: 4 - i }}>
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                      <div className="w-9 h-9 rounded-full border-2 border-card -ml-2 flex items-center justify-center text-[11px] font-bold bg-muted text-muted-foreground">
                        +3
                      </div>
                    </div>
                  </div>
                </div>
              </Demo>
            </DocSection>

            {/* ════ 19 ANIMATIONS ════ */}
            <DocSection id="animations" eyebrow="Components · 19"
              title="Motion & Animation"
              sub="150–200ms. Cards fade in with 8px translate. Hover lifts 1px. Nothing bounces. Single-tone shimmer on interactive states only. Money apps that bounce feel like games — and games lose trust.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Demo label="Skeleton shimmer">
                  <div className="flex flex-col gap-3">
                    {[180, 140, 100].map((w) => (
                      <div key={w} className="h-3 rounded-full overflow-hidden" style={{ width: w, background: "var(--border)" }}>
                        <div className="h-full w-full rounded-full animate-pulse" style={{ background: "var(--brand-soft)" }} />
                      </div>
                    ))}
                  </div>
                </Demo>
                <Demo label="Typewriter">
                  <p className="font-mono text-[13px] text-[var(--ok-fg)] h-6">
                    {typeText}<span style={{ animation: "blink 1s step-end infinite" }}>|</span>
                  </p>
                </Demo>
                <Demo label="Animated counter">
                  <div className="flex flex-col gap-3">
                    <p className="text-[32px] font-extrabold tracking-tight">
                      ${counterVal.toLocaleString()}
                    </p>
                    <Button size="sm" variant="outline" onClick={runCounter}>Animate</Button>
                  </div>
                </Demo>
                <Demo label="Card hover (hover me)">
                  <div className="bg-card border border-border rounded-[16px] p-5 cursor-pointer select-none transition-all duration-200 hover:shadow-lg hover:-translate-y-px"
                       style={{ boxShadow: DS.shadow.card }}>
                    <p className="font-semibold text-[14px]">Escrow Op #24</p>
                    <p className="text-[12px] text-muted-foreground mt-1">500 TKA → 1,000 TKB</p>
                  </div>
                </Demo>
              </div>
            </DocSection>

            {/* ════ 20 ESCROW PATTERNS ════ */}
            <DocSection id="escrow" eyebrow="Product · 20"
              title="Escrow-Specific Patterns"
              sub="Assembled UI patterns unique to SwapEscrow. These are direct expressions of the FSM, error mapper, and state tokens.">
              <div className="flex flex-col gap-6">

                {/* Operation card full */}
                <Demo label="Full operation card — Active state (Op #24)">
                  <div className="rounded-[16px] border overflow-hidden" style={{ borderColor: "var(--border)", boxShadow: DS.shadow.card, background: "var(--card)" }}>

                    {/* Header: title + status + countdown */}
                    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "var(--brand-soft)" }}>
                          <ArrowLeftRight className="w-4 h-4" style={{ color: "var(--brand)" }} />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold leading-none">Brand identity — Northwind Co.</p>
                          <p className="font-mono text-[10px] mt-0.5" style={{ color: "var(--fg-3)" }}>OP · VLN-7281</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1" style={{ color: "var(--fg-3)" }} aria-label="Time remaining: 47 hours 12 minutes">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          <span className="font-mono text-[10px]">47h 12m</span>
                        </div>
                        <StatusBadge state="locked" />
                      </div>
                    </div>

                    {/* Token swap row: left-anchored Offering, right-anchored Receiving */}
                    <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--fg-3)" }}>Offering</p>
                        <p className="text-[26px] font-extrabold tracking-tight leading-none">$24,500</p>
                        <p className="text-[11px] font-medium mt-1" style={{ color: "var(--fg-3)" }}>USDC</p>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--background)" }} aria-hidden="true">
                        <ArrowRight className="w-4 h-4" style={{ color: "var(--fg-3)" }} />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--fg-3)" }}>Receiving</p>
                        <p className="text-[26px] font-extrabold tracking-tight leading-none">Design</p>
                        <p className="text-[11px] font-medium mt-1" style={{ color: "var(--fg-3)" }}>file delivery</p>
                      </div>
                    </div>

                    {/* Progress stepper */}
                    <div className="px-5 pt-3 pb-4 flex items-center gap-2 border-t" style={{ borderColor: "var(--border-soft)" }}>
                      {[
                        { label: "Funded", done: true },
                        { label: "In review", active: true },
                        { label: "Released", done: false },
                      ].map((step, i) => (
                        <div key={step.label} className="flex items-center gap-2 flex-1">
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                                 style={{
                                   background: step.done ? "var(--brand)" : step.active ? "var(--brand)" : "var(--border)",
                                   color: step.done || step.active ? "oklch(98% 0.005 270)" : "var(--fg-3)",
                                 }}>
                              {step.done ? <Check className="w-3 h-3" /> : i + 1}
                            </div>
                            <span className="text-[11px]" style={{ color: step.done ? "var(--fg-2)" : step.active ? "var(--foreground)" : "var(--fg-3)", fontWeight: step.active ? 600 : 400 }}>
                              {step.label}
                            </span>
                          </div>
                          {i < 2 && <div className="flex-1 h-px" style={{ background: step.done ? "var(--brand)" : "var(--border)" }} />}
                        </div>
                      ))}
                    </div>

                    {/* Parties row */}
                    <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: "var(--border-soft)" }}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: DS.colors.avatars[2] }}>JK</div>
                          <span className="text-[12px] font-medium" style={{ color: "var(--fg-2)" }}>Jamie K.</span>
                        </div>
                        <ArrowRight className="w-3 h-3" style={{ color: "var(--fg-3)" }} />
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: DS.colors.avatars[3] }}>NW</div>
                          <span className="text-[12px] font-medium" style={{ color: "var(--fg-2)" }}>Northwind</span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px]" style={{ color: "var(--fg-3)" }}>contract: 0xA42f…8c91</span>
                    </div>

                    {/* Action footer */}
                    <div className="px-4 py-3 flex gap-2 border-t" style={{ borderColor: "var(--border)", background: "var(--surface-sunk)" }}>
                      <Button size="sm" className="flex-1 gap-1.5" style={{ boxShadow: "var(--sh-brand)" }}>
                        <Zap className="w-3.5 h-3.5" /> Complete Swap
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <XCircle className="w-3.5 h-3.5" /> Cancel Swap
                      </Button>
                    </div>
                  </div>
                </Demo>

                {/* Disputed state card */}
                <Demo label="Disputed state (Op #28)">
                  <div className="rounded-[16px] border overflow-hidden" style={{ borderColor: "var(--err-fg)", boxShadow: DS.shadow.card, background: "var(--card)" }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "var(--err-bg)" }}>
                          <AlertCircle className="w-4 h-4" style={{ color: "var(--err-fg)" }} />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold">Smart contract audit — RetroLab</p>
                          <p className="font-mono text-[10px] mt-0.5" style={{ color: "var(--fg-3)" }}>DEAL · VLN-7280</p>
                        </div>
                      </div>
                      <StatusBadge state="cancelled" />
                    </div>
                    <div className="px-5 py-4">
                      <div className="flex items-end gap-2 mb-1">
                        <p className="text-[22px] font-extrabold tracking-tight">$48,000</p>
                        <span className="mb-0.5 text-[11px] font-semibold" style={{ color: "var(--fg-3)" }}>USDC</span>
                      </div>
                      <div className="mt-3 p-3 rounded-[8px] text-[12px]" style={{ background: "var(--err-bg)", color: "var(--err-fg)" }}>
                        <p className="font-semibold">Arbitration in progress</p>
                        <p className="opacity-80 mt-0.5">1 deal · counterparty disputed delivery milestone</p>
                      </div>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: "var(--border-soft)" }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: DS.colors.avatars[1] }}>RL</div>
                        <span className="text-[12px]" style={{ color: "var(--fg-2)" }}>RetroLab</span>
                        <span style={{ color: "var(--fg-3)" }}>→</span>
                        <div className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: DS.colors.avatars[0] }}>AS</div>
                        <span className="text-[12px]" style={{ color: "var(--fg-2)" }}>Audrey S.</span>
                      </div>
                      <span className="font-mono text-[10px]" style={{ color: "var(--fg-3)" }}>● 0x7b3e…f82</span>
                    </div>
                  </div>
                </Demo>

                {/* Wallet connection state */}
                <Demo label="Wallet states">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center gap-2 p-4 rounded-[12px] border border-border bg-card">
                      <Wallet className="w-6 h-6 text-muted-foreground" />
                      <p className="text-[12px] font-semibold text-muted-foreground">Disconnected</p>
                      <Button size="sm" variant="outline">Connect Wallet</Button>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-[12px] border border-border bg-card">
                      <div className="w-6 h-6 rounded-full" style={{ background: DS.colors.avatars[0] }} />
                      <p className="font-mono text-[11px] text-muted-foreground">0xf39F…2266</p>
                      <Badge variant="outline" className="text-[10px]">Chain 31337</Badge>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-4 rounded-[12px] border-2 border-[var(--err-fg)] bg-[var(--err-bg)]">
                      <AlertCircle className="w-6 h-6 text-[var(--err-fg)]" />
                      <p className="text-[12px] font-semibold text-[var(--err-fg)]">Wrong Network</p>
                      <Button size="sm" variant="destructive">Switch to Anvil</Button>
                    </div>
                  </div>
                </Demo>

                {/* Error states mapped */}
                <Demo label="Error mapper — errors.ts">
                  <div className="flex flex-col gap-2">
                    {[
                      { revert: '"Tokens must differ"',        msg: "You cannot swap a token for itself" },
                      { revert: '"Operation expired"',         msg: "This swap offer has expired" },
                      { revert: '"Insufficient allowance"',    msg: "Please approve the token transfer first" },
                      { revert: '"Is creator"',                msg: "You cannot complete your own operation" },
                    ].map(({ revert, msg }) => (
                      <div key={revert} className="flex items-center gap-3 text-[12px]">
                        <code className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded w-56 shrink-0">{revert}</code>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-[var(--err-fg)]">{msg}</span>
                      </div>
                    ))}
                  </div>
                </Demo>

              </div>
            </DocSection>

          </div>{/* end content */}

          {/* ── STICKY TOC ── */}
          <aside className="hidden lg:block">
            <nav className="sticky top-8 flex flex-col gap-0.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[1.4px] text-muted-foreground mb-3">
                Contents
              </p>
              {TOC_SECTIONS.map((s) => {
                if ("divider" in s) {
                  return <p key={s.id} className="text-[11px] text-muted-foreground/40 py-1 pl-2 select-none">{s.label}</p>;
                }
                const isActive = activeId === s.id;
                return (
                  <a key={s.id} href={`#${s.id}`}
                     className="text-[12px] py-1 pl-2 rounded-[6px] transition-colors duration-150 block"
                     style={isActive
                       ? { color: DS.colors.brand, fontWeight: 700, background: DS.colors.brandSoft }
                       : { color: "var(--fg-2,#6B7280)", fontWeight: 500 }}>
                    {s.label}
                  </a>
                );
              })}
            </nav>
          </aside>

        </div>{/* end two-column */}

        {/* ── FOOTER ── */}
        <footer className="border-t border-border bg-card mt-4">
          <div className="max-w-[1180px] mx-auto px-8 py-8 flex items-center justify-between text-[12px] text-muted-foreground">
            <span className="font-mono">Dezentra Design System v1.0 · DESIGN.md compliant</span>
            <span>SwapEscrow · CodeCrypto · Anvil 31337</span>
          </div>
        </footer>

      </main>
    </TooltipProvider>
  );
}
