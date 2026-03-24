import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";

// ─── Config ───────────────────────────────────────────────────────────────────

const DFX_NETWORK = (process.env as any).DFX_NETWORK || "local";
const IS_LOCAL = DFX_NETWORK !== "ic";
const II_URL = IS_LOCAL
  ? "http://localhost:8000/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai"
  : "https://identity.ic0.app";

// ─── Status Page ──────────────────────────────────────────────────────────────

function StatusPage({ isAuthenticated, principal }: { isAuthenticated: boolean; principal: string }) {
  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-icon">🏠</div>
        <h2>HomeFax Backend Status</h2>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Network</span>
            <span className={`status-value ${IS_LOCAL ? "local" : "mainnet"}`}>
              {IS_LOCAL ? "Local (dfx)" : "ICP Mainnet"}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Auth Canister</span>
            <span className="status-value canister-id">
              {(process.env as any).AUTH_CANISTER_ID || "Not deployed"}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Property Canister</span>
            <span className="status-value canister-id">
              {(process.env as any).PROPERTY_CANISTER_ID || "Not deployed"}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">User</span>
            <span className="status-value">
              {isAuthenticated ? `${principal.slice(0, 12)}...` : "Anonymous"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-badge">⛓️ Built on Internet Computer Protocol</div>
        <h1>The Carfax for <span className="highlight">Homes</span></h1>
        <p className="hero-subtitle">
          Immutable, blockchain-verified maintenance records for your property.
          Build trust with buyers. Protect your investment. Own your history forever.
        </p>
        <div className="hero-actions">
          <button onClick={onLogin} className="btn btn-primary">
            Sign In with Internet Identity
          </button>
          <Link to="/status" className="btn btn-outline">
            View Backend Status
          </Link>
        </div>
        <p className="hero-note">🔒 No passwords · No emails · Decentralized forever</p>
      </section>

      <section className="features">
        {[
          { icon: "🔗", title: "Blockchain Verified", desc: "Records stored immutably on ICP. No one can alter or delete your property history." },
          { icon: "🏠", title: "Complete History", desc: "Track every repair, upgrade, and inspection — from roof to foundation." },
          { icon: "💰", title: "Increase Home Value", desc: "Verified maintenance records demonstrate care. Buyers pay more for transparent history." },
          { icon: "🔐", title: "Internet Identity", desc: "No passwords. Authenticate with ICP's native identity — secure and private." },
          { icon: "📄", title: "Receipt Hashing", desc: "Attach SHA-256 hashes of receipts to prove authenticity of every maintenance claim." },
          { icon: "🎯", title: "Tier System", desc: "Free, Pro, Premium, and ContractorPro tiers — scale as your portfolio grows." },
        ].map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      if (await client.isAuthenticated()) {
        const id = client.getIdentity();
        setIsAuthenticated(true);
        setPrincipal(id.getPrincipal().toText());
      }
    });
  }, []);

  const login = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: II_URL,
      maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000),
      onSuccess: () => {
        const id = authClient.getIdentity();
        setIsAuthenticated(true);
        setPrincipal(id.getPrincipal().toText());
        navigate("/status");
      },
    });
  };

  const logout = async () => {
    if (!authClient) return;
    await authClient.logout();
    setIsAuthenticated(false);
    setPrincipal("");
    navigate("/");
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">
          <span>🏠</span> <strong>HomeFax</strong>
          <span className="logo-tag">on ICP</span>
        </Link>
        <nav>
          <Link to="/status">Status</Link>
        </nav>
        <div>
          {isAuthenticated ? (
            <div className="user-bar">
              <span className="principal-short">{principal.slice(0, 8)}…</span>
              <button onClick={logout} className="btn btn-sm btn-outline">Sign Out</button>
            </div>
          ) : (
            <button onClick={login} className="btn btn-primary btn-sm">Sign In</button>
          )}
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<LandingPage onLogin={login} />} />
          <Route
            path="/status"
            element={<StatusPage isAuthenticated={isAuthenticated} principal={principal} />}
          />
        </Routes>
      </main>
    </div>
  );
}
