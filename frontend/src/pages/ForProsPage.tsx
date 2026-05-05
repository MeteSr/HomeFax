import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CSS } from "./landingStyles";

const CONTRACTOR_PLANS = [
  {
    tier: "Contractor Free",
    price: "$0",
    tag: null as string | null,
    fee: "+ $15 referral fee per verified job",
    features: [
      "Contractor profile listing",
      "5 photos per job",
      "Receive leads from HomeGentic homeowners",
      "Basic trust score",
      "Job completion certificates",
    ],
    cta: "Join free",
  },
  {
    tier: "Contractor Pro",
    price: "$30/mo",
    tag: "Most Popular",
    fee: "No referral fees",
    features: [
      "Everything in Contractor Free",
      "Lead notifications",
      "50 photos per job",
      "Trust score display",
      "Customer reviews",
      "Earnings dashboard",
    ],
    cta: "Go Pro",
  },
];

const REALTOR_PLANS = [
  {
    tier: "Realtor Free",
    price: "$0",
    tag: null as string | null,
    fee: "+ $100 per won bid",
    features: [
      "Realtor profile listing",
      "Bid on homeowner FSBO listing requests",
      "5 photos per bid proposal",
      "Basic performance score",
      "Job completion certificates",
    ],
    cta: "Join free",
  },
  {
    tier: "Realtor Pro",
    price: "$30/mo",
    tag: "Most Popular",
    fee: "No bid fees",
    features: [
      "Everything in Realtor Free",
      "Unlimited bid proposals",
      "50 photos per bid proposal",
      "10 AI agent calls/day",
      "Priority placement in agent search",
      "Verified Realtor badge",
      "Performance analytics dashboard",
      "Customer reviews",
    ],
    cta: "Go Pro",
  },
];

export default function ForProsPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!document.getElementById("hf-landing-fonts")) {
      const link = document.createElement("link");
      link.id = "hf-landing-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,900;1,9..144,300;1,9..144,600;1,9..144,900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
    return () => { document.getElementById("hf-landing-fonts")?.remove(); };
  }, []);

  React.useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <Helmet>
        <title>For Pros — Join the HomeGentic Network</title>
        <meta name="description" content="Contractors and realtors: grow your business with HomeGentic. Get leads from verified homeowners, auto-log completed work, and build a trusted profile." />
        <link rel="canonical" href="https://homegentic.app/for-pros" />
      </Helmet>
      <style>{CSS}</style>
      <div className="hfl">

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav className="hfl-nav">
          <a href="/" className="hfl-logo">Home<span>Gentic</span></a>
          <ul className={`hfl-nav-links${menuOpen ? " hfl-menu-open" : ""}`}>
            <li><a onClick={(e) => { e.preventDefault(); setMenuOpen(false); navigate("/"); }}>Home</a></li>
            <li><a onClick={(e) => { e.preventDefault(); setMenuOpen(false); navigate("/pricing"); }}>Pricing</a></li>
            <li><a onClick={(e) => { e.preventDefault(); setMenuOpen(false); navigate("/for-pros"); }} style={{ color: "var(--plum)", fontWeight: 700 }}>For Pros</a></li>
          </ul>
          <div className="hfl-nav-actions">
            <button className="hfl-nav-signin" onClick={() => navigate("/login")}>Sign in</button>
            <button className="hfl-nav-pill" onClick={() => navigate("/login")}>Join Now</button>
            <button
              className={`hfl-hamburger${menuOpen ? " hfl-menu-open" : ""}`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span /><span /><span />
            </button>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section style={{ paddingTop: "140px", paddingBottom: "80px", paddingLeft: "56px", paddingRight: "56px", textAlign: "center", background: "var(--white)" }}>
          <div className="hfl-kicker" style={{ marginBottom: "1.5rem" }}>✦ Service Professionals</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 900, color: "var(--plum)", lineHeight: 1.1, marginBottom: "1.25rem" }}>
            Grow your business<br /><em style={{ fontWeight: 300, color: "var(--sage)" }}>with HomeGentic.</em>
          </h1>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.1rem", color: "var(--plum-mid)", maxWidth: 560, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            Join a network of trusted contractors and realtors connected directly to motivated homeowners. No cold outreach. No bidding wars. Verified work auto-logged to permanent records.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="hfl-nav-pill" style={{ fontSize: "1rem", padding: "14px 32px" }} onClick={() => navigate("/login")}>Join the network</button>
            <button className="hfl-btn-soft" onClick={() => navigate("/")}>Learn about HomeGentic</button>
          </div>
        </section>

        {/* ── Why Join ────────────────────────────────────────────────────── */}
        <section style={{ background: "var(--plum)", padding: "72px 56px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, color: "white", textAlign: "center", marginBottom: "0.75rem" }}>
              Why professionals choose HomeGentic
            </h2>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1rem", color: "rgba(253,252,250,0.6)", textAlign: "center", marginBottom: "3rem", maxWidth: 520, margin: "0 auto 3rem" }}>
              3,400+ verified homeowners actively seeking trusted service providers — and every job you complete builds your permanent reputation.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {[
                { icon: "🎯", title: "Warm leads only", body: "Homeowners on HomeGentic are actively maintaining their homes and requesting quotes — no cold calls, no wasted pitches." },
                { icon: "✅", title: "Auto-logged work", body: "Every completed job is auto-recorded to the homeowner's blockchain record. Your reputation grows with every project." },
                { icon: "⭐", title: "Verified reviews", body: "Rate-limited, verified reviews from real clients. No fake stars. Your trust score is earned, not gamed." },
                { icon: "📊", title: "Earnings dashboard", body: "Track jobs, completed bids, and revenue — all in one place. See exactly where your business stands." },
              ].map((c) => (
                <div key={c.title} style={{ background: "rgba(253,252,250,0.06)", border: "1px solid rgba(253,252,250,0.1)", borderRadius: 12, padding: "1.5rem" }}>
                  <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{c.icon}</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: "1rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>{c.title}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.875rem", color: "rgba(253,252,250,0.55)", lineHeight: 1.6 }}>{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contractor Plans ─────────────────────────────────────────────── */}
        <section className="hfl-pricing" id="contractor-plans">
          <div className="hfl-pricing-inner">
            <div className="hfl-pricing-header">
              <div className="hfl-kicker">👷 Contractors</div>
              <h2>Start free.<br /><em>Scale when you're ready.</em></h2>
              <p className="hfl-sec-sub">Join the network at no cost and pay a small referral fee per job — or upgrade to Pro and keep everything you earn.</p>
            </div>
            <div className="hfl-pricing-grid" style={{ maxWidth: 680, margin: "0 auto" }}>
              {CONTRACTOR_PLANS.map((plan) => (
                <div key={plan.tier} className={`hfl-plan-card${plan.tag ? " hfl-plan-featured" : ""}`}>
                  {plan.tag && <div className="hfl-plan-badge">{plan.tag}</div>}
                  <div className="hfl-plan-tier">{plan.tier}</div>
                  <div className="hfl-plan-price">{plan.price}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.75rem", color: plan.tag ? "rgba(122,175,118,0.9)" : "var(--plum-mid)", marginTop: "-16px", marginBottom: "18px", fontWeight: 600 }}>
                    {plan.fee}
                  </div>
                  <ul className="hfl-plan-features">
                    {plan.features.map((f) => <li key={f}>✓ {f}</li>)}
                  </ul>
                  <button className="hfl-plan-cta" onClick={() => navigate("/login")}>{plan.cta}</button>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.7rem", color: "var(--plum-mid)", marginTop: "1.5rem", lineHeight: 1.6 }}>
              * Plans billed monthly. Cancel anytime — access ends at the close of your current billing period. Referral fees are charged per verified completed job and are non-refundable.
            </p>
          </div>
        </section>

        {/* ── Realtor Plans ────────────────────────────────────────────────── */}
        <section className="hfl-pricing" id="realtor-plans" style={{ background: "var(--sage-light)" }}>
          <div className="hfl-pricing-inner">
            <div className="hfl-pricing-header">
              <div className="hfl-kicker">🏡 Realtors</div>
              <h2>Win more listings.<br /><em>Compete on merit.</em></h2>
              <p className="hfl-sec-sub">Homeowners post listing requests and verified agents submit competing proposals. The best offer wins — no referral networks, no gatekeepers.</p>
            </div>
            <div className="hfl-pricing-grid" style={{ maxWidth: 680, margin: "0 auto" }}>
              {REALTOR_PLANS.map((plan) => (
                <div key={plan.tier} className={`hfl-plan-card${plan.tag ? " hfl-plan-featured" : ""}`}>
                  {plan.tag && <div className="hfl-plan-badge">{plan.tag}</div>}
                  <div className="hfl-plan-tier">{plan.tier}</div>
                  <div className="hfl-plan-price">{plan.price}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.75rem", color: plan.tag ? "rgba(122,175,118,0.9)" : "var(--plum-mid)", marginTop: "-16px", marginBottom: "18px", fontWeight: 600 }}>
                    {plan.fee}
                  </div>
                  <ul className="hfl-plan-features">
                    {plan.features.map((f) => <li key={f}>✓ {f}</li>)}
                  </ul>
                  <button className="hfl-plan-cta" onClick={() => navigate("/login")}>{plan.cta}</button>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.7rem", color: "var(--plum-mid)", marginTop: "1.5rem", lineHeight: 1.6 }}>
              * Plans billed monthly. Cancel anytime — access ends at the close of your current billing period. Bid fees are charged per won listing and are non-refundable.
            </p>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section className="hfl-final-cta">
          <div className="hfl-final-cta-inner">
            <div className="hfl-kicker" style={{ color: "rgba(253,252,250,0.45)" }}>✦ Ready to grow?</div>
            <h2>Join 3,400+ homeowners<br /><em>already on the network.</em></h2>
            <p className="hfl-final-cta-sub">Set up your profile in minutes. Leads start flowing as soon as you're verified.</p>
            <button className="hfl-final-cta-btn" onClick={() => navigate("/login")}>Create your profile</button>
            <div className="hfl-final-cta-fine">Free to join · No credit card required · Cancel anytime</div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="hfl-footer">
          <div className="hfl-footer-top">
            <div>
              <span className="hfl-footer-logo">Home<span>Gentic</span></span>
              <p className="hfl-footer-tagline">The verified maintenance record that makes your home worth more and easier to sell.</p>
            </div>
            <div>
              <div className="hfl-footer-col-title">For Pros</div>
              <ul className="hfl-footer-col-links">
                <li><a onClick={(e) => { e.preventDefault(); document.getElementById("contractor-plans")?.scrollIntoView({ behavior: "smooth" }); }}>Contractor Plans</a></li>
                <li><a onClick={(e) => { e.preventDefault(); document.getElementById("realtor-plans")?.scrollIntoView({ behavior: "smooth" }); }}>Realtor Plans</a></li>
                <li><a onClick={() => navigate("/login")}>Create Profile</a></li>
              </ul>
            </div>
            <div>
              <div className="hfl-footer-col-title">Company</div>
              <ul className="hfl-footer-col-links">
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/pricing">Full Pricing</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/support">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="hfl-footer-bottom">
            <span>© 2026 HomeGentic Inc.</span>
            <div className="hfl-footer-bottom-links">
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/support">Support</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
