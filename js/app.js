import {prepareCafe} from './cafe-materials.js';
import {carouselTravel,clonePreviewMaterial} from './carousel.js';
import * as THREE from 'three';
import {createAssetCache,carouselPositions} from './preload.js';
import {createTilt} from './motion.js';
import {createWrapTransition} from './wrap-transition.js';
import {makeDrive} from './drive.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
const wraps=[
 ['Mike Bennett','Warm Cutouts',['#e1b95b','#744c29','#db6043']],['Mike Bennett','Twilight Friends',['#276c6c','#dcb16c','#719081']],
 ['Saleam','Black & White',['#e9e7df','#232c2d','#ec5a25']],['Saleam','Turquoise & Ochre',['#3a9c9e','#d6a440','#ec5a25']],
 ['Bleached by Josh','Charcoal / Gold',['#2b3030','#bd9655','#d8bd8c']],['Bleached by Josh','Slate / Blush',['#4f6573','#d7b6a9','#eee2d7']],['Bleached by Josh','Forest / Cream',['#314b40','#baa775','#e4d9bc']],
 ['Fleet','TriMet',['#075699','#ec5a25','#f5f1e5']],['Fleet','Neutral',['#92999e','#cbd0d0','#393e3f']]
];
const instagram=['mikebennettart','mikebennettart','saleam108','saleam108','bleachedbyjosh','bleachedbyjosh','bleachedbyjosh'];
const $=id=>document.getElementById(id),canvas=$('viewer'),stage=$('viewport');
let renderer,scene,camera,controls,bus,wrapMaterial,filmMaterial,rackMaterial,active=0,requested=0,requestId=0;
let wipe,currentArt=null,carouselBusy=false,carouselQueue=[],viewName="hero";let autoSpin=true,lastFrame=0;let drive;let dirty=true;const rackMaps=new Map();const previews=new Map();let portalNext=null;const loader=new THREE.TextureLoader(),filmMasks=[];
const fail=e=>{$('loading').hidden=true;$('error').hidden=false;$('errorText').textContent=e.message||'The 3D assets could not be loaded. Please refresh and try again.';console.error(e)};
function texture(url,color=true){return loader.loadAsync(url).then(t=>{t.flipY=false;t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t})}
const assets=createAssetCache(async i=>{const rackId=i===7?7:i===8?8:0;if(!rackMaps.has(rackId))rackMaps.set(rackId,texture(`assets/rack-${rackId}.png`));const [map,mask,rackMap]=await Promise.all([texture(`assets/wrap-${i}.webp`),i<2?(filmMasks[i]??=texture(`assets/film-${i}.png`,false)):null,rackMaps.get(rackId)]);return {map,mask,rackMap}},async data=>{for(const tex of [data.map,data.mask,data.rackMap])if(tex)renderer.initTexture(tex)});
async function getWrap(i){return (await assets.get(i)).map}
function preview(i,data){if(previews.has(i))return previews.get(i);const root=bus.parent.parent.clone(true),materials=new Set();root.position.set(0,0,0);root.rotation.set(0,0,0);let w=wrapMaterial.clone(),f=filmMaterial.clone();w.map=data.map;f.map=data.map;f.alphaMap=null;materials.add(w);materials.add(f);const lights=[];root.traverse(o=>{if(o.isLight)lights.push(o);if(!o.isMesh)return;const type=o.userData.web_surface;if(type==='wrap')o.material=w;else if(type==='film'){o.material=f;o.visible=i<2}else{o.material=Array.isArray(o.material)?o.material.map(clonePreviewMaterial):clonePreviewMaterial(o.material);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if(m.userData.isRack){m.map=data.rackMap;m.color.set(i===2||i===3?0xec5a25:0xffffff)}}}});lights.forEach(o=>o.removeFromParent());const transition=createWrapTransition(root,w,f);transition.set(data,data,1);root.visible=false;scene.add(root);const result={root,materials,transition};previews.set(i,result);return result;}
async function prepareGarage(){const ids=[active,(active+8)%9,(active+1)%9];await Promise.all(ids.map(async i=>{const data=await assets.get(i);const p=preview(i,data);p.root.visible=true;p.root.position.set(10000,0,0);await renderer.compileAsync(p.root,camera,scene);p.root.visible=false;p.root.position.set(0,0,0)}));for(const [i,p] of previews)if(!ids.includes(i)){scene.remove(p.root);p.materials.forEach(m=>m.dispose());p.transition.dispose();previews.delete(i)}assets.retain([...ids,...(portalNext===null?[]:[portalNext])]);}
function clearPreviews(){for(const p of previews.values()){scene.remove(p.root);p.materials.forEach(m=>m.dispose());p.transition.dispose()}previews.clear();}
async function returnGarage(){for(const id of ['previous','next','start'])$(id).disabled=true;try{await prepareGarage()}finally{for(const id of ['previous','next','start'])$(id).disabled=false;mark()}}
function preloadPortal(i){portalNext=i;return assets.get(i).catch(()=>null)}
function setAutoSpin(value){autoSpin=value;$('auto-rotate').setAttribute('aria-pressed',String(value));mark()}
function mark(){dirty=true}
function fit(){const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();if(bus&&!drive?.driving)frameBus();mark()}
const positions={hero:[-10,5.2,12],side:[0,2.8,16],rear:[13,3.4,4]};
function frameBus(){const center=new THREE.Vector3(0,1.35,0),direction=camera.position.clone().sub(controls.target).normalize();const vertical=THREE.MathUtils.degToRad(camera.fov)/2,horizontal=Math.atan(Math.tan(vertical)*camera.aspect);const distance=7.2/Math.sin(Math.min(vertical,horizontal)) * 1.05;controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);controls.maxDistance=Math.max(55,distance*1.5);camera.far=Math.max(100,distance+60);scene.fog.near=distance+15;scene.fog.far=distance+60;camera.updateProjectionMatrix();controls.update();}
function view(name){viewName=name;drive?.setShowcaseAngle(0);camera.position.fromArray(positions[name]||positions.hero);controls.target.set(0,1.35,0);frameBus();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));mark()}
function animate(duration,update){return new Promise(resolve=>{let start;function frame(t){start??=t;const progress=Math.min(1,(t-start)/duration);update(progress);mark();if(progress<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});}
function garageOffset(amount){const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);drive.setGarageOffset(right.multiplyScalar(amount));}
async function navigate(direction){if(drive?.driving)return;carouselQueue.push(direction);if(carouselBusy)return;carouselBusy=true;document.body.classList.add('carousel-active');$('start').disabled=true;controls.enabled=false;document.querySelectorAll('[data-view],#reset,#auto-rotate').forEach(b=>b.disabled=true);
 try{while(carouselQueue.length){const dir=carouselQueue.shift(),index=(active+dir+wraps.length)%wraps.length;await assets.get(index);await choose(index,{slide:dir});await prepareGarage();}}
 finally{garageOffset(0);carouselBusy=false;controls.enabled=true;$('start').disabled=false;document.querySelectorAll('[data-view],#reset,#auto-rotate').forEach(b=>b.disabled=false);document.body.classList.remove('carousel-active');mark();}}
async function choose(i,options={}){i=(i+wraps.length)%wraps.length;requested=i;const token=++requestId;$('wrap').value=i;$('loadText').textContent='Loading '+wraps[i][1]+'…';$('loading').hidden=Boolean(options.slide||options.portal);try{
 const {map,mask,rackMap}=await assets.get(i);
 if(token!==requestId)return;
 const nextArt={map,mask,rackMap},previousArt=currentArt||nextArt;
 let outgoing=null,travel=0;if(options.slide){outgoing=preview(active,previousArt.rackMap?previousArt:{...previousArt,rackMap:rackMaterial.map});outgoing.root.rotation.copy(bus.parent.parent.rotation);outgoing.root.visible=true;outgoing.root.position.set(0,0,0);travel=carouselTravel(outgoing.root,camera);garageOffset(options.slide*travel);}
 wipe.set(previousArt,nextArt,options.portal?0:1);wrapMaterial.map=map;wrapMaterial.needsUpdate=true;filmMaterial.map=map;filmMaterial.alphaMap=null;filmMaterial.needsUpdate=true;bus.traverse(o=>{if(o.userData.web_surface==='film')o.visible=i<2||(options.portal&&Boolean(previousArt.mask))});active=i;if(rackMaterial){rackMaterial.map=rackMap;rackMaterial.color.set(i===2||i===3?0xec5a25:0xffffff);rackMaterial.needsUpdate=true;}
 $('artist').textContent=wraps[i][0].toUpperCase();$('artist-credit').hidden=i>=7;const social=$('artist-instagram');social.hidden=i>=7;if(i<7){social.href='https://www.instagram.com/'+instagram[i]+'/';social.setAttribute('aria-label',wraps[i][0]+' on Instagram (opens in new tab)');}else social.removeAttribute('href');$('artwork').textContent=wraps[i][1];$('count').textContent=String(i+1).padStart(2,'0')+' / 09';$('swatches').replaceChildren(...wraps[i][2].map(c=>{const e=document.createElement('i');e.style.background=c;return e}));$('status').textContent=wraps[i][0]+' — '+wraps[i][1];$('loading').hidden=true;
 if(options.portal)await animate(1050,t=>{if(token===requestId)wipe.progress(t)});
 if(token!==requestId)return;
 currentArt=nextArt;wipe.set(nextArt,nextArt,1);bus.traverse(o=>{if(o.userData.web_surface==='film')o.visible=i<2});
 if(options.slide){const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);await animate(520,t=>{const pos=carouselPositions(options.slide,travel,t);garageOffset(pos.incoming);outgoing.root.position.copy(right).multiplyScalar(pos.outgoing);});outgoing.root.visible=false;outgoing.root.position.set(0,0,0);}
 if(!options.slide&&drive?.driving)assets.retain([i,...(portalNext===null?[]:[portalNext])]);mark();
 }catch(e){if(token===requestId)fail(new Error('This wrap could not be loaded. Check your connection and try again.'))}}
async function init(){
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.90;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 scene=new THREE.Scene();scene.background=new THREE.Color('#e8eae5');scene.fog=new THREE.Fog('#e8eae5',28,65);
 camera=new THREE.PerspectiveCamera(38,1,.05,100);controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=3.2;controls.maxDistance=28;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,1.25,0);controls.addEventListener('change',mark);
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=.65;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xf4f6ff,0x89968a,1.65));const sun=new THREE.DirectionalLight(0xffffff,1.1);sun.position.set(-5,11,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:35});sun.shadow.bias=-.0002;sun.shadow.normalBias=.025;scene.add(sun);
 const fill=new THREE.DirectionalLight(0xe6edff,.85);fill.position.set(4,5,-8);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600),new THREE.MeshStandardMaterial({color:'#d9ded4',roughness:.8}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
 wrapMaterial=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.52,metalness:0,clearcoat:.025,clearcoatRoughness:.4,envMapIntensity:.55});
 const glass=new THREE.MeshPhysicalMaterial({color:0xf4fcfa,roughness:0,metalness:0,transmission:.98,thickness:0,ior:1.45,envMapIntensity:.7,side:THREE.DoubleSide});
 filmMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.48,transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide,alphaTest:.035});
 filmMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',`#include <alphamap_fragment>
#ifdef USE_MAP
vec2 filmCell=vMapUv*vec2(6200.,1700.);float spread=max(fwidth(filmCell.x),fwidth(filmCell.y));float holes=smoothstep(.26,.32,length(fract(filmCell)-.5));float filmInk=mix(holes,.72,smoothstep(.4,1.5,spread));diffuseColor.a*=filmInk;
if(!gl_FrontFacing)diffuseColor.rgb*=.08;
#endif`)};
 bus=(await new GLTFLoader().loadAsync('assets/bus.glb')).scene;bus.traverse(o=>{if(!o.isMesh)return;const type=o.userData.web_surface;
 if(o.material?.name?.startsWith('Rack sign')){rackMaterial??=new THREE.MeshStandardMaterial({roughness:.5});rackMaterial.userData.isRack=true;o.material=rackMaterial;}
 if(type==='wrap')o.material=wrapMaterial;else if(type==='film'){o.material=filmMaterial;o.renderOrder=2;o.visible=false}else if(type==='glass'){o.material=glass;o.renderOrder=1}
 o.castShadow=type!=='glass'&&type!=='film';o.receiveShadow=type!=='glass';
 });scene.add(bus);wipe=createWrapTransition(bus,wrapMaterial,filmMaterial);fit();view('hero');await choose(Math.floor(Math.random()*8));const rosette=await new THREE.TextureLoader().loadAsync('assets/trimet-rosette.png');rosette.colorSpace=THREE.SRGBColorSpace;const tiltSteering=createTilt({button:$('tilt-enable'),calibrate:$('tilt-calibrate'),status:$('tilt-status')});$('loading').hidden=false;$('loadText').textContent='Preparing the café…';const cafeModel=(await new GLTFLoader().loadAsync('assets/cafe.glb')).scene;prepareCafe(cafeModel,renderer);cafeModel.traverse(o=>{if(o.isMesh)for(const value of Object.values(o.material))if(value?.isTexture)renderer.initTexture(value)});await renderer.compileAsync(cafeModel,camera,scene);$('loading').hidden=true;drive=makeDrive({cafeModel,scene,bus,camera,controls,sun,floor,choose,view,mark,rosette,tiltSteering,preloadPortal,onGarage:returnGarage,onDriveStart:clearPreviews});await prepareGarage();$('start').disabled=false;$('previous').disabled=false;$('next').disabled=false;
 controls.addEventListener('start',()=>setAutoSpin(false));$('auto-rotate').onclick=()=>setAutoSpin(!autoSpin);
 new ResizeObserver(fit).observe(stage);renderer.setAnimationLoop(t=>{const dt=lastFrame?Math.min((t-lastFrame)/1000,.05):0;lastFrame=t;if(document.hidden)return;if(!drive.driving&&autoSpin&&!carouselBusy){drive.rotateShowcase(dt*.11);dirty=true;}if(drive.update(t))dirty=true;if(!drive.driving)controls.update();if(dirty){renderer.render(scene,camera);dirty=false}});
 $('previous').onclick=()=>navigate(-1);$('next').onclick=()=>navigate(1);$('wrap').onchange=e=>choose(Number(e.target.value));$('reset').onclick=()=>{setAutoSpin(false);view('hero')};document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{setAutoSpin(false);view(b.dataset.view)});
 canvas.addEventListener('keydown',e=>{if(drive.driving)return;if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1)}if(e.key==='ArrowRight'){e.preventDefault();navigate(1)}if(e.key.toLowerCase()==='r'){setAutoSpin(false);view('hero')}});document.querySelectorAll('#stage button, #viewer').forEach(el=>el.addEventListener('contextmenu',e=>e.preventDefault()));canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(new Error('The graphics context was interrupted. Reload to continue.'))});
 window.wrapStudio={wraps:wraps.map(w=>w[0]+' — '+w[1]),choose,get active(){return active},get renderer(){return renderer},get bus(){return bus},get drive(){return drive}};
}init().catch(fail);
