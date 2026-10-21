import {tableCollision} from '../attack/birthday';import {floydCollision} from '../attack/floyd';import {meaningful} from '../attack/meaningful';import {cascade,chainCollisions,enumerateMulticollision,ENUMERATION_CAP,type MulticollisionChain} from '../attack/joux';import {verifyCascade,verifyCollision,verifyMeaningful,verifyFork,verifyMulticollision,verifyPreimage} from '../verify/verify';import {hash,randomHex,calibrate} from '../hash/truncate';import {buildChains,buildFull,invertChains,exhaustive,domainMessage,targets} from '../attack/tmto/tables';import {saltExperiment} from '../salt/experiment';import {rainbowPrediction} from '../math/birthday';import type {H2Mode} from '../md/toyMd';
export async function run(name:string,args:Record<string,unknown>,progress:(n:unknown)=>void):Promise<unknown>{const t=Number(args.t);
 if(name==='calibrate')return calibrate();
 if(name==='collision'){const result=args.method==='floyd'?floydCollision(t,progress):tableCollision(t,progress);const check=verifyCollision(result.a,result.b,t);if(!check.valid)throw Error('Independent collision check rejected the result');return {...result,...check};}
 if(name==='meaningful'){const result=meaningful(t,args.method==='floyd'?'floyd':'piles',progress),check=verifyMeaningful(result.a,result.b,t);if(!check.valid)throw Error('Independent meaningful collision check failed');return {...result,...check};}
 if(name==='birthday'){const N=Number(args.N),q=Number(args.q),runs=Number(args.runs);if(N<2||N>65536||q<2||q>1000||runs<1||runs>500)throw Error('Birthday batch out of bounds');const rows=[];for(let r=0;r<runs;r++){const prefix=randomHex(),seen=new Set<number>();let hit=false;for(let i=0;i<q;i++){// Rejection mapping avoids modulo bias when N=365.
 let nonce=0,y:number;const ceiling=Math.floor(2**24/N)*N;do{y=hash(prefix+':'+i+':'+nonce++,24);}while(y>=ceiling);y%=N;if(seen.has(y))hit=true;seen.add(y);}rows.push(hit);if(r%20===0)progress(r+1);}return {rows,hits:rows.filter(Boolean).length,N,q};}
 if(name==='tables'){const password=!!args.password,columns=Number(args.columns),starts=Number(args.starts),tables=Number(args.tables);const full=buildFull(t,password),hellman=buildChains('hellman',t,starts,columns,tables,password),rainbow=buildChains('rainbow',t,Math.min(full.N,starts*tables),columns,1,password);const xs=targets(t,32,password),rows=[];for(const [method,tab]of [['hellman',hellman],['rainbow',rainbow]] as const){let hits=0,evals=0,falseAlarms=0,originals=0;const results=[];for(const secret of xs){const y=hash(domainMessage(secret,password),t),r=invertChains(tab,y);if(r.x!==null&&!verifyPreimage(domainMessage(r.x,password),y,t))throw Error('Preimage failed independent check');if(r.x!==null)hits++;if(r.x===secret)originals++;evals+=r.evals;falseAlarms+=r.falseAlarms;results.push({target:y,x:r.x,original:secret,note:r.reason});}rows.push({method,hits,targets:xs.length,originals,evals,falseAlarms,precompute:tab.precompute,stored:tab.stored,merges:tab.merges,coverage:tab.coverage,trace:tab.trace,results});progress(method+' complete');}
 const y=hash(domainMessage(xs[0],password),t),brute=exhaustive(y,t,password);return {rows,full:{precompute:full.precompute,stored:full.stored,coverage:full.map.size,hits:xs.filter(x=>full.map.has(hash(domainMessage(x,password),t))).length},brute,N:full.N,predictedRainbow:rainbowPrediction(2**t,Math.min(full.N,starts*tables),columns),uniformOutputCoverage:true};}
 if(name==='salt')return saltExperiment(progress);
 if(name==='multicollision'){
  if(args.action==='enumerate'){
   const chain=args.chain as MulticollisionChain,enumeration=enumerateMulticollision(chain,ENUMERATION_CAP),verification=verifyMulticollision(chain.forks,enumeration.messages,chain.bits,chain.h1Digest,enumeration.complete);
   if(!verification.valid)throw Error('Independent multicollision verification rejected the enumerated set');
   return {chain,enumeration,verification};
  }
  const forks=Number(args.forks),verifiedProgress=(value:unknown)=>{const update=value as {phase?:string;fork?:Parameters<typeof verifyFork>[0]};if(update.phase==='forks'&&update.fork&&!verifyFork(update.fork,t))throw Error('Independent fork verification rejected a completed stage');progress(value);},chain=chainCollisions(t,forks,verifiedProgress),forkChecks=chain.forks.map(fork=>verifyFork(fork,t));
  if(forkChecks.some(valid=>!valid))throw Error('Independent fork verification rejected the chain');
  return {chain,forkChecks};
 }
 if(name==='cascade'){
  const forks=Number(args.forks),mode=(args.mode==='whole'?'whole':'iterated') as H2Mode,verifiedProgress=(value:unknown)=>{const update=value as {phase?:string;fork?:Parameters<typeof verifyFork>[0]};if(update.phase==='forks'&&update.fork&&!verifyFork(update.fork,t))throw Error('Independent fork verification rejected a completed stage');progress(value);},result=cascade(t,forks,mode,verifiedProgress),forkChecks=result.chain.forks.map(fork=>verifyFork(fork,t));
  if(forkChecks.some(valid=>!valid))throw Error('Independent fork verification rejected the cascade chain');
  const enumeration=enumerateMulticollision(result.chain,ENUMERATION_CAP),multicollisionVerification=verifyMulticollision(result.chain.forks,enumeration.messages,t,result.chain.h1Digest,enumeration.complete);
  if(!multicollisionVerification.valid)throw Error('Independent multicollision verification rejected the cascade set');
  if(!result.pair)return {...result,forkChecks,multicollisionVerification,cascadeVerification:null};
  const cascadeVerification=verifyCascade(result.pair.a,result.pair.b,t,mode,result.pair.h1,result.pair.h2);
  if(!cascadeVerification.valid)throw Error('Independent H1 || H2 verification rejected the pair');
  return {...result,forkChecks,multicollisionVerification,cascadeVerification};
 }
 throw Error('Unknown experiment');
}
