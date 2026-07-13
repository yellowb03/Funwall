/**
 * Deterministic wheel geometry.
 *
 * Convention:
 * - Segments are laid out clockwise from the top (north / 12 o'clock).
 * - Segment i occupies local angles [i * seg, (i + 1) * seg) measured clockwise from top.
 * - Wheel rotation R (degrees) is CSS-style clockwise.
 * - Pointer is fixed at the top of the viewport.
 * - Local angle under the pointer: θ = normalizeDegrees(-R)
 * - Winner index = floor(θ / segmentAngle)
 *
 * Tolerance: visual landing must place the pointer inside the winner segment.
 * We target the segment center; tests allow ± (segmentAngle / 2 - epsilon).
 */

export const WHEEL_ANGLE_TOLERANCE_DEG = 0.5;

export function normalizeDegrees(deg: number): number {
  const m = deg % 360;
  return m < 0 ? m + 360 : m;
}

export function segmentAngleDeg(segmentCount: number): number {
  if (segmentCount < 1) {
    throw new Error("segmentCount must be >= 1");
  }
  return 360 / segmentCount;
}

/**
 * Index of the segment currently under the fixed top pointer.
 */
export function segmentIndexAtRotation(
  rotationDeg: number,
  segmentCount: number,
): number {
  if (segmentCount < 1) {
    throw new Error("segmentCount must be >= 1");
  }
  const θ = normalizeDegrees(-rotationDeg);
  const seg = segmentAngleDeg(segmentCount);
  const index = Math.floor(θ / seg);
  // Guard floating-point edge at exact 360
  return Math.min(index, segmentCount - 1);
}

/**
 * Absolute local center angle (clockwise from top) for segment index.
 */
export function segmentCenterLocalDeg(
  index: number,
  segmentCount: number,
): number {
  const seg = segmentAngleDeg(segmentCount);
  return index * seg + seg / 2;
}

/**
 * Target rotation that places segment `winnerIndex` under the pointer,
 * including `extraTurns` full clockwise rotations for drama.
 *
 * Final rotation is always >= currentRotation and prefers continuing forward.
 */
export function targetRotationForWinner(
  winnerIndex: number,
  segmentCount: number,
  extraTurns: number,
  currentRotationDeg = 0,
): number {
  if (winnerIndex < 0 || winnerIndex >= segmentCount) {
    throw new Error(
      `winnerIndex ${winnerIndex} out of range for ${segmentCount} segments`,
    );
  }
  if (extraTurns < 0) {
    throw new Error("extraTurns must be >= 0");
  }

  const centerLocal = segmentCenterLocalDeg(winnerIndex, segmentCount);
  // θ = -R => R = -θ (normalized base)
  const baseTarget = normalizeDegrees(-centerLocal);

  const currentNorm = normalizeDegrees(currentRotationDeg);
  let delta = normalizeDegrees(baseTarget - currentNorm);
  // Prefer a positive spin; if already aligned, still take a full lap when extraTurns allow
  if (delta < 0.0001 && extraTurns === 0) {
    delta = 0;
  }

  return currentRotationDeg + delta + extraTurns * 360;
}

/**
 * Verify pointer lands on the expected winner within half-segment tolerance.
 */
export function rotationAgreesWithWinner(
  rotationDeg: number,
  winnerIndex: number,
  segmentCount: number,
  toleranceDeg: number = WHEEL_ANGLE_TOLERANCE_DEG,
): boolean {
  const seg = segmentAngleDeg(segmentCount);
  const θ = normalizeDegrees(-rotationDeg);
  const start = winnerIndex * seg;
  const end = start + seg;
  // Expand by tiny epsilon for FP; require within segment (not just nearest)
  return θ + toleranceDeg >= start && θ - toleranceDeg < end;
}

/**
 * Cubic ease-out: 1 - (1-t)^3
 */
export function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

/**
 * Interpolate rotation for animation frame.
 */
export function interpolateRotation(
  from: number,
  to: number,
  t: number,
): number {
  return from + (to - from) * easeOutCubic(t);
}

/**
 * Detect segment boundary crossings between two rotations (for tick audio).
 * Returns how many boundaries were crossed moving from `fromRotation` to `toRotation`.
 */
export function countBoundaryCrossings(
  fromRotation: number,
  toRotation: number,
  segmentCount: number,
): number {
  if (segmentCount < 1) return 0;
  const seg = segmentAngleDeg(segmentCount);
  // Local θ decreases as rotation increases (clockwise)
  const fromθ = normalizeDegrees(-fromRotation);
  const deltaR = toRotation - fromRotation;
  if (deltaR === 0) return 0;

  // Change in local angle under pointer
  const deltaθ = -deltaR;
  const absDelta = Math.abs(deltaθ);
  // Approximate crossings: how many segment multiples of local angle moved
  const startBoundary = Math.floor(fromθ / seg);
  const endθ = fromθ + deltaθ;
  // Unwrap end relative to continuous motion
  const endBoundary = Math.floor(endθ / seg);
  return Math.abs(endBoundary - startBoundary);
}

/**
 * Whether segment labels / images are likely legible.
 */
export function segmentsAreLegible(segmentCount: number): boolean {
  // Below ~12° arcs labels are hard; 30 items => 12°
  return segmentCount > 0 && segmentCount <= 30;
}

export function shouldShowImagesOnSegments(
  segmentCount: number,
  policy: "auto" | "always" | "resultOnly",
): boolean {
  if (policy === "resultOnly") return false;
  if (policy === "always") return true;
  return segmentsAreLegible(segmentCount);
}

/**
 * Truncate label for thin segments.
 */
export function truncateSegmentLabel(
  text: string,
  segmentCount: number,
): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  let maxChars: number;
  if (segmentCount <= 8) maxChars = 18;
  else if (segmentCount <= 16) maxChars = 12;
  else if (segmentCount <= 30) maxChars = 8;
  else if (segmentCount <= 60) maxChars = 4;
  else maxChars = 2;
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, Math.max(1, maxChars - 1))}…`;
}
