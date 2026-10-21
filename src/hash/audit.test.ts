import {it,expect,vi} from 'vitest';
import {createHash} from 'node:crypto';
import {meaningful,letter} from '../attack/meaningful';
import {verifyMeaningful} from '../verify/verify';
import {saltExperiment} from '../salt/experiment';
import {buildChains,invertChains} from '../attack/tmto/tables';
const h=(s:string)=>createHash('sha256').update(s).digest()[0];
it('same-type meaningful collision is cryptographically real but cannot be a forgery',()=>{
 const a=letter('x:1',8).text,b=letter('x:29',8).text;expect(a).not.toBe(b);expect(h(a)).toBe(h(b));expect(a).toContain('dismissed');expect(b).toContain('dismissed');expect(verifyMeaningful(a,b,8).valid).toBe(false);
});
it('Floyd logs each same-type collision and continues to a cross-type result',()=>{
 let seed=0;const rng=vi.spyOn(crypto,'getRandomValues').mockImplementation(((a:Uint8Array<ArrayBuffer>)=>{a.fill(0);a[0]=seed++;return a}) as typeof crypto.getRandomValues);
 try{const r=meaningful(8,'floyd');expect(r.retries).toBe(4);expect(r.retryLog).toHaveLength(4);for(const p of r.retryLog){expect(h(p.a)).toBe(h(p.b));expect(p.a.includes('dismissed')).toBe(p.b.includes('dismissed'))}expect(verifyMeaningful(r.a,r.b,8).valid).toBe(true)}finally{rng.mockRestore()}
});
it('salt RNG is not invoked until the actual full-table build completes',()=>{
 let phase='unstarted';const observed:string[]=[],original=crypto.getRandomValues.bind(crypto);
 const rng=vi.spyOn(crypto,'getRandomValues').mockImplementation(((a:Uint8Array<ArrayBuffer>)=>{if(a instanceof Uint8Array&&a.length===16)observed.push(phase);return original(a)}) as typeof crypto.getRandomValues);
 try{const result=saltExperiment(p=>{phase=p});expect(result.precompute).toBe(4096);expect(observed).toHaveLength(20);expect(observed.every(p=>p==='precompute-complete')).toBe(true)}finally{rng.mockRestore()}
});
it.each(['hellman','rainbow'] as const)('%s does not treat a stored start as its own preimage',method=>{
 // The single chain starts at index zero. Independently H_8("x:0") is not zero.
 expect(h('x:0')).not.toBe(0);const table=buildChains(method,8,1,1,1);expect(table.trace[0].start).toBe(0);const result=invertChains(table,0);expect(result.x).toBeNull();expect(result.reason).toBe('start point, no preimage in chain');
});
