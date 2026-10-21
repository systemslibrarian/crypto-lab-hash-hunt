import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {assertNormalExit,validateNamedRun} from './mutation-report.mjs';
const specs=JSON.parse(readFileSync(new URL('./mutations.json',import.meta.url),'utf8'));
function command(args){const p=spawnSync(args[0],args.slice(1),{encoding:'utf8',env:{...process.env,CI:'1'},timeout:300000,maxBuffer:5e6});assertNormalExit(p,args[0]);return {...p,ok:p.status===0,text:(p.stdout||'')+(p.stderr||'')};}
function hash(){const h=createHash('sha256');for(const file of readdirSync('dist/assets').filter(f=>f.endsWith('.js')).sort())h.update(readFileSync('dist/assets/'+file));return h.digest('hex');}
const dirty=command(['git','status','--porcelain']);if(!dirty.ok||dirty.text.trim())throw Error('Commit source changes before mutations');
const reports=[];
for(const m of specs){const original=readFileSync(m.file,'utf8');if(original.split(m.anchor).length!==2)throw Error('Mutation anchor is not unique: '+m.name);const args=['npx','playwright','test','e2e/claims.spec.ts','--retries=0','-g',m.test,'--reporter=json'];const baseline=command(args);validateNamedRun(baseline,m.test,true);const before=hash();let result;
 try{const patched=original.replace(m.anchor,m.replacement);if(patched===original)throw Error('Empty mutation');writeFileSync(m.file,patched);const build=command(['npm','run','build']);if(!build.ok)throw Error('DOES NOT BUILD: '+m.name+'\n'+build.text);if(hash()===before)throw Error('Bundle did not move: '+m.name);result=command(args);validateNamedRun(result,m.test,false);reports.push({name:m.name,test:m.test,baseline:'passed',sourceChanged:true,bundleMoved:true,killed:true});console.log('KILLED: '+m.name+' -> '+m.test);
 }finally{writeFileSync(m.file,original);const restored=command(['npm','run','build']);if(!restored.ok||hash()!==before)throw Error('Restore failed: '+m.name);}
 const after=command(args);validateNamedRun(after,m.test,true);
}
if(!existsSync('dist'))throw Error('Missing build');writeFileSync('mutation-results.json',JSON.stringify(reports,null,2)+'\n');console.log(reports.length+' / '+specs.length+' mutations killed and restored');
