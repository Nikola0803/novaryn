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

const TEAL = "#5EE8D5";
const TEAL_DIM = "#2A5F58";
const TEAL_BRIGHT = "#A8F5ED";
const PLATINUM = "#C9CDD3";

/**
 * Builds a small procedural environment map and assigns it to the scene so
 * the metallic bonds / node highlights have something coherent to reflect;
 * without one they read flat under a transparent canvas.
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

function HelixModel({ reduceMotion }: { reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const elapsed = useRef(0);

  const { points, bonds } = useMemo(() => buildHelix(), []);

  useFrame((_, delta) => {
    if (group.current && !reduceMotion) {
      group.current.rotation.y += delta * 0.32;
    }
    if (reduceMotion) return;
    elapsed.current += delta;
    // A slow pulse of light travels down the chain, node to node.
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
          <meshStandardMaterial color={PLATINUM} metalness={0.75} roughness={0.35} envMapIntensity={1.1} />
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
              color={major ? TEAL_BRIGHT : TEAL}
              emissive={TEAL}
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
        camera={{ position: [0, 0, 5.7], fov: 30 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 4]} intensity={1.1} color="#ffffff" />
        <pointLight position={[-3, 1, 2]} intensity={14} color={TEAL} />
        <pointLight position={[2, -2, -3]} intensity={6} color={TEAL_DIM} />
        <EnvironmentSetup />
        <HelixModel reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  );
}
