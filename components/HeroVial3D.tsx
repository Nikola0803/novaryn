"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const TEAL = "#5EE8D5";
const TEAL_DIM = "#2A5F58";
const PLATINUM = "#C9CDD3";

/**
 * Builds a small procedural environment map and assigns it to the scene.
 * Glass materials with `transmission` sample the scene environment to render
 * refraction/highlights — without one, on a transparent canvas they read as a
 * flat, muddy, near-black blob instead of clear glass. This gives the vial
 * something coherent (a soft teal highlight over a dark gradient) to refract.
 */
function EnvironmentSetup() {
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
      grad.addColorStop(0, "#123a35");
      grad.addColorStop(0.42, "#0d2320");
      grad.addColorStop(0.6, "#0a0b0d");
      grad.addColorStop(1, "#050607");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Soft bright band so the glass has a highlight to catch as it rotates.
      ctx.fillStyle = "rgba(168,245,237,0.85)";
      ctx.beginPath();
      ctx.ellipse(canvas.width * 0.28, canvas.height * 0.32, 46, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(94,232,213,0.35)";
      ctx.beginPath();
      ctx.ellipse(canvas.width * 0.78, canvas.height * 0.62, 60, 22, 0, 0, Math.PI * 2);
      ctx.fill();

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

/** Builds a canvas texture for the vial label — batch code + purity, drawn procedurally (no external assets). */
function useLabelTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#0e1013";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(94,232,213,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    ctx.fillStyle = "#E9EDF2";
    ctx.font = "700 26px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("VERTALIS", canvas.width / 2, 48);

    ctx.fillStyle = "#5EE8D5";
    ctx.font = "600 15px 'JetBrains Mono', monospace";
    ctx.fillText("99.42% PURITY", canvas.width / 2, 78);

    ctx.fillStyle = "rgba(233,237,242,0.55)";
    ctx.font = "400 12px 'JetBrains Mono', monospace";
    ctx.fillText("BATCH · VTX-24-1108-A", canvas.width / 2, 104);
    ctx.fillText("RESEARCH USE ONLY", canvas.width / 2, 124);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

function VialModel({ reduceMotion }: { reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const labelTexture = useLabelTexture();

  // Vial silhouette: flat base -> cylindrical body -> shoulder taper -> narrow neck -> lip.
  const profile = useMemo(
    () =>
      [
        [0.0, -1.55],
        [0.62, -1.55],
        [0.62, 0.95],
        [0.5, 1.15],
        [0.24, 1.32],
        [0.24, 1.55],
        [0.3, 1.55],
        [0.3, 1.62],
        [0.22, 1.62],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    []
  );

  useFrame((_, delta) => {
    if (!group.current || reduceMotion) return;
    group.current.rotation.y += delta * 0.35;
  });

  return (
    <group ref={group} rotation={[0.08, 0.6, 0]} scale={0.88}>
      {/* Glass vial body */}
      <mesh castShadow>
        <latheGeometry args={[profile, 48]} />
        <meshPhysicalMaterial
          color="#dfe8e6"
          roughness={0.05}
          metalness={0}
          transmission={0.92}
          thickness={0.6}
          ior={1.45}
          clearcoat={0.6}
          clearcoatRoughness={0.15}
          attenuationColor="#bfe9e2"
          attenuationDistance={1.2}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Liquid fill */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 2.1, 40]} />
        <meshPhysicalMaterial
          color={TEAL}
          transmission={0.7}
          roughness={0.15}
          thickness={0.8}
          ior={1.33}
          emissive={TEAL_DIM}
          emissiveIntensity={0.3}
          envMapIntensity={0.8}
          transparent
          opacity={0.62}
        />
      </mesh>

      {/* Metal crimp cap */}
      <mesh position={[0, 1.72, 0]}>
        <cylinderGeometry args={[0.34, 0.3, 0.32, 32]} />
        <meshStandardMaterial color={PLATINUM} metalness={0.9} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.06, 32]} />
        <meshStandardMaterial color="#8B93A1" metalness={0.85} roughness={0.35} />
      </mesh>

      {/* Label */}
      {labelTexture && (
        <mesh position={[0, -0.25, 0.63]}>
          <planeGeometry args={[0.86, 0.56]} />
          <meshBasicMaterial map={labelTexture} transparent />
        </mesh>
      )}
    </group>
  );
}

export default function HeroVial3D() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="w-full h-full">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0.1, 5.4], fov: 32 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 4]} intensity={1.1} color="#ffffff" />
        <pointLight position={[-3, 1, 2]} intensity={18} color={TEAL} />
        <pointLight position={[2, -2, -3]} intensity={8} color={TEAL_DIM} />
        <EnvironmentSetup />
        <VialModel reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  );
}
