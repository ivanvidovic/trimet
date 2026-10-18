import * as THREE from 'three';
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
const $=id=>document.getElementById(id),canvas=$('viewer'),stage=$('stage');
let renderer,scene,camera,controls,bus,wrapMaterial,filmMaterial,rackMaterial,active=0,requested=0,requestId=0;
let autoSpin=true,lastFrame=0;let drive;let dirty=true;const rackMaps=new Map();const cache=new Map(),loader=new THREE.TextureLoader(),filmMasks=[];
const fail=e=>{$('loading').hidden=true;$('error').hidden=false;$('errorText').textContent=e.message||'The 3D assets could not be loaded. Please refresh and try again.';console.error(e)};
function texture(url,color=true){return loader.loadAsync(url).then(t=>{t.flipY=false;t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t})}
async function getWrap(i){if(cache.has(i))return cache.get(i);const p=texture(`assets/wrap-${i}.webp`);cache.set(i,p);try{return await p}catch(e){cache.delete(i);throw e}}
function setAutoSpin(value){autoSpin=value;$('auto-rotate').setAttribute('aria-pressed',String(value));mark()}
function mark(){dirty=true}
function fit(){const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();mark()}
const positions={hero:[-10,5.2,12],side:[0,2.8,16],rear:[13,3.4,4]};
function view(name){drive?.setShowcaseAngle(0);const p=positions[name]||positions.hero;camera.position.fromArray(p);if(camera.aspect<1)camera.position.multiplyScalar(1.4);controls.target.set(0,1.25,0);controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));mark()}
async function choose(i){i=(i+wraps.length)%wraps.length;requested=i;const token=++requestId;$('wrap').value=i;$('loadText').textContent='Loading '+wraps[i][1]+'…';$('loading').hidden=false;try{
 const rackId=i===7?7:i===8?8:0; if(!rackMaps.has(rackId))rackMaps.set(rackId,texture(`assets/rack-${rackId}.png`));
 const [map,mask,rackMap]=await Promise.all([getWrap(i),i<2?(filmMasks[i]??=texture(`assets/film-${i}.png`,false)):Promise.resolve(null),rackMaps.get(rackId)]);
 if(token!==requestId)return;wrapMaterial.map=map;wrapMaterial.needsUpdate=true;filmMaterial.map=map;filmMaterial.alphaMap=mask;filmMaterial.needsUpdate=true;bus.traverse(o=>{if(o.userData.web_surface==='film')o.visible=i<2});active=i;if(rackMaterial){rackMaterial.map=rackMap;rackMaterial.color.set(i===2||i===3?0xec5a25:0xffffff);rackMaterial.needsUpdate=true;}
 $('artist').textContent=wraps[i][0].toUpperCase();$('artwork').textContent=wraps[i][1];$('count').textContent=String(i+1).padStart(2,'0')+' / 09';$('swatches').replaceChildren(...wraps[i][2].map(c=>{const e=document.createElement('i');e.style.background=c;return e}));$('status').textContent=wraps[i][0]+' — '+wraps[i][1];$('loading').hidden=true;
 for(const [key,p] of cache)if(cache.size>2&&key!==i){cache.delete(key);p.then(t=>t.dispose()).catch(()=>{})}mark();
 }catch(e){if(token===requestId)fail(new Error('This wrap could not be loaded. Check your connection and try again.'))}}
async function init(){
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 scene=new THREE.Scene();scene.background=new THREE.Color('#e8eae5');scene.fog=new THREE.Fog('#e8eae5',28,65);
 camera=new THREE.PerspectiveCamera(38,1,.05,100);controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=3.2;controls.maxDistance=28;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,1.25,0);controls.addEventListener('change',mark);
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=.85;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xf4f6ff,0x89968a,1.65));const sun=new THREE.DirectionalLight(0xfff4df,1.45);sun.position.set(-5,11,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:35});sun.shadow.bias=-.0002;sun.shadow.normalBias=.025;scene.add(sun);
 const fill=new THREE.DirectionalLight(0xe6edff,.85);fill.position.set(4,5,-8);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600),new THREE.MeshStandardMaterial({color:'#d9ded4',roughness:.8}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
 wrapMaterial=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.38,metalness:0,clearcoat:.08,clearcoatRoughness:.22});
 const glass=new THREE.MeshPhysicalMaterial({color:0xf4fcfa,roughness:0,metalness:0,transmission:.98,thickness:0,ior:1.45,envMapIntensity:.7,side:THREE.DoubleSide});
 filmMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.48,transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide,alphaTest:.035});
 filmMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',`#include <alphamap_fragment>
#ifdef USE_MAP
vec2 filmCell=vMapUv*vec2(6200.,1700.);float spread=max(fwidth(filmCell.x),fwidth(filmCell.y));float holes=smoothstep(.26,.32,length(fract(filmCell)-.5));float filmInk=mix(holes,.72,smoothstep(.4,1.5,spread));diffuseColor.a*=filmInk;
if(!gl_FrontFacing)diffuseColor.rgb*=.08;
#endif`)};
 bus=(await new GLTFLoader().loadAsync('assets/bus.glb')).scene;bus.traverse(o=>{if(!o.isMesh)return;const type=o.userData.web_surface;
 if(o.material?.name?.startsWith('Rack sign')){rackMaterial??=new THREE.MeshStandardMaterial({roughness:.5});o.material=rackMaterial;}
 if(type==='wrap')o.material=wrapMaterial;else if(type==='film'){o.material=filmMaterial;o.renderOrder=2;o.visible=false}else if(type==='glass'){o.material=glass;o.renderOrder=1}
 o.castShadow=type!=='glass'&&type!=='film';o.receiveShadow=type!=='glass';
 });scene.add(bus);fit();view('hero');await choose(0);drive=makeDrive({scene,bus,camera,controls,sun,floor,choose,view,mark});$('start').disabled=false;
 controls.addEventListener('start',()=>setAutoSpin(false));$('auto-rotate').onclick=()=>setAutoSpin(!autoSpin);
 new ResizeObserver(fit).observe(stage);renderer.setAnimationLoop(t=>{const dt=lastFrame?Math.min((t-lastFrame)/1000,.05):0;lastFrame=t;if(document.hidden)return;if(!drive.driving&&autoSpin){drive.rotateShowcase(dt*.11);dirty=true;}if(drive.update(t))dirty=true;if(!drive.driving)controls.update();if(dirty){renderer.render(scene,camera);dirty=false}});
 $('previous').onclick=()=>choose(requested-1);$('next').onclick=()=>choose(requested+1);$('wrap').onchange=e=>choose(Number(e.target.value));$('reset').onclick=()=>{setAutoSpin(false);view('hero')};document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{setAutoSpin(false);view(b.dataset.view)});
 canvas.addEventListener('keydown',e=>{if(drive.driving)return;if(e.key==='ArrowLeft'){e.preventDefault();choose(requested-1)}if(e.key==='ArrowRight'){e.preventDefault();choose(requested+1)}if(e.key.toLowerCase()==='r'){setAutoSpin(false);view('hero')}});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(new Error('The graphics context was interrupted. Reload to continue.'))});
 window.wrapStudio={wraps:wraps.map(w=>w[0]+' — '+w[1]),choose,get active(){return active},get renderer(){return renderer},get bus(){return bus},get drive(){return drive}};
}init().catch(fail);
