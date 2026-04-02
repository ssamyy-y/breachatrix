/// <reference types="@react-three/fiber" />
"use client";

import { Points } from "three";
import { useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

function StarField({
  count = 2500,
  clickPos,
}: {
  count?: number;
  clickPos: [number, number] | null;
}) {
 const mesh = useRef<Points>(null!);
  const rippleTime = useRef(0);
  const activeClickPos = useRef<[number, number] | null>(null);

  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      temp[i * 3] = (Math.random() - 0.5) * 1000;
      temp[i * 3 + 1] = (Math.random() - 0.5) * 1000;
      temp[i * 3 + 2] = (Math.random() - 0.5) * 1000;
    }
    return temp;
  }, [count]);

  useMemo(() => {
    if (clickPos) {
      activeClickPos.current = clickPos;
      rippleTime.current = 0;
    }
  }, [clickPos]);

  useFrame((state, delta) => {
    if (!mesh.current) return;

    if (activeClickPos.current) {
      rippleTime.current += delta;
      if (rippleTime.current > 2) {
        activeClickPos.current = null;
        rippleTime.current = 0;
      }
    }

    const positions = mesh.current.geometry.attributes.position;
    const array = positions.array as Float32Array;
    const waveRadius = rippleTime.current * 500;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      array[i3 + 2] += delta * 50;
      if (array[i3 + 2] > 500) array[i3 + 2] = -500;

      if (activeClickPos.current) {
        const dx = array[i3] - activeClickPos.current[0];
        const dy = array[i3 + 1] - activeClickPos.current[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(dist - waveRadius) < 80) {
          const strength = (1 - Math.abs(dist - waveRadius) / 80) * 150;
          array[i3] += (dx / dist) * strength * delta;
          array[i3 + 1] += (dy / dist) * strength * delta;
        }
      }
    }
    positions.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
}

export default function Background3D() {
  const [clickPos, setClickPos] = useState<[number, number] | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    setClickPos([x * 300, y * 300]);
  };

  return (
    <div
      className="fixed inset-0 z-0 w-full h-full pointer-events-none"
      onClick={handleClick}
    >
      <Canvas camera={{ position: [0, 0, 200], fov: 75 }}>
        <color attach="background" args={["#000000"]} />
        <StarField clickPos={clickPos} />

        {/* Bloom Post-processing */}
        <EffectComposer disableNormalPass>
          <Bloom
            luminanceThreshold={0.9}
            mipmapBlur
            intensity={0.5}
            radius={0.3}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
