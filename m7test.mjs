import { io } from "socket.io-client";
import { execSync } from "node:child_process";
const URL="http://localhost:8080";
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const call=(s,e,p)=>new Promise(r=>s.emit(e,p,r));
const uuid=n=>{const c=String(n);return `${c.repeat(8)}-${c.repeat(4)}-4${c.repeat(3)}-8${c.repeat(3)}-${c.repeat(12)}`;};
const PSQL='/opt/homebrew/opt/postgresql@15/bin/psql -h /tmp -p 55432 -U postgres -d gamespaglu -qAtc';
const expire=(code)=>execSync(`${PSQL} "update gp.rounds set state = jsonb_set(state,'{deadlineAt}', to_jsonb((extract(epoch from now())*1000 - 5000)::bigint)) where room_code='${code}'"`);

const names=["Asha","Bilal","Chitra","Dev"];
const cs=names.map(()=>io(URL,{transports:["websocket"]}));
const st={}; cs.forEach((s,i)=>s.on("room:state",x=>{st[i]=x;}));
await wait(500);
const r=await call(cs[0],"room:create",{deviceId:uuid(1),name:names[0]});
const code=r.data.code;
for(let i=1;i<4;i++) await call(cs[i],"room:join",{deviceId:uuid(i+1),name:names[i],code});
await wait(300);
await call(cs[0],"round:start",{}); await wait(400);
console.log("deal has a deadline:", typeof st[0].round.deadlineAt === "number");
console.log("your own progress echoed:", st[0].your.hasClued===false, st[0].your.hasVoted===false);

// --- only two of four give a clue, then the clock runs out ---
await call(cs[0],"clue:submit",{word:"one"});
await call(cs[1],"clue:submit",{word:"two"});
await wait(300);
console.log("cluedBy visible while waiting:", JSON.stringify(st[0].round.cluedBy.length), "of 4");
console.log("clue words still hidden:", st[0].round.clues===null);
console.log("submitter knows it landed:", st[0].your.hasClued===true, "| non-submitter:", st[2].your.hasClued===false);

expire(code); await wait(3500);
console.log("\nCLUE TIMEOUT");
console.log("  phase now:", st[0].phase);
console.log("  skipped:", st[0].round.skipped.map(id=>st[0].players.find(p=>p.id===id)?.name).join(","));
console.log("  clues that were given still stand:", st[0].round.clues?.length);

// --- the exact stall: two people vote, two phones are locked ---
await call(cs[2],"vote:call",{}); await wait(400);
const ids=st[0].players.map(p=>p.id);
const gi = cs.findIndex((_,i)=>st[i].your.isGirgit);
const other = ids[(gi+1)%4];
await call(cs[gi===0?1:0],"vote:cast",{targetId:ids[gi]});
await wait(200);
console.log("\nVOTE");
console.log("  votedBy visible:", st[0].round.votedBy.length, "of 4");
console.log("  voter knows it landed:", st[gi===0?1:0].your.hasVoted===true);
console.log("  targets still hidden:", st[0].round.votes===null);
cs[2].disconnect(); cs[3].disconnect();   // two phones lock, as in the real game
await wait(500);
expire(code); await wait(3500);
console.log("  after timeout, phase:", st[0].phase, "(was stuck on 'vote' before)");
console.log("  accused:", st[0].players.find(p=>p.id===st[0].round.accused)?.name ?? "nobody");
if(st[0].phase==="escape"){ await call(cs[gi],"escape:guess",{cellIndex:0}); await wait(500); }
console.log("  outcome:", st[0].round.outcome, "| scores:", st[0].players.map(p=>`${p.name}:${p.score}`).join(" "));
cs.forEach(c=>{try{c.disconnect()}catch{}}); await wait(200); process.exit(0);
