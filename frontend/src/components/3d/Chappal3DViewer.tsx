import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type { LeatherColor, SoleType, BuckleFinish } from '../../types';

interface ProductImages {
  front?: string;
  back?: string;
  left?: string;
  right?: string;
  top?: string;
  sole?: string;
}

interface ChappalMeshProps {
  leatherColor?: LeatherColor;
  soleType?: SoleType;
  buckleFinish?: BuckleFinish;
  autoRotate?: boolean;
  images?: ProductImages;
  model3dUrl?: string;
}

const COLOR_MAP: Record<LeatherColor, string> = {
  'saddle-tan': '#8B5A34',
  'espresso': '#2E1A11',
  'burnt-copper': '#C1602E',
  'mustard-gold': '#C9A24B',
  'midnight-black': '#1A1817',
  'vintage-tan': '#A46E45',
};

const BUCKLE_MAP: Record<BuckleFinish, { color: string; metalness: number; roughness: number }> = {
  'aged-brass': { color: '#C9A24B', metalness: 0.9, roughness: 0.25 },
  'burnt-copper': { color: '#C1602E', metalness: 0.85, roughness: 0.3 },
  'antique-silver': { color: '#D1D5DB', metalness: 0.95, roughness: 0.2 },
  'matte-black': { color: '#262626', metalness: 0.5, roughness: 0.7 },
};

const SOLE_COLOR_MAP: Record<SoleType, string> = {
  'tire-recycled': '#171717',
  'double-leather': '#4A2E1B',
  'cushioned-foam': '#292524',
  'traditional-raw': '#654321',
};

// GLTF 3D Model Renderer
const GltfModel: React.FC<{ url: string; autoRotate?: boolean }> = ({ url, autoRotate = true }) => {
  const gltf = useLoader(GLTFLoader, url);
  const modelRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={modelRef}>
      <primitive object={gltf.scene} scale={1.5} position={[0, -0.2, 0]} />
    </group>
  );
};

// Dynamic Image Texture Applier for 3D Mesh Parts
const TextureMeshPart: React.FC<{
  imageUrl?: string;
  fallbackMaterial: THREE.Material;
  children: (material: THREE.Material) => React.ReactNode;
}> = ({ imageUrl, fallbackMaterial, children }) => {
  const loadedTexture = useLoader(
    THREE.TextureLoader,
    imageUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  );

  const material = useMemo(() => {
    if (imageUrl && loadedTexture) {
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.wrapS = THREE.RepeatWrapping;
      loadedTexture.wrapT = THREE.RepeatWrapping;
      return new THREE.MeshStandardMaterial({
        map: loadedTexture,
        roughness: 0.35,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
    }
    return fallbackMaterial;
  }, [imageUrl, loadedTexture, fallbackMaterial]);

  return <>{children(material)}</>;
};

const ChappalMesh: React.FC<ChappalMeshProps> = ({
  leatherColor = 'saddle-tan',
  soleType = 'tire-recycled',
  buckleFinish = 'aged-brass',
  autoRotate = true,
  images,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  const upperFallbackMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(COLOR_MAP[leatherColor] || COLOR_MAP['saddle-tan']),
      roughness: 0.4,
      metalness: 0.1,
    });
  }, [leatherColor]);

  const soleFallbackMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(SOLE_COLOR_MAP[soleType] || SOLE_COLOR_MAP['tire-recycled']),
      roughness: 0.85,
      metalness: 0.05,
    });
  }, [soleType]);

  const buckleSpec = BUCKLE_MAP[buckleFinish] || BUCKLE_MAP['aged-brass'];
  const buckleMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(buckleSpec.color),
      roughness: buckleSpec.roughness,
      metalness: buckleSpec.metalness,
    });
  }, [buckleFinish]);

  const frontImg = images?.front;
  const topImg = images?.top || images?.front;
  const soleImg = images?.sole;

  return (
    <group ref={groupRef} position={[0, -0.1, 0]} rotation={[0.2, -0.4, 0]}>
      {/* Base Sole - Authentic Oval Chappal Shape with Sole Texture */}
      <React.Suspense fallback={null}>
        <TextureMeshPart imageUrl={soleImg} fallbackMaterial={soleFallbackMaterial}>
          {(mat) => (
            <mesh position={[0, 0, 0]} material={mat} castShadow receiveShadow>
              <cylinderGeometry args={[0.9, 0.95, 0.12, 32]} />
            </mesh>
          )}
        </TextureMeshPart>
      </React.Suspense>

      {/* Cushioned Insole Leather Layer with Top Product Texture */}
      <React.Suspense fallback={null}>
        <TextureMeshPart imageUrl={topImg} fallbackMaterial={upperFallbackMaterial}>
          {(mat) => (
            <mesh position={[0, 0.07, 0]} material={mat} castShadow>
              <cylinderGeometry args={[0.88, 0.88, 0.04, 32]} />
            </mesh>
          )}
        </TextureMeshPart>
      </React.Suspense>

      {/* Heel Cup & Raised Rim */}
      <React.Suspense fallback={null}>
        <TextureMeshPart imageUrl={frontImg} fallbackMaterial={upperFallbackMaterial}>
          {(mat) => (
            <mesh position={[0, 0.15, -0.55]} rotation={[0.3, 0, 0]} material={mat} castShadow>
              <cylinderGeometry args={[0.65, 0.68, 0.18, 16, 1, false, 0, Math.PI]} />
            </mesh>
          )}
        </TextureMeshPart>
      </React.Suspense>

      {/* Front Toe Cap Guard (Signature Peshawari High Curve) with Front Product Texture */}
      <React.Suspense fallback={null}>
        <TextureMeshPart imageUrl={frontImg} fallbackMaterial={upperFallbackMaterial}>
          {(mat) => (
            <mesh position={[0, 0.22, 0.55]} rotation={[-0.45, 0, 0]} material={mat} castShadow>
              <cylinderGeometry args={[0.6, 0.65, 0.25, 16, 1, false, 0, Math.PI]} />
            </mesh>
          )}
        </TextureMeshPart>
      </React.Suspense>

      {/* Main Diagonal T-Strap Cross Over with Upper Product Texture */}
      <React.Suspense fallback={null}>
        <TextureMeshPart imageUrl={frontImg} fallbackMaterial={upperFallbackMaterial}>
          {(mat) => (
            <>
              <mesh position={[-0.15, 0.24, 0.1]} rotation={[0.2, -0.3, 0.3]} material={mat} castShadow>
                <boxGeometry args={[1.1, 0.05, 0.35]} />
              </mesh>
              <mesh position={[0.15, 0.26, 0.1]} rotation={[0.2, 0.3, -0.3]} material={mat} castShadow>
                <boxGeometry args={[1.1, 0.05, 0.35]} />
              </mesh>
            </>
          )}
        </TextureMeshPart>
      </React.Suspense>

      {/* Back Ankle Strap */}
      <mesh position={[0, 0.25, -0.45]} rotation={[0.1, 0, 0]} material={upperFallbackMaterial} castShadow>
        <torusGeometry args={[0.65, 0.035, 16, 32, Math.PI]} />
      </mesh>

      {/* Handcrafted Solid Buckle Hardware */}
      <mesh position={[0.55, 0.26, -0.2]} rotation={[0, Math.PI / 2, 0]} material={buckleMaterial} castShadow>
        <boxGeometry args={[0.18, 0.14, 0.04]} />
      </mesh>
      <mesh position={[0.55, 0.26, -0.2]} rotation={[0, Math.PI / 2, 0]} material={buckleMaterial}>
        <cylinderGeometry args={[0.015, 0.015, 0.16, 8]} />
      </mesh>
    </group>
  );
};

export const Chappal3DViewer: React.FC<{
  leatherColor?: LeatherColor;
  soleType?: SoleType;
  buckleFinish?: BuckleFinish;
  autoRotate?: boolean;
  className?: string;
  images?: ProductImages;
  model3dUrl?: string;
}> = ({
  leatherColor = 'saddle-tan',
  soleType = 'tire-recycled',
  buckleFinish = 'aged-brass',
  autoRotate = true,
  className = 'h-80 w-full',
  images,
  model3dUrl,
}) => {
  return (
    <div className={`relative ${className}`}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.8, 3.8], fov: 45 }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[5, 8, 5]} intensity={1.8} castShadow shadow-mapSize={1024} />
        <directionalLight position={[-5, 3, -3]} intensity={0.7} color="#93C5FD" />
        <pointLight position={[0, -2, 2]} intensity={0.5} color="#3B82F6" />

        <Stage environment="city" intensity={0.6} adjustCamera={false}>
          {model3dUrl ? (
            <React.Suspense fallback={
              <ChappalMesh
                leatherColor={leatherColor}
                soleType={soleType}
                buckleFinish={buckleFinish}
                autoRotate={autoRotate}
                images={images}
              />
            }>
              <GltfModel url={model3dUrl} autoRotate={autoRotate} />
            </React.Suspense>
          ) : (
            <ChappalMesh
              leatherColor={leatherColor}
              soleType={soleType}
              buckleFinish={buckleFinish}
              autoRotate={autoRotate}
              images={images}
            />
          )}
        </Stage>

        <OrbitControls
          enableZoom={true}
          minDistance={2.4}
          maxDistance={5.5}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          enablePan={false}
          rotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
};
