/**
 * Renders a BOVS-style ownership diagram using @openownership/bods-dagre.
 *
 * Adapted from the same pattern used in bods-validator:
 * https://github.com/StephenAbbott/bods-validator/blob/main/frontend/src/components/VisualisationPanel.tsx
 */

import { useEffect, useRef, useState } from "react";
import type { Statement } from "../bods/types";

declare global {
  interface Window {
    BODSDagre?: { draw: (config: Record<string, unknown>) => void };
  }
}

interface Props {
  data: Statement[];
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

const ARROW_MARKERS = [
  { id: "arrow-control-Half", d: "M 0 0 L 10 5 L 0 5 z", fill: "#349aee", refY: 3.8 },
  { id: "arrow-control-Full", d: "M 0 0 L 10 5 L 0 10 z", fill: "#349aee", refY: 5 },
  { id: "arrow-control-blackHalf", d: "M 0 0 L 10 5 L 0 10 z", fill: "#000", refY: 5 },
  { id: "arrow-control-blackFull", d: "M 0 0 L 10 5 L 0 10 z", fill: "#000", refY: 5 },
  { id: "arrow-own-Half", d: "M 0 10 L 10 5 L 0 5 z", fill: "#652eb1", refY: 6.1 },
  { id: "arrow-own-Full", d: "M 0 10 L 10 5 L 0 0 z", fill: "#652eb1", refY: 5 },
  { id: "arrow-own-blackHalf", d: "M 0 10 L 10 5 L 0 5 z", fill: "#000", refY: 6.1 },
  { id: "arrow-own-blackFull", d: "M 0 10 L 10 5 L 0 0 z", fill: "#000", refY: 5 },
  { id: "arrow-unknown-blackHalf", d: "M 0 10 L 10 5 L 0 5 z", fill: "#000", refY: 6.1 },
  { id: "arrow-unknown-blackFull", d: "M 0 10 L 10 5 L 0 0 z", fill: "#000", refY: 5 },
];

function ensureArrowMarkers(svg: SVGSVGElement) {
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  for (const m of ARROW_MARKERS) {
    if (svg.querySelector(`#${m.id}`)) continue;
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", m.id);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "8");
    marker.setAttribute("refY", String(m.refY));
    marker.setAttribute("markerUnits", "userSpaceOnUse");
    marker.setAttribute("markerWidth", "40");
    marker.setAttribute("markerHeight", "40");
    marker.setAttribute("orient", "auto-start-reverse");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", m.d);
    path.setAttribute("fill", m.fill);
    marker.appendChild(path);
    defs.appendChild(marker);
  }
}

export default function VisualisationPanel({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [rendered, setRendered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRendered(false);
    setError("");
  }, [data]);

  const drawGraph = async () => {
    if (!containerRef.current) return;
    setError("");
    setLoading(true);
    try {
      await loadScript("/lib/bods-dagre.js");
      if (!window.BODSDagre) throw new Error("BODSDagre library failed to initialise");
      containerRef.current.innerHTML = "";
      containerRef.current.style.minHeight = "400px";
      try {
        window.BODSDagre.draw({
          data,
          selectedData: data,
          container: "#bods-viz-container",
          imagesPath: "/bods-images/",
          labelLimit: 30,
          rankDir: "TB",
          viewProperties: false,
          useTippy: false,
        });
      } catch {
        // bods-dagre can throw on optional features (properties panel)
        // after the graph has already rendered; that's safe to swallow.
      }
      const svg = containerRef.current.querySelector("svg");
      if (!svg || svg.querySelectorAll("g.node").length === 0) {
        throw new Error("No ownership graph could be rendered from this data.");
      }
      ensureArrowMarkers(svg);
      svg.querySelectorAll("g.edgePath").forEach((edge) => {
        (edge as SVGGElement).style.opacity = "1";
      });
      setRendered(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to render visualisation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="viz-panel">
      <div className="viz-panel__header">
        <div>
          <h2 className="viz-panel__title">Ownership visualisation</h2>
          <p className="field-hint" style={{ marginTop: 4, marginBottom: 0 }}>
            Drawn with the{" "}
            <a
              href="https://www.openownership.org/en/publications/beneficial-ownership-data-standard-visualisation-library/"
              target="_blank"
              rel="noreferrer"
            >
              BODS Visualisation Library
            </a>{" "}
            (implements{" "}
            <a
              href="https://www.openownership.org/en/publications/beneficial-ownership-visualisation-system/"
              target="_blank"
              rel="noreferrer"
            >
              BOVS
            </a>
            ).
          </p>
        </div>
        {!rendered && (
          <button type="button" className="btn btn--primary" onClick={drawGraph} disabled={loading}>
            {loading ? "Rendering…" : "Draw diagram"}
          </button>
        )}
      </div>
      {error && (
        <div className="preview-panel__errors" style={{ margin: "0 20px 20px" }}>
          {error}
        </div>
      )}
      <div id="bods-viz-container" ref={containerRef} className="viz-panel__container">
        {!rendered && !loading && !error && (
          <div style={{ textAlign: "center", color: "var(--oo-muted)", padding: 40 }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", opacity: 0.5, marginBottom: 10 }}>
              <img src="/bods-images/bovs-person.svg" alt="" width={40} height={40} />
              <img src="/bods-images/bovs-organisation.svg" alt="" width={40} height={40} />
              <img src="/bods-images/bovs-arrangement.svg" alt="" width={40} height={40} />
            </div>
            Click “Draw diagram” to visualise the declared ownership structure. Purple edges are ownership, cyan are control.
          </div>
        )}
      </div>
    </div>
  );
}
