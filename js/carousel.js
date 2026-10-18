import * as THREE from 'three';
// Camera-space bounds include perspective depth: every corner must clear the edge.
export function carouselTravel(root,camera,gap=1.2){
 root.updateWorldMatrix(true,true);camera.updateWorldMatrix(true,false);
 const box=new THREE.Box3().setFromObject(root),points=[];
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
 const tanHalf=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect/camera.zoom;
 const xs=points.map(p=>p.x),width=Math.max(...xs)-Math.min(...xs);
 const offscreen=Math.max(...points.map(p=>-p.z*tanHalf+Math.abs(p.x)));
 return Math.max(width+gap,offscreen+.35);
}
export function clonePreviewMaterial(material){
 // Keep opaque seats, rails and body in the opaque pass. Glass/film retain their own flags.
 return material.clone();
}
