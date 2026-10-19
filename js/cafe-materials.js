import * as THREE from 'three';

/** Configure the imported café without changing the game's lights or renderer.
 * Default clear glass keeps nested windows/cases crisp and inexpensive.
 * glassMode: 'physical' uses the bus's transmission settings instead.
 */
export function prepareCafe(root, renderer, { glassMode = 'clear', night = 0 } = {}) {
  const materials = [];
  const anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.material = object.material.clone();
    const material = object.material;
    materials.push(material);
    for (const key of ['map', 'aoMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) {
      if (material[key]) material[key].anisotropy = anisotropy;
    }
    const isGlass = material.name === 'Cafe_Glass';
    object.castShadow = !isGlass;
    object.receiveShadow = !isGlass;
    if (isGlass) {
      material.roughness = 0;
      material.metalness = 0;
      material.side = THREE.DoubleSide;
      material.envMapIntensity = 0.7;
      material.ior = 1.45;
      material.thickness = 0;
      const physical = glassMode === 'physical';
      material.transmission = physical ? 0.98 : 0;
      material.transparent = !physical;
      material.opacity = physical ? 1 : 0.12;
      material.depthWrite = physical;
      material.needsUpdate = true;
      object.renderOrder = 1;
    }
  });
  function setNight(value) {
    const t = THREE.MathUtils.clamp(value, 0, 1);
    for (const material of materials) {
      if (['Cafe_Logo_Signs', 'Cafe_Rear_Advertisement'].includes(material.name)) {
        material.emissiveIntensity = THREE.MathUtils.lerp(0.45, 1.5, t);
      } else if (material.name === 'Cafe_LED_Amber') {
        material.emissiveIntensity = THREE.MathUtils.lerp(2, 3, t);
      } else if (material.name === 'Cafe_Warm_Diffusers') {
        material.emissiveIntensity = THREE.MathUtils.lerp(2, 4, t);
      }
    }
  }
  setNight(night);
  return { root, setNight };
}
