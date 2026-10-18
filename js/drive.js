import * as THREE from 'three';
import {resetState,step,RADIUS,damp,BOOST_DURATION,boostEnvelope} from './physics.js';
import {createBodyRig} from './body-rig.js';
import {createLamps} from './lamps.js';
import {createRoute} from './route.js';
export function makeDrive({scene,bus,camera,controls,sun,floor,choose,view,mark,rosette,tiltSteering,preloadPortal,onGarage,onDriveStart}){
 const $=id=>document.getElementById(id),world=new THREE.Group(),vehicle=new THREE.Group(),tilt=new THREE.Group();
 scene.add(world,vehicle);world.visible=false;vehicle.add(tilt);tilt.position.x=3.241;tilt.add(bus);bus.position.x=-3.241;
 const lamps=createLamps(bus),bodyRig=createBodyRig(bus);
 const wheels=[],steers=[];bus.traverse(o=>{if(/wheel.*ROTATE.*Y/i.test(o.name)&&!o.isMesh)wheels.push({o,q:o.quaternion.clone(),angle:0});if(/steering/i.test(o.name)&&!o.isMesh)steers.push({o,q:o.quaternion.clone()})});
 if(wheels.length!==4)throw new Error(`Expected four wheel pivots; found ${wheels.length}`);
 const axle=new THREE.Vector3(0,0,1),up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion();
 const keys=new Set(),touch=new Set(),rings=[];let route,state=resetState(),driving=false,last=0,accumulator=0,wasGas=false,progress=0,toastTime=0,mode=0,portalCount=0,runId=0,tickets=0,kneel=0,rewardTime=0,showcase=0;
 const modes=['Chase','Close chase','High follow','Side tracking','Front three-quarter'];
 const look=new THREE.Vector3(),eye=new THREE.Vector3();scene.add(sun.target);
 function cycle(){mode=(mode+1)%modes.length;$('camera-mode').textContent='Camera: '+modes[mode]+' · C';}
 function clearRings(){for(const r of rings){world.remove(r.mesh);r.mesh.geometry.dispose();r.mesh.material.dispose()}rings.length=0;}
 function resetPose(){bodyRig.setHeight(0);kneel=0;lamps.update(false);tilt.rotation.set(0,0,0);tilt.position.y=0;wheels.forEach(w=>{w.angle=0;w.o.quaternion.copy(w.q)});steers.forEach(w=>w.o.quaternion.copy(w.q));}
 function reset(newRun=false){keys.clear();touch.clear();wasGas=false;accumulator=0;last=0;clearRings();resetPose();
 if(newRun){route?.dispose();route=createRoute(world,Math.random()*0xffffffff,rosette);progress=0;portalCount=0;preloadPortal?.(route.gates[0]?.d.wrap??0);tickets=0;$('tickets').textContent='0';runId++;}
 const p=route.nearest(state.x,state.z);state=resetState(newRun?0:p.x,newRun?0:p.z,newRun?0:p.yaw);vehicle.position.set(state.x,0,state.z);vehicle.rotation.y=state.yaw;$('portal-toast').hidden=true;$('drive-state').textContent='';$('ticket-pop').hidden=true;
 if(newRun){$('line').textContent='BLUE LINE';$('line').style.background='#075699';}cameraFollow(1,true);
 }
 function start(){onDriveStart?.();driving=true;world.visible=true;controls.enabled=false;document.body.classList.add('driving');scene.fog.near=95;scene.fog.far=300;camera.far=450;camera.updateProjectionMatrix();reset(true);$('viewer').focus();mark();}
 function stop(){driving=false;$('viewer').blur?.();tiltSteering?.reset();showcase=0;runId++;keys.clear();touch.clear();clearRings();world.visible=false;vehicle.position.set(0,0,0);vehicle.rotation.set(0,0,0);resetPose();if(floor)floor.position.set(0,-.015,0);controls.enabled=true;document.body.classList.remove('driving','boosting');scene.fog.near=28;scene.fog.far=65;camera.fov=38;camera.updateProjectionMatrix();sun.position.set(-5,11,7);sun.target.position.set(0,0,0);$('portal-toast').hidden=true;view('hero');onGarage?.();}
 $('start').onclick=start;$('garage').onclick=stop;$('respawn').onclick=()=>reset();$('camera-mode').onclick=cycle;
 const aliases={arrowup:'w',arrowdown:'s',arrowleft:'a',arrowright:'d'};
 function key(e,down){let k=e.key.toLowerCase();k=aliases[k]||k;if(!down)keys.delete(k);if(!driving||/INPUT|SELECT|TEXTAREA/.test(e.target?.tagName)||e.target?.isContentEditable)return;
 if(['w','a','s','d',' ','r','c','escape'].includes(k)){e.preventDefault();if(down){keys.add(k);if(!e.repeat){if(k==='escape')stop();if(k==='r')reset();if(k==='c')cycle();}}}
 }
 window.addEventListener('keydown',e=>key(e,true));window.addEventListener('keyup',e=>key(e,false));
 function release(){keys.clear();touch.clear();state.vx=state.vz=0;last=0;accumulator=0;}
 window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);
 document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch.add(b.dataset.key)};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>touch.delete(b.dataset.key)});
 const held=k=>keys.has(k)||touch.has(k);
 function pulse(g){for(let i=0;i<4;i++){const mat=new THREE.MeshBasicMaterial({color:g.d.color,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false});const mesh=new THREE.Mesh(new THREE.RingGeometry(.94,1,64),mat);mesh.rotation.y=Math.PI/2+g.yaw;mesh.position.set(g.x,3,g.z);world.add(mesh);rings.push({mesh,age:-i*.17})}}
 function cross(g){g.passed=true;portalCount++;$('line').textContent=g.d.line+' LINE';$('line').style.background='#'+g.d.color.toString(16).padStart(6,'0');document.body.style?.setProperty('--boost-color','#'+g.d.color.toString(16).padStart(6,'0')+'44');pulse(g);const currentRun=runId;
 Promise.resolve(choose(g.d.wrap,{portal:true})).then(()=>{if(!driving||currentRun!==runId)return;const t=$('portal-toast');t.replaceChildren();const label=document.createElement('span');label.textContent=g.d.line+' LINE · NEW NEIGHBORHOOD';const name=document.createElement('strong');name.textContent=g.d.artist;const title=document.createElement('span');title.textContent=g.d.title;t.append(label,name,title);t.hidden=false;toastTime=3.5;});}
 function cameraFollow(dt,snap=false){const f=new THREE.Vector3(-Math.cos(state.yaw),0,Math.sin(state.yaw)),r=new THREE.Vector3(-Math.sin(state.yaw),0,-Math.cos(state.yaw));const p=vehicle.position;
 const configs=[[-19,8,3,5],[-13,4,1,5],[-22,21,0,10],[0,6,21,0],[16,7,13,0]],c=configs[mode];eye.copy(p).addScaledVector(f,c[0]).addScaledVector(r,c[2]);eye.y=c[1];const framing=Math.max(1,1/Math.max(.35,camera.aspect));eye.sub(p).multiplyScalar(Math.min(framing,2.4)).add(p);const wanted=p.clone().addScaledVector(f,c[3]);wanted.y=2;
 const blend=snap?1:1-Math.exp(-5*dt);camera.position.lerp(eye,blend);look.lerp(wanted,blend);camera.lookAt(look);const fov=(mode===1?48:mode===2?44:42)+(3*boostEnvelope(state.boost));camera.fov=damp(camera.fov,fov,4,dt);camera.updateProjectionMatrix();}
 function reward(amount,label){tickets+=amount;$('tickets').textContent=String(tickets);const el=$('ticket-pop');el.textContent=`+${amount} TICKETS · ${label}`;el.hidden=false;el.classList?.remove('collect');void el.offsetWidth;el.classList?.add('collect');rewardTime=2;}
 function tick(dt){const near=route.nearest(state.x,state.z),oldX=state.x,oldZ=state.z;const input={gas:held('w'),brake:held('s'),turn:held('a')||held('d')?Number(held('a'))-Number(held('d')):(tiltSteering?.read(dt)||0),handbrake:held(' '),wasGas};const distance=step(state,input,dt,near.distance>10);wasGas=input.gas;
 progress=Math.max(progress,near.s);route.ensure(progress);
 let stopped=false;
 for(const stop of route.stops){if(stop.claimed)continue;const dx=state.x-stop.x,dz=state.z-stop.z,along=-dx*Math.cos(stop.yaw)+dz*Math.sin(stop.yaw),across=dx*Math.sin(stop.yaw)+dz*Math.cos(stop.yaw);
 const inBay=Math.abs(along)<6&&across< -5.5&&across> -9.5;
 if(inBay&&Math.hypot(state.vx,state.vz)<.65&&!input.gas){stop.dwell+=dt;stopped=true;if(stop.dwell>1.1){stop.claimed=true;reward(25,'BUS STOP');}}else stop.dwell=0;
 if(!stop.claimed&&along>10&&along<18&&Math.abs(across)<11){stop.claimed=true;reward(5,'ROLLING THROUGH');}
 }
 // Hold the kneel until the driver accelerates, then return to normal ride height.
 if(stopped)kneel=damp(kneel,.10,5,dt);else if(input.gas||Math.abs(state.speed)>1)kneel=damp(kneel,0,5,dt);
 for(const boost of route.boosts){if(boost.claimed)continue;const dx=state.x-boost.x,dz=state.z-boost.z,along=-dx*Math.cos(boost.yaw)+dz*Math.sin(boost.yaw),across=dx*Math.sin(boost.yaw)+dz*Math.cos(boost.yaw);if(Math.abs(along)<4&&Math.abs(across)<4.5){boost.claimed=true;state.boost=BOOST_DURATION;}}
 lamps.update(input.brake||input.handbrake);
 bodyRig.setSuspension(state.bounce,kneel);
 
 for(const g of route.gates){if(g.passed)continue;const fx=-Math.cos(g.yaw),fz=Math.sin(g.yaw),before=(oldX-g.x)*fx+(oldZ-g.z)*fz,after=(state.x-g.x)*fx+(state.z-g.z)*fz;
 if(before<0&&after>=0){const t=-before/(after-before),x=oldX+(state.x-oldX)*t,z=oldZ+(state.z-oldZ)*t;const across=(x-g.x)*Math.sin(g.yaw)+(z-g.z)*Math.cos(g.yaw);if(Math.abs(across)<9)cross(g);}}
 wheels.forEach(w=>{w.angle=(w.angle+distance/RADIUS)%(Math.PI*2);w.o.quaternion.copy(w.q).multiply(q.setFromAxisAngle(axle,w.angle))});steers.forEach(w=>w.o.quaternion.copy(w.q).multiply(q.setFromAxisAngle(up,state.steer)));
 vehicle.position.set(state.x,0,state.z);vehicle.rotation.y=state.yaw;tilt.rotation.z=-state.pitch;tilt.rotation.x=state.roll;tilt.position.y=Math.abs(Math.sin(state.roll))*1.25;
 if(near.distance>65)reset();
 }
 function update(t){if(!driving){last=t;return false}const dt=last?Math.min((t-last)/1000,.1):0;last=t;accumulator+=dt;while(accumulator>=1/120){tick(1/120);accumulator-=1/120;}
 cameraFollow(dt);if(floor)floor.position.set(state.x,-.015,state.z);
 sun.position.copy(vehicle.position).add(new THREE.Vector3(-5,11,7));sun.target.position.copy(vehicle.position);
 $('speed').textContent=String(Math.round(Math.abs(state.speed)*2.237)).padStart(2,'0');$('drive-state').textContent=state.boost>0?'BOOST':state.pitch>.04?'LIFT OFF':state.slip>.45?'SLIDING': '';
 const next=route.gates.find(g=>!g.passed&&g.s>progress-10);if(next&&next!==route.preloadedGate){route.preloadedGate=next;preloadPortal?.(next.d.wrap);}$('mission').textContent=next?`${next.d.artist} · ${Math.max(0,Math.round(next.s-progress))} m ahead`:'Follow the line';
 rewardTime-=dt;if(rewardTime<=0)$('ticket-pop').hidden=true;document.body.classList.toggle?.('boosting',state.boost>0);toastTime-=dt;if(toastTime<=0)$('portal-toast').hidden=true;
 for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.age+=dt;r.mesh.visible=r.age>=0;const scale=2+Math.max(0,r.age)*15;r.mesh.scale.setScalar(scale);r.mesh.material.opacity=Math.max(0,.8*(1-r.age/1.9));if(r.age>1.9){world.remove(r.mesh);r.mesh.geometry.dispose();r.mesh.material.dispose();rings.splice(i,1)}}return true;
 }
 return {setGarageOffset(v){if(!driving)vehicle.position.copy(v)},rotateShowcase(delta){showcase+=delta;vehicle.rotation.y=showcase},setShowcaseAngle(angle){showcase=angle;if(!driving)vehicle.rotation.y=angle},update,start,stop,reset,cycle,get driving(){return driving},get state(){return {...state}},get route(){return route},get diagnostics(){return {tickets,kneel,wheels:wheels.length,steers:steers.length,portalCount,mode:modes[mode],rings:rings.length,chunks:route?.chunkCount}},get wheelAngles(){return wheels.map(w=>w.angle)}};
}
