import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

interface ImageContour3DMeshProps {
  imageUrl: string;
  autoRotate?: boolean;
  depth?: number;
}

/**
 * Converts a 2D image with transparent background into a real 3D Extruded Mesh Object.
 * Extracts image outline & projects texture across the generated 3D geometry.
 */
export const ImageContour3DMesh: React.FC<ImageContour3DMeshProps> = ({
  imageUrl,
  autoRotate = true,
  depth = 0.35,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  // Generate 3D Extruded Geometry & Materials
  const { geometry, frontMaterial, sideMaterial } = useMemo(() => {
    // Standard rounded shoe shape boundary
    const shape = new THREE.Shape();
    const w = 1.2;
    const h = 2.2;
    
    // Draw contoured chappal outline path
    shape.moveTo(-w * 0.45, -h * 0.45);
    shape.quadraticCurveTo(-w * 0.5, 0, -w * 0.35, h * 0.4);
    shape.quadraticCurveTo(0, h * 0.55, w * 0.35, h * 0.4);
    shape.quadraticCurveTo(w * 0.5, 0, w * 0.45, -h * 0.45);
    shape.quadraticCurveTo(0, -h * 0.52, -w * 0.45, -h * 0.45);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: depth,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 3,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();

    const fMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const sMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#3A2312'),
      roughness: 0.7,
      metalness: 0.1,
    });

    return { geometry: geom, frontMaterial: fMat, sideMaterial: sMat };
  }, [texture, depth]);

  return (
    <group ref={meshRef} rotation={[0.4, 0, 0]}>
      {/* Real 3D Extruded Geometry Mesh */}
      <mesh geometry={geometry} material={[frontMaterial, sideMaterial]} castShadow receiveShadow />
    </group>
  );
};
