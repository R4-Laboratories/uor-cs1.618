// Generated from model/round.prompt.json by scripts/prism-generate.mjs.
export function roundDecision(r:{bomb:"absent"|"planted"|"defused"|"exploded";attackers:number;defenders:number;clock:number}):'continue'|'attack'|'defend'{
 if(r.bomb === "defused")return "defend";
 if(r.bomb === "exploded")return "attack";
 if(r.defenders === 0)return "attack";
 if(r.attackers === 0&&r.bomb === "absent")return "defend";
 if(r.clock === 0&&r.bomb === "absent")return "defend";
 return "continue";
}
