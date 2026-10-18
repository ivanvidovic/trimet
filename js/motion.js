export function screenTilt(beta,gamma,angle=0){const a=angle*Math.PI/180;return gamma*Math.cos(a)+beta*Math.sin(a);}
export function tiltValue(delta){const magnitude=Math.abs(delta);return Math.sign(delta)*Math.min(1,Math.max(0,magnitude-3)/22);}
export function createTilt({button,calibrate,status,host=window}){
 let enabled=false,ready=false,neutral=null,raw=0,filtered=0,lastEvent=0,timer;
 const angle=()=>host.screen?.orientation?.angle??host.orientation??0;
 function message(s){status.textContent=s;}
 function zero(){neutral=null;filtered=0;ready=false;message('Hold comfortably—calibrating…');}
 function off(text='Touch steering'){enabled=false;ready=false;neutral=null;filtered=0;button.textContent='Tilt steering';calibrate.hidden=true;clearTimeout(timer);message(text);}
 function event(e){if(!enabled||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;raw=screenTilt(e.beta,e.gamma,angle());lastEvent=performance.now();if(neutral===null){neutral=raw;ready=true;clearTimeout(timer);message('Tilt left / right to steer');} }
 button.onclick=async()=>{if(enabled){off();return}const API=host.DeviceOrientationEvent;if(!API){off('Motion unavailable—use arrows');return}try{if(typeof API.requestPermission==='function'&&await API.requestPermission()!=='granted'){off('Motion denied—use arrows');return}enabled=true;button.textContent='Tilt: on';calibrate.hidden=false;zero();timer=setTimeout(()=>{if(!ready)off('No motion data—use arrows')},4000);}catch{off('Motion unavailable—use arrows');}};
 calibrate.onclick=zero;host.addEventListener('deviceorientation',event);const orientation=()=>{if(enabled)zero()};host.screen?.orientation?.addEventListener('change',orientation);host.addEventListener('orientationchange',orientation);
 return {read(dt){const target=enabled&&ready&&performance.now()-lastEvent<700?-tiltValue(raw-neutral):0;filtered+=(target-filtered)*(1-Math.exp(-9*dt));return filtered},get enabled(){return enabled&&ready},reset(){filtered=0}};
}
