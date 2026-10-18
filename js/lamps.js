import * as THREE from 'three';
export function createLamps(bus){
 const head=[],rear=[];bus.updateWorldMatrix(true,true);const intoBus=bus.matrixWorld.clone().invert();
 bus.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];const mapped=mats.map(m=>{if(!m||!['Headlamp lenses','Red lenses'].includes(m.name))return m;const clone=m.clone();clone.emissive=new THREE.Color(m.name==='Red lenses'?0xff2818:0xffedce);(m.name==='Red lenses'?rear:head).push(clone);return clone;});o.material=Array.isArray(o.material)?mapped:mapped[0];
 if(mats.length===1&&mats[0].name==='Red lenses'){const marker=mapped[0].clone();marker.emissiveIntensity=.22;o.geometry=o.geometry.clone();o.geometry.clearGroups();const pos=o.geometry.attributes.position,idx=o.geometry.index,transform=intoBus.clone().multiply(o.matrixWorld),v=new THREE.Vector3();const count=idx?idx.count:pos.count;
 let start=0,last=-1;for(let i=0;i<count;i+=3){v.fromBufferAttribute(pos,idx?idx.getX(i):i).applyMatrix4(transform);const material=v.y<2.1?0:1;if(material!==last){if(i>start)o.geometry.addGroup(start,i-start,last);start=i;last=material;}}if(count>start)o.geometry.addGroup(start,count-start,last);o.material=[mapped[0],marker];}
 });
 const group=new THREE.Group();bus.add(group);
 for(const side of [-1,1]){const light=new THREE.SpotLight(0xffefd8,95,44,.35,.65,1.5);light.position.set(-6.23,.97,side*.95);light.target.position.set(-28,.02,side*2.1);group.add(light,light.target);}
 function update(braking=false){head.forEach(m=>m.emissiveIntensity=.65);rear.forEach(m=>m.emissiveIntensity=braking?2.4:.22);}
 update();return {update};
}
