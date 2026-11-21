export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

export interface SpatialParams {
  distance: number;
  proximity: number;
  alignment: number;
  gain: number;
  pan: number;
  cutoffHz: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/** Computes distance attenuation, stereo pan, and filter brightness relative to a camera. */
export function computeSpatialParams(
  cameraPos: Vec3Like,
  cameraRight: Vec3Like,
  cameraForward: Vec3Like,
  sourcePos: Vec3Like,
  maxDistance = 26,
  refDistance = 3.5,
): SpatialParams {
  const dx = sourcePos.x - cameraPos.x;
  const dy = sourcePos.y - cameraPos.y;
  const dz = sourcePos.z - cameraPos.z;
  const distance = Math.hypot(dx, dy, dz);

  if (distance < 1e-5) {
    return { distance: 0, proximity: 1, alignment: 1, gain: 1, pan: 0, cutoffHz: 5600 };
  }

  const inv = 1 / distance;
  const nx = dx * inv;
  const ny = dy * inv;
  const nz = dz * inv;

  const pan = clamp(nx * cameraRight.x + ny * cameraRight.y + nz * cameraRight.z, -0.92, 0.92);
  const forwardDot = nx * cameraForward.x + ny * cameraForward.y + nz * cameraForward.z;
  const alignment = clamp((forwardDot + 1) * 0.5, 0, 1);

  const range = Math.max(0.5, maxDistance - refDistance);
  const rawProximity = 1 - clamp((distance - refDistance) / range, 0, 1);
  const proximity = rawProximity * rawProximity;
  const directionalWeight = 0.38 + 0.62 * Math.pow(alignment, 1.35);
  const gain = clamp(proximity * directionalWeight, 0, 1);
  const cutoffHz = 360 + gain * 4800;

  return { distance, proximity, alignment, gain, pan, cutoffHz };
}
