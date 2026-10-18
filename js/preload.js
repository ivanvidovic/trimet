export function createAssetCache(load,warm){
 const entries=new Map();
 function get(index){if(!entries.has(index)){const job=load(index).then(async data=>{await warm(data);return data}).catch(error=>{entries.delete(index);throw error});entries.set(index,job);}return entries.get(index)}
 function retain(indices){const keep=new Set(indices);for(const [i,p] of entries)if(!keep.has(i)){entries.delete(i);p.then(data=>data.map.dispose()).catch(()=>{})}}
 return {get,retain,get size(){return entries.size}};
}
export const carouselPositions=(direction,spacing,t)=>{const eased=t*t*(3-2*t);return {outgoing:-direction*spacing*eased,incoming:direction*spacing*(1-eased)}};
