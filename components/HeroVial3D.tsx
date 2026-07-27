"use client";

/**
 * Hero visual: a procedurally generated 3D peptide chain (ball-and-stick
 * alpha-helix), not a vial or product photo. Built entirely from Three.js
 * primitives (spheres + oriented cylinders along a helical curve), so it's
 * original artwork rather than a rendering of any real-world object, and it
 * doubles as an on-brand visual: a literal peptide backbone with a pulse of
 * light traveling along it.
 */

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The helix's palette is driven by the same CSS custom properties the rest
 * of the site uses for theming (see app/globals.css :root / [data-theme
 * light]). Three.js materials can't read CSS vars directly, so this hook
 * reads the computed values off <html> and re-reads them whenever
 * data-theme flips, keeping the 3D piece in sync with the light/dark
 * toggle instead of being hardcoded to one theme.
 */
function readCssColor(varName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;
  const parts = raw.split(/\s+/).filter(Boolean);
  return parts.length === 3 ? `rgb(${parts.join(",")})` : fallback;
}

function readThemeColors() {
  return {
    teal: readCssColor("--primary-500", "#5EE8D5"),
    tealDim: readCssColor("--hero-dim", "#2A5F58"),
    tealBright: readCssColor("--hero-emphasis", "#A8F5ED"),
    platinum: readCssColor("--platinum-2", "#C9CDD3"),
    bg: readCssColor("--bg-900", "#08090B"),
  };
}

function useThemeColors() {
  const [colors, setColors] = useState(readThemeColors);
  useEffect(() => {
    setColors(readThemeColors());
    const observer = new MutationObserver(() => setColors(readThemeColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return colors;
}

type ThemeColors = ReturnType<typeof readThemeColors>;

/**
 * Builds a small procedural environment map and assigns it to the scene so
 * the metallic bonds / node highlights have something coherent to reflect;
 * without one they read flat under a transparent canvas.
 */
function EnvironmentSetup({ colors }: { colors: ThemeColors }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    let pmrem: THREE.PMREMGenerator | null = null;
    let envTexture: THREE.Texture | null = null;
    let renderTarget: THREE.WebGLRenderTarget | null = null;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, colors.tealDim);
      grad.addColorStop(0.42, colors.bg);
      grad.addColorStop(0.6, colors.bg);
      grad.addColorStop(1, colors.bg);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = colors.tealBright;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(canvas.width * 0.28, canvas.height * 0.32, 46, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.teal;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.ellipse(canvas.width * 0.78, canvas.height * 0.62, 60, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      envTexture = new THREE.CanvasTexture(canvas);
      envTexture.mapping = THREE.EquirectangularReflectionMapping;
      envTexture.colorSpace = THREE.SRGBColorSpace;
      envTexture.needsUpdate = true;

      pmrem = new THREE.PMREMGenerator(gl);
      pmrem.compileEquirectangularShader();
      renderTarget = pmrem.fromEquirectangular(envTexture);
      scene.environment = renderTarget.texture;
    } catch {
      // If PMREM generation fails on an unusual GPU/browser, materials fall
      // back to their non-environment appearance rather than crashing.
    }

    return () => {
      pmrem?.dispose();
      envTexture?.dispose();
      renderTarget?.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);

  return null;
}

type Bond = { mid: THREE.Vector3; quaternion: THREE.Quaternion; length: number };

function buildHelix() {
  const POINT_COUNT = 26;
  const TURNS = 2.4;
  const RADIUS = 0.52;
  const HEIGHT = 2.5;

  const points: THREE.Vector3[] = [];
  for (let i = 0; i < POINT_COUNT; i++) {
    const t = i / (POINT_COUNT - 1);
    const angle = t * TURNS * Math.PI * 2;
    points.push(
      new THREE.Vector3(Math.cos(angle) * RADIUS, (t - 0.5) * HEIGHT, Math.sin(angle) * RADIUS)
    );
  }

  const bonds: Bond[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    bonds.push({ mid, quaternion, length });
  }

  return { points, bonds };
}

function HelixModel({ colors }: { colors: ThemeColors }) {
  const group = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const elapsed = useRef(0);

  const { points, bonds } = useMemo(() => buildHelix(), []);

  // Purely decorative background motion, same as the particle canvas and
  // scanline elsewhere in this hero (neither of which gate on
  // prefers-reduced-motion either) — kept unconditional so this doesn't
  // silently go static on machines with "reduce motion" enabled at the OS
  // level, which is a common default a lot of people never notice is on.
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.5;
    }
    elapsed.current += delta;
    // A pulse of light travels down the chain, node to node.
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const phase = elapsed.current * 1.4 - i * 0.35;
      const pulse = (Math.sin(phase) + 1) / 2;
      mat.emissiveIntensity = 0.5 + pulse * 1.1;
    });
  });

  return (
    <group ref={group} rotation={[0.12, 0.5, 0]}>
      {/* Backbone bonds */}
      {bonds.map((bond, i) => (
        <mesh key={`bond-${i}`} position={bond.mid} quaternion={bond.quaternion}>
          <cylinderGeometry args={[0.028, 0.028, bond.length, 10]} />
          <meshStandardMaterial color={colors.platinum} metalness={0.75} roughness={0.35} envMapIntensity={1.1} />
        </mesh>
      ))}

      {/* Residue nodes */}
      {points.map((p, i) => {
        const major = i % 4 === 0;
        const radius = major ? 0.1 : 0.065;
        return (
          <mesh
            key={`node-${i}`}
            position={p}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[radius, 20, 20]} />
            <meshStandardMaterial
              color={major ? colors.tealBright : colors.teal}
              emissive={colors.teal}
              emissiveIntensity={0.7}
              metalness={0.2}
              roughness={0.3}
              envMapIntensity={1.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function HeroVial3D() {
  const colors = useThemeColors();

  return (
    <div className="w-full h-full">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 5.7], fov: 30 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 4]} intensity={1.1} color="#ffffff" />
        <pointLight position={[-3, 1, 2]} intensity={14} color={colors.teal} />
        <pointLight position={[2, -2, -3]} intensity={6} color={colors.tealDim} />
        <EnvironmentSetup colors={colors} />
        <HelixModel colors={colors} />
      </Canvas>
    </div>
  );
}
