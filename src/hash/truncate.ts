import {sha256} from '@noble/hashes/sha2.js';
const encoder=new TextEncoder();
export const fullHash=(m:string):Uint8Array<ArrayBuffer>=>new Uint8Array(sha256(encoder.encode(m)));
export const hex=(b:Uint8Array):string=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
export function truncate(bytes:Uint8Array,t:number):number{if(!Number.isInteger(t)||t<1||t>24||bytes.length!==32)throw Error('Use 1–24 leading bits of a 32-byte SHA-256 digest');let x=0;for(let i=0;i<Math.ceil(t/8);i++)x=x*256+bytes[i];return Math.floor(x/2**((8-t%8)%8));}
export function hash(m:string,t:number):number{return truncate(fullHash(m),t);}
export function hashBytes(m:string,t:number):Uint8Array<ArrayBuffer>{const bytes=fullHash(m).slice(0,Math.ceil(t/8));if(t%8)bytes[bytes.length-1]&=255<<(8-t%8);return bytes;}
export function counted(t:number,max=2000000,ms=15000,progress:(n:number)=>void=()=>{}){let count=0;const start=performance.now();return {h:(m:string)=>{count++;if(count>max||performance.now()-start>ms)throw Error('Search stopped at its measured time or evaluation budget; no result claimed.');if(count%2048===0)progress(count);return hash(m,t);},get count(){return count;},get ms(){return performance.now()-start;}};}
export function randomHex(bytes=8):string{const b=crypto.getRandomValues(new Uint8Array(bytes));return hex(b);}
export function randomBelow(n:number):number{if(!Number.isInteger(n)||n<1||n>2**24)throw Error('Invalid random domain');const limit=Math.floor(2**32/n)*n,b=new Uint32Array(1);do{crypto.getRandomValues(b);}while(b[0]>=limit);return b[0]%n;}
export function calibrate(){const start=performance.now();let calls=0;while(performance.now()-start<60){hash('Calibration letter with several words, variation points, and a SHA-256 digest. '+calls,16);calls++;}const rate=calls*1000/(performance.now()-start);return {calls,ms:performance.now()-start,rate,maxBits:Math.max(12,Math.min(24,Math.floor(2*Math.log2(rate*.12))))};}
