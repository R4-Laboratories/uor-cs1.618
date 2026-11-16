import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newInvitation,parseInvitation,invitationUrl,networkConfig} from '../src/peer-config';
test('peer invitations round-trip in fragments without TURN credentials',()=>{
 const invite=newInvitation();const url=invitationUrl(invite,'https://example.com/game/?server=old');
 assert.equal(new URL(url).search,'');assert.deepEqual(parseInvitation(url),invite);
 assert.deepEqual(parseInvitation(`${invite.room}.${invite.token}`),invite);
 assert.throws(()=>parseInvitation('https://example.com/#p2p=bad'));
});
test('ICE configuration validates relay credentials and custom signaling',()=>{
 const config=networkConfig({stun:'stun:stun.l.google.com:19302',turn:'',username:'',credential:'',relay:false,signaling:''});
 assert.equal(config.ice.iceTransportPolicy,'all');assert.equal(config.signaling,undefined);
 assert.throws(()=>networkConfig({stun:'',turn:'',username:'',credential:'',relay:true,signaling:''}));
 assert.throws(()=>networkConfig({stun:'https://wrong',turn:'',username:'',credential:'',relay:false,signaling:''}));
 const custom=networkConfig({stun:'',turn:'turn:relay.example:3478',username:'u',credential:'p',relay:true,signaling:'https://signal.example/peerjs'});
 assert.equal(custom.ice.iceTransportPolicy,'relay');assert.equal(custom.signaling?.path,'/peerjs');
});
