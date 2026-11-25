import type {CareerCount} from './protocol';
import {sealCareer, verifyCareerSeal, type CareerKey, type CareerSeal} from './hologram-identity';

export type CareerMode = 'multiplayer' | 'practice';
export interface CareerRow extends CareerCount { mode:CareerMode }
export interface CareerBackup {schema:'cs1618/career/1'; owner:string; rows:CareerRow[]; seal:CareerSeal}

function checkRow(row:CareerRow) {
  if(!row || !/^[0-9a-f]{32}$/.test(row.seat) || !['practice','multiplayer'].includes(row.mode)
    || !Number.isSafeInteger(row.kills) || row.kills<0 || !Number.isSafeInteger(row.deaths) || row.deaths<0) throw Error('Invalid career checkpoint.');
}
export function mergeRow(old:CareerRow|undefined, row:CareerRow):CareerRow {
  checkRow(row);
  if(old && (old.mode!==row.mode || old.seat!==row.seat)) throw Error('Conflicting career checkpoint.');
  return {seat:row.seat,mode:row.mode,kills:Math.max(old?.kills??0,row.kills),deaths:Math.max(old?.deaths??0,row.deaths)};
}
export function careerTotals(rows:CareerRow[],mode:CareerMode) {
  let kills=0,deaths=0;
  for(const row of rows) if(row.mode===mode){kills+=row.kills;deaths+=row.deaths;}
  if(!Number.isSafeInteger(kills)||!Number.isSafeInteger(deaths))throw Error('Career totals are too large.');
  return {kills,deaths,ratio:deaths?(kills/deaths).toFixed(2):kills?'∞':'—'};
}

async function rowsDigest(rows:CareerRow[]) {
  const ids=new Set<string>();
  const values=rows.map(row=>{
    checkRow(row);
    if(ids.has(row.seat)) throw Error('Repeated career checkpoint.');
    ids.add(row.seat);
    return [row.seat,row.mode,row.kills,row.deaths];
  });
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(values)));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function backupCareer(key:CareerKey,app:string,rows:CareerRow[]):Promise<CareerBackup> {
  const challenge=await rowsDigest(rows);
  const seal=await sealCareer(key,app,'backup',challenge);
  await verifyCareerSeal(seal,key.owner,app,'backup',challenge);
  return {schema:'cs1618/career/1',owner:key.owner,rows,seal};
}
export async function verifyBackup(input:CareerBackup,key:CareerKey,app:string) {
  if(input?.schema!=='cs1618/career/1'||input.owner!==key.owner||!Array.isArray(input.rows))throw Error('Select a signed backup for your current Prism ID.');
  const challenge=await rowsDigest(input.rows);
  await verifyCareerSeal(input.seal,key.owner,app,'backup',challenge);
  return input.rows;
}
