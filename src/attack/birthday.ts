import {counted,randomHex} from '../hash/truncate';
export function tableCollision(t:number,progress:(n:number)=>void=()=>{}){const h=counted(t,2000000,15000,progress),seen=new Map<number,string>(),prefix=randomHex();for(let i=0;;i++){const x='distinct:'+prefix+':'+i,y=h.h(x),other=seen.get(y);if(other!==undefined)return {a:other,b:x,evals:h.count,entries:seen.size,ms:h.ms};seen.set(y,x);}}
