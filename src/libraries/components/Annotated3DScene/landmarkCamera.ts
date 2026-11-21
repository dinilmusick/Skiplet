import * as THREE from 'three';

export interface LandmarkCameraMove {
  /** Target orbit yaw in radians (overrides default orbit while focused). */
  yaw?: number;
  /** Target orbit pitch in radians. */
  pitch?: number;
  /** Target distance from lookAt point (smaller = zoomed in). */
  radius?: number;
  /** World-space target point to look at (defaults to [0, 0, 0]). */
  lookAt?: readonly [number, number, number];
  /** Optional screen-relative camera pan offset [right, up, forward]. */
  panOffset?: readonly [number, number, number];
  /** Target vertical field of view in degrees. */
  fov?: number;
  /** Exponential damping speed. */
  damping?: number;
}

export interface OrbitCameraState {
  yaw: number;
  pitch: number;
  radius: number;
  fov: number;
}

export interface CameraRigPose {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
}

export const DEFAULT_ORBIT_STATE: Readonly<OrbitCameraState> = {
  yaw: 0.15,
  pitch: 0.12,
  radius: 9,
  fov: 43,
};

/** Computes the desired camera position, lookAt target, and FOV for default or landmark focus. */
export function resolveLandmarkCameraTarget(
  baseOrbit: OrbitCameraState,
  move?: LandmarkCameraMove,
  orbitDragDelta?: { yaw: number; pitch: number },
): CameraRigPose {
  const yaw = (move?.yaw ?? baseOrbit.yaw) + (move ? (orbitDragDelta?.yaw ?? 0) : 0);
  const pitch = THREE.MathUtils.clamp(
    (move?.pitch ?? baseOrbit.pitch) + (move ? (orbitDragDelta?.pitch ?? 0) : 0),
    -1.3,
    1.3,
  );
  const radius = move?.radius ?? baseOrbit.radius;
  const lookAt = new THREE.Vector3(...(move?.lookAt ?? [0, 0, 0]));

  const horiz = Math.cos(pitch) * radius;
  const position = new THREE.Vector3(
    lookAt.x + Math.sin(yaw) * horiz,
    lookAt.y + Math.sin(pitch) * radius,
    lookAt.z + Math.cos(yaw) * horiz,
  );

  if (move?.panOffset) {
    const [rx, uy, fz] = move.panOffset;
    const forward = lookAt.clone().sub(position).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();
    position.addScaledVector(right, rx).addScaledVector(up, uy).addScaledVector(forward, fz);
    lookAt.addScaledVector(right, rx).addScaledVector(up, uy);
  }

  return { position, lookAt, fov: move?.fov ?? baseOrbit.fov };
}

/** Smoothly damps current camera pose toward the resolved target pose. */
export function stepCameraRig(
  current: CameraRigPose,
  target: CameraRigPose,
  dt: number,
  damping = 4.6,
  reducedMotion = false,
) {
  const factor = reducedMotion ? 1 : 1 - Math.exp(-Math.max(0.001, dt) * damping);
  current.position.lerp(target.position, factor);
  current.lookAt.lerp(target.lookAt, factor);
  current.fov = THREE.MathUtils.lerp(current.fov, target.fov, factor);
}
