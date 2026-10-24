import { ArrowLeft, ArrowUpRight, CircleDot, Route } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/resonance-ui";

type RoutePlaceholderProps = {
  route: string;
  stateLabel: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
};

export default function RoutePlaceholder({
  route,
  stateLabel,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel = "Return to landing",
  secondaryActionHref = "/",
}: RoutePlaceholderProps) {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100svh",
        overflow: "hidden",
        background: "var(--ink)",
        color: "var(--ivory)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.34,
          backgroundImage:
            "linear-gradient(rgba(242, 239, 232, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 239, 232, 0.035) 1px, transparent 1px), radial-gradient(circle at 72% 22%, rgba(184, 227, 232, 0.12), transparent 32%)",
          backgroundPosition: "center, center, center",
          backgroundSize: "72px 72px, 72px 72px, auto",
          maskImage: "linear-gradient(to bottom, black, transparent 90%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(1180px, calc(100% - 48px))",
          minHeight: "100svh",
          marginInline: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
            minHeight: 82,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <Link href="/" aria-label="RESONANCE home" style={{ display: "inline-flex", minHeight: 44, alignItems: "center" }}>
            <BrandMark />
          </Link>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              color: "var(--muted)",
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--amber)",
                boxShadow: "0 0 0 3px rgba(214, 168, 95, 0.12)",
              }}
            />
            Testnet / route scaffold
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
            alignItems: "center",
            gap: "clamp(38px, 8vw, 112px)",
            flex: 1,
            padding: "clamp(72px, 12vh, 150px) 0 clamp(64px, 10vh, 120px)",
          }}
        >
          <div style={{ maxWidth: 650 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                border: "1px solid rgba(214, 168, 95, 0.34)",
                background: "rgba(214, 168, 95, 0.08)",
                color: "var(--amber)",
                fontFamily: "var(--mono)",
                fontSize: 9,
                fontWeight: 650,
                letterSpacing: "0.08em",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              <CircleDot size={12} aria-hidden="true" />
              {stateLabel}
            </div>

            <p
              style={{
                margin: "28px 0 0",
                color: "var(--muted)",
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Protocol surface / Phase 01
            </p>
            <h1
              style={{
                maxWidth: 640,
                margin: "18px 0 0",
                color: "var(--ivory)",
                fontFamily: "var(--display)",
                fontSize: "clamp(48px, 7vw, 88px)",
                fontWeight: 680,
                letterSpacing: "-0.085em",
                lineHeight: 0.92,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                maxWidth: 510,
                margin: "28px 0 0",
                color: "var(--ivory-soft)",
                fontSize: 16,
                lineHeight: 1.7,
              }}
            >
              {description}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 22,
                marginTop: 36,
              }}
            >
              <Link className="arrow-button arrow-button--primary" href={actionHref}>
                <span>{actionLabel}</span>
                <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <Link className="quiet-button" href={secondaryActionHref}>
                <ArrowLeft size={16} aria-hidden="true" />
                {secondaryActionLabel}
              </Link>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 14,
                marginTop: 54,
                color: "var(--muted)",
                fontSize: 11,
              }}
            >
              <span className="mono" style={{ color: "var(--copper)", fontSize: 9 }}>
                SYS.01
              </span>
              <span>Independent observation → evidence → consensus → proof.</span>
            </div>
          </div>

          <aside
            aria-label="Route status"
            style={{
              position: "relative",
              maxWidth: 430,
              justifySelf: "end",
              width: "100%",
              padding: 25,
              border: "1px solid var(--line)",
              background: "rgba(17, 17, 17, 0.86)",
              boxShadow: "var(--shadow-tight)",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -1,
                left: -1,
                width: "38%",
                height: 1,
                background: "var(--cyan)",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div>
                <span
                  style={{
                    display: "block",
                    color: "var(--muted)",
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Current state
                </span>
                <h2
                  style={{
                    margin: "9px 0 0",
                    color: "var(--ivory)",
                    fontFamily: "var(--display)",
                    fontSize: 21,
                    fontWeight: 620,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                  }}
                >
                  Route scaffolded
                </h2>
              </div>
              <Route size={20} strokeWidth={1.5} color="var(--cyan)" aria-hidden="true" />
            </div>

            <div
              style={{
                display: "grid",
                gap: 0,
                marginTop: 30,
                borderTop: "1px solid var(--line)",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 20,
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span style={{ color: "var(--muted)", fontSize: 11 }}>Route</span>
                <strong className="mono" style={{ color: "var(--ivory-soft)", fontSize: 10, fontWeight: 500 }}>
                  {route}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 20,
                  padding: "14px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span style={{ color: "var(--muted)", fontSize: 11 }}>Implementation</span>
                <strong className="mono" style={{ color: "var(--cyan)", fontSize: 10, fontWeight: 500 }}>
                  READY
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 20,
                  padding: "14px 0",
                }}
              >
                <span style={{ color: "var(--muted)", fontSize: 11 }}>Next signal</span>
                <strong className="mono" style={{ color: "var(--amber)", fontSize: 10, fontWeight: 500 }}>
                  DOMAIN LOGIC
                </strong>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginTop: 20,
                color: "var(--muted)",
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  flex: "none",
                  marginTop: 6,
                  borderRadius: "50%",
                  background: "var(--cyan)",
                  boxShadow: "0 0 0 3px rgba(184, 227, 232, 0.09)",
                }}
              />
              <span>Navigation remains available while this surface is being wired.</span>
            </div>
          </aside>
        </section>

        <footer
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 18,
            minHeight: 64,
            borderTop: "1px solid var(--line)",
            color: "var(--muted-deep)",
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>RESONANCE protocol</span>
          <span>Phase 01 / {route}</span>
        </footer>
      </div>
    </main>
  );
}
