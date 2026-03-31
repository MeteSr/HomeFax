/**
 * Agent Public Profile — /agent/:id
 *
 * Public-facing view of a Realtor's on-chain profile, reviews, and stats (Epic 9.1.3, 9.1.4).
 */

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { agentService, AgentOnChainProfile, AgentReview, computeAverageRating } from "@/services/agent";
import { COLORS, FONTS } from "@/theme";

const S = {
  ink:      COLORS.plum,
  paper:    COLORS.white,
  rule:     COLORS.rule,
  rust:     COLORS.sage,
  inkLight: COLORS.plumMid,
  serif:    FONTS.serif,
  mono:     FONTS.mono,
};

export default function AgentPublicPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<AgentOnChainProfile | null | undefined>(undefined);
  const [reviews, setReviews] = useState<AgentReview[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      agentService.getPublicProfile(id),
      agentService.getReviews(id),
    ]).then(([p, r]) => {
      setProfile(p);
      setReviews(r);
    }).catch(() => setProfile(null));
  }, [id]);

  if (profile === undefined) {
    return (
      <Layout>
        <p style={{ fontFamily: S.mono, color: S.inkLight }}>Loading…</p>
      </Layout>
    );
  }

  if (profile === null) {
    return (
      <Layout>
        <p style={{ fontFamily: S.mono, color: S.inkLight }}>Agent not found.</p>
      </Layout>
    );
  }

  const avgRating = computeAverageRating(reviews);

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontFamily: S.serif, color: S.ink, margin: 0 }}>
            {profile.name}
          </h1>
          <p style={{ fontFamily: S.mono, color: S.inkLight, margin: "4px 0 0" }}>
            {profile.brokerage} · {profile.licenseNumber}
          </p>

          {profile.isVerified && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
              background: "#e6f4ea", border: "1px solid #34a853", borderRadius: 2,
              padding: "4px 10px", marginTop: 8 }}>
              <span style={{ fontFamily: S.mono, fontSize: "0.75rem", color: "#188038" }}>
                HomeFax Verified
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem",
          borderTop: `1px solid ${S.rule}`, borderBottom: `1px solid ${S.rule}`,
          padding: "1rem 0" }}>
          <div>
            <div style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight,
              textTransform: "uppercase", letterSpacing: "0.08em" }}>Avg. Days on Market</div>
            <div style={{ fontFamily: S.serif, fontSize: "1.5rem", color: S.ink }}>
              {profile.avgDaysOnMarket}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight,
              textTransform: "uppercase", letterSpacing: "0.08em" }}>Listings (12 mo)</div>
            <div style={{ fontFamily: S.serif, fontSize: "1.5rem", color: S.ink }}>
              {profile.listingsLast12Months}
            </div>
          </div>
          {avgRating !== null && (
            <div>
              <div style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight,
                textTransform: "uppercase", letterSpacing: "0.08em" }}>Avg. Rating</div>
              <div style={{ fontFamily: S.serif, fontSize: "1.5rem", color: S.ink }}>
                {avgRating.toFixed(1)} / 5
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight,
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Bio</div>
            <p style={{ fontFamily: S.mono, color: S.ink, lineHeight: 1.6, margin: 0 }}>
              {profile.bio}
            </p>
          </div>
        )}

        {/* States Licensed */}
        {profile.statesLicensed.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight,
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Licensed In
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {profile.statesLicensed.map((state) => (
                <span key={state} style={{ fontFamily: S.mono, fontSize: "0.75rem",
                  border: `1px solid ${S.rule}`, padding: "2px 8px" }}>
                  {state}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div>
          <div style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight,
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            Reviews ({reviews.length})
          </div>
          {reviews.length === 0 ? (
            <p style={{ fontFamily: S.mono, color: S.inkLight }}>No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} style={{ border: `1px solid ${S.rule}`,
                padding: "1rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  marginBottom: 6 }}>
                  <span style={{ fontFamily: S.mono, fontSize: "0.75rem", color: S.ink }}>
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </span>
                  <span style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontFamily: S.mono, color: S.ink, margin: 0, lineHeight: 1.5 }}>
                  {r.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
