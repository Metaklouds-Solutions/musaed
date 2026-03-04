"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

const PARTICLE_COUNT = 420;
const ORB_RADIUS = 0.92;

function deterministic(seed: number) {
  const v = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const sandVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aHeight;
  varying float vHeight;
  void main() {
    vHeight = aHeight;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (180.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const sandFragmentShader = /* glsl */ `
  uniform vec3 uColorTop;
  uniform vec3 uColorMid;
  uniform vec3 uColorBottom;
  varying float vHeight;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.22, d) * 0.88;
    float t = clamp(vHeight, 0.0, 1.0);
    vec3 col = t > 0.5
      ? mix(uColorMid, uColorTop, (t - 0.5) * 2.0)
      : mix(uColorBottom, uColorMid, t * 2.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

function SandFluid({ phase }: { phase: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const { positions, velocities, heights, sizes } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const h = new Float32Array(PARTICLE_COUNT);
    const s = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = deterministic(i * 3 + 1) * Math.PI * 2;
      const phi = Math.acos(2 * deterministic(i * 3 + 2) - 1);
      const r = deterministic(i * 3 + 3) * ORB_RADIUS * 0.78;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      vel[i * 3] = (deterministic(i * 7 + 11) - 0.5) * 0.015;
      vel[i * 3 + 1] = (deterministic(i * 7 + 17) - 0.5) * 0.015;
      vel[i * 3 + 2] = (deterministic(i * 7 + 23) - 0.5) * 0.015;

      h[i] = (pos[i * 3 + 1] / ORB_RADIUS + 1.0) * 0.5;
      s[i] = 0.035 + deterministic(i * 13 + 7) * 0.045;
    }
    return { positions: pos, velocities: vel, heights: h, sizes: s };
  }, []);

  const uniforms = useMemo(
    () => ({
      uColorTop: { value: new THREE.Color("#ffe082") }, // More prominent bright gold
      uColorMid: { value: new THREE.Color("#ff9800") }, // Vibrant amber
      uColorBottom: { value: new THREE.Color("#e65100") }, // Deep vibrant copper
    }),
    []
  );

  useFrame(({ clock }) => {
    const pts = pointsRef.current;
    if (!pts) return;

    const pos = pts.geometry.attributes.position;
    const heightAttr = pts.geometry.attributes.aHeight;
    const t = clock.getElapsedTime();
    const p = phaseRef.current;

    const speedMul = p === 0 ? 0.35 : p === 1 ? 0.9 : p === 2 ? 1.5 : 1.1;
    const rightBias = p === 3 ? 0.005 : 0;
    const maxR = ORB_RADIUS * 0.76;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      const noiseX =
        Math.sin(t * 1.3 * speedMul + i * 0.8) * 0.003 * speedMul;
      const noiseY =
        Math.cos(t * 1.1 * speedMul + i * 1.2) * 0.003 * speedMul;
      const noiseZ =
        Math.sin(t * 0.9 * speedMul + i * 0.6) * 0.0025 * speedMul;

      const swirlAngle = t * 0.6 * speedMul;
      const swirlX = Math.cos(swirlAngle + i * 0.08) * 0.0018 * speedMul;
      const swirlZ = Math.sin(swirlAngle + i * 0.08) * 0.0018 * speedMul;

      const gravity = -0.0004 * speedMul;

      x += velocities[i * 3] * speedMul + noiseX + swirlX + rightBias;
      y += velocities[i * 3 + 1] * speedMul + noiseY + gravity;
      z += velocities[i * 3 + 2] * speedMul + noiseZ + swirlZ;

      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist > maxR) {
        const scale = maxR / dist;
        x *= scale * 0.96;
        y *= scale * 0.96;
        z *= scale * 0.96;
        velocities[i * 3] *= -0.45;
        velocities[i * 3 + 1] *= -0.45;
        velocities[i * 3 + 2] *= -0.45;
      }

      pos.setXYZ(i, x, y, z);
      (heightAttr as THREE.BufferAttribute).setX(
        i,
        (y / ORB_RADIUS + 1.0) * 0.5
      );
    }

    pos.needsUpdate = true;
    heightAttr.needsUpdate = true;

    pts.rotation.y = t * 0.18 * speedMul;
    pts.rotation.x = Math.sin(t * 0.25) * 0.08;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aHeight" args={[heights, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={sandVertexShader}
        fragmentShader={sandFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

function GlassShell({ phase }: { phase: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const specRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const halo = haloRef.current;
    const spec = specRef.current;
    if (!mesh) return;

    const t = clock.getElapsedTime();
    const p = phaseRef.current;
    const speedMul = p === 0 ? 0.35 : p === 1 ? 0.9 : p === 2 ? 1.5 : 1.1;

    mesh.rotation.y = t * 0.18 * speedMul;
    mesh.rotation.x = Math.sin(t * 0.25) * 0.08;
    mesh.rotation.z = Math.sin(t * 0.3) * 0.04;

    const emissiveBase =
      p === 0 ? 0.05 : p === 1 ? 0.15 : p === 2 ? 0.25 : 0.15;
    const emissivePulse = Math.sin(t * 2) * 0.05;
    const mat = mesh.material as THREE.MeshPhysicalMaterial;
    mat.emissiveIntensity = emissiveBase + emissivePulse;

    if (halo) {
      const haloScale = p >= 2 ? 1.24 : 1.16;
      const pulse = Math.sin(t * 1.2) * 0.025;
      halo.scale.setScalar(haloScale + pulse);
      halo.rotation.y = -t * 0.1;

      const haloMat = halo.material as THREE.MeshBasicMaterial;
      haloMat.opacity =
        p === 0 ? 0.08 : p === 1 ? 0.15 : p === 2 ? 0.22 : 0.18;
    }

    if (spec) {
      spec.rotation.y = t * 0.18 * speedMul;
      spec.rotation.x = Math.sin(t * 0.25) * 0.08;
    }
  });

  return (
    <>
      {/* Outer glow halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[1.1, 48, 48]} />
        <meshBasicMaterial color="#C7EDE6" transparent opacity={0.1} />
      </mesh>

      {/* Main glass sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[ORB_RADIUS, 64, 64]} />
        <meshPhysicalMaterial
          color="#ffffff"
          emissive="#1F7A8C"
          emissiveIntensity={0.1}
          roughness={0.0}
          metalness={0.1}
          transmission={1.0}
          thickness={2.0}
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          ior={1.5}
          transparent={true}
          opacity={1.0}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Specular highlight ring */}
      <mesh ref={specRef} scale={[ORB_RADIUS * 1.005, ORB_RADIUS * 1.005, ORB_RADIUS * 1.005]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.06}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Inner warm glow core */}
      <mesh>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshBasicMaterial
          color="#e4b980"
          transparent
          opacity={0.12}
        />
      </mesh>
    </>
  );
}

function Scene({ phase }: { phase: number }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[-2.5, 2, 3]} intensity={1.8} color="#ffffff" />
      <pointLight position={[2, 1.5, 2.5]} intensity={1.0} color="#C7EDE6" />
      <pointLight position={[0, -2, 2]} intensity={0.5} color="#e4b980" />
      <pointLight position={[1.5, 2.5, -1]} intensity={0.6} color="#ffffff" />
      <Environment preset="city" />
      <GlassShell phase={phase} />
      <SandFluid phase={phase} />
    </>
  );
}

export default function AgentOrb3D({ phase }: { phase: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.6], fov: 36 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <Scene phase={phase} />
    </Canvas>
  );
}
