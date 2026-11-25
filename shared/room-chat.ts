import {CHAT_MAX_LENGTH,type ChatError,type ChatMessage,type PublicPlayer} from './protocol';

type Seat=Pick<PublicPlayer,'id'|'name'|'team'|'bot'>;
interface Delivery {message:ChatMessage|ChatError;recipients:string[];}

/** One limiter per joined connection. The current match roster supplies identity and audience. */
export class SeatChat {
 private attempts:number[]=[];
 private warned=false;

 route(players:ReadonlyMap<string,Seat>,id:string,request:{channel?:unknown;text?:unknown},now=performance.now()):Delivery|undefined {
  const sender=players.get(id);
  if(!sender||sender.bot)return;
  const error=(message:string):Delivery=>({message:{type:'chat-error',message},recipients:[id]});
  this.attempts=this.attempts.filter(time=>now-time<5000);
  if(this.attempts.length>=4){
   if(this.warned)return;
   this.warned=true;
   return error('Chat is moving too quickly. Try again in a moment.');
  }
  this.attempts.push(now);
  this.warned=false;
  const {channel}=request;
  if(channel!=='all'&&channel!=='team')return error('Choose All or Team chat.');
  if(typeof request.text!=='string'||request.text.length>CHAT_MAX_LENGTH)return error(`Use up to ${CHAT_MAX_LENGTH} characters.`);
  const text=request.text.replace(/[\u0000-\u001f\u007f-\u009f]/gu,' ').replace(/[\u061c\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu,'').replace(/\s+/gu,' ').trim();
  if(!text)return error('Enter a message.');
  const recipients:string[]=[];
  for(const player of players.values()){
   if(!player.bot&&(channel==='all'||player.team===sender.team))recipients.push(player.id);
  }
  return {message:{type:'chat',channel,text,senderId:id,name:sender.name,team:sender.team},recipients};
 }
}
