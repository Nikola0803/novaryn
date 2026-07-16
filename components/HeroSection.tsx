"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const TEAL   = "#5EE8D5";
const TEAL_D = "#3bb8a8";
const TEAL_L = "#a8f5ed";
const BG     = "#08090B";
const FG_DIM = "rgba(233,237,242,0.48)";

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      alpha: Math.random() * 0.09 + 0.02,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha; ctx.fillStyle = TEAL; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "calc(100vh - 72px)", minHeight: 560, maxHeight: 880, background: BG }}
    >
      {/* Radial ambient */}
      <div className="absolute inset-0 z-0" style={{
        background: `radial-gradient(ellipse 58% 75% at 70% 50%, #0d1a19 0%, transparent 65%), ${BG}`,
      }} />

      {/* Grid */}
      <div className="absolute inset-0 z-[1] grid-overlay opacity-[0.07] pointer-events-none" />

      {/* Left fade so text stays readable */}
      <div className="absolute inset-0 z-[2] pointer-events-none" style={{
        background: "linear-gradient(to right, rgba(8,9,11,1) 0%, rgba(8,9,11,0.88) 30%, rgba(8,9,11,0.45) 52%, rgba(8,9,11,0) 68%)",
      }} />

      {/* Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-[3] w-full h-full pointer-events-none" />

      {/* Scanline */}
      <div className="absolute top-0 bottom-0 z-[4] pointer-events-none" style={{
        width: 1,
        background: `linear-gradient(to bottom, transparent, ${TEAL_D} 20%, ${TEAL_L} 50%, ${TEAL_D} 80%, transparent)`,
        animation: "nvScanline 10s ease-in-out infinite",
        opacity: 0.5,
      }} />

      {/* Corner marks */}
      {([
        { top: 20, left: 20, bt: true, bl: true },
        { top: 20, right: 20, bt: true, br: true },
        { bottom: 20, left: 20, bb: true, bl: true },
        { bottom: 20, right: 20, bb: true, br: true },
      ] as const).map((c, i) => (
        <div key={i} className="absolute z-[10] pointer-events-none" style={{
          width: 20, height: 20,
          top: (c as any).top, bottom: (c as any).bottom,
          left: (c as any).left, right: (c as any).right,
          borderTop:    (c as any).bt ? `1.5px solid ${TEAL}` : undefined,
          borderLeft:   (c as any).bl ? `1.5px solid ${TEAL}` : undefined,
          borderBottom: (c as any).bb ? `1.5px solid ${TEAL}` : undefined,
          borderRight:  (c as any).br ? `1.5px solid ${TEAL}` : undefined,
          opacity: 0.45,
        }} />
      ))}

      {/* Molecular SVG — right half */}
      <div className="absolute right-0 top-0 bottom-0 z-[5] pointer-events-none hidden lg:block" style={{ width: "50%" }}>
        <svg viewBox="0 0 600 520" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <defs>
            <filter id="nv-glow"><feGaussianBlur stdDeviation="5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
            <filter id="nv-gs"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
            <radialGradient id="nv-bg" cx="52%" cy="46%" r="48%">
              <stop offset="0%" stopColor="#0d2622" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#08090B" stopOpacity="0.8"/>
            </radialGradient>
            <linearGradient id="nv-bt" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={TEAL}   stopOpacity="0.7"/>
              <stop offset="100%" stopColor={TEAL_D} stopOpacity="0.18"/>
            </linearGradient>
            <linearGradient id="nv-bd" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={TEAL_D} stopOpacity="0.38"/>
              <stop offset="100%" stopColor={TEAL_D} stopOpacity="0.08"/>
            </linearGradient>
            <radialGradient id="nv-np" cx="35%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fff"/>
              <stop offset="40%" stopColor={TEAL_L}/>
              <stop offset="100%" stopColor={TEAL_D}/>
            </radialGradient>
            <radialGradient id="nv-nd" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor={TEAL}/>
              <stop offset="100%" stopColor="#1F2228"/>
            </radialGradient>
            <pattern id="nv-hex" x="0" y="0" width="40" height="46" patternUnits="userSpaceOnUse">
              <path d="M20 2 L38 12 L38 34 L20 44 L2 34 L2 12 Z" fill="none" stroke="#1F2228" strokeWidth="0.55"/>
            </pattern>
          </defs>
          <ellipse cx="300" cy="250" rx="270" ry="210" fill="url(#nv-bg)" opacity="0.6"/>
          <rect width="600" height="520" fill="url(#nv-hex)" opacity="0.15"/>

          {/* Peptide chain */}
          <g style={{ animation: "nvFloat 6s ease-in-out infinite" }}>
            <line x1="90"  y1="210" x2="152" y2="172" stroke="url(#nv-bt)" strokeWidth="2.5"/>
            <line x1="152" y1="172" x2="218" y2="192" stroke="url(#nv-bd)" strokeWidth="2.5"/>
            <line x1="218" y1="192" x2="280" y2="156" stroke="url(#nv-bt)" strokeWidth="2.5"/>
            <line x1="280" y1="156" x2="346" y2="178" stroke="url(#nv-bd)" strokeWidth="2.5"/>
            <line x1="346" y1="178" x2="408" y2="148" stroke="url(#nv-bt)" strokeWidth="2.5"/>
            <line x1="408" y1="148" x2="472" y2="170" stroke="url(#nv-bd)" strokeWidth="2.5"/>
            {/* Side chains */}
            <line x1="152" y1="172" x2="138" y2="230" stroke={TEAL} strokeWidth="1.3" opacity="0.32"/>
            <line x1="218" y1="192" x2="232" y2="252" stroke={TEAL_D} strokeWidth="1.3" opacity="0.32"/>
            <line x1="280" y1="156" x2="266" y2="102" stroke={TEAL} strokeWidth="1.3" opacity="0.32"/>
            <line x1="346" y1="178" x2="360" y2="238" stroke={TEAL_D} strokeWidth="1.3" opacity="0.32"/>
            <line x1="408" y1="148" x2="422" y2="92"  stroke={TEAL} strokeWidth="1.3" opacity="0.32"/>
            {/* Nodes */}
            <circle cx="90"  cy="210" r="14" fill="url(#nv-np)" filter="url(#nv-glow)"/>
            <text x="90"  y="215" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="8.5" fill="#0A0B0D" fontWeight="bold">N</text>
            <circle cx="152" cy="172" r="11" fill="url(#nv-nd)"/>
            <text x="152" y="176" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill={TEAL_L}>Cα</text>
            <circle cx="218" cy="192" r="13" fill="url(#nv-np)" filter="url(#nv-gs)"/>
            <text x="218" y="197" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="8.5" fill="#0A0B0D" fontWeight="bold">C</text>
            <circle cx="280" cy="156" r="16" fill="url(#nv-np)" filter="url(#nv-glow)"/>
            <text x="280" y="161" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="8.5" fill="#0A0B0D" fontWeight="bold">NH</text>
            <circle cx="346" cy="178" r="12" fill="url(#nv-nd)"/>
            <text x="346" y="182" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill={TEAL_L}>Cα</text>
            <circle cx="408" cy="148" r="13" fill="url(#nv-np)" filter="url(#nv-gs)"/>
            <text x="408" y="152" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill="#0A0B0D">CO</text>
            <circle cx="472" cy="170" r="11" fill="url(#nv-np)"/>
            <text x="472" y="174" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="8" fill="#0A0B0D">N</text>
            {/* Small terminus */}
            <circle cx="138" cy="244" r="7" fill="url(#nv-nd)" opacity="0.65"/>
            <text x="138" y="248" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="6.5" fill={TEAL_L}>O</text>
            <circle cx="266" cy="90"  r="8" fill="url(#nv-np)" opacity="0.7"/>
            <text x="266" y="94"  textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="6.5" fill="#0A0B0D">O</text>
            <circle cx="360" cy="250" r="7" fill="url(#nv-nd)" opacity="0.65"/>
            <text x="360" y="254" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="6.5" fill={TEAL}>H</text>
          </g>

          {/* HPLC */}
          <g opacity="0.58" style={{ animation: "nvFloat 7s ease-in-out infinite 1s" }}>
            <text x="58" y="408" fontFamily="'JetBrains Mono',monospace" fontSize="7.5" fill={TEAL_D}>HPLC ANALYSIS</text>
            <line x1="58" y1="448" x2="340" y2="448" stroke="#2A2E36" strokeWidth="0.8" opacity="0.5"/>
            <path d="M58,448 L80,448 L85,446 L90,442 L96,428 L101,414 L106,406 L111,414 L116,428 L121,443 L127,448 L142,448 L152,447 L162,432 L167,418 L172,410 L177,418 L182,432 L188,447 L206,448 L218,447 L228,438 L232,430 L235,438 L239,447 L280,448 L290,447 L296,441 L299,435 L303,441 L306,447 L340,448"
              fill="none" stroke={TEAL} strokeWidth="1.5" opacity="0.8"/>
            <line x1="106" y1="406" x2="106" y2="398" stroke={TEAL_L} strokeWidth="0.8" opacity="0.6"/>
            <text x="106" y="396" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="6.5" fill={TEAL_L} opacity="0.9">99.42%</text>
          </g>

          {/* COA box */}
          <g opacity="0.85" style={{ animation: "nvFloat2 8s ease-in-out infinite 2s" }}>
            <rect x="368" y="295" width="192" height="118" rx="4" fill="#08090B" stroke={TEAL_D} strokeWidth="0.75" strokeOpacity="0.5"/>
            <rect x="368" y="295" width="192" height="20"  rx="4" fill={TEAL} fillOpacity="0.07"/>
            <circle cx="379" cy="305" r="3" fill="#FF5C5C" opacity="0.65"/>
            <circle cx="389" cy="305" r="3" fill="#FFBC00" opacity="0.65"/>
            <circle cx="399" cy="305" r="3" fill={TEAL}    opacity="0.65"/>
            <text x="412" y="309" fontFamily="'JetBrains Mono',monospace" fontSize="7.5" fill={TEAL_D}>COA DATA</text>
            <text x="378" y="328" fontFamily="'JetBrains Mono',monospace" fontSize="7" fill="#6B7280">Purity: <tspan fill={TEAL_L}>99.42%</tspan></text>
            <text x="378" y="343" fontFamily="'JetBrains Mono',monospace" fontSize="7" fill="#6B7280">MW: <tspan fill="#E9EDF2">4,113.6 Da</tspan></text>
            <text x="378" y="358" fontFamily="'JetBrains Mono',monospace" fontSize="7" fill="#6B7280">Endotoxin: <tspan fill="#A8AEB8">&lt;0.1 EU/mg</tspan></text>
            <text x="378" y="373" fontFamily="'JetBrains Mono',monospace" fontSize="7" fill="#6B7280">Batch: <tspan fill="#E9EDF2">NVR-24-1108-A</tspan></text>
            <text x="378" y="400" fontFamily="'JetBrains Mono',monospace" fontSize="6" fill={TEAL_D} opacity="0.65">▣ VERIFIED  ✓ 3RD PARTY TESTED</text>
          </g>

          {/* Verified pill */}
          <g>
            <rect x="56" y="10" width="126" height="22" rx="11" fill="#08090B" stroke={TEAL_D} strokeWidth="0.6" strokeOpacity="0.45"/>
            <circle cx="71" cy="21" r="5.5" fill="none" stroke={TEAL} strokeWidth="1.2"/>
            <text x="71" y="24.5" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fill={TEAL}>✓</text>
            <text x="82" y="25" fontFamily="'JetBrains Mono',monospace" fontSize="7" fill="#E9EDF2" letterSpacing="0.08em">3RD PARTY VERIFIED</text>
          </g>
        </svg>
      </div>

      {/* ── Text — constrained to same 1440px grid as rest of page ── */}
      <div className="relative z-[8] h-full w-full max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col justify-center">
        <div className="max-w-[580px]">

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-7" style={{ animation: "nvFadeUp 0.8s ease forwards 0.25s", opacity: 0 }}>
            <span style={{ width: 28, height: 1, background: TEAL, display: "inline-block" }}/>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: TEAL_D }}>
              USA Research Grade Peptides
            </p>
          </div>

          {/* Main headline — Novaryn's own copy */}
          <div style={{ marginBottom: 14 }}>
            <h1 style={{
              fontSize: "clamp(44px, 5.8vw, 82px)", lineHeight: 0.9,
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              letterSpacing: "-0.03em", color: "#E9EDF2",
              animation: "nvFadeUp 0.9s ease forwards 0.42s", opacity: 0,
            }}>
              Research‑Grade
            </h1>
            <h1 style={{
              fontSize: "clamp(44px, 5.8vw, 82px)", lineHeight: 0.9,
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              letterSpacing: "-0.03em",
              background: `linear-gradient(135deg, ${TEAL_D} 0%, ${TEAL_L} 40%, ${TEAL} 80%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              animation: "nvFadeUp 0.9s ease forwards 0.56s", opacity: 0,
            }}>
              Peptides.
            </h1>
            <h1 style={{
              fontSize: "clamp(44px, 5.8vw, 82px)", lineHeight: 0.9,
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "transparent", WebkitTextStroke: `1.5px ${TEAL_D}`,
              animation: "nvFadeUp 0.9s ease forwards 0.7s", opacity: 0,
            }}>
              Verified.
            </h1>
          </div>

          {/* Sub-label */}
          <p style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: "clamp(9px,1vw,12px)",
            color: TEAL_D, letterSpacing: "0.22em", textTransform: "uppercase",
            marginBottom: 16, animation: "nvFadeUp 0.9s ease forwards 0.84s", opacity: 0,
          }}>
            Precision Synthesis · Independent COA · Cold-Chain
          </p>

          {/* Divider */}
          <div style={{
            width: 280, height: 1,
            background: `linear-gradient(to right, ${TEAL}, rgba(94,232,213,0.06))`,
            marginBottom: 16, animation: "nvFadeUp 0.8s ease forwards 0.94s", opacity: 0,
          }} />

          {/* Body */}
          <p style={{
            fontSize: "clamp(12px,1.2vw,14px)", lineHeight: 1.75, color: FG_DIM,
            maxWidth: 420, marginBottom: 4,
            animation: "nvFadeUp 0.9s ease forwards 1.04s", opacity: 0,
          }}>
            Every batch HPLC-verified and independently tested before it ships. Every COA published publicly the moment it clears — searchable by batch code.
          </p>
          <p style={{
            fontSize: 10, fontStyle: "italic", color: "rgba(233,237,242,0.2)",
            marginBottom: 20, animation: "nvFadeUp 0.9s ease forwards 1.12s", opacity: 0,
          }}>
            *For Research Use Only. Not intended for human consumption.*
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 24, animation: "nvFadeUp 0.9s ease forwards 1.18s", opacity: 0 }}>
            {["≥99% PURITY", "3RD PARTY TESTED", "COLD-CHAIN 24H"].map((b) => (
              <div key={b} className="flex items-center gap-2" style={{
                padding: "5px 12px", border: `1px solid rgba(94,232,213,0.25)`,
                background: "rgba(94,232,213,0.04)",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5,
                letterSpacing: "0.13em", color: TEAL,
              }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: TEAL, display: "inline-block", animation: "nvPulse 2s ease-in-out infinite" }}/>
                {b}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-5" style={{ marginBottom: 30, animation: "nvFadeUp 0.9s ease forwards 1.3s", opacity: 0 }}>
            <Link href="/shop" className="inline-flex items-center gap-3 transition-all duration-200 whitespace-nowrap"
              style={{ background: TEAL, color: BG, padding: "13px 30px", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = TEAL_L; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = TEAL; }}>
              Shop Catalog <i className="ri-arrow-right-line"/>
            </Link>
            <Link href="/coa" className="transition-all duration-200 whitespace-nowrap"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: "0.14em", color: TEAL_D, borderBottom: `1.5px solid rgba(94,232,213,0.28)`, paddingBottom: 2 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = TEAL; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = TEAL_D; }}>
              Verify a COA →
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center" style={{ gap: 22, animation: "nvFadeUp 0.9s ease forwards 1.44s", opacity: 0 }}>
            {[
              { val: "≥99%",  label: "Purity" },
              { val: "24h",   label: "Cold-Chain" },
              { val: "2,847", label: "COAs Live" },
              { val: "100%",  label: "Verified" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center" style={{ gap: 22 }}>
                <div>
                  <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.03em", background: `linear-gradient(135deg, ${TEAL_L}, ${TEAL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.val}</p>
                  <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(233,237,242,0.28)", marginTop: 2 }}>{s.label}</p>
                </div>
                {i < arr.length - 1 && <div style={{ width: 1, height: 28, background: "rgba(94,232,213,0.14)" }}/>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 z-[9]" style={{ height: 1, background: `linear-gradient(to right, ${TEAL}, rgba(94,232,213,0.05))`, opacity: 0.25 }}/>

      {/* Edge vignette */}
      <div className="absolute inset-0 z-[6] pointer-events-none" style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 46%, rgba(5,5,5,0.55) 100%)" }}/>

      <style>{`
        @keyframes nvScanline {
          0%   { left:-2%; opacity:0; }
          8%   { opacity:0.5; }
          92%  { opacity:0.35; }
          100% { left:102%; opacity:0; }
        }
        @keyframes nvFadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes nvPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.35; transform:scale(0.6); }
        }
        @keyframes nvFloat {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-8px); }
        }
        @keyframes nvFloat2 {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-5px); }
        }
      `}</style>
    </section>
  );
}
