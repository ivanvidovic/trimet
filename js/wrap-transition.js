import * as THREE from 'three';
export function createWrapTransition(bus,wrap,film){
 const pixel=new THREE.DataTexture(new Uint8Array([0,0,0,255]),1,1);pixel.needsUpdate=true;
 const uniforms={oldAtlas:{value:null},newAtlas:{value:null},oldFilm:{value:pixel},newFilm:{value:pixel},wipeProgress:{value:1}};
 bus.updateWorldMatrix(true,true);const inverse=bus.matrixWorld.clone().invert();
 bus.traverse(o=>{if(!o.isMesh||!['wrap','film'].includes(o.userData.web_surface))return;o.geometry=o.geometry.clone();const pos=o.geometry.attributes.position,data=new Float32Array(pos.count),m=inverse.clone().multiply(o.matrixWorld),v=new THREE.Vector3();for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(m);data[i]=v.x;}o.geometry.setAttribute('busX',new THREE.BufferAttribute(data,1));});
 function install(material,isFilm){material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader='attribute float busX; varying float vBusX;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBusX=busX;');shader.fragmentShader='uniform sampler2D oldAtlas,newAtlas,oldFilm,newFilm; uniform float wipeProgress; varying float vBusX;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
float edge=mix(-7.5,7.5,wipeProgress);
float reveal=1.0-smoothstep(edge-.65,edge+.65,vBusX);
vec4 oldInk=texture2D(oldAtlas,vMapUv),newInk=texture2D(newAtlas,vMapUv);
${isFilm?`float oldA=texture2D(oldFilm,vMapUv).g,newA=texture2D(newFilm,vMapUv).g;
float inkAlpha=mix(oldA,newA,reveal);
vec3 inkColor=mix(oldInk.rgb*oldA,newInk.rgb*newA,reveal)/max(inkAlpha,.0001);
diffuseColor.rgb*=inkColor;diffuseColor.a*=inkAlpha;`:`diffuseColor*=mix(oldInk,newInk,reveal);`}
#endif`);
 if(isFilm)shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',`#ifdef USE_MAP
vec2 cell=vMapUv*vec2(6200.,1700.);float spread=max(fwidth(cell.x),fwidth(cell.y));float holes=smoothstep(.26,.32,length(fract(cell)-.5));diffuseColor.a*=mix(holes,.72,smoothstep(.4,1.5,spread));if(!gl_FrontFacing)diffuseColor.rgb*=.08;
#endif`);
 };material.customProgramCacheKey=()=>isFilm?'bus-film-wipe-v26':'bus-wrap-wipe-v26';material.needsUpdate=true;}
 install(wrap,false);install(film,true);
 return {set(previous,next,progress=1){uniforms.oldAtlas.value=previous.map;uniforms.newAtlas.value=next.map;uniforms.oldFilm.value=previous.mask||pixel;uniforms.newFilm.value=next.mask||pixel;uniforms.wipeProgress.value=progress;},progress(t){uniforms.wipeProgress.value=t},uniforms};
}
