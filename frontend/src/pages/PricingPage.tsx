import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, X, Shield, BarChart2, Archive, RefreshCw, TrendingUp, ShieldCheck, CalendarDays, Users, Info } from "lucide-react";
import { Button } from "@/components/Button";
import { PLANS, ANNUAL_PLANS } from "@/services/payment";
import type { Plan } from "@/services/payment";
import { useAuth } from "@/contexts/AuthContext";
import { COLORS, FONTS, RADIUS, SHADOWS } from "@/theme";

const S = {
  ink:      COLORS.plum,
  paper:    COLORS.white,
  rule:     COLORS.rule,
  rust:     COLORS.sage,
  inkLight: COLORS.plumMid,
  sage:     COLORS.sage,
  serif:    FONTS.serif,
  mono:     FONTS.mono,
};

const HOMEOWNER_FEATURES_TABLE = [
  { feature: "Properties",                   Free: "1",    Pro: "5",    Premium: "Unlimited" },
  { feature: "Photos per job",               Free: "5",    Pro: "20",   Premium: "Unlimited" },
  { feature: "Quote requests/mo",            Free: "3",    Pro: "10",   Premium: "Unlimited" },
  { feature: "Public HomeGentic report",     Free: true,   Pro: true,   Premium: true        },
  { feature: "Blockchain verified",          Free: true,   Pro: true,   Premium: true        },
  { feature: "Score breakdown",             Free: false,  Pro: true,   Premium: true        },
  { feature: "Warranty Wallet",             Free: false,  Pro: true,   Premium: true        },
  { feature: "Recurring Services",          Free: false,  Pro: true,   Premium: true        },
  { feature: "Market Intelligence",         Free: false,  Pro: true,   Premium: true        },
  { feature: "Insurance Defense Mode",      Free: false,  Pro: true,   Premium: true        },
  { feature: "5-Year Maintenance Calendar", Free: false,  Pro: true,   Premium: true        },
  { feature: "Contractor search",           Free: false,  Pro: true,   Premium: true        },
  { feature: "PDF export",                  Free: false,  Pro: true,   Premium: true        },
  { feature: "Priority support",            Free: false,  Pro: false,  Premium: true        },
];

const CONTRACTOR_FEATURES_TABLE = [
  { feature: "Profile listing",              ContractorFree: true,   ContractorPro: true  },
  { feature: "Receive leads",                ContractorFree: true,   ContractorPro: true  },
  { feature: "Job completion certificates",  ContractorFree: true,   ContractorPro: true  },
  { feature: "Photos per job",               ContractorFree: "5",    ContractorPro: "50"  },
  { feature: "Trust score & reviews",        ContractorFree: false,  ContractorPro: true  },
  { feature: "Lead notifications",           ContractorFree: false,  ContractorPro: true  },
  { feature: "Earnings dashboard",           ContractorFree: false,  ContractorPro: true  },
  { feature: "Priority support",             ContractorFree: false,  ContractorPro: true  },
  { feature: "Referral fee per verified job", ContractorFree: "$15",  ContractorPro: "None" },
];

const FEATURE_SPOTLIGHTS = [
  {
    icon: Shield,
    title: "Blockchain-Verified Records",
    tagline: "Your maintenance history, tamper-proof forever.",
    description:
      "Every job you log is sealed on the Internet Computer Protocol — a decentralized network no single company controls. No one can alter or delete your records, not even us.",
    benefit: "Show buyers, insurers, or inspectors an unimpeachable paper trail on closing day.",
    color: COLORS.sage,
  },
  {
    icon: ShieldCheck,
    title: "Insurance Defense Mode",
    tagline: "Fight a rate hike or claim denial with a single report.",
    description:
      "Generates a print-ready document of every insurance-relevant job — roof, HVAC, electrical, plumbing — sorted by system and dated, ready to hand to your insurer.",
    benefit: "Florida homeowners have used documented maintenance to negotiate premium discounts and overturn claim denials.",
    color: COLORS.sage,
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    tagline: "Know which renovations actually pay off in your zip code.",
    description:
      "Uses 2024 Remodeling Magazine data to rank projects by ROI for your area. Compares your home's condition score to similar nearby properties so you see exactly where you stand.",
    benefit: "Stop guessing. Spend renovation dollars on the projects buyers pay a premium for.",
    color: COLORS.sage,
  },
  {
    icon: BarChart2,
    title: "Score Breakdown",
    tagline: "A report card for your home, not just a number.",
    description:
      "Your HomeGentic Score covers Maintenance History, System Ages, Documentation Quality, and more. Each dimension is graded A–F so you see exactly what's dragging the overall score down.",
    benefit: "Walk into a listing negotiation knowing your home's strengths — and fix the weak spots before you list.",
    color: COLORS.sage,
  },
  {
    icon: CalendarDays,
    title: "5-Year Maintenance Calendar",
    tagline: "Budget for the future instead of being blindsided.",
    description:
      "Based on your home's system ages and service history, HomeGentic generates a personalized 5-year maintenance schedule with projected costs for each task.",
    benefit: "Know that your HVAC needs replacement in year 3 — not when it fails at midnight in August.",
    color: COLORS.sage,
  },
  {
    icon: Archive,
    title: "Warranty Wallet",
    tagline: "Every warranty, receipt, and manual — attached to your home.",
    description:
      "Store appliance warranties, installation receipts, and product manuals directly tied to the job and fixture they belong to. Linked to your blockchain record, not buried in your email.",
    benefit: "File a warranty claim in seconds. Transfer everything to the new owner at closing with one link.",
    color: COLORS.sage,
  },
  {
    icon: RefreshCw,
    title: "Recurring Services",
    tagline: "Never miss the HVAC tune-up that prevents a $12k failure.",
    description:
      "Log ongoing service contracts — HVAC, pest control, landscaping — and HomeGentic tracks every visit, sends reminders, and builds a documented service history automatically.",
    benefit: "Proof of regular maintenance is a selling point. Let the record speak for itself.",
    color: COLORS.sage,
  },
  {
    icon: Users,
    title: "Verified Contractor Search",
    tagline: "Trust scores built from real, dual-signed jobs — not self-reviews.",
    description:
      "Browse contractors whose trust scores are calculated from jobs that both the homeowner and contractor confirmed complete. Fake reviews can't game a cryptographically signed record.",
    benefit: "Hire someone with a proven track record in your neighborhood, not just a 5-star rating they gave themselves.",
    color: COLORS.sage,
  },
];

const FEATURE_TOOLTIPS: Record<string, string> = {
  "Properties": "How many properties you can register and track under your account.",
  "Photos per job": "Max photos you can attach to a single maintenance job record.",
  "Quote requests/mo": "How many contractor quote requests you can open each month.",
  "Public HomeGentic report": "A shareable link buyers, agents, or insurers can view to see your verified maintenance history.",
  "Blockchain verified": "Jobs are stored as immutable records on the Internet Computer Protocol — no one can edit or delete them after the fact.",
  "Score breakdown": "See your HomeGentic Score broken down by category (Maintenance, Age, Documentation, etc.) with an A–F grade for each.",
  "Warranty Wallet": "Store appliance warranties, receipts, and manuals attached to the specific job and fixture they belong to.",
  "Recurring Services": "Log and track ongoing service contracts (HVAC, pest, landscaping) with visit history and automatic reminders.",
  "Market Intelligence": "ROI-ranked renovation recommendations for your zip code, plus a competitive analysis of your home vs. similar properties.",
  "Insurance Defense Mode": "Generates a print-ready report of all insurance-relevant jobs (roof, HVAC, electrical) to support premium negotiations or claim disputes.",
  "5-Year Maintenance Calendar": "A personalized maintenance schedule for the next 5 years, based on your home's system ages, with projected costs.",
  "Contractor search": "Browse verified contractors with trust scores based on completed, dual-signed jobs — not self-reported ratings.",
  "PDF export": "Download a formatted PDF of your full home report to share offline or attach to a listing.",
  "Priority support": "Dedicated support with faster response times for Premium subscribers.",
  "Profile listing": "Your contractor profile is listed in the HomeGentic marketplace for homeowners to discover.",
  "Receive leads": "Get quote requests from homeowners in your area who need your services.",
  "Job completion certificates": "Earn a blockchain-backed certificate for every dual-signed completed job — proof of your work you can show future clients.",
  "Trust score & reviews": "A trust score calculated from your verified job history, displayed on your public profile.",
  "Lead notifications": "Real-time alerts when a new quote request matches your trade and service area.",
  "Earnings dashboard": "Track your HomeGentic-sourced revenue, job count, and referral fee history.",
  "Referral fee per verified job": "ContractorFree accounts pay $15 per job sourced via HomeGentic and verified with a dual-signature. ContractorPro pays no per-job fee.",
};

const FAQS = [
  { q: "How does the contractor referral fee work?", a: "ContractorFree contractors pay a flat $15 fee per job that is both sourced via a HomeGentic quote request and verified (dual-signed). ContractorPro subscribers pay no referral fees — the monthly subscription covers it." },
  { q: "How does blockchain verification work?", a: "Every maintenance job is stored as an immutable record on the Internet Computer Protocol. The data is cryptographically signed and cannot be altered — not even by us." },
  { q: "What is ICP?", a: "The Internet Computer Protocol is a decentralized cloud platform developed by DFINITY. Unlike traditional cloud storage, data on ICP is governed by a decentralized protocol — no single company can take it down." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel your subscription at any time from your Settings page. Your data remains accessible and your blockchain records are permanent — even after cancellation." },
  { q: "What's the difference between annual and monthly billing?", a: "Annual plans are billed once per year at 10× the monthly price — equivalent to 2 months free. Your subscription runs for 365 days from the date of payment." },
];

const BILLING_KEY = "homegentic_pricing_billing";

function FeatureTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: "0.35rem", verticalAlign: "middle", cursor: "help" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <Info size={12} color={COLORS.plumMid} style={{ opacity: 0.5 }} />
      {visible && (
        <span style={{
          position: "absolute", left: "1.25rem", top: "-0.25rem",
          zIndex: 100, width: "220px",
          background: COLORS.plum, color: COLORS.white,
          fontFamily: FONTS.sans, fontSize: "0.75rem", fontWeight: 300,
          lineHeight: 1.55, padding: "0.625rem 0.875rem",
          borderRadius: "4px",
          boxShadow: SHADOWS.hover,
          pointerEvents: "none",
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

function FeatureSpotlights() {
  return (
    <div style={{ marginBottom: "4rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", background: COLORS.butter, color: COLORS.plum, padding: "5px 16px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600, marginBottom: "1rem", border: `1px solid rgba(46,37,64,0.1)` }}>
          What you're getting
        </div>
        <h2 style={{ fontFamily: FONTS.serif, fontWeight: 900, fontSize: "1.75rem", lineHeight: 1, color: COLORS.plum, marginBottom: "0.75rem" }}>
          Features that actually matter
        </h2>
        <p style={{ fontFamily: FONTS.sans, fontSize: "0.875rem", fontWeight: 300, color: COLORS.plumMid, maxWidth: "38rem", margin: "0 auto" }}>
          Most home apps give you a checklist. HomeGentic gives you documentation that works for you at resale, during insurance claims, and before emergencies happen.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1rem",
      }}>
        {FEATURE_SPOTLIGHTS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.rule}`,
              borderRadius: RADIUS.card,
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div style={{
                  width: "2.25rem", height: "2.25rem",
                  background: COLORS.sageLight,
                  borderRadius: "6px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={16} color={COLORS.sage} />
                </div>
                <p style={{ fontFamily: FONTS.serif, fontWeight: 700, fontSize: "1rem", color: COLORS.plum, lineHeight: 1.2 }}>
                  {f.title}
                </p>
              </div>
              <p style={{ fontFamily: FONTS.mono, fontSize: "0.65rem", letterSpacing: "0.04em", color: COLORS.sage, fontWeight: 600, textTransform: "uppercase" }}>
                {f.tagline}
              </p>
              <p style={{ fontFamily: FONTS.sans, fontSize: "0.825rem", fontWeight: 300, color: COLORS.plumMid, lineHeight: 1.65, flexGrow: 1 }}>
                {f.description}
              </p>
              <div style={{
                borderTop: `1px solid ${COLORS.rule}`,
                paddingTop: "0.75rem",
                display: "flex", alignItems: "flex-start", gap: "0.5rem",
              }}>
                <CheckCircle size={13} color={COLORS.sage} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                <p style={{ fontFamily: FONTS.sans, fontSize: "0.8rem", fontWeight: 400, color: COLORS.plum, lineHeight: 1.5 }}>
                  {f.benefit}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { login, devLogin } = useAuth();
  const handleLogin = import.meta.env.DEV ? devLogin : login;
  const navigate = useNavigate();

  const [annual, setAnnual] = useState<boolean>(() => {
    try { return localStorage.getItem(BILLING_KEY) === "annual"; } catch { return false; }
  });
  const [audience, setAudience] = useState<"homeowner" | "contractor">("homeowner");

  useEffect(() => {
    try { localStorage.setItem(BILLING_KEY, annual ? "annual" : "monthly"); } catch {}
  }, [annual]);

  // Plans to display based on toggle state and audience
  const homeownerPlans: Plan[] = annual
    ? PLANS.filter((p) => p.tier === "Free").concat(ANNUAL_PLANS)
    : PLANS.filter((p) => p.tier === "Free" || p.tier === "Pro" || p.tier === "Premium");

  const contractorPlans: Plan[] = PLANS.filter(
    (p) => p.tier === "ContractorFree" || p.tier === "ContractorPro"
  );

  const displayPlans = audience === "homeowner" ? homeownerPlans : contractorPlans;

  return (
    <div style={{ minHeight: "100vh", background: S.paper }}>
      {/* Nav */}
      <header style={{ borderBottom: `1px solid ${S.rule}`, position: "sticky", top: 0, background: S.paper, zIndex: 50 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "3.5rem" }}>
          <Link to="/" style={{ textDecoration: "none", fontFamily: FONTS.serif, fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.5px", color: COLORS.plum }}>
            Home<span style={{ color: COLORS.sage }}>Gentic</span>
          </Link>
          <Button size="sm" onClick={handleLogin}>Get Started Free</Button>
        </div>
      </header>

      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "4rem 1.5rem" }}>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: COLORS.butter, color: COLORS.plum, padding: "5px 16px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600, marginBottom: "1rem", border: `1px solid rgba(46,37,64,0.1)` }}>
            Pricing
          </div>
          <h1 style={{ fontFamily: S.serif, fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1, color: S.ink, marginBottom: "1rem" }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontFamily: FONTS.sans, fontSize: "0.9rem", fontWeight: 300, color: S.inkLight }}>
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>
        </div>

        {/* Audience toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-flex", border: `1px solid ${S.rule}`, borderRadius: RADIUS.sm, overflow: "hidden" }}>
            {(["homeowner", "contractor"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAudience(a)}
                style={{
                  padding: "0.5rem 1.5rem",
                  fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase",
                  background: audience === a ? COLORS.plum : COLORS.white,
                  color: audience === a ? COLORS.white : S.inkLight,
                  border: "none", cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {a === "homeowner" ? "Homeowner" : "Contractor"}
              </button>
            ))}
          </div>
        </div>

        {/* Monthly/Annual toggle — homeowner only */}
        {audience === "homeowner" && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
            <span style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.06em", color: annual ? S.inkLight : S.ink, fontWeight: annual ? 400 : 700 }}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual((v) => !v)}
              aria-label="Toggle annual billing"
              style={{
                width: "2.5rem", height: "1.375rem",
                borderRadius: 100, border: "none", cursor: "pointer",
                background: annual ? COLORS.sage : COLORS.rule,
                position: "relative", transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: "3px",
                left: annual ? "calc(100% - 1.125rem)" : "3px",
                width: "1rem", height: "1rem",
                borderRadius: "50%", background: COLORS.white,
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
            <span style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.06em", color: annual ? S.ink : S.inkLight, fontWeight: annual ? 700 : 400 }}>
              Annual
            </span>
            {annual && (
              <span style={{ background: COLORS.sage, color: COLORS.white, padding: "2px 10px", borderRadius: 100, fontFamily: S.mono, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em" }}>
                Save 2 months
              </span>
            )}
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "4rem" }}>
          {displayPlans.map((plan) => {
            const isPopular = plan.tier === "Pro";
            const isFeatured = plan.tier === "ContractorFree";
            return (
              <div key={plan.tier} style={{
                padding: "2rem",
                borderRadius: RADIUS.card,
                background: isPopular ? COLORS.plum : COLORS.white,
                border: `1.5px solid ${isPopular ? COLORS.plum : isFeatured ? COLORS.sage : COLORS.rule}`,
                boxShadow: isPopular ? SHADOWS.hover : SHADOWS.card,
                position: "relative",
              }}>
                {isPopular && (
                  <div style={{ display: "inline-flex", alignItems: "center", background: COLORS.sage, color: COLORS.white, padding: "3px 12px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                    Most Popular
                  </div>
                )}
                {isFeatured && (
                  <div style={{ display: "inline-flex", alignItems: "center", background: COLORS.butter, color: COLORS.plum, padding: "3px 12px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.75rem", border: `1px solid rgba(46,37,64,0.1)` }}>
                    Start Free
                  </div>
                )}
                <div style={{ fontFamily: FONTS.sans, fontWeight: 600, fontSize: "0.875rem", color: isPopular ? COLORS.sageLight : COLORS.plumMid, marginBottom: "0.5rem" }}>
                  {plan.tier === "ContractorFree" ? "Contractor Free" : plan.tier === "ContractorPro" ? "Contractor Pro" : plan.tier}
                </div>
                <div style={{ marginBottom: plan.tier === "ContractorFree" ? "0.5rem" : "1.5rem" }}>
                  <span style={{ fontFamily: FONTS.serif, fontWeight: 900, fontSize: "2.5rem", lineHeight: 1, color: isPopular ? COLORS.white : COLORS.plum }}>
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ fontFamily: FONTS.mono, fontSize: "0.65rem", color: COLORS.plumMid }}>/{plan.period}</span>
                  )}
                  {plan.period === "year" && (
                    <div style={{ fontFamily: FONTS.mono, fontSize: "0.6rem", color: COLORS.sage, marginTop: "0.25rem", letterSpacing: "0.04em" }}>
                      ${(plan.price / 12).toFixed(2)}/mo billed annually
                    </div>
                  )}
                </div>
                {plan.tier === "ContractorFree" && (
                  <div style={{ fontFamily: FONTS.sans, fontSize: "0.8rem", fontWeight: 300, color: COLORS.plumMid, marginBottom: "1.25rem", padding: "0.5rem 0.75rem", background: COLORS.sageLight, borderRadius: RADIUS.sm, lineHeight: 1.5 }}>
                    $15 flat fee per verified referral job
                  </div>
                )}

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontFamily: FONTS.sans, fontSize: "0.85rem", color: isPopular ? COLORS.sageLight : COLORS.plumMid, fontWeight: 300 }}>
                      <CheckCircle size={14} color={COLORS.sage} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isPopular ? "secondary" : "outline"}
                  style={{ width: "100%", background: isPopular ? COLORS.sage : undefined, color: isPopular ? COLORS.white : undefined, borderColor: isPopular ? COLORS.sage : isFeatured ? COLORS.sage : undefined }}
                  onClick={handleLogin}
                >
                  {plan.price === 0 ? "Get Started Free" : `Upgrade to ${plan.tier === "ContractorPro" ? "Contractor Pro" : plan.tier}`}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Feature spotlights */}
        {audience === "homeowner" && <FeatureSpotlights />}

        {/* Feature comparison */}
        <div style={{ marginBottom: "4rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", background: COLORS.butter, color: COLORS.plum, padding: "5px 16px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600, marginBottom: "1rem", border: `1px solid rgba(46,37,64,0.1)` }}>Compare</div>
            <h2 style={{ fontFamily: S.serif, fontWeight: 900, fontSize: "1.75rem", lineHeight: 1, color: S.ink }}>Feature comparison</h2>
          </div>

          {audience === "homeowner" ? (
            <div style={{ border: `1px solid ${S.rule}`, borderRadius: RADIUS.card, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: COLORS.sageLight }}>
                    <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: S.inkLight, borderBottom: `1px solid ${S.rule}` }}>Feature</th>
                    {(["Free", "Pro", "Premium"] as const).map((tier) => (
                      <th key={tier} style={{ textAlign: "center", padding: "0.875rem 1rem", fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: tier === "Pro" ? S.rust : S.inkLight, borderBottom: `1px solid ${S.rule}` }}>
                        {tier}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOMEOWNER_FEATURES_TABLE.map((row, i) => (
                    <tr key={row.feature} style={{ borderBottom: i < HOMEOWNER_FEATURES_TABLE.length - 1 ? `1px solid ${S.rule}` : "none" }}>
                      <td style={{ padding: "0.75rem 1.25rem", fontFamily: FONTS.sans, fontSize: "0.85rem", fontWeight: 400, color: S.ink }}>
                        {row.feature}
                        {FEATURE_TOOLTIPS[row.feature] && <FeatureTooltip text={FEATURE_TOOLTIPS[row.feature]} />}
                      </td>
                      {(["Free", "Pro", "Premium"] as const).map((tier) => {
                        const val = (row as any)[tier];
                        return (
                          <td key={tier} style={{ textAlign: "center", padding: "0.75rem 1rem" }}>
                            {typeof val === "boolean" ? (
                              val ? <CheckCircle size={14} color={S.sage} style={{ margin: "0 auto" }} /> : <X size={14} color={S.rule} style={{ margin: "0 auto" }} />
                            ) : (
                              <span style={{ fontFamily: FONTS.sans, fontSize: "0.85rem", fontWeight: 500, color: S.ink }}>{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ border: `1px solid ${S.rule}`, borderRadius: RADIUS.card, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: COLORS.sageLight }}>
                    <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: S.inkLight, borderBottom: `1px solid ${S.rule}` }}>Feature</th>
                    {(["ContractorFree", "ContractorPro"] as const).map((tier) => (
                      <th key={tier} style={{ textAlign: "center", padding: "0.875rem 1rem", fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, borderBottom: `1px solid ${S.rule}` }}>
                        {tier === "ContractorFree" ? "Free" : "Pro"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONTRACTOR_FEATURES_TABLE.map((row, i) => (
                    <tr key={row.feature} style={{ borderBottom: i < CONTRACTOR_FEATURES_TABLE.length - 1 ? `1px solid ${S.rule}` : "none" }}>
                      <td style={{ padding: "0.75rem 1.25rem", fontFamily: FONTS.sans, fontSize: "0.85rem", fontWeight: 400, color: S.ink }}>
                        {row.feature}
                        {FEATURE_TOOLTIPS[row.feature] && <FeatureTooltip text={FEATURE_TOOLTIPS[row.feature]} />}
                      </td>
                      {(["ContractorFree", "ContractorPro"] as const).map((tier) => {
                        const val = (row as any)[tier];
                        return (
                          <td key={tier} style={{ textAlign: "center", padding: "0.75rem 1rem" }}>
                            {typeof val === "boolean" ? (
                              val ? <CheckCircle size={14} color={S.sage} style={{ margin: "0 auto" }} /> : <X size={14} color={S.rule} style={{ margin: "0 auto" }} />
                            ) : (
                              <span style={{ fontFamily: FONTS.sans, fontSize: "0.85rem", fontWeight: 500, color: S.ink }}>{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", background: COLORS.butter, color: COLORS.plum, padding: "5px 16px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600, marginBottom: "1rem", border: `1px solid rgba(46,37,64,0.1)` }}>FAQ</div>
            <h2 style={{ fontFamily: S.serif, fontWeight: 900, fontSize: "1.75rem", lineHeight: 1, color: S.ink }}>Frequently asked questions</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {FAQS.map((faq) => (
              <div key={faq.q} style={{ background: COLORS.white, padding: "1.25rem 1.5rem", borderRadius: RADIUS.sm, border: `1px solid ${COLORS.rule}` }}>
                <p style={{ fontFamily: FONTS.serif, fontWeight: 700, color: S.ink, marginBottom: "0.625rem" }}>{faq.q}</p>
                <p style={{ fontFamily: FONTS.sans, fontSize: "0.875rem", color: S.inkLight, lineHeight: 1.7, fontWeight: 300 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
