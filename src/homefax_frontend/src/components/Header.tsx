import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthState } from "../hooks/useAuth";

interface HeaderProps {
  auth: AuthState & { login: () => void; logout: () => void };
}

export function Header({ auth }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">🏠</span>
          <span className="logo-text">HomeFax</span>
          <span className="logo-tag">on ICP</span>
        </Link>

        <nav className="nav">
          <Link to="/search" className={`nav-link ${location.pathname === "/search" ? "active" : ""}`}>
            Search
          </Link>
          {auth.isAuthenticated && (
            <>
              <Link to="/dashboard" className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}>
                My Properties
              </Link>
              <Link to="/register" className={`nav-link ${location.pathname === "/register" ? "active" : ""}`}>
                + Add Property
              </Link>
            </>
          )}
        </nav>

        <div className="auth-section">
          {auth.isAuthenticated ? (
            <div className="user-info">
              <span className="principal" title={auth.principal || ""}>
                {auth.principal?.slice(0, 8)}...
              </span>
              <button onClick={auth.logout} className="btn btn-outline btn-sm">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={auth.login} className="btn btn-primary">
              Sign In with Internet Identity
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
