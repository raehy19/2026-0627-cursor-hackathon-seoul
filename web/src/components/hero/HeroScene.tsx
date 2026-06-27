"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import type { Group } from "three";

type SceneMode = "hero" | "logo";

function PurpleKnot() {
  return (
    <mesh>
      <torusKnotGeometry args={[0.52, 0.13, 128, 20, 2, 3]} />
      <meshStandardMaterial
        color="#7c5cff"
        emissive="#7c5cff"
        emissiveIntensity={0.45}
        metalness={0.65}
        roughness={0.22}
      />
    </mesh>
  );
}

function PinkKnot() {
  return (
    <mesh scale={0.88}>
      <torusKnotGeometry args={[0.48, 0.11, 128, 20, 3, 2]} />
      <meshStandardMaterial
        color="#ff5c8a"
        emissive="#ff5c8a"
        emissiveIntensity={0.5}
        metalness={0.55}
        roughness={0.28}
      />
    </mesh>
  );
}

function BridgeArc() {
  return (
    <group position={[0, 0.05, -0.2]}>
      <mesh rotation={[0, 0, Math.PI / 6]}>
        <torusGeometry args={[0.9, 0.018, 16, 64, Math.PI]} />
        <meshStandardMaterial
          color="#ececf2"
          emissive="#9a9ab0"
          emissiveIntensity={0.15}
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

/** Static, centered framing for square logo export. */
function LogoPaths() {
  return (
    <>
      <group position={[-0.95, 0.06, 0]} rotation={[0.28, 0.95, 0.08]}>
        <PurpleKnot />
      </group>
      <BridgeArc />
      <group position={[0.95, -0.06, -0.12]} rotation={[0.12, -0.75, -0.05]}>
        <PinkKnot />
      </group>
    </>
  );
}

function HeroPaths() {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const bridge = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (left.current) {
      left.current.rotation.x = Math.sin(t * 0.3) * 0.15;
      left.current.rotation.y = t * 0.12;
    }
    if (right.current) {
      right.current.rotation.x = Math.cos(t * 0.25) * 0.12;
      right.current.rotation.y = -t * 0.1;
    }
    if (bridge.current) {
      bridge.current.rotation.z = Math.sin(t * 0.2) * 0.08;
    }
  });

  return (
    <>
      <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.7}>
        <group ref={left} position={[-1.35, 0.25, 0]}>
          <PurpleKnot />
        </group>
      </Float>

      <group ref={bridge} position={[0, 0.05, -0.2]}>
        <mesh rotation={[0, 0, Math.PI / 6]}>
          <torusGeometry args={[0.9, 0.018, 16, 64, Math.PI]} />
          <meshStandardMaterial
            color="#ececf2"
            emissive="#9a9ab0"
            emissiveIntensity={0.15}
            transparent
            opacity={0.35}
          />
        </mesh>
      </group>

      <Float speed={1.4} rotationIntensity={0.45} floatIntensity={0.85}>
        <group ref={right} position={[1.4, -0.2, -0.35]}>
          <PinkKnot />
        </group>
      </Float>
    </>
  );
}

export function HeroSceneCanvas({ mode = "hero" }: { mode?: SceneMode }) {
  const isLogo = mode === "logo";

  return (
    <Canvas
      camera={
        isLogo
          ? { position: [0, 0, 5.6], fov: 34 }
          : { position: [0, 0, 4.8], fov: 42 }
      }
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={isLogo ? 2 : [1, 1.75]}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0b0b12"]} />
      {!isLogo && <fog attach="fog" args={["#0b0b12", 6, 14]} />}
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 4, 5]} intensity={1.4} color="#7c5cff" />
      <pointLight position={[-4, -3, 3]} intensity={1} color="#ff5c8a" />
      <directionalLight position={[0, 2, 6]} intensity={0.35} color="#ececf2" />
      <Stars
        radius={70}
        depth={35}
        count={isLogo ? 520 : 900}
        factor={isLogo ? 2.2 : 2.8}
        fade
        speed={isLogo ? 0 : 0.35}
      />
      {isLogo ? <LogoPaths /> : <HeroPaths />}
    </Canvas>
  );
}
