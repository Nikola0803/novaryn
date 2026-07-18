"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const TEAL = "#5EE8D5";
const TEAL_DIM = "#2A5F58";
const PLATINUM = "#C9CDD3";

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
    <group ref={group} rotation={[0.08, 0.6, 0]}>
      {/* Glass vial body */}
      <mesh castShadow>
        <latheGeometry args={[profile, 48]} />
        <meshPhysicalMaterial
          color="#dfe8e6"
          roughness={0.04}
          metalness={0}
          transmission={1}
          thickness={0.6}
          ior={1.45}
          clearcoat={0.6}
          clearcoatRoughness={0.15}
          attenuationColor="#bfe9e2"
          attenuationDistance={1.2}
        />
      </mesh>

      {/* Liquid fill */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 2.1, 40]} />
        <meshPhysicalMaterial
          color={TEAL}
          transmission={0.85}
          roughness={0.15}
          thickness={0.8}
          ior={1.33}
          emissive={TEAL_DIM}
          emissiveIntensity={0.25}
          transparent
          opacity={0.55}
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
        <VialModel reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  );
}
