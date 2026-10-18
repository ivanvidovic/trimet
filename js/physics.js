// Coordinates: front = local -X; up = +Y; axle = Z. Distances in metres.
export const RADIUS=.535, WHEELBASE=6.886, BOOST_DURATION=1.4;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const damp=(a,b,k,dt)=>b+(a-b)*Math.exp(-k*dt);
export function boostEnvelope(remaining){const elapsed=BOOST_DURATION-remaining;const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};return remaining>0?smooth(elapsed/.25)*smooth(remaining/.4):0;}
export function resetState(x=0,z=0,yaw=0){return {x,z,yaw,vx:0,vz:0,steer:0,yawRate:0,speed:0,slip:0,pitch:0,roll:0,launch:0,travel:0,acceleration:0,bounce:0,bounceV:0,boost:0};}
export function step(s,input,dt,offroad=false){
 const fx=-Math.cos(s.yaw),fz=Math.sin(s.yaw),rx=-Math.sin(s.yaw),rz=-Math.cos(s.yaw);
 let forward=s.vx*fx+s.vz*fz,lateral=s.vx*rx+s.vz*rz;
 const steeringLimit=.48/(1+.0015*forward*forward);
 s.steer=damp(s.steer,input.turn*steeringLimit,11,dt);
 const force=input.gas?15*(1-clamp(forward/40,0,.88)):input.brake?(forward>1?-22:-8):0;
 s.boost=Math.max(0,s.boost-dt);
 s.acceleration=force+(!input.brake&&!input.handbrake&&forward>=0?8*boostEnvelope(s.boost):0)-forward*(offroad?1.1:.22)-Math.max(0,forward-36)*2;
 forward=clamp(forward+s.acceleration*dt,-9,44);
 if(input.handbrake)forward*=Math.exp(-2.1*dt);
 const stress=Math.abs(forward*forward*Math.tan(s.steer)/WHEELBASE);
 const aggressive=Math.abs(input.turn)>.85&&Math.abs(forward)>20;
 const breakaway=aggressive?clamp((stress-24)/24,0,.55):0;
 const targetSlip=input.handbrake?.85:breakaway;
 const countersteering=s.yawRate*s.steer<0;
 s.slip=damp(s.slip,targetSlip,targetSlip>s.slip?2.2:countersteering?10:7,dt);
 const targetRate=forward/WHEELBASE*Math.tan(s.steer)*(1+s.slip*.12);
 s.yawRate=damp(s.yawRate,clamp(targetRate,-.8,.8),countersteering?10:8,dt);
 s.yaw+=s.yawRate*dt;
 // Retain velocity heading while the body yaws; lower rear grip produces a visible slide.
 lateral*=Math.exp(-(offroad?6:14-11*s.slip)*dt);
 s.vx=fx*forward+rx*lateral;s.vz=fz*forward+rz*lateral;
 const dx=s.vx*dt,dz=s.vz*dt;s.x+=dx;s.z+=dz;
 const signedDistance=dx*(-Math.cos(s.yaw))+dz*Math.sin(s.yaw);
 s.travel+=signedDistance;s.speed=forward;
 if(input.gas&&!input.wasGas&&Math.abs(forward)<6)s.launch=1;
 const previousLaunch=s.launch;s.launch=Math.max(0,s.launch-dt*.72);
 if(previousLaunch>0&&s.launch===0)s.bounceV=-.95;
 s.bounceV+=(-100*s.bounce-8*s.bounceV)*dt;s.bounce+=s.bounceV*dt;
 const lift=Math.sin(s.launch*Math.PI)*.145;
 s.pitch=damp(s.pitch,lift,10,dt);
 s.roll=damp(s.roll,clamp(-s.yawRate*forward*.003,-.075,.075),6,dt);
 return signedDistance;
}
