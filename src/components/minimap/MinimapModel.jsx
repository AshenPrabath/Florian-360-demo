// src/components/minimap/MinimapModel.jsx
import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * SingleModel component loads and displays a single 3D GLTF model.
 */
function SingleModel({ url, opacity = 0.8, isGlass = false }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        if (isGlass) {
          // Create realistic glass material
          child.material = new THREE.MeshPhysicalMaterial({
            // Glass base properties
            color: 0xffffff,
            metalness: 0.0,
            roughness: 0.0,
            
            // Transparency
            transparent: true,
            opacity: 0.15,
            
            // Glass-specific properties
            transmission: 0.9, // How much light passes through
            thickness: 0.5, // Glass thickness for refraction
            
            // Reflectivity
            reflectivity: 0.8,
            
            // Index of refraction (glass ~1.5)
            ior: 1.5,
            
            // Clearcoat for extra glossiness
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
            
            // Subtle blue tint for realistic glass
            attenuationColor: new THREE.Color(0.8, 0.9, 1.0),
            attenuationDistance: 1.0,
            
            // Enable double-sided rendering for glass
            side: THREE.DoubleSide,
            
            // Disable depth write for proper transparency sorting
            depthWrite: false,
          });
        } else {
          // Regular material with transparency
          child.material.transparent = true;
          child.material.opacity = opacity;
        }
      }
    });
  }, [scene, opacity, isGlass]);

  return <primitive object={scene.clone()} position={[0, 0, 0]} scale={[1, 1, 1]} />;
}

/**
 * MinimapModel component loads and displays up to 3 3D GLTF models for the minimap.
 * It also applies a default transparency to the models' materials.
 *
 * @param {Object} props - Component props.
 * @param {string|string[]} props.modelUrl - URL(s) to the GLTF model file(s). Can be a single URL or an array of URLs (max 3).
 * @param {number} props.opacity - Opacity level for the models (default: 0.8).
 * @param {Array} props.position - Position for all models (default: [0, 0, 0]).
 * @param {Array} props.scale - Scale for all models (default: [1, 1, 1]).
 */
function MinimapModel({ modelUrl, opacity = 0.8, position = [0, 0, 0], scale = [1, 1, 1] }) {
  // Handle both single URL and array of URLs
  const modelUrls = Array.isArray(modelUrl) ? modelUrl : [modelUrl];
  
  // Limit to 3 models to avoid dynamic hook calls
  const url1 = modelUrls[0] || null;
  const url2 = modelUrls[1] || null;
  const url3 = modelUrls[2] || null;

  // Render all models at the same location
  return (
    <group position={position} scale={scale}>
      {url1 && <SingleModel url={url1} opacity={opacity} />}
      {url2 && <SingleModel url={url2} opacity={opacity} isGlass={true} />}
      {url3 && <SingleModel url={url3} opacity={opacity} />}
    </group>
  );
}

export default MinimapModel;