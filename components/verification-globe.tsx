"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";

const COLORS = {
  ink: "#080808",
  surface: "#111111",
  paper: "#F2EFE8",
  copper: "#B8875A",
  aqua: "#B8E3E8",
  gold: "#D6A85F",
  coral: "#C96A6A",
} as const;

const VIEWBOX_SIZE = 640;
const SPHERE_CENTER = { x: 320, y: 320 };
const SPHERE_RADIUS = 250;

const FALLBACK_POSITIONS = [
  { x: 0.5, y: 0.13 },
  { x: 0.28, y: 0.2 },
  { x: 0.13, y: 0.47 },
  { x: 0.24, y: 0.76 },
  { x: 0.51, y: 0.88 },
  { x: 0.75, y: 0.77 },
  { x: 0.87, y: 0.51 },
  { x: 0.78, y: 0.25 },
] as const;

export type WitnessStatus = "verified" | "pending" | "attention";

export interface VerificationWitness {
  /** A stable identifier used for focus and selection state. */
  id: string;
  /** The short, human-readable name shown in the SVG tooltip and label. */
  label: string;
  /** Optional context announced to assistive technology and shown when active. */
  detail?: string;
  /** Determines the witness accent color. Defaults to `verified`. */
  status?: WitnessStatus;
  /** Optional normalized coordinates within the globe (0–1 on each axis). */
  position?: { x: number; y: number };
}

export interface VerificationGlobeProps {
  /** Replaces the built-in witness set while preserving the network treatment. */
  witnesses?: VerificationWitness[];
  /** Called when a witness is hovered, focused, clicked, or activated by keyboard. */
  onWitnessSelect?: (witness: VerificationWitness) => void;
  /** Optional class name for layout composition in a parent component. */
  className?: string;
  /** Accessible title for the visualization. */
  title?: string;
  /** Accessible description for the visualization. */
  description?: string;
}

const DEFAULT_WITNESSES: VerificationWitness[] = [
  {
    id: "north-star",
    label: "North star",
    detail: "Identity witness",
    status: "verified",
  },
  {
    id: "quorum",
    label: "Quorum",
    detail: "Consensus witness",
    status: "verified",
  },
  {
    id: "signal",
    label: "Signal",
    detail: "Origin witness",
    status: "pending",
  },
  {
    id: "proof",
    label: "Proof",
    detail: "Integrity witness",
    status: "verified",
  },
  {
    id: "anchor",
    label: "Anchor",
    detail: "Ledger witness",
    status: "attention",
  },
  {
    id: "relay",
    label: "Relay",
    detail: "Delivery witness",
    status: "verified",
  },
  {
    id: "ledger",
    label: "Ledger",
    detail: "State witness",
    status: "verified",
  },
  {
    id: "origin",
    label: "Origin",
    detail: "Event witness",
    status: "verified",
  },
];

type Point = {
  x: number;
  y: number;
};

type PositionedWitness = VerificationWitness & {
  point: Point;
};

type NetworkEdge = {
  from: Point;
  to: Point;
  index: number;
};

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

function resolvePoint(witness: VerificationWitness, index: number): Point {
  const fallback = FALLBACK_POSITIONS[index % FALLBACK_POSITIONS.length];
  const position = witness.position ?? fallback;

  return {
    x: 90 + clampUnit(position.x) * 460,
    y: 90 + clampUnit(position.y) * 460,
  };
}

function statusColor(status: WitnessStatus | undefined) {
  if (status === "pending") return COLORS.gold;
  if (status === "attention") return COLORS.coral;
  return COLORS.aqua;
}

function statusLabel(status: WitnessStatus | undefined) {
  if (status === "pending") return "pending";
  if (status === "attention") return "needs attention";
  return "verified";
}

function linePath(from: Point, to: Point) {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

export function VerificationGlobe({
  witnesses = DEFAULT_WITNESSES,
  onWitnessSelect,
  className,
  title = "Verification network",
  description = "A spherical network of witnesses converging on one event center.",
}: VerificationGlobeProps) {
  const reducedMotion = useReducedMotion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const instanceId = useId().replace(/:/g, "");
  const titleId = `verification-globe-title-${instanceId}`;
  const descriptionId = `verification-globe-description-${instanceId}`;
  const clipId = `verification-globe-clip-${instanceId}`;
  const sphereGradientId = `verification-globe-sphere-${instanceId}`;
  const glowGradientId = `verification-globe-glow-${instanceId}`;
  const shouldAnimate = reducedMotion !== true;

  const positionedWitnesses = useMemo<PositionedWitness[]>(
    () => witnesses.map((witness, index) => ({ ...witness, point: resolvePoint(witness, index) })),
    [witnesses],
  );

  const edges = useMemo<NetworkEdge[]>(() => {
    const radialEdges = positionedWitnesses.map(({ point }, index) => ({
      from: point,
      to: SPHERE_CENTER,
      index,
    }));

    const ringEdges = positionedWitnesses.map(({ point }, index) => ({
      from: point,
      to: positionedWitnesses[(index + 1) % positionedWitnesses.length]?.point ?? point,
      index: index + positionedWitnesses.length,
    }));

    return [...radialEdges, ...ringEdges];
  }, [positionedWitnesses]);

  const activeId = focusedId ?? hoveredId ?? selectedId;

  const notifyWitness = useCallback(
    (witness: VerificationWitness, persist = false) => {
      if (persist) setSelectedId(witness.id);
      onWitnessSelect?.(witness);
    },
    [onWitnessSelect],
  );

  const handleWitnessKeyDown = useCallback(
    (event: KeyboardEvent<SVGGElement>, witness: VerificationWitness) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      notifyWitness(witness, true);
    },
    [notifyWitness],
  );

  const shellStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: 720,
    aspectRatio: "1 / 1",
    overflow: "hidden",
    margin: 0,
    border: `1px solid rgba(242, 239, 232, 0.1)`,
    borderRadius: 28,
    background: COLORS.ink,
    boxShadow: "0 28px 80px rgba(0, 0, 0, 0.38), inset 0 0 0 1px rgba(242, 239, 232, 0.025)",
  };

  return (
    <MotionConfig reducedMotion="user">
      <figure className={className} style={shellStyle}>
        <svg
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          role="group"
          focusable="false"
          aria-labelledby={`${titleId} ${descriptionId}`}
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <title id={titleId}>{title}</title>
          <desc id={descriptionId}>{description}</desc>

          <defs>
            <radialGradient id={sphereGradientId} cx="42%" cy="36%" r="72%">
              <stop offset="0%" stopColor={COLORS.surface} />
              <stop offset="64%" stopColor={COLORS.surface} />
              <stop offset="100%" stopColor={COLORS.ink} />
            </radialGradient>
            <radialGradient id={glowGradientId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={COLORS.aqua} stopOpacity="0.28" />
              <stop offset="42%" stopColor={COLORS.aqua} stopOpacity="0.06" />
              <stop offset="100%" stopColor={COLORS.aqua} stopOpacity="0" />
            </radialGradient>
            <clipPath id={clipId}>
              <circle cx={SPHERE_CENTER.x} cy={SPHERE_CENTER.y} r={SPHERE_RADIUS} />
            </clipPath>
          </defs>

          <rect width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} fill={COLORS.ink} />

          <g aria-hidden="true">
            <path
              d="M 62 134 V 88 H 108 M 532 88 H 578 V 134 M 62 506 V 552 H 108 M 532 552 H 578 V 506"
              fill="none"
              stroke={COLORS.copper}
              strokeOpacity="0.3"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={SPHERE_CENTER.x}
              cy={SPHERE_CENTER.y}
              r={SPHERE_RADIUS + 18}
              fill="none"
              stroke={COLORS.aqua}
              strokeOpacity="0.08"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={SPHERE_CENTER.x}
              cy={SPHERE_CENTER.y}
              r={SPHERE_RADIUS + 10}
              fill="none"
              stroke={COLORS.paper}
              strokeOpacity="0.06"
              strokeDasharray="1 9"
              strokeLinecap="round"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          <g clipPath={`url(#${clipId})`} aria-hidden="true">
            <circle
              cx={SPHERE_CENTER.x}
              cy={SPHERE_CENTER.y}
              r={SPHERE_RADIUS}
              fill={`url(#${sphereGradientId})`}
            />
            <circle
              cx={SPHERE_CENTER.x - 42}
              cy={SPHERE_CENTER.y - 56}
              r="230"
              fill={`url(#${glowGradientId})`}
            />

            <g fill="none" stroke={COLORS.paper} strokeOpacity="0.1" strokeWidth="1" vectorEffect="non-scaling-stroke">
              <ellipse cx={SPHERE_CENTER.x} cy={SPHERE_CENTER.y} rx="78" ry={SPHERE_RADIUS} />
              <ellipse cx={SPHERE_CENTER.x} cy={SPHERE_CENTER.y} rx="158" ry={SPHERE_RADIUS} />
              <ellipse cx={SPHERE_CENTER.x} cy={SPHERE_CENTER.y} rx="232" ry={SPHERE_RADIUS} />
              <ellipse cx={SPHERE_CENTER.x} cy={SPHERE_CENTER.y} rx={SPHERE_RADIUS} ry="58" />
              <ellipse cx={SPHERE_CENTER.x} cy="246" rx="236" ry="42" />
              <ellipse cx={SPHERE_CENTER.x} cy="394" rx="236" ry="42" />
              <ellipse cx={SPHERE_CENTER.x} cy="184" rx="188" ry="24" strokeOpacity="0.07" />
              <ellipse cx={SPHERE_CENTER.x} cy="456" rx="188" ry="24" strokeOpacity="0.07" />
            </g>

            <path
              d="M 101 320 C 177 282 227 250 320 250 C 413 250 463 282 539 320"
              fill="none"
              stroke={COLORS.copper}
              strokeOpacity="0.16"
              strokeDasharray="3 8"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M 125 407 C 210 384 242 366 320 366 C 398 366 430 384 515 407"
              fill="none"
              stroke={COLORS.gold}
              strokeOpacity="0.12"
              strokeDasharray="2 10"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />

            <g fill="none" stroke={COLORS.copper} strokeOpacity="0.23" strokeWidth="1" vectorEffect="non-scaling-stroke">
              {edges.map((edge) => (
                <path key={`edge-${edge.index}`} d={linePath(edge.from, edge.to)} />
              ))}
            </g>

            {edges.map((edge) => {
              const packetColor = edge.index % 2 === 0 ? COLORS.aqua : COLORS.gold;
              const midpoint = {
                x: (edge.from.x + edge.to.x) / 2,
                y: (edge.from.y + edge.to.y) / 2,
              };

              return (
                <motion.circle
                  key={`packet-${edge.index}`}
                  r="3.25"
                  fill={packetColor}
                  stroke={COLORS.paper}
                  strokeOpacity="0.5"
                  strokeWidth="0.7"
                  initial={{ cx: edge.from.x, cy: edge.from.y, opacity: 0 }}
                  animate={
                    shouldAnimate
                      ? {
                          cx: [edge.from.x, edge.to.x],
                          cy: [edge.from.y, edge.to.y],
                          opacity: [0, 0.9, 0],
                        }
                      : { cx: midpoint.x, cy: midpoint.y, opacity: 0.34 }
                  }
                  transition={
                    shouldAnimate
                      ? {
                          duration: 3.5 + (edge.index % 4) * 0.55,
                          delay: (edge.index % 7) * 0.36,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                      : { duration: 0.01 }
                  }
                />
              );
            })}

            <motion.circle
              cx={SPHERE_CENTER.x}
              cy={SPHERE_CENTER.y}
              r="52"
              fill={`url(#${glowGradientId})`}
              initial={{ opacity: 0.16, scale: 0.94 }}
              animate={
                shouldAnimate
                  ? { opacity: [0.12, 0.32, 0.12], scale: [0.94, 1.04, 0.94] }
                  : { opacity: 0.2, scale: 1 }
              }
              transition={
                shouldAnimate
                  ? { duration: 3.8, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.01 }
              }
              style={{ transformOrigin: `${SPHERE_CENTER.x}px ${SPHERE_CENTER.y}px` }}
            />
          </g>

          <circle
            cx={SPHERE_CENTER.x}
            cy={SPHERE_CENTER.y}
            r={SPHERE_RADIUS}
            fill="none"
            stroke={COLORS.paper}
            strokeOpacity="0.18"
            strokeWidth="1.25"
            vectorEffect="non-scaling-stroke"
            aria-hidden="true"
          />

          <g aria-hidden="true">
            <circle
              cx={SPHERE_CENTER.x}
              cy={SPHERE_CENTER.y}
              r="23"
              fill={COLORS.ink}
              fillOpacity="0.72"
              stroke={COLORS.aqua}
              strokeOpacity="0.75"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <motion.circle
              cx={SPHERE_CENTER.x}
              cy={SPHERE_CENTER.y}
              r="13"
              fill="none"
              stroke={COLORS.gold}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0.42, r: 13 }}
              animate={
                shouldAnimate
                  ? { opacity: [0.52, 0.08, 0.52], r: [13, 27, 13] }
                  : { opacity: 0.4, r: 18 }
              }
              transition={
                shouldAnimate
                  ? { duration: 2.8, repeat: Infinity, ease: "easeOut" }
                  : { duration: 0.01 }
              }
            />
            <path
              d="M 320 300 L 340 320 L 320 340 L 300 320 Z"
              fill={COLORS.aqua}
              fillOpacity="0.88"
              stroke={COLORS.paper}
              strokeOpacity="0.72"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={SPHERE_CENTER.x} cy={SPHERE_CENTER.y} r="4" fill={COLORS.paper} />
          </g>

          {positionedWitnesses.map((witness, index) => {
            const witnessColor = statusColor(witness.status);
            const isActive = activeId === witness.id;
            const isFocused = focusedId === witness.id;
            const labelAnchor = witness.point.x < SPHERE_CENTER.x ? "start" : "end";
            const labelX = witness.point.x < SPHERE_CENTER.x ? witness.point.x + 18 : witness.point.x - 18;
            const labelY = witness.point.y < SPHERE_CENTER.y ? witness.point.y - 16 : witness.point.y + 24;
            const accessibleLabel = `${witness.label} witness, ${statusLabel(witness.status)}${
              witness.detail ? `. ${witness.detail}` : ""
            }`;

            return (
              <motion.g
                key={witness.id}
                role="button"
                tabIndex={0}
                aria-label={accessibleLabel}
                aria-pressed={selectedId === witness.id}
                onPointerEnter={() => {
                  setHoveredId(witness.id);
                  notifyWitness(witness);
                }}
                onPointerLeave={() => setHoveredId(null)}
                onFocus={() => {
                  setFocusedId(witness.id);
                  notifyWitness(witness);
                }}
                onBlur={() => setFocusedId(null)}
                onClick={() => notifyWitness(witness, true)}
                onKeyDown={(event) => handleWitnessKeyDown(event, witness)}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0.82 }}
                transition={{ duration: 0.18 }}
                style={{ cursor: "pointer", outline: "none" }}
              >
                <title>{accessibleLabel}</title>
                <circle
                  cx={witness.point.x}
                  cy={witness.point.y}
                  r={isActive ? 18 : 13}
                  fill={COLORS.ink}
                  fillOpacity="0.78"
                  stroke={isActive ? COLORS.paper : witnessColor}
                  strokeOpacity={isActive ? 0.92 : 0.56}
                  strokeWidth={isActive ? 1.3 : 1}
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={witness.point.x}
                  cy={witness.point.y}
                  r={isActive ? 7 : 5}
                  fill={witnessColor}
                  fillOpacity={isActive ? 1 : 0.86}
                />
                <circle
                  cx={witness.point.x}
                  cy={witness.point.y}
                  r="23"
                  fill="none"
                  stroke={COLORS.paper}
                  strokeOpacity={isFocused ? 0.9 : 0}
                  strokeDasharray="2 4"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={labelAnchor}
                  fill={COLORS.paper}
                  fillOpacity={isActive ? 0.88 : 0.42}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                  fontSize="10"
                  letterSpacing="0.04em"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {witness.label}
                </text>
                {isActive && witness.detail ? (
                  <text
                    x={labelX}
                    y={labelY + 13}
                    textAnchor={labelAnchor}
                    fill={witnessColor}
                    fillOpacity="0.9"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                    fontSize="8"
                    letterSpacing="0.03em"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {witness.detail}
                  </text>
                ) : null}
                <circle
                  cx={witness.point.x}
                  cy={witness.point.y}
                  r={index % 3 === 0 ? 26 : 21}
                  fill="none"
                  stroke={witnessColor}
                  strokeOpacity={isActive ? 0.24 : 0.1}
                  strokeDasharray={index % 2 === 0 ? "1 7" : "2 9"}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </motion.g>
            );
          })}

          <g aria-hidden="true">
            <text
              x="62"
              y="586"
              fill={COLORS.paper}
              fillOpacity="0.46"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              fontSize="9"
              letterSpacing="0.14em"
            >
              EVENT CENTER
            </text>
            <text
              x="578"
              y="586"
              textAnchor="end"
              fill={COLORS.aqua}
              fillOpacity="0.62"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              fontSize="9"
              letterSpacing="0.14em"
            >
              WITNESS NETWORK
            </text>
          </g>
        </svg>
      </figure>
    </MotionConfig>
  );
}

export default VerificationGlobe;
