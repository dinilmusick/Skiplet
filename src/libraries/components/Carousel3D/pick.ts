import * as THREE from 'three';

function findStationIndex(object: THREE.Object3D | null): number | null {
  let curr: THREE.Object3D | null = object;
  while (curr) {
    if (typeof curr.userData.stationIndex === 'number') {
      return curr.userData.stationIndex;
    }
    curr = curr.parent;
  }
  return null;
}

export function attachStagePick(
  dom: HTMLElement,
  camera: THREE.Camera,
  anchors: readonly THREE.Group[],
  getActiveIndex: () => number,
  onOpenDetail: (index: number) => void,
): () => void {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const worldPos = new THREE.Vector3();

  const pickAt = (clientX: number, clientY: number): number | null => {
    const rect = dom.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    camera.updateMatrixWorld();
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(anchors as THREE.Group[], true);
    for (const hit of hits) {
      const idx = findStationIndex(hit.object);
      if (idx !== null) return idx;
    }

    const radius = Math.min(rect.width, rect.height) * 0.24;
    let bestIdx: number | null = null;
    let bestDist = radius;
    const active = getActiveIndex();

    anchors.forEach((anchor, idx) => {
      anchor.getWorldPosition(worldPos);
      worldPos.project(camera);
      if (worldPos.z < -1 || worldPos.z > 1) return;
      const sx = rect.left + (worldPos.x * 0.5 + 0.5) * rect.width;
      const sy = rect.top + (-worldPos.y * 0.5 + 0.5) * rect.height;
      const dist = Math.hypot(clientX - sx, clientY - sy);
      const bias = idx === active ? 0.85 : 1;
      if (dist * bias < bestDist) {
        bestDist = dist * bias;
        bestIdx = idx;
      }
    });
    return bestIdx;
  };

  const onDblClick = (e: MouseEvent) => {
    const idx = pickAt(e.clientX, e.clientY);
    if (idx !== null) onOpenDetail(idx);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.buttons !== 0) return;
    dom.style.cursor = pickAt(e.clientX, e.clientY) !== null ? 'pointer' : 'grab';
  };

  dom.addEventListener('dblclick', onDblClick);
  dom.addEventListener('pointermove', onPointerMove);
  return () => {
    dom.removeEventListener('dblclick', onDblClick);
    dom.removeEventListener('pointermove', onPointerMove);
  };
}
