import React from "react";
import { Link } from "react-router-dom";

interface LandingPageProps {
  onLogin: () => void;
  isAuthenticated: boolean;
}

export function LandingPage({ onLogin, isAuthenticated }: LandingPageProps) {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Built on Internet Computer Protocol</div>
          <h1 className="hero-title">
            The Carfax for <span className="highlight">Homes</span>
          </h1>
          <p className="hero-subtitle">
            Immutable, blockchain-verified maintenance records for your property.
            Build trust with buyers. Protect your investment. Own your home history forever.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard
              </Link>
            ) : (
              <button onClick={onLogin} className="btn btn-primary btn-lg">
                Get Started Free
              </button>
            )}
            <Link to="/search" className="btn btn-outline btn-lg">
              Search a Property
            </Link>
          </div>
          <p className="hero-note">
            🔒 Powered by ICP • No central server • Your data, forever
          </p>
        </div>
      </section>

      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3>Blockchain Verified</h3>
            <p>Every record is stored immutably on the Internet Computer. No one can alter or delete your property history.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏠</div>
            <h3>Complete Property History</h3>
            <p>Track every repair, upgrade, and inspection. From roof replacements to HVAC tune-ups — all in one place.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Increase Home Value</h3>
            <p>Verified maintenance records demonstrate care and quality. Buyers pay more for homes with transparent history.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Internet Identity</h3>
            <p>No passwords. No emails. Authenticate with ICP's native identity system — secure, private, and decentralized.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Receipt Hashing</h3>
            <p>Attach cryptographic hashes of receipts and documents to prove authenticity of every maintenance claim.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Public Reports</h3>
            <p>Share a public HomeFax report link with buyers, agents, or insurers. Control exactly what you share.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Register Your Property</h3>
            <p>Add your home's address and basic details to the blockchain.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Log Maintenance</h3>
            <p>Record every repair, upgrade, and inspection as it happens.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Share Your Report</h3>
            <p>Generate a verified HomeFax report to share with buyers or insurers.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>HomeFax © 2024 • Built on <a href="https://internetcomputer.org" target="_blank" rel="noopener noreferrer">Internet Computer Protocol</a></p>
      </footer>
    </div>
  );
}
