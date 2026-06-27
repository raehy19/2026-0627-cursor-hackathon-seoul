"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import type { Group } from "three";

function ParallelPaths() {
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
        </group>
      </Float>
    </>
  );
}

export function HeroSceneCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.8], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 1.75]}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0b0b12"]} />
      <fog attach="fog" args={["#0b0b12", 6, 14]} />
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 4, 5]} intensity={1.4} color="#7c5cff" />
      <pointLight position={[-4, -3, 3]} intensity={1} color="#ff5c8a" />
      <directionalLight position={[0, 2, 6]} intensity={0.35} color="#ececf2" />
      <Stars radius={70} depth={35} count={900} factor={2.8} fade speed={0.35} />
      <ParallelPaths />
    </Canvas>
  );
}
