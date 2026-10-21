import {hash,fullHash,hex} from '../hash/truncate';
import {h2Hash,lengthBlock,toyCompress,toyMd,type H2Mode} from '../md/toyMd';
// No attack imports. A separate recomputation gates every collision/preimage display.
export function verifyCollision(a:string,b:string,t:number){const ha=fullHash(a),hb=fullHash(b);return {valid:a!==b&&hash(a,t)===hash(b,t)&&hex(ha)!==hex(hb),truncated:hash(a,t),fullA:hex(ha),fullB:hex(hb)};}
export function verifyPreimage(x:string,y:number,t:number):boolean{return hash(x,t)===y;}

export type VerifiableFork={stage:number;inputCv:number;left:string;right:string;nextCv:number};
export type VerifiableMessage={mask:number;blocks:string[]};

export function verifyFork(fork:VerifiableFork,bits:number):boolean{
 const left=toyCompress('h1',fork.inputCv,fork.left,bits),right=toyCompress('h1',fork.inputCv,fork.right,bits);
 return fork.left!==fork.right&&left===right&&left===fork.nextCv;
}

export function verifyMulticollision(
 forks:VerifiableFork[],
 messages:VerifiableMessage[],
 bits:number,
 expectedDigest:number,
):{valid:boolean;verified:number;distinct:number;paddingBlock:string}{
 const digests=messages.map(message=>toyMd(message.blocks,bits,'h1'));
 const encodings=new Set(messages.map(message=>JSON.stringify(message.blocks)));
 return {
  valid:forks.every(fork=>verifyFork(fork,bits))&&messages.length>0&&digests.every(digest=>digest===expectedDigest)&&encodings.size===messages.length,
  verified:digests.filter(digest=>digest===expectedDigest).length,
  distinct:encodings.size,
  paddingBlock:lengthBlock(forks.length),
 };
}

export function verifyCascade(
 a:VerifiableMessage,
 b:VerifiableMessage,
 bits:number,
 mode:H2Mode,
 expectedH1:number,
 expectedH2:number,
):{valid:boolean;distinct:boolean;h1A:number;h1B:number;h2A:number;h2B:number;paddingBlock:string}{
 const distinct=JSON.stringify(a.blocks)!==JSON.stringify(b.blocks);
 const h1A=toyMd(a.blocks,bits,'h1'),h1B=toyMd(b.blocks,bits,'h1');
 const h2A=h2Hash(a.blocks,bits,mode),h2B=h2Hash(b.blocks,bits,mode);
 return {valid:distinct&&h1A===h1B&&h1A===expectedH1&&h2A===h2B&&h2A===expectedH2,distinct,h1A,h1B,h2A,h2B,paddingBlock:lengthBlock(a.blocks.length)};
}
