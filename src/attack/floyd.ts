import {counted,randomHex} from '../hash/truncate';
export function floydMap(f:(x:string)=>string,start:string,limit=2000000){let calls=0;const next=(x:string)=>{if(++calls>limit)throw Error('Floyd step cap reached');return f(x);};let tort=next(start),hare=next(next(start)),meeting=1;while(tort!==hare){tort=next(tort);hare=next(next(hare));meeting++;}
 let a=start,b=tort,tail=0;while(a!==b){a=next(a);b=next(b);tail++;}const cycleEntry=a;let cycle=1;b=next(a);while(b!==a){b=next(b);cycle++;}
 // Start is outside the range, so the first repeated output has two distinct predecessors.
 let left=start,right=start;for(let i=0;i<cycle;i++)right=next(right);for(let i=0;i<tail-1;i++){left=next(left);right=next(right);}if(next(left)!==next(right)||left===right)throw Error('Floyd predecessor invariant failed');
 return {left,right,tail,cycle,meeting,calls,cycleEntry};
}
export function floydCollision(t:number,progress:(n:number)=>void=()=>{}){const h=counted(t,2000000,15000,progress),start='sentinel:'+randomHex();const r=floydMap(x=>'x:'+h.h(x),start);return {...r,a:r.left,b:r.right,evals:h.count,ms:h.ms,registers:2};}
// [extension] point: distinguished points and parallel collision search.
