import * as THREE from 'three';
// Detach complete wheel branches first, then collect every other attachment into one sprung assembly.
export function createBodyRig(bus){
 bus.updateWorldMatrix(true,true);const suspensions=[];bus.traverse(o=>{if(/^(Front|Rear).*suspension$/i.test(o.name.replaceAll('_',' ')))suspensions.push(o)});
 if(suspensions.length!==4)throw new Error(`Expected four suspension roots, found ${suspensions.length}`);
 for(const wheel of suspensions)bus.attach(wheel);
 const sprung=new THREE.Group();sprung.name='Complete sprung bus assembly';bus.add(sprung);sprung.updateWorldMatrix(true,false);
 for(const child of [...bus.children])if(child!==sprung&&!suspensions.includes(child))sprung.attach(child);
 return {sprung,suspensions,setHeight(y){sprung.position.y=y}};
}
