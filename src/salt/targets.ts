import {hash,randomHex} from '../hash/truncate';
// Created only after preprocessing. No table builder is imported or supplied the salt.
export function freshSaltedTarget(message:string,t:number){const salt=randomHex(16);return {salt,y:hash('salt:'+salt+'|'+message,t)};}
