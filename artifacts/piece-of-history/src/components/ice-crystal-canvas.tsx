import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type GeometryKind = 'octahedron' | 'icosahedron' | 'cube';

type CrystalProps = {
  geometryKind: GeometryKind;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};

function addFrostGradient(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const bounds = geometry.boundingBox;
  const lowerIce = new THREE.Color('#58b4dc');
  const glacierBlue = new THREE.Color('#a9e0f4');
  const snowLight = new THREE.Color('#f5fcff');
  const color = new THREE.Color();
  const height = (bounds?.max.y ?? 1) - (bounds?.min.y ?? -1) || 1;

  for (let index = 0; index < position.count; index += 1) {
    const progress = THREE.MathUtils.clamp(
      (position.getY(index) - (bounds?.min.y ?? -1)) / height,
      0,
      1,
    );

    if (progress < 0.58) {
      color.copy(lowerIce).lerp(glacierBlue, progress / 0.58);
    } else {
      color.copy(glacierBlue).lerp(snowLight, (progress - 0.58) / 0.42);
    }
    color.toArray(colors, index * 3);
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function Crystal({
  geometryKind,
  position,
  rotation,
  scale,
}: CrystalProps) {
  const geometry = useMemo(() => {
    const shape =
      geometryKind === 'icosahedron'
        ? new THREE.IcosahedronGeometry(1, 0)
        : geometryKind === 'cube'
          ? new THREE.BoxGeometry(1, 1, 1)
          : new THREE.OctahedronGeometry(1, 0);
    return addFrostGradient(shape);
  }, [geometryKind]);
  const edgeGeometry = useMemo(
    () => new THREE.EdgesGeometry(geometry, 1),
    [geometry],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      edgeGeometry.dispose();
    },
    [edgeGeometry, geometry],
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          vertexColors
          flatShading
          transparent
          opacity={0.86}
          roughness={0.2}
          metalness={0.04}
          clearcoat={0.9}
          clearcoatRoughness={0.16}
          depthWrite={false}
        />
      </mesh>
      <lineSegments geometry={edgeGeometry} scale={1.006}>
        <lineBasicMaterial
          color="#effbff"
          transparent
          opacity={0.68}
          depthWrite={false}
        />
      </lineSegments>
      <mesh geometry={geometry} scale={0.72} rotation={[0.18, 0.38, 0.12]}>
        <meshBasicMaterial
          color="#e9faff"
          wireframe
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function CrystalCluster() {
  const clusterRef = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!clusterRef.current) return;
    const time = clock.elapsedTime;
    clusterRef.current.rotation.y += delta * 0.075;
    clusterRef.current.rotation.x = Math.sin(time * 0.31) * 0.018;
    clusterRef.current.rotation.z = Math.sin(time * 0.36) * 0.025;
    clusterRef.current.position.y = Math.sin(time * 0.5) * 0.05;
  });

  return (
    <group ref={clusterRef}>
      <ambientLight intensity={1.2} />
      <directionalLight
        position={[-3, 4, 5]}
        intensity={2.5}
        color="#ffffff"
      />
      <pointLight position={[2.5, 1.5, 2]} intensity={2.8} color="#88d7fa" />
      <pointLight position={[-2, -1, 1]} intensity={1.1} color="#d5f4ff" />

      <Crystal
        geometryKind="octahedron"
        position={[-0.68, -0.12, -0.18]}
        rotation={[0.15, 0.28, -0.18]}
        scale={[0.46, 0.82, 0.44]}
      />
      <Crystal
        geometryKind="icosahedron"
        position={[0, 0.12, 0.16]}
        rotation={[0.08, 0.12, 0.06]}
        scale={[0.58, 1.12, 0.55]}
      />
      <Crystal
        geometryKind="octahedron"
        position={[0.67, -0.04, -0.24]}
        rotation={[-0.12, -0.26, 0.2]}
        scale={[0.4, 0.7, 0.4]}
      />
      <Crystal
        geometryKind="cube"
        position={[0.52, -0.63, 0.36]}
        rotation={[0.34, 0.52, 0.16]}
        scale={[0.43, 0.43, 0.43]}
      />

      <mesh position={[0, -0.78, -0.08]} scale={[1.24, 0.13, 0.67]}>
        <sphereGeometry args={[1, 9, 5]} />
        <meshPhysicalMaterial
          color="#c8efff"
          transparent
          opacity={0.2}
          roughness={0.28}
          metalness={0.04}
          clearcoat={0.8}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function IceCrystalCanvas({
  onReady,
}: {
  onReady: () => void;
}) {
  return (
    <Canvas
      className="ice-crystal-canvas-root"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      camera={{ position: [0, 0, 4.8], fov: 36 }}
      dpr={[1, 1.35]}
      frameloop="always"
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        window.requestAnimationFrame(onReady);
      }}
    >
      <CrystalCluster />
    </Canvas>
  );
}