import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Mic, MicOff, Volume2, X, History, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useVoiceAgent } from "../hooks/useVoiceAgent";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8",
  rust: "#C94C2E", inkLight: "#7A7268", sage: "#3D6B57",
  mono: "'IBM Plex Mono', monospace" as const,
};

export function VoiceAgent() {
  const navigate = useNavigate();
  const {
    state, transcript, response, error, isSupported,
    alerts, history, clearHistory,
    startListening, stopListening, reset,
  } = useVoiceAgent();

  const [showHistory, setShowHistory] = useState(false);

  if (!isSupported) return null;

  const isListening  = state === "listening";
  const isProcessing = state === "processing";
  const isSpeaking   = state === "speaking";
  const isIdle       = state === "idle" || state === "error";
  const hasBubble    = transcript || response || error;

  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", right: "1.5rem",
      zIndex: 50, display: "flex", flexDirection: "column",
      alignItems: "flex-end", gap: "0.75rem",
    }}>

      {/* Proactive alert chips — shown only when idle and no bubble */}
      {isIdle && !hasBubble && alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.375rem" }}>
          {alerts.map((alert, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: S.ink, border: `1px solid ${S.rule}`,
                padding: "0.4rem 0.75rem",
                maxWidth: "18rem",
              }}
            >
              <AlertTriangle size={11} color={alert.type === "warranty" ? "#D4820E" : S.rust} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: S.mono, fontSize: "0.6rem", color: "#C8C3B8", flex: 1, lineHeight: 1.4 }}>
                {alert.message}
              </span>
              {alert.href && (
                <button
                  onClick={() => navigate(alert.href!)}
                  style={{ fontFamily: S.mono, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.rust, background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", padding: 0 }}
                >
                  {alert.actionLabel ?? "View"} →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Speech bubble */}
      {hasBubble && (
        <div style={{
          position: "relative", width: "20rem",
          background: S.ink, border: `1px solid ${S.rule}`,
          padding: "1rem 1.25rem",
        }}>
          <button
            onClick={reset}
            style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "none", border: "none", cursor: "pointer", color: S.inkLight, padding: 0, display: "flex" }}
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>

          {transcript && (
            <p style={{ marginBottom: "0.5rem", fontFamily: S.mono, fontSize: "0.7rem", color: S.inkLight, fontStyle: "italic", paddingRight: "1.25rem" }}>
              "{transcript}"
            </p>
          )}

          {response && (
            <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "0.8rem", color: "#F4F1EB", lineHeight: 1.55, paddingRight: "1.25rem" }}>
              {response}
              {isProcessing && (
                <span style={{ display: "inline-block", width: "2px", height: "0.875rem", marginLeft: "2px", backgroundColor: S.rust, animation: "spin 1s step-end infinite", verticalAlign: "middle" }} />
              )}
            </p>
          )}

          {isProcessing && !response && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Loader2 size={13} color={S.inkLight} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontFamily: S.mono, fontSize: "0.7rem", color: S.inkLight }}>Thinking…</span>
            </div>
          )}

          {error && (
            <p style={{ fontFamily: S.mono, fontSize: "0.7rem", color: S.rust }}>{error}</p>
          )}
        </div>
      )}

      {/* Action history panel */}
      {history.length > 0 && (
        <div style={{ width: "20rem", background: S.ink, border: `1px solid ${S.rule}` }}>
          <button
            onClick={() => setShowHistory((v) => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.5rem 0.875rem", background: "none", border: "none", cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <History size={11} color={S.inkLight} />
              <span style={{ fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight }}>
                Agent History ({history.length})
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {showHistory && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearHistory(); setShowHistory(false); }}
                  style={{ fontFamily: S.mono, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.rust, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Clear
                </button>
              )}
              {showHistory ? <ChevronDown size={11} color={S.inkLight} /> : <ChevronUp size={11} color={S.inkLight} />}
            </div>
          </button>

          {showHistory && (
            <div style={{ borderTop: `1px solid ${S.rule}`, maxHeight: "12rem", overflowY: "auto" }}>
              {history.slice(0, 20).map((action) => (
                <div key={action.id} style={{
                  display: "flex", alignItems: "flex-start", gap: "0.5rem",
                  padding: "0.5rem 0.875rem",
                  borderBottom: `1px solid rgba(200,195,184,0.15)`,
                }}>
                  {action.success
                    ? <CheckCircle size={11} color={S.sage} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                    : <XCircle    size={11} color={S.rust}  style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: S.mono, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: action.success ? S.sage : S.rust, marginBottom: "0.1rem" }}>
                      {action.label}
                    </div>
                    <div style={{ fontFamily: S.mono, fontSize: "0.6rem", color: "#C8C3B8", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {action.summary}
                    </div>
                    <div style={{ fontFamily: S.mono, fontSize: "0.5rem", color: S.inkLight, marginTop: "0.1rem" }}>
                      {new Date(action.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mic button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
        <button
          onClick={isListening ? stopListening : isIdle ? startListening : undefined}
          disabled={isProcessing || isSpeaking}
          aria-label={isListening ? "Stop listening" : "Ask HomeFax"}
          style={{
            width: "3.25rem", height: "3.25rem",
            borderRadius: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${isListening ? S.rust : S.ink}`,
            backgroundColor: isListening ? S.rust : isProcessing || isSpeaking ? "#EDE9E0" : S.ink,
            cursor: isProcessing || isSpeaking ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {isListening  && <MicOff  size={20} color="#F4F1EB" />}
          {isProcessing && <Loader2 size={20} color={S.inkLight} style={{ animation: "spin 1s linear infinite" }} />}
          {isSpeaking   && <Volume2 size={20} color={S.inkLight} />}
          {isIdle       && <Mic     size={20} color="#F4F1EB" />}
        </button>

        <span style={{
          fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.1em",
          textTransform: "uppercase", color: S.inkLight, userSelect: "none",
        }}>
          {isListening  && "Listening"}
          {isProcessing && "Thinking"}
          {isSpeaking   && "Speaking"}
          {isIdle       && "Ask HomeFax"}
        </span>
      </div>
    </div>
  );
}
