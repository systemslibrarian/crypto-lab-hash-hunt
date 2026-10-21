import {buildFull,domainMessage,exhaustive} from '../attack/tmto/tables';
import {randomBelow} from '../hash/truncate';
import {verifyPreimage} from '../verify/verify';
import {freshSaltedTarget} from './targets';
export function saltExperiment(progress:(phase:string)=>void=()=>{}){
 const password=true,t=12;
 const choose=()=>{const original=randomBelow(4096),message=domainMessage(original,password);return {original,message,...freshSaltedTarget(message,t)}};
 const prepared:ReturnType<typeof choose>[]=[];
 progress('precompute-start');const full=buildFull(t,password);progress('precompute-complete');
 const rows=[];
 for(let i=0;i<20;i++){
  const {original,message,salt,y}=prepared[i]??choose();
  const guess=full.map.get(y),bucket=guess!==undefined,valid=bucket&&verifyPreimage('salt:'+salt+'|'+domainMessage(guess!,password),y,t);
  const brute=exhaustive(y,t,password,salt);
  if(brute.x===null||!verifyPreimage('salt:'+salt+'|'+domainMessage(brute.x,password),y,t))throw Error('Salted verification failed');
  rows.push({salt,y,bucket,valid,original:message,precomputed:guess===undefined?null:domainMessage(guess,password),recovered:domainMessage(brute.x,password),originalRecovered:brute.x===original,evals:brute.evals});
 }
 return {rows,precompute:full.precompute,stored:full.stored,t};
}
