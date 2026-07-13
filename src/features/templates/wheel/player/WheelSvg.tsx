"use client";

import type { ListItem } from "@/domain/content/list.v1";
import {
  segmentAngleDeg,
  shouldShowImagesOnSegments,
  truncateSegmentLabel,
} from "@/features/templates/wheel/geometry";
import {
  segmentColor,
  segmentLabelColor,
} from "@/features/templates/wheel/palette";
import type { WheelImageDisplayPolicy } from "@/features/templates/wheel/settings";

export interface WheelSvgProps {
  items: readonly ListItem[];
  rotationDeg: number;
  themeTokens?: Record<string, string>;
  imageDisplayPolicy: WheelImageDisplayPolicy;
  /** Highlight selected segment index (post-spin). */
  highlightIndex?: number | null;
  reducedMotion?: boolean;
  className?: string;
}

const VIEW = 200;
const CX = 100;
const CY = 100;
const RADIUS = 90;
const INNER = 18;

function polar(cx: number, cy: number, r: number, angleDegFromTop: number) {
  // Convert clockwise-from-top to standard math (CCW from east)
  const rad = ((angleDegFromTop - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function segmentPath(
  index: number,
  count: number,
  outerR: number,
  innerR: number,
): string {
  const seg = segmentAngleDeg(count);
  const start = index * seg;
  const end = (index + 1) * seg;
  const large = seg > 180 ? 1 : 0;

  const p0 = polar(CX, CY, outerR, start);
  const p1 = polar(CX, CY, outerR, end);
  const p2 = polar(CX, CY, innerR, end);
  const p3 = polar(CX, CY, innerR, start);

  return [
    `M ${p0.x} ${p0.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

export function WheelSvg({
  items,
  rotationDeg,
  themeTokens = {},
  imageDisplayPolicy,
  highlightIndex = null,
  className = "",
}: WheelSvgProps) {
  const count = items.length;
  const showImages = shouldShowImagesOnSegments(count, imageDisplayPolicy);
  const showLabels = count <= 60;

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role="img"
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "auto", maxWidth: 480 }}
    >
      {/* Pointer at top */}
      <polygon
        points="100,4 90,22 110,22"
        fill="var(--fw-color-ink, #111111)"
        stroke="var(--fw-color-surface, #ffffff)"
        strokeWidth={1.5}
      />

      <g
        style={{
          transform: `rotate(${rotationDeg}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
        }}
      >
        {count === 0 ? (
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="var(--fw-color-tile-pale, #cfeeff)"
          />
        ) : (
          items.map((item, index) => {
            const fill = segmentColor(index, themeTokens);
            const label = truncateSegmentLabel(
              item.content.text ?? "",
              count,
            );
            const mid = index * segmentAngleDeg(count) + segmentAngleDeg(count) / 2;
            const labelPos = polar(CX, CY, (RADIUS + INNER) / 2 + 8, mid);
            const isHighlight = highlightIndex === index;

            return (
              <g key={item.id}>
                <path
                  d={segmentPath(index, count, RADIUS, INNER)}
                  fill={fill}
                  stroke="var(--fw-color-surface, #ffffff)"
                  strokeWidth={isHighlight ? 2.5 : 1}
                  opacity={
                    highlightIndex !== null && !isHighlight ? 0.55 : 1
                  }
                />
                {showLabels && label ? (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill={segmentLabelColor(fill)}
                    fontSize={count > 20 ? 6 : count > 12 ? 7 : 9}
                    fontWeight={700}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {label}
                  </text>
                ) : null}
                {showImages && item.content.imageAssetId ? (
                  <circle
                    cx={polar(CX, CY, RADIUS * 0.62, mid).x}
                    cy={polar(CX, CY, RADIUS * 0.62, mid).y}
                    r={count > 16 ? 3 : 5}
                    fill="rgba(255,255,255,0.85)"
                    aria-hidden
                  />
                ) : null}
              </g>
            );
          })
        )}
        <circle
          cx={CX}
          cy={CY}
          r={INNER}
          fill="var(--fw-color-surface, #ffffff)"
          stroke="var(--fw-color-border-strong, #9bb0b8)"
          strokeWidth={2}
        />
      </g>
    </svg>
  );
}
