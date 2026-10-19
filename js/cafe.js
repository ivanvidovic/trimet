export const BOOST_COST=25;
export function cafeLocal(cafe,x,z){const dx=x-cafe.x,dz=z-cafe.z;return {x:dx*Math.cos(cafe.yaw)-dz*Math.sin(cafe.yaw),z:dx*Math.sin(cafe.yaw)+dz*Math.cos(cafe.yaw)}};
export function inCafeBay(cafe,state){const p=cafeLocal(cafe,state.x,state.z);return Math.abs(p.x)<10&&p.z> -17&&p.z< -11;}
export function hitsCafe(cafe,state){
 // Three circles approximate the bus footprint; include the café's sign/hatch overhang.
 for(const offset of [-5,0,5]){const p=cafeLocal(cafe,state.x+Math.cos(state.yaw)*offset,state.z-Math.sin(state.yaw)*offset);const dx=Math.max(-2.56-p.x,0,p.x-3.4),dz=Math.max(-25.54-p.z,0,p.z+21.25);if(dx*dx+dz*dz<1.6*1.6)return true;}return false;
}
export function createEnergy(){let value=100,dwell=0,charging=false;return {
 get value(){return value},get charging(){return charging},reset(){value=100;dwell=0;charging=false},
 spend(){if(value<BOOST_COST)return false;value-=BOOST_COST;return true},
 update(dt,parked){dwell=parked?dwell+dt:0;charging=parked&&dwell>=1&&value<100;if(charging)value=Math.min(100,value+20*dt);return charging}
};}
