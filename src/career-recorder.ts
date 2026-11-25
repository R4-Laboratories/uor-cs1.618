import {mergeRow,type CareerMode,type CareerRow} from '../shared/career';
import type {CareerCount} from '../shared/protocol';

/** The authority repeats cumulative seat counters. A missed packet or a failed
 * write can be recovered from any later snapshot, including after a round reset. */
export class CareerRecorder {
  private owner:string|null=null;
  private pending:CareerRow|null=null;
  private saved:CareerRow|null=null;
  private active=false;
  private retryAfter=0;
  private unavailable=false;
  constructor(private readonly mode:CareerMode,owner:Promise<string|null>,
    private readonly write:(owner:string,rows:CareerRow[])=>Promise<void>,
    private readonly status:(text:string)=>void) {
    void owner.then(value=>{
      this.owner=value;
      if(value){this.status('Career connected · '+mode);void this.flush();}
      else this.status('Guest · connect a Prism ID to keep scores');
    }).catch(()=>this.status('Career unavailable · check the Prism identity page'));
  }
  observe(count:CareerCount|undefined) {
    if(!count||(!count.kills&&!count.deaths))return;
    try{this.pending=mergeRow(this.pending??undefined,{seat:count.seat,mode:this.mode,kills:count.kills,deaths:count.deaths});}
    catch{return;}
    void this.flush();
  }
  private async flush(){
    if(!this.owner||!this.pending||this.active||Date.now()<this.retryAfter)return;
    this.active=true;
    try {
      while(this.pending && (this.saved?.kills!==this.pending.kills||this.saved?.deaths!==this.pending.deaths)) {
        const row=this.pending;
        await this.write(this.owner,[row]);
        this.saved=row;
      }
      if(this.unavailable)this.status('Career saved');
      this.unavailable=false;
    }catch{
      if(!this.unavailable)this.status('Career save delayed · browser storage unavailable');
      this.unavailable=true;
      this.retryAfter=Date.now()+2000;
    }finally{this.active=false;}
  }
}
