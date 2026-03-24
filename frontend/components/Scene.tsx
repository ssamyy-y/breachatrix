"use client";
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  PerspectiveCamera,
  MeshDistortMaterial,
  Sphere,
  Float,
} from "@react-three/drei";
import * as THREE from "three";

/* ── Star field ── */
function StarField({
  count,
  spread,
  size,
  opacity,
  color,
}: {
  count: number;
  spread: number;
  size: number;
  opacity: number;
  color: string;
}) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = spread * (0.7 + Math.random() * 0.3);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, spread]);

  const ref = useRef<THREE.Points>(null!);
  useFrame((s) => {
    ref.current.rotation.y = s.clock.getElapsedTime() * 0.006;
    ref.current.rotation.x = s.clock.getElapsedTime() * 0.002;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ── Nebula dust cloud ── */
function NebulaDust() {
  const count = 300;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null!);
  useFrame((s) => {
    ref.current.rotation.z = s.clock.getElapsedTime() * 0.004;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#444444"
        size={0.18}
        transparent
        opacity={0.08}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ── Inner glow halo behind the core ── */
function CoreHalo() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    const pulse = 1 + Math.sin(s.clock.getElapsedTime() * 1.4) * 0.06;
    ref.current.scale.setScalar(pulse);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.9, 32, 32]} />
      <meshBasicMaterial
        color="#cc2200"
        transparent
        opacity={0.06}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function CoreHalo2() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    const pulse = 1 + Math.sin(s.clock.getElapsedTime() * 0.9 + 1) * 0.09;
    ref.current.scale.setScalar(pulse);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshBasicMaterial
        color="#aa1100"
        transparent
        opacity={0.03}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

/* ── Central breach core ── */
function BreachCore() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    const t = s.clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.12;
    meshRef.current.rotation.y = t * 0.3;
  });
  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={1.2}>
      <CoreHalo />
      <CoreHalo2 />
      <Sphere ref={meshRef} args={[1.35, 128, 128]}>
        <MeshDistortMaterial
          color="#991a00"
          speed={2.5}
          distort={0.35}
          radius={1}
          emissive="#cc2200"
          emissiveIntensity={0.9}
          roughness={0.05}
          metalness={0.7}
        />
      </Sphere>
    </Float>
  );
}

/* ── Orbital rings ── */
function OrbitalRing({
  radius,
  speed,
  color,
  tilt,
}: {
  radius: number;
  speed: number;
  color: string;
  tilt: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    ref.current.rotation.z = s.clock.getElapsedTime() * speed;
  });
  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.006, 16, 120]} />
      <meshBasicMaterial color={color} transparent opacity={0.22} />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      style={{ height: "100vh", width: "100vw" }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color("#060606"), 1)}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={60} />

      {/* Monochrome space lighting — pure white ambient, one red key */}
      <ambientLight intensity={0.18} color="#aaaaaa" />
      <pointLight position={[0, 0, 4]} intensity={2.2} color="#cc2200" />
      <pointLight position={[6, 4, 4]} intensity={0.9} color="#dd3311" />
      <pointLight position={[-5, -4, -4]} intensity={0.8} color="#ffffff" />
      <pointLight position={[0, 5, -5]} intensity={0.3} color="#dddddd" />

      {/* Stars — pure white/grey, no blue tint */}
      <StarField
        count={2200}
        spread={90}
        size={0.05}
        opacity={0.95}
        color="#ffffff"
      />
      <StarField
        count={700}
        spread={55}
        size={0.09}
        opacity={0.45}
        color="#cccccc"
      />
      <StarField
        count={220}
        spread={35}
        size={0.13}
        opacity={0.25}
        color="#999999"
      />

      <NebulaDust />

      {/* Rings — one dark red, two neutral grey */}
      <OrbitalRing
        radius={2.1}
        speed={0.35}
        color="#881500"
        tilt={Math.PI / 4}
      />
      <OrbitalRing
        radius={2.55}
        speed={-0.22}
        color="#444444"
        tilt={Math.PI / 3}
      />
      <OrbitalRing
        radius={3.0}
        speed={0.15}
        color="#2a2a2a"
        tilt={Math.PI / 6}
      />

      <BreachCore />

      <fog attach="fog" args={["#060606", 14, 40]} />
    </Canvas>
  );
}
