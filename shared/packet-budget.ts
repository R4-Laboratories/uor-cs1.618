/** Rendering stalls can deliver several seconds of disposable movement updates at once.
 * Leave room for reliable purchases and final scores while bounding messages forwarded. */
export class PacketBudget {
 private window=-Infinity;
 private received=0;
 private admitted=0;
 private credit=20;
 private previous=0;
 take(now:number,replaceable:boolean):'accept'|'skip'|'close'{
  if(now-this.window>=1000){this.window=now;this.received=0;this.admitted=0;}
  // Sustained or very large streams still disconnect, including on the fast channel.
  if(++this.received>300)return 'close';
  this.credit=Math.min(20,this.credit+Math.max(0,now-this.previous)*.09);
  this.previous=now;
  if(replaceable){
   if(this.credit<1)return 'skip';
   this.credit--;
  }
  return ++this.admitted>150?'close':'accept';
 }
}
