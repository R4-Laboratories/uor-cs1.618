// Generated creative decision program. Edit the model, not this file.
import type {BotFacts,TacticAction} from './creative-program';
export const tacticsProgram = {"version":1,"rules":[{"when":{"any":[{"fact":"canPlant"},{"fact":"canDefuse"}]},"action":"interact"},{"when":{"fact":"empty"},"action":"reload"},{"when":{"fact":"enemy"},"action":"engage"},{"when":{"all":[{"fact":"lowAmmo"},{"not":{"fact":"enemy"}}]},"action":"reload"},{"when":{"fact":"planted"},"action":"advance"},{"when":{"all":[{"fact":"attacker"},{"fact":"dropped"}]},"action":"advance"},{"when":{"all":[{"fact":"attacker"},{"not":{"fact":"carrier"}}]},"action":"escort"},{"when":{"not":{"fact":"attacker"}},"action":"guard"}],"fallback":"advance"};
export function decideTactic(f:BotFacts):TacticAction|null {
 if((f.canPlant || f.canDefuse))return "interact";
 if(f.empty)return "reload";
 if(f.enemy)return "engage";
 if((f.lowAmmo && !(f.enemy)))return "reload";
 if(f.planted)return "advance";
 if((f.attacker && f.dropped))return "advance";
 if((f.attacker && !(f.carrier)))return "escort";
 if(!(f.attacker))return "guard";
 return "advance";
}
