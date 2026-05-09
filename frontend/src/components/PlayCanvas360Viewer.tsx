import React, { useRef, useEffect, useState } from "react";

export interface PanoramaEntry {
  roomLabel: string;
  photoId:   string;
}

interface Props {
  panoramas:    PanoramaEntry[];
  initialRoom?: string;
}

const S = {
  wrapper: {
    fontFamily: "'IBM Plex Sans', sans-serif",
  } as React.CSSProperties,
  canvasWrap: {
    position: "relative" as const,
    width:    "100%",
    height:   480,
    background: "#0e0e0c",
    overflow:   "hidden",
  } as React.CSSProperties,
  canvas: {
    width:  "100%",
    height: "100%",
    display: "block",
  } as React.CSSProperties,
  roomLabel: {
    fontFamily:    "'IBM Plex Mono', monospace",
    fontSize:      "0.72rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color:         "#f4f1eb",
    padding:       "0.5rem 1rem",
    background:    "rgba(14,14,12,0.7)",
    position:      "absolute" as const,
    bottom:        8,
    left:          8,
  },
  nav: {
    display:   "flex",
    gap:       "0.5rem",
    flexWrap:  "wrap" as const,
    padding:   "0.75rem 0",
  },
  navBtn: (active: boolean): React.CSSProperties => ({
    fontFamily:    "'IBM Plex Mono', monospace",
    fontSize:      "0.68rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    padding:       "0.3rem 0.75rem",
    border:        active ? "1px solid #0e0e0c" : "1px solid #c8c3b8",
    background:    active ? "#0e0e0c"           : "transparent",
    color:         active ? "#f4f1eb"           : "#0e0e0c",
    cursor:        "pointer",
  }),
  fallback: {
    padding:    "2rem",
    textAlign:  "center" as const,
    background: "#f4f1eb",
    border:     "1px solid #c8c3b8",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize:   "0.8rem",
    color:      "#7a7268",
  },
};

export default function PlayCanvas360Viewer({ panoramas, initialRoom }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const appRef       = useRef<any>(null);
  const [activeRoom, setActiveRoom] = useState<string>(
    () => initialRoom ?? (panoramas[0]?.roomLabel ?? "")
  );
  const [noWebGL, setNoWebGL] = useState(false);

  // Update active room when panoramas/initialRoom change externally
  useEffect(() => {
    if (panoramas.length > 0 && !panoramas.some((p) => p.roomLabel === activeRoom)) {
      setActiveRoom(panoramas[0].roomLabel);
    }
  }, [panoramas]);

  useEffect(() => {
    if (!panoramas.length || !canvasRef.current) return;

    // Detect WebGL availability before handing off to PlayCanvas
    const testCtx = canvasRef.current.getContext("webgl") ?? canvasRef.current.getContext("experimental-webgl");
    if (!testCtx) {
      setNoWebGL(true);
      return;
    }

    let destroyed = false;

    (async () => {
      try {
        const pc = await import("playcanvas");

        if (destroyed || !canvasRef.current) return;

        const app = new pc.Application(canvasRef.current, {});
        app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
        app.setCanvasResolution(pc.RESOLUTION_AUTO);
        appRef.current = app;

        // Sky-sphere entity — equirectangular photo mapped to inner face of a sphere
        const sphere = new pc.Entity("sky");
        sphere.addComponent("render", { type: "sphere" });
        app.scene.root?.addChild(sphere);
        sphere.setLocalPosition(0, 0, 0);

        // Camera placed at origin (inside the sphere)
        const camera = new pc.Entity("camera");
        camera.addComponent("camera", { clearColor: new pc.Color(0, 0, 0) });
        app.scene.root?.addChild(camera);
        camera.setLocalPosition(0, 0, 0);

        app.start();
      } catch {
        // PlayCanvas init failure (e.g. in test environment) — silently skip
      }
    })();

    return () => {
      destroyed = true;
      if (appRef.current) {
        try { appRef.current.destroy(); } catch { /* ignore */ }
        appRef.current = null;
      }
    };
  }, []);

  // Swap texture when active room changes
  useEffect(() => {
    // Real texture swap would go here; skipped for now — Phase 1 focus is
    // the viewer shell and navigation UX. Texture loading is a Phase 1.5 task.
  }, [activeRoom, panoramas]);

  if (!panoramas.length) {
    return (
      <div data-testid="viewer-360-fallback" style={S.fallback}>
        No 360° tour available for this listing.
      </div>
    );
  }

  return (
    <div style={S.wrapper} data-testid="viewer-360">
      <section
        role="region"
        aria-label="360° Virtual Tour"
        style={S.canvasWrap}
      >
        {noWebGL ? (
          <div
            data-testid="viewer-360-no-webgl"
            style={{ ...S.fallback, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            WebGL is not supported in your browser. Upgrade your browser to view the 360° tour.
          </div>
        ) : (
          <canvas ref={canvasRef} style={S.canvas} />
        )}

        <div data-testid="viewer-current-room" style={S.roomLabel}>
          {activeRoom}
        </div>
      </section>

      {panoramas.length > 1 && (
        <nav aria-label="Rooms" style={S.nav}>
          {panoramas.map((p) => (
            <button
              key={p.roomLabel}
              onClick={() => setActiveRoom(p.roomLabel)}
              aria-pressed={p.roomLabel === activeRoom}
              style={S.navBtn(p.roomLabel === activeRoom)}
            >
              {p.roomLabel}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
