import {test,expect,type Page} from '@playwright/test';import {createHash} from 'node:crypto';import {boot} from './gate';
const digest=(m:string)=>createHash('sha256').update(m).digest('hex');
const shortened=(m:string,t:number)=>Number(BigInt('0x'+digest(m))>>BigInt(256-t));
async function collision(page:Page){const a=(await page.locator('[data-input-a]').textContent())!,b=(await page.locator('[data-input-b]').textContent())!,t=Number(await page.locator('[data-truncated]').getAttribute('data-bits')),h=Number(await page.locator('[data-truncated]').getAttribute('data-truncated'));expect(a).not.toBe(b);expect(shortened(a,t)).toBe(h);expect(shortened(b,t)).toBe(h);expect(digest(a)).not.toBe(digest(b));await expect(page.locator('[data-full-a]')).toHaveText(digest(a));await expect(page.locator('[data-full-b]')).toHaveText(digest(b));}
test('birthday probability and measured trial count agree independently',async({page})=>{await boot(page);await page.getByRole('button',{name:'Run the birthday room'}).click();await expect(page.locator('[data-hits]')).toBeAttached();let miss=1;for(let i=1;i<23;i++)miss*=1-i/365;expect(Number(await page.locator('[data-model]').getAttribute('data-model'))).toBeCloseTo(1-miss,12);const hits=(await page.locator('#birthday-out tbody tr td:last-child').allTextContents()).filter(x=>x==='yes').length;expect(Number(await page.locator('[data-hits]').getAttribute('data-hits'))).toBe(hits);await page.locator('#q').dispatchEvent('input');await expect(page.locator('[data-hits]')).toBeAttached();await page.locator('#q').fill('24');await expect(page.locator('[data-hits]')).toHaveCount(0);});
for(const method of ['table','floyd'])test(method+' collision recomputes every displayed hash',async({page})=>{await boot(page);await page.getByRole('tab',{name:/Collision hunt/}).click();await page.locator('#t').fill('9');await page.locator('#method').selectOption(method);await page.getByRole('button',{name:'Hunt a collision'}).click();await expect(page.locator('[data-verdict=collision]')).toBeVisible();await collision(page);expect(Number(await page.locator('[data-evals]').getAttribute('data-evals'))).toBeGreaterThan(0);if(method==='floyd'){await expect(page.locator('[data-memory]')).toHaveAttribute('data-memory','2');await expect(page.locator('.chart')).toBeVisible();await page.getByRole('button',{name:'Next walk state'}).click();await expect(page.locator('#walk-record tbody td').first()).toHaveText('2');}await page.locator('#t').fill('10');await expect(page.locator('[data-verdict=collision]')).toHaveCount(0);});
test('meaningful forgery is a cross-type collision with a real accepted HMAC',async({page})=>{await page.addInitScript(()=>{const original=crypto.subtle.verify.bind(crypto.subtle);const results:boolean[]=[];(window as unknown as {platformResults:boolean[]}).platformResults=results;crypto.subtle.verify=async(...args:Parameters<SubtleCrypto['verify']>)=>{const result=await original(...args);results.push(result);return result;};});await boot(page);await page.getByRole('tab',{name:/Meaningful forgery/}).click();await page.locator('#t').fill('8');await page.getByRole('button',{name:'Find letters and forge the tag'}).click();await expect(page.locator('[data-verdict=forgery]')).toBeVisible();await collision(page);await expect(page.locator('[data-input-a] mark').first()).toBeVisible();await expect(page.locator('[data-input-a]')).toContainText('Alice is dismissed');await expect(page.locator('[data-input-b]')).toContainText('I recommend Alice');await expect(page.locator('[data-tag]')).toHaveText(/^[0-9a-f]{64}$/);await expect(page.locator('[data-platform-verify]')).toHaveAttribute('data-platform-verify','true');await expect(page.locator('[data-altered-tag-accepted]')).toHaveAttribute('data-altered-tag-accepted','false');expect(await page.evaluate(()=>(window as unknown as {platformResults:boolean[]}).platformResults)).toEqual([true,false]);await expect(page.locator('[data-verdict=forgery]')).toContainText('does not show the key holder approved this letter');});
test('chained table preimages and full-table cost agree independently',async({page})=>{await boot(page);await page.getByRole('tab',{name:/Chained tables/}).click();await page.locator('#table-t').selectOption('10');await page.locator('#starts').fill('8');await page.getByRole('button',{name:'Build and invert 32 targets'}).click();await expect(page.locator('#tables-out')).toContainText('Every inversion result');let hits=0;for(const row of await page.locator('#tables-out details tbody tr').all()){const [target,x]=await row.locator('td').allTextContents();if(x!=='miss'){hits++;expect(shortened('x:'+x,10)).toBe(Number(target));}}expect(hits).toBeGreaterThan(0);for(const [i,details] of (await page.locator('#tables-out details').all()).entries()){const values=await details.locator('tbody tr td:nth-child(2)').allTextContents(),actual=values.filter(x=>x!=='miss').length;await expect(page.locator('#tables-out table').first().locator('tbody tr').nth(i+2).locator('td').nth(4)).toHaveText(actual+' / 32');}const full=page.locator('#tables-out table').first().locator('tbody tr').nth(1);await expect(full.locator('td').nth(1)).toHaveText('1024');await expect(full.locator('td').nth(4)).toHaveText('32 / 32');});
test('salted recovered preimages verify independently and retain the negative claim',async({page})=>{await boot(page);await page.getByRole('tab',{name:/Salt experiment/}).click();await page.getByRole('button',{name:'Run the salt experiment'}).click();await expect(page.locator('[data-verdict=salt-negative]')).toBeVisible();const rows=await page.locator('#salt-out tbody tr').all();expect(rows).toHaveLength(20);const salts=new Set<string>();for(const row of rows){const [salt,y,old,valid,recovered]=await row.locator('td').allTextContents();salts.add(salt);expect(shortened('salt:'+salt+'|'+recovered,12)).toBe(Number(y));if(old!=='miss')expect(shortened('salt:'+salt+'|'+old,12)===Number(y)).toBe(valid==='valid accidental preimage');}expect(salts.size).toBe(20);await expect(page.locator('[data-verdict=salt-negative]')).toContainText('it does not stop guessing one user’s password');});
test('invalid controls refuse a result and tabs retire the old experiment',async({page})=>{await boot(page);await page.locator('#q').fill('0');await page.getByRole('button',{name:'Run the birthday room'}).click();await expect(page.locator('#birthday-out')).toContainText('Input refused');await page.getByRole('tab',{name:/Birthday room/}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:/Collision hunt/})).toHaveAttribute('aria-selected','true');await expect(page.locator('#birthday-out')).toHaveCount(0);});

test('near miss verifier refuses equal first 8 bits at width 9',async({page})=>{await boot(page);await page.getByRole('tab',{name:/Collision hunt/}).click();await page.getByRole('button',{name:'Verify the 9-bit near miss'}).click();expect(shortened('verification-control:16',8)).toBe(shortened('verification-control:18',8));expect(shortened('verification-control:16',9)).not.toBe(shortened('verification-control:18',9));await expect(page.locator('[data-verdict=near-miss]')).toContainText('NEAR MISS REJECTED');});

const toyCompression=(tag:'h1'|'h2',cv:number,block:string,bits:number)=>shortened(tag+'|'+cv+'|'+block,bits);
const toyMd=(blocks:string[],bits:number,tag:'h1'|'h2')=>{let cv=0;for(const block of blocks)cv=toyCompression(tag,cv,block,bits);return toyCompression(tag,cv,'PB:'+blocks.length,bits);};
const wholeMessage=(blocks:string[])=>blocks.map(block=>Buffer.byteLength(block)+':'+block).join('|');
const h2=(blocks:string[],bits:number,mode:string)=>mode==='iterated'?toyMd(blocks,bits,'h2'):shortened(wholeMessage(blocks),bits);

async function openMulti(page:Page,bits:number, forks:number, mode:'iterated'|'whole'='iterated'){
 await boot(page);
 await expect(page.locator('#calibration')).toContainText(/Measured calibration|Calibration unavailable/);
 await page.getByRole('tab',{name:/Multicollisions/}).click();
 await page.locator('#multi-n').fill(String(bits));
 await page.locator('#multi-b').fill(String(forks));
 await page.locator('#multi-mode').selectOption(mode);
}

// Completion includes explicit rejection. A rejected computation must fail the
// owning result assertion, rather than consuming the whole test timeout.
async function completedEvidence(page:Page,selector:string){
 await expect.poll(async()=>page.locator(selector+', #multi-out .verdict.warn').count(),{timeout:20_000}).toBeGreaterThan(0);
 expect(await page.locator(selector).count(),'the completed computation must publish the expected verified evidence').toBe(1);
}

async function buildForks(page:Page){
 await page.getByRole('button',{name:'Build the forks'}).click();
 await completedEvidence(page,'[data-verdict="multi-forks"]');
}

async function runCascade(page:Page){
 await page.getByRole('button',{name:'Find an H1‖H2 collision'}).click();
 await completedEvidence(page,'#multi-cost');
}

test('multicollision forks chain from each verified next state',async({page})=>{
 await openMulti(page,10,5);await buildForks(page);
 const forks=await page.locator('.multi-fork').all();expect(forks).toHaveLength(5);
 let expectedInput=0;
 for(const [index,fork] of forks.entries()){
  const stage=Number(await fork.getAttribute('data-stage')),input=Number(await fork.getAttribute('data-input-cv')),left=(await fork.getAttribute('data-left'))!,right=(await fork.getAttribute('data-right'))!,next=Number(await fork.getAttribute('data-next-cv'));
  expect(stage).toBe(index+1);expect(input).toBe(expectedInput);expect(left).not.toBe(right);expect(toyCompression('h1',input,left,10)).toBe(next);expect(toyCompression('h1',input,right,10)).toBe(next);expectedInput=next;
 }
 await expect(page.locator('[data-verdict="multi-forks"]')).toContainText('Swapping one choice');
});

test('toy Merkle-Damgard display includes the encoded length block',async({page})=>{
 await openMulti(page,11,4);await buildForks(page);await page.getByRole('button',{name:'Enumerate',exact:true}).click();await completedEvidence(page,'#multi-enumeration-evidence');
 const blocks=await page.locator('.multi-fork').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-left')!));
 const padding=page.locator('.multi-padding');await expect(padding).toHaveAttribute('data-padding-block','PB:4');
 expect(Number(await padding.getAttribute('data-h1'))).toBe(toyMd(blocks,11,'h1'));
});

test('enumeration maps every mask to its displayed fork choices',async({page})=>{
 await openMulti(page,9,6);await buildForks(page);await page.getByRole('button',{name:'Enumerate',exact:true}).click();
 const evidence=page.locator('#multi-enumeration-evidence');await completedEvidence(page,'#multi-enumeration-evidence');await expect(evidence).toHaveAttribute('data-complete','true');
 expect(Number(await evidence.getAttribute('data-total'))).toBe(64);expect(Number(await evidence.getAttribute('data-verified'))).toBe(64);expect(Number(await evidence.getAttribute('data-distinct'))).toBe(64);
 const choices=await page.locator('.multi-fork').evaluateAll(nodes=>nodes.map(node=>({left:node.getAttribute('data-left')!,right:node.getAttribute('data-right')!})));
 const rows=page.locator('[data-multi-message]');await expect(rows).toHaveCount(64);
 for(const index of [Math.floor(64*.37),Math.floor(64*.73)]){const row=rows.nth(index),mask=Number(await row.getAttribute('data-mask')),blocks=JSON.parse((await row.getAttribute('data-blocks'))!) as string[],shown=Number(await row.getAttribute('data-h1'));expect(blocks).toEqual(choices.map((choice,bit)=>((mask>>bit)&1)?choice.right:choice.left));expect(toyMd(blocks,9,'h1')).toBe(shown);}
});

test('flipping one displayed fork changes the message without moving H1',async({page})=>{
 await openMulti(page,12,6);await buildForks(page);
 let evidence=page.locator('#multi-flip-evidence');
 for(let fork=1;fork<=6;fork++){await page.locator('#multi-flip-index').fill(String(fork));await page.getByRole('button',{name:'Flip selected fork'}).click();await expect(evidence).toBeVisible();const before=JSON.parse((await evidence.getAttribute('data-before-blocks'))!) as string[],after=JSON.parse((await evidence.getAttribute('data-after-blocks'))!) as string[];expect(before).not.toEqual(after);expect(after.filter((block,index)=>block!==before[index])).toHaveLength(1);expect(Number(await evidence.getAttribute('data-after-mask'))).toBe(1<<(fork-1));expect(Number(await evidence.getAttribute('data-h1-before'))).toBe(Number(await evidence.getAttribute('data-h1-after')));if(await evidence.getAttribute('data-h2-before')!==await evidence.getAttribute('data-h2-after'))break;if(fork===6)throw Error('All six independent H2 flip controls collided unexpectedly');}
});

test('cascade pair independently collides under H1 and H2',async({page})=>{
 await openMulti(page,14,9);let evidence=page.locator('#multi-negative-evidence');for(let attempt=0;attempt<3;attempt++){await runCascade(page);if(await evidence.count())break;}await expect(evidence).toHaveAttribute('data-evidence-green','true');
 const a=JSON.parse((await evidence.getAttribute('data-a-blocks'))!) as string[],b=JSON.parse((await evidence.getAttribute('data-b-blocks'))!) as string[];expect(a).not.toEqual(b);expect(toyMd(a,14,'h1')).toBe(toyMd(b,14,'h1'));expect(h2(a,14,'iterated')).toBe(h2(b,14,'iterated'));
 for(const check of await evidence.locator('[data-check]').all())expect(await check.getAttribute('data-result')).toBe('pass');
 await expect(page.locator('[data-verdict="multi-cascade"]')).toContainText('2n-BIT DIGEST — b·2^(n/2) WORK');
 await expect(page.locator('[data-verdict="multi-cascade"]')).toContainText('does not double the collision work');
 await page.getByText('Construction, source boundary, and non-goals',{exact:true}).click();await expect(page.getByText('What this is not:',{exact:false})).toBeVisible();await expect(page.getByText('real SHA-256 is not attacked',{exact:false})).toBeVisible();await expect(page.getByText('second-preimage attacks remain out of scope',{exact:false})).toBeVisible();
});

test('whole-message H2 toggle still verifies the displayed concatenation collision',async({page})=>{
 await openMulti(page,8,9,'whole');await runCascade(page);
 const evidence=page.locator('#multi-negative-evidence');await expect(evidence).toBeVisible();const a=JSON.parse((await evidence.getAttribute('data-a-blocks'))!) as string[],b=JSON.parse((await evidence.getAttribute('data-b-blocks'))!) as string[];expect(a).not.toEqual(b);expect(toyMd(a,8,'h1')).toBe(toyMd(b,8,'h1'));expect(h2(a,8,'whole')).toBe(h2(b,8,'whole'));await expect(evidence).toContainText('existing non-iterated whole-message hash');
});

test('cascade compression-call parts sum and include every H2 evaluation',async({page})=>{
 await openMulti(page,9,10);await runCascade(page);
 const cost=page.locator('#multi-cost'),h1Calls=Number(await cost.getAttribute('data-h1-calls')),h2Calls=Number(await cost.getAttribute('data-h2-calls')),total=Number(await cost.getAttribute('data-total-calls')),candidates=Number(await cost.getAttribute('data-candidate-count'));
 expect(h2Calls).toBe(candidates*11);expect(total).toBe(h1Calls+h2Calls);
});

test('naive 2n-bit comparison uses the birthday exponent and measured rate',async({page})=>{
 await openMulti(page,19,1);await runCascade(page);
 const cost=page.locator('#multi-cost');await expect(cost).toHaveAttribute('data-naive-kind','extrapolated');
 const evaluations=Number(await cost.getAttribute('data-naive-expected-evaluations')),calls=Number(await cost.getAttribute('data-naive-expected-calls')),rate=Number(await cost.getAttribute('data-naive-rate')),seconds=Number(await cost.getAttribute('data-naive-seconds'));
 expect(evaluations).toBeCloseTo(Math.sqrt(Math.PI/2)*2**19,10);expect(calls).toBeCloseTo(evaluations*4,8);expect(seconds).toBeCloseTo(calls/rate,10);
});

test('multicollision evidence retires on a changed input but not a no-op',async({page})=>{
 await openMulti(page,9,5);await buildForks(page);const bits=page.locator('#multi-n');await bits.fill('9');await bits.dispatchEvent('input');await expect(page.locator('[data-verdict="multi-forks"]')).toBeVisible();await bits.fill('10');await expect(page.locator('[data-verdict="multi-forks"]')).toHaveCount(0);await expect(page.locator('#multi-out')).toContainText('Retired: inputs changed');expect(await page.locator('[hidden]').evaluateAll(nodes=>nodes.filter(node=>getComputedStyle(node).display!=='none').length)).toBe(0);
});

test('every selected fork stays inspectable and stage-first choices match the message blocks',async({page})=>{
 await openMulti(page,8,4);await buildForks(page);
 for(const fork of [2,3,4,1]){
  await page.locator('#multi-flip-index').fill(String(fork));
  await expect(page.locator('[data-verdict="multi-forks"]')).toBeVisible();
  await page.locator('#multi-flip').click();
  const evidence=page.locator('#multi-flip-evidence');await expect(evidence).toHaveAttribute('data-fork',String(fork));
  const before=JSON.parse((await evidence.getAttribute('data-before-blocks'))!) as string[],after=JSON.parse((await evidence.getAttribute('data-after-blocks'))!) as string[];
  expect(after.map((v,i)=>v!==before[i]?i+1:0).filter(Boolean)).toEqual([fork]);
 }
 await page.locator('#multi-enumerate').click();
 await expect(page.locator('#multi-enumeration-evidence')).toBeVisible();
 for(const row of await page.locator('[data-multi-message]').all()){
  const mask=Number(await row.getAttribute('data-mask'));
  const expected=Array.from({length:4},(_,i)=>String((mask>>i)&1)).join('');
  await expect(row.locator('td').first()).toHaveText(expected);
 }
});

test('same-type meaningful collision is rejected despite matching hashes',async({page})=>{
 await boot(page);await page.getByRole('tab',{name:/Meaningful forgery/}).click();await page.locator('#same-type-check').click();const a=(await page.locator('[data-same-a]').textContent())!,b=(await page.locator('[data-same-b]').textContent())!;expect(a).not.toBe(b);expect(shortened(a,8)).toBe(shortened(b,8));expect(a).toContain('Alice is dismissed');expect(b).toContain('Alice is dismissed');expect(await page.locator('[data-verdict=same-type]').innerText()).toContain('SAME-TYPE REJECTED');
});
test('Floyd displays real same-type retries before the meaningful forgery',async({page})=>{
 await page.addInitScript(()=>{(window as any).Worker=class{constructor(){throw Error('Exercise inline fallback')}};let seed=0;const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=((a:any)=>{if(a instanceof Uint8Array&&a.length===8){a.fill(0);a[0]=seed++;return a}return original(a)}) as typeof crypto.getRandomValues});
 await boot(page);await page.getByRole('tab',{name:/Meaningful forgery/}).click();await page.locator('#t').fill('8');await page.locator('#meaning-method').selectOption('floyd');await page.locator('#forge').click();await expect.poll(()=>page.locator('#meaning-out .verdict').count()).toBeGreaterThan(0);expect(await page.locator('[data-verdict=forgery]').count()).toBe(1);
 const retries=page.locator('[data-retry]');expect(await retries.count()).toBe(4);for(const retry of await retries.all()){const a=(await retry.locator('[data-retry-a]').textContent())!,b=(await retry.locator('[data-retry-b]').textContent())!;expect(a).not.toBe(b);expect(shortened(a,8)).toBe(shortened(b,8));expect(a.includes('dismissed')).toBe(b.includes('dismissed'))}await collision(page);
});
test('actual salt draws occur only after precomputation has completed',async({page})=>{
 await page.addInitScript(()=>{(window as any).Worker=class{constructor(){throw Error('Exercise inline fallback')}};const original=crypto.getRandomValues.bind(crypto);(window as any).__saltPhases=[];crypto.getRandomValues=((a:any)=>{if(a instanceof Uint8Array&&a.length===16)(window as any).__saltPhases.push(document.querySelector<HTMLElement>('#salt-out')?.dataset.saltPhase??'unstarted');return original(a)}) as typeof crypto.getRandomValues});
 await boot(page);await page.getByRole('tab',{name:/Salt experiment/}).click();await page.locator('#salt').click();await expect(page.locator('[data-verdict=salt-negative]')).toBeVisible();const observed=await page.evaluate(()=>(window as any).__saltPhases);expect(observed).toHaveLength(20);expect(observed).toEqual(Array(20).fill('precompute-complete'));
});
test('partial-byte mask tooltip and required related labs are present',async({page})=>{
 await boot(page);for(const slug of ['hash-zoo','dnssec-chain','feistel-forge','grover'])expect(await page.locator(`a[href="https://systemslibrarian.github.io/crypto-lab-${slug}/"]`).count()).toBe(1);
 await page.getByRole('tab',{name:/Collision hunt/}).click();await page.locator('#t').fill('9');expect(await page.locator('#t').getAttribute('title')).toContain('mask 0x80');expect(await page.locator('#t').getAttribute('title')).toContain('Measured cap:');await page.getByRole('tab',{name:/Chained tables/}).click();expect(await page.locator('#panel').innerText()).toContain('Bcrypt Forge’s Scenario B');
});
