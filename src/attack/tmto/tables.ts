import {counted,randomBelow} from '../../hash/truncate';
export type Method='hellman'|'rainbow';
export const domainMessage=(x:number,password=false):string=>password?Array.from({length:4},(_,i)=>String.fromCharCode(97+Math.floor(x/8**i)%8)).join(''):'x:'+x;
export function reduce(y:number,column:number,table:number,N:number):number{return ((y*(2*table+1)+104729*(column+1)+7919*table)%N+N)%N;}
export interface ChainTable{method:Method;t:number;N:number;columns:number;tables:number;starts:number;endpoints:Map<number,number[]>[];precompute:number;stored:number;merges:number;coverage:number;trace:{table:number;start:number;path:number[]}[];password:boolean;}
export function buildChains(method:Method,t:number,starts:number,columns:number,tables:number,password=false):ChainTable{
 const N=password?4096:2**t;if(t<8||t>16||starts<1||starts>N||columns<1||columns>128||tables<1||tables>128||starts*columns*tables>1000000)throw Error('Table parameters exceed the bounded experiment (at most 1,000,000 chain hashes).');const h=counted(t,2000000,20000),coverage=new Set<number>(),endpoints:Map<number,number[]>[]=[],trace:ChainTable['trace']=[];let merges=0;
 for(let tb=0;tb<tables;tb++){const ends=new Map<number,number[]>(),seen=new Set<string>();for(let i=0;i<starts;i++){let x=(i*1543+tb*7919)%N;const start=x,path=[x];for(let j=0;j<columns;j++){const y=h.h(domainMessage(x,password));coverage.add(y);const state=method==='rainbow'?j+':'+x:String(x);if(seen.has(state))merges++;seen.add(state);x=reduce(y,method==='rainbow'?j:0,tb,N);if(trace.length<4)path.push(x);}const prior=ends.get(x)??[];prior.push(start);ends.set(x,prior);if(trace.length<4)trace.push({table:tb,start,path});}endpoints.push(ends);}
 return {method,t,N,columns,tables,starts,endpoints,precompute:h.count,stored:starts*tables,merges,coverage:coverage.size,trace,password};
}
export function invertChains(table:ChainTable,y:number){const {N,t,columns,tables,endpoints,method,password}=table;const h=counted(t,3000000,20000);let falseAlarms=0;
 const regenerate=(start:number)=>{let x=start;for(let j=0;j<columns;j++){const d=h.h(domainMessage(x,password));if(d===y)return x;x=reduce(d,method==='rainbow'?j:0,current,N);}return null;};let current=0;
 for(current=0;current<tables;current++){
  if(method==='hellman'){let x=reduce(y,0,current,N);for(let step=0;step<columns;step++){for(const start of endpoints[current].get(x)??[]){const found=regenerate(start);if(found!==null)return {x:found,evals:h.count,falseAlarms};falseAlarms++;}x=reduce(h.h(domainMessage(x,password)),0,current,N);}}
  else for(let pos=columns-1;pos>=0;pos--){let x=reduce(y,pos,current,N);for(let j=pos+1;j<columns;j++)x=reduce(h.h(domainMessage(x,password)),j,current,N);for(const start of endpoints[current].get(x)??[]){const found=regenerate(start);if(found!==null)return {x:found,evals:h.count,falseAlarms};falseAlarms++;}}
 }
 return {x:null,evals:h.count,falseAlarms};
}
export function buildFull(t:number,password=false){const N=password?4096:2**t;if(t>16)throw Error('Full table capped at 16 bits');const h=counted(t,100000,20000),map=new Map<number,number>();for(let x=0;x<N;x++){const y=h.h(domainMessage(x,password));if(!map.has(y))map.set(y,x);}return {map,precompute:h.count,stored:map.size,N,t,password};}
export function exhaustive(y:number,t:number,password=false,salt=''){const N=password?4096:2**t,h=counted(t,100000,20000);for(let x=0;x<N;x++){const msg=domainMessage(x,password);if(h.h(salt?'salt:'+salt+'|'+msg:msg)===y)return {x,evals:h.count};}return {x:null,evals:h.count};}
export function targets(t:number,count:number,password=false){const N=password?4096:2**t;return Array.from({length:count},()=>randomBelow(N));}
// [extension] point: Hellman's original key-recovery setting uses k -> E_k(m).
