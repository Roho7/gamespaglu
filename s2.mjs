import { io } from "socket.io-client";
const URL="https://gamespaglu-server.fly.dev";
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const call=(s,e,p)=>new Promise(r=>s.emit(e,p,r));
const uuid=n=>{const c=String(n);return `${c.repeat(8)}-${c.repeat(4)}-4${c.repeat(3)}-8${c.repeat(3)}-${c.repeat(12)}`;};
const cs=[0,1,2,3].map(()=>io(URL,{transports:["websocket"]}));
const st={}; cs.forEach((s,i)=>s.on("room:state",x=>{st[i]=x;}));
await wait(1200);
const r=await call(cs[0],"room:create",{deviceId:uuid(3),name:"Q0"});
const code=r.data.code;
for(let i=1;i<4;i++){ const j=await call(cs[i],"room:join",{deviceId:uuid(i+3),name:"Q"+i,code}); if(!j.ok) console.log("join",i,j.error); }
await wait(700);
console.log("players:", st[0].players.length, "| packs:", st[0].packs.join(","));
console.log("start (all packs):", JSON.stringify(await call(cs[0],"round:start",{})));
await wait(700);
console.log("round:", st[0].round ? st[0].round.theme : null);
