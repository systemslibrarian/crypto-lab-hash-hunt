import {hash,fullHash,hex} from '../hash/truncate';
// No attack imports. A separate recomputation gates every collision/preimage display.
export function verifyCollision(a:string,b:string,t:number){const ha=fullHash(a),hb=fullHash(b);return {valid:a!==b&&hash(a,t)===hash(b,t)&&hex(ha)!==hex(hb),truncated:hash(a,t),fullA:hex(ha),fullB:hex(hb)};}
export function verifyPreimage(x:string,y:number,t:number):boolean{return hash(x,t)===y;}
