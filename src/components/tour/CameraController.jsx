// src/components/tour/CameraController.jsx
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three'; // Import Three.js for vector calculations

/**
 * CameraController component updates the user's viewing direction.
 * It's a non-visual component that hooks into the Three.js render loop
 * to continuously get the camera's world direction and pass it to a callback.
 *
 * @param {Object} props - Component props.
 * @param {Function} props.onDirectionChange - Callback function that receives the current camera direction in radians.
 */
function CameraController({ onDirectionChange }) {
  // useThree hook provides access to the Three.js state, including the camera.
  const { camera } = useThree();

  // useFrame hook runs a function on each frame of the render loop.
  // This is where we continuously calculate and update the camera direction.
  useFrame(() => {
    const direction = new THREE.Vector3(); // Create a new 3D vector to store the camera's direction.
    camera.getWorldDirection(direction); // Get the camera's forward direction in world space.

    // Calculate the horizontal angle (yaw) from the direction vector.
    // -Math.atan2(direction.x, direction.z) computes the angle in radians
    // based on the X and Z components of the direction vector.
    // The negative sign and argument order are typical for converting
    // Three.js camera rotations (where +Z is often forward, +X is right)
    // to a more intuitive "north-aligned" compass direction.
    const angle = -Math.atan2(direction.x, direction.z);

    // Call the provided callback with the calculated angle.
    onDirectionChange(angle);
  });

  // This component does not render any visible elements, so it returns null.
  return null;
}

export default CameraController;
