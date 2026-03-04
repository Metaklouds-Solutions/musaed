"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function deterministic(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function WaveSurface({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const intensity = useRef(0.45);

  const geometryArgs = useMemo(
    () => [24, 16, 64, 42] as [number, number, number, number],
    []
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    const geometry = mesh.geometry as THREE.PlaneGeometry;
    const position = geometry.attributes.position;
    const time = clock.getElapsedTime();

    const targetIntensity = active ? 0.95 : 0.45;
    intensity.current += (targetIntensity - intensity.current) * 0.02;

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const y = position.getY(i);
      const distance = Math.sqrt(x * x + y * y);
      const wave = Math.sin(distance * 1.5 - time * 1.1) * 0.22;
      const pulse = Math.sin(time * 0.6 + distance * 0.45) * 0.12;
      position.setZ(i, (wave + pulse) * intensity.current);
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -2.5, -2]}>
      <planeGeometry args={geometryArgs} />
      <meshStandardMaterial
        color="#1F7A8C"
        wireframe
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}

function DeepParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { points, sizes } = useMemo(() => {
    const total = 400; // Increased for more depth
    const pos = new Float32Array(total * 3);
    const sz = new Float32Array(total);

    for (let i = 0; i < total; i += 1) {
      // Distribute particles in a large 3D volume
      pos[i * 3] = (deterministic(i + 1) - 0.5) * 20; // x
      pos[i * 3 + 1] = (deterministic(i + 77) - 0.5) * 15; // y
      pos[i * 3 + 2] = (deterministic(i + 151) - 0.5) * 20 - 5; // z (depth)
      
      sz[i] = deterministic(i + 42) * 0.08 + 0.02;
    }

    return { points: pos, sizes: sz };
  }, []);

  useFrame(({ clock }) => {
    const pointsObj = pointsRef.current;
    if (!pointsObj) return;
    
    const time = clock.getElapsedTime() * 0.15;
    pointsObj.rotation.y = time;
    pointsObj.rotation.x = Math.sin(time * 0.5) * 0.2;
    
    const position = pointsObj.geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      // Slowly drift particles upwards
      let y = position.getY(i) + 0.01;
      if (y > 7.5) y = -7.5;
      position.setY(i, y);
    }
    position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial 
        color="#C7EDE6" 
        size={0.08} 
        sizeAttenuation 
        transparent 
        opacity={0.4} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Medical Cross Shape
function MedicalCross(props: any) {
  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2} {...props}>
      <group>
        <mesh>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#1F7A8C" transparent opacity={0.6} roughness={0.2} metalness={0.08} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.8, 0.2, 0.2]} />
          <meshStandardMaterial color="#1F7A8C" transparent opacity={0.6} roughness={0.2} metalness={0.08} />
        </mesh>
      </group>
    </Float>
  );
}

// Abstract Pill Shape
function Pill(props: any) {
  return (
    <Float speed={2.5} rotationIntensity={2} floatIntensity={1.5} {...props}>
      <mesh>
        <capsuleGeometry args={[0.15, 0.5, 16, 32]} />
        <meshStandardMaterial color="#C7EDE6" transparent opacity={0.7} roughness={0.1} metalness={0.05} />
      </mesh>
    </Float>
  );
}

// DNA Helix-like abstract element
function AbstractHelix(props: any) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[Math.sin(i * 0.8) * 0.4, (i - 6) * 0.25, Math.cos(i * 0.8) * 0.4]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#1F7A8C" : "#e4b980"} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Abstract DNA Connection Lines
function HelixConnections(props: any) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`conn-${i}`} position={[0, (i - 6) * 0.25, 0]} rotation={[0, -i * 0.8, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
          <meshStandardMaterial color="#C7EDE6" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ active }: { active: boolean }) {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[8, 5, 3]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-5, 2, -2]} intensity={2.0} color="#1F7A8C" />
      <pointLight position={[5, -2, 2]} intensity={1.5} color="#e4b980" />
      
      <WaveSurface active={active} />
      <DeepParticles />
      
      {/* Background Clinical Elements */}
      <MedicalCross position={[-5, 2, -6]} rotation={[0.4, 0.2, 0.1]} scale={1.5} />
      <MedicalCross position={[6, -1, -8]} rotation={[-0.2, 0.5, 0.3]} scale={1.2} />
      <MedicalCross position={[3, 4, -10]} rotation={[0.1, 0.8, -0.2]} scale={0.8} />
      
      <Pill position={[-6, -2, -5]} rotation={[0.5, 0.8, 0.2]} scale={1.2} />
      <Pill position={[4, 3, -6]} rotation={[-0.4, 0.1, 0.6]} scale={1.5} />
      <Pill position={[-2, 5, -8]} rotation={[0.2, -0.5, 0.4]} scale={0.9} />
      
      <AbstractHelix position={[-7, 0, -8]} scale={1.2} />
      <HelixConnections position={[-7, 0, -8]} scale={1.2} rotation={[0, 0, Math.PI / 2]} />
      
      <AbstractHelix position={[7, 2, -10]} scale={0.9} />
      <HelixConnections position={[7, 2, -10]} scale={0.9} rotation={[0, 0, Math.PI / 2]} />
    </>
  );
}

export default function HeroBackground3D({ active }: { active: boolean }) {
  return (
    <Canvas camera={{ position: [0, 2, 8], fov: 45 }} dpr={[1, 1.5]}>
      <fog attach="fog" args={['#F8FAF9', 5, 20]} />
      <Scene active={active} />
    </Canvas>
  );
}
