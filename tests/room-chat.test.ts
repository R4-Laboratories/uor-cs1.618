import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CHAT_MAX_LENGTH} from '../shared/protocol';
import {SeatChat} from '../shared/room-chat';

const roster=new Map([
 ['p',{id:'p',name:'Player',team:'attack' as const,bot:false}],
 ['b',{id:'b',name:'Bot',team:'attack' as const,bot:true}],
]);
test('room chat rejects unknown senders, bots, empty or malformed text, and invalid channels',()=>{
 const request={channel:'all',text:'ready'};
 assert.equal(new SeatChat().route(roster,'absent',request),undefined);
 assert.equal(new SeatChat().route(roster,'b',request),undefined);
 for(const invalid of [
  {text:'   \r\n\u202e\x7f',channel:'all'},
  {text:123,channel:'all'},{text:'test',channel:'attack'},
  {text:'x'.repeat(CHAT_MAX_LENGTH+1),channel:'team'}
 ]){
  const delivery=new SeatChat().route(roster,'p',invalid);
  assert.equal(delivery?.message.type,'chat-error');
  assert.deepEqual(delivery.recipients,['p']);
 }
});
test('room chat accepts the length limit exactly and excludes bots in practice',()=>{
 for(const channel of ['all','team']){
  const text='é'.repeat(CHAT_MAX_LENGTH);
  assert.deepEqual(new SeatChat().route(roster,'p',{channel,text}),{
   recipients:['p'],message:{type:'chat',channel,text,senderId:'p',team:'attack',name:'Player'}
  });
 }
});
