import { afterEach,expect,it,vi } from 'vitest';
import { Runner } from './runner';
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
const setup=()=>{vi.useFakeTimers();vi.stubGlobal('window',{addEventListener:vi.fn()});};
it('cancelling a degraded run before its scheduled start prevents computation',async()=>{
 setup();const fallback=vi.fn(async()=>42),progress=vi.fn();const runner=new Runner(()=>{throw Error('unavailable');},fallback,{textContent:''} as HTMLElement);
 const pending=runner.run('demo',{},progress),settled=expect(pending).rejects.toThrow('Cancelled');runner.cancel();await vi.runAllTimersAsync();await settled;expect(fallback).not.toHaveBeenCalled();expect(progress).not.toHaveBeenCalled();
});
it('retired fallback progress and errors cannot overwrite a newer result',async()=>{
 setup();let release!:()=>void;const gate=new Promise<void>(r=>release=r),progress=vi.fn();
 const fallback=vi.fn(async(_name:string,_args:Record<string,unknown>,update:(v:unknown)=>void)=>{await gate;update('stale');throw Error('old failure');});
 const runner=new Runner(()=>{throw Error('unavailable');},fallback,{textContent:''} as HTMLElement);
 const pending=runner.run('demo',{},progress),settled=expect(pending).rejects.toThrow('Cancelled');await vi.advanceTimersByTimeAsync(0);runner.cancel();release();await settled;expect(progress).not.toHaveBeenCalled();
});
