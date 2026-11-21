import * as THREE from 'three';

// The camera never orbits the world; only the Z-oriented sphere assembly turns.
// Expand the framing on narrow screens so the 3D title remains fully readable.
export function applySphereCamera(camera: THREE.PerspectiveCamera, width: number, height: number) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
  const fitDistance = 8.4 / (2 * Math.tan(halfFov) * aspect);
  const baseZ = Math.max(8.5, fitDistance * 0.5);
  camera.userData.baseZ = baseZ;
  camera.position.set(0, 0, baseZ);
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

/** Smooth view panning combined with subtle natural cinema-rig wiggle by default. */
export function focusCameraView(
  camera: THREE.PerspectiveCamera,
  viewIndex: number,
  dt: number,
  elapsed: number,
  reduced: boolean,
) {
  const side = viewIndex === 0 ? 0 : viewIndex % 2 ? 1 : -1;
  const viewX = side * Math.min(1.1, 0.55 + Math.floor(viewIndex / 2) * 0.18);
  const viewY = viewIndex === 0 ? 0 : (Math.floor((viewIndex - 1) / 2) - 1) * 0.34;
  const baseZ = typeof camera.userData.baseZ === 'number' ? camera.userData.baseZ : camera.position.z;

  // Multi-harmonic organic breathing wiggle (gentle, Steadicam-like, non-dizzying)
  const wx = reduced ? 0 : Math.sin(elapsed * 0.43) * 0.14 + Math.sin(elapsed * 0.97 + 1.1) * 0.045;
  const wy = reduced ? 0 : Math.cos(elapsed * 0.37 + 0.6) * 0.10 + Math.sin(elapsed * 0.83) * 0.035;
  const wz = reduced ? 0 : Math.sin(elapsed * 0.29 + 2.1) * 0.18;

  const factor = reduced ? 1 : 1 - Math.exp(-dt * 3.2);
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, viewX + wx, factor);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, viewY + wy, factor);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, baseZ + wz, factor);

  const roll = reduced ? 0 : Math.sin(elapsed * 0.31) * 0.008;
  camera.up.set(roll, 1, 0);
  camera.lookAt(camera.position.x * 0.35, camera.position.y * 0.35, 0);
}
