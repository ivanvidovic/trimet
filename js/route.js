import * as THREE from 'three';
export const districts=[
 {artist:'Mike Bennett',title:'Warm Cutouts',wrap:0,line:'ORANGE',color:0xec5a25,theme:0},
 {artist:'Saleam',title:'Black & White',wrap:2,line:'RED',color:0xc94249,theme:1},
 {artist:'Bleached by Josh',title:'Charcoal / Gold',wrap:4,line:'GREEN',color:0x348263,theme:2},
 {artist:'Mike Bennett',title:'Twilight Friends',wrap:1,line:'BLUE',color:0x1479b8,theme:0},
 {artist:'Saleam',title:'Turquoise & Ochre',wrap:3,line:'YELLOW',color:0xd5a529,theme:1},
 {artist:'Bleached by Josh',title:'Slate / Blush',wrap:5,line:'RED',color:0xc94249,theme:2},
 {artist:'Bleached by Josh',title:'Forest / Cream',wrap:6,line:'GREEN',color:0x348263,theme:2}
];
export function createRoute(world,seed=Math.random()*0xffffffff){
 let randomState=seed>>>0;const rand=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296};
 let points=[{x:25,z:0,yaw:0,s:-25}],chunks=[],gates=[],index=0,target=0;
 const roadMats=[0x075699,...districts.map(d=>d.color)].map(color=>new THREE.MeshStandardMaterial({color,roughness:.9}));
 const white=new THREE.MeshStandardMaterial({color:0xfff2d5});const sharedGeo=new THREE.BoxGeometry(1,1,1);
 const sceneryMats=[0xb7c5a1,0xe2be85,0x698d77,0xe6d9bd,0x343c3d,0xc0a691].map(color=>new THREE.MeshStandardMaterial({color}));
 function cube(g,x,y,z,w,h,d,mat){const m=new THREE.Mesh(sharedGeo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);g.add(m);return m}
 function build(){
 const first=points.at(-1),startS=first.s;const g=new THREE.Group();world.add(g);const verts=[],ids=[];
 for(let i=0;i<=20;i++){
 let p;if(i===0)p=first;else {const prev=points.at(-1);if(index%20===0)target=index<20?0:(rand()-.5)*1.9;const yaw=prev.yaw+Math.max(-.045,Math.min(.045,target-prev.yaw));p={x:prev.x-5*Math.cos(yaw),z:prev.z+5*Math.sin(yaw),yaw,s:prev.s+5};points.push(p);index++;}
 const nx=Math.sin(p.yaw),nz=Math.cos(p.yaw);verts.push(p.x+nx*10,.015,p.z+nz*10,p.x-nx*10,.015,p.z-nz*10);
 if(i<20){const k=i*2;ids.push(k,k+1,k+2,k+1,k+3,k+2)}
 if(i%2===0){const dash=cube(g,p.x,.04,p.z,3,.025,.16,white);dash.rotation.y=p.yaw;}
 if(i%4===0){const theme=districts[Math.max(0,Math.floor((p.s-75)/200))%7].theme;
 for(const side of [-1,1]){const off=side*(16+rand()*9),x=p.x+nx*off,z=p.z+nz*off;const sub=new THREE.Group();sub.position.set(x,0,z);g.add(sub);
 if(theme===0){cube(sub,0,1.5,0,.6,3,.6,sceneryMats[5]);const crown=new THREE.Mesh(new THREE.ConeGeometry(2+rand(),4,7),sceneryMats[2]);crown.position.y=4;sub.add(crown)}
 else if(theme===1){for(let b=0;b<3;b++)cube(sub,b*.8,1+b*1.3,0,3.5,2,3.5,sceneryMats[(b+index)%2?4:3]);sub.rotation.y=rand()*2;}
 else {const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(2,0),sceneryMats[index%3]);rock.position.y=1.6;rock.scale.set(1,1+rand(),1);sub.add(rock);}
 }}
 if(i>0&&p.s>=75&&Math.abs((p.s-75)%200)<.01){const d=districts[Math.floor((p.s-75)/200)%7],gate=new THREE.Group();gate.position.set(p.x,0,p.z);gate.rotation.y=p.yaw;g.add(gate);const mat=new THREE.MeshStandardMaterial({color:d.color,emissive:d.color,emissiveIntensity:.45});cube(gate,0,4,-9,.5,8,.5,mat);cube(gate,0,4,9,.5,8,.5,mat);cube(gate,0,8,0,.5,.5,18.5,mat);gates.push({...p,d,passed:false,group:gate,material:mat});}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(ids);geo.computeVertexNormals();const road=new THREE.Mesh(geo,roadMats[0]);road.material=roadMats[startS<75?0:(Math.floor((startS-75)/200)%7)+1];road.receiveShadow=true;g.add(road);chunks.push({g,end:points.at(-1).s});
 }
 function ensure(progress){while(points.at(-1).s<progress+650)build();while(chunks.length&&chunks[0].end<progress-180){const {g}=chunks.shift();world.remove(g);g.traverse(o=>{if(o.geometry&&o.geometry!==sharedGeo)o.geometry.dispose()});}gates=gates.filter(g=>{if(g.s<progress-180){g.material.dispose();return false}return true});while(points.length>2&&points[1].s<progress-200)points.shift();}
 function nearest(x,z){let best={distance:Infinity};for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));const px=a.x+t*dx,pz=a.z+t*dz,dist=Math.hypot(x-px,z-pz);if(dist<best.distance)best={x:px,z:pz,yaw:b.yaw,s:a.s+t*5,distance:dist};}return best;}
 function dispose(){for(const {g} of chunks){g.traverse(o=>{if(o.geometry&&o.geometry!==sharedGeo)o.geometry.dispose()});world.remove(g)}for(const g of gates)g.material.dispose();sharedGeo.dispose();[...roadMats,white,...sceneryMats].forEach(m=>m.dispose());}
 ensure(0);return {ensure,nearest,dispose,get gates(){return gates},get points(){return points},get chunkCount(){return chunks.length}};
}
