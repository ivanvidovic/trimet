// Coordinates: front = local -X; up = +Y; axle = Z. Distances in metres.
export const RADIUS=.535, WHEELBASE=6.886;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const damp=(a,b,k,dt)=>b+(a-b)*Math.exp(-k*dt);
export function resetState(x=0,z=0,yaw=0){return {x,z,yaw,vx:0,vz:0,steer:0,yawRate:0,speed:0,slip:0,pitch:0,roll:0,launch:0,travel:0,acceleration:0};}
export function step(s,input,dt,offroad=false){
 const fx=-Math.cos(s.yaw),fz=Math.sin(s.yaw),rx=-Math.sin(s.yaw),rz=-Math.cos(s.yaw);
 let forward=s.vx*fx+s.vz*fz,lateral=s.vx*rx+s.vz*rz;
 s.steer=damp(s.steer,input.turn*.48,10,dt);
 const force=input.gas?15*(1-clamp(forward/40,0,.88)):input.brake?(forward>1?-22:-8):0;
 s.acceleration=force-forward*(offroad?1.1:.22);
 forward=clamp(forward+s.acceleration*dt,-9,38);
 if(input.handbrake)forward*=Math.exp(-2.1*dt);
 const stress=Math.abs(forward*forward*Math.tan(s.steer)/WHEELBASE);
 const breakaway=clamp((stress-10)/24,0,1)+(input.gas&&Math.abs(s.steer)>.22&&forward<14?.3:0);
 s.slip=damp(s.slip,clamp(breakaway+(input.handbrake?.65:0),0,1),input.gas?4:2.5,dt);
 const targetRate=forward/WHEELBASE*Math.tan(s.steer)*(1+s.slip*.35);
 s.yawRate=damp(s.yawRate,clamp(targetRate,-1.05,1.05),5,dt);
 s.yaw+=s.yawRate*dt;
 // Retain velocity heading while the body yaws; lower rear grip produces a visible slide.
 lateral*=Math.exp(-(offroad?2:7-5.8*s.slip)*dt);
 s.vx=fx*forward+rx*lateral;s.vz=fz*forward+rz*lateral;
 const dx=s.vx*dt,dz=s.vz*dt;s.x+=dx;s.z+=dz;
 const signedDistance=dx*(-Math.cos(s.yaw))+dz*Math.sin(s.yaw);
 s.travel+=signedDistance;s.speed=forward;
 if(input.gas&&!input.wasGas&&Math.abs(forward)<6)s.launch=1;
 s.launch=Math.max(0,s.launch-dt*.72);
 const lift=Math.sin(s.launch*Math.PI)*.145;
 s.pitch=damp(s.pitch,lift,10,dt);
 s.roll=damp(s.roll,clamp(-s.yawRate*forward*.003,-.075,.075),6,dt);
 return signedDistance;
}
