const $=id=>document.getElementById(id);

function makeInputs(id){
  const box=$(id); box.innerHTML="";
  for(let i=0;i<10;i++){
    const input=document.createElement("input");
    input.type="text"; input.placeholder=`${i+1}`;
    input.dataset.i=i;
    box.appendChild(input);
  }
}
makeInputs("inputsA"); makeInputs("inputsB");

function parseTeam(id){
  return [...$(id).querySelectorAll("input")].map(x=>{
    const m=x.value.trim().match(/^(\d+)\s*[-:]\s*(\d+)$/);
    return m ? {gf:+m[1],gc:+m[2]} : null;
  }).filter(Boolean);
}
function pct(arr,fn){return arr.length ? arr.filter(fn).length/arr.length*100:0}
function avg(arr,fn){return arr.length ? arr.reduce((s,x)=>s+fn(x),0)/arr.length:0}
function fmt(n){return n.toFixed(1)}
function teamStats(g){
 return {
  n:g.length, gf:avg(g,x=>x.gf), gc:avg(g,x=>x.gc),
  over15:pct(g,x=>x.gf+x.gc>=2),
  over25:pct(g,x=>x.gf+x.gc>=3),
  under35:pct(g,x=>x.gf+x.gc<=3),
  btts:pct(g,x=>x.gf>0&&x.gc>0),
  win:pct(g,x=>x.gf>x.gc),
  draw:pct(g,x=>x.gf===x.gc),
  loss:pct(g,x=>x.gf<x.gc),
  clean:pct(g,x=>x.gc===0),
  scored:pct(g,x=>x.gf>0),
  failed:pct(g,x=>x.gf===0)
 };
}
function combine(a,b,key,mode="avg"){
 return mode==="min"?Math.min(a[key],b[key]):(a[key]+b[key])/2;
}
function addBet(list,name,value,detail){
 let score=Math.max(0,Math.min(99,value));
 list.push({name,score,detail});
}
function analyze(){
 const A=parseTeam("inputsA"), B=parseTeam("inputsB");
 if(A.length<10||B.length<10){alert("Cargá exactamente 10 resultados válidos por equipo (GF-GC).");return}
 const a=teamStats(A), b=teamStats(B), bets=[];
 addBet(bets,"Más de 1.5 goles",combine(a,b,"over15"),`${fmt(a.over15)}% A · ${fmt(b.over15)}% B`);
 addBet(bets,"Menos de 3.5 goles",combine(a,b,"under35"),`${fmt(a.under35)}% A · ${fmt(b.under35)}% B`);
 addBet(bets,"Ambos equipos marcan",combine(a,b,"btts","min"),`${fmt(a.btts)}% A · ${fmt(b.btts)}% B`);
 addBet(bets,`${$("teamA").value||"Equipo A"} marca`,combine(a,b,"scored","min"),`${fmt(a.scored)}% A · ${fmt(b.scored)}% B`);
 addBet(bets,`${$("teamB").value||"Equipo B"} marca`,combine(b,a,"scored","min"),`${fmt(b.scored)}% B · ${fmt(a.scored)}% A`);
 addBet(bets,`${$("teamA").value||"Equipo A"} gana`,a.win,`${fmt(a.win)}% victorias recientes`);
 addBet(bets,`${$("teamB").value||"Equipo B"} gana`,b.win,`${fmt(b.win)}% victorias recientes`);
 addBet(bets,"Doble oportunidad A o empate",100-a.loss,`${fmt(100-a.loss)}% A no perdió`);
 addBet(bets,"Doble oportunidad B o empate",100-b.loss,`${fmt(100-b.loss)}% B no perdió`);
 bets.sort((x,y)=>y.score-x.score);
 render(A,B,a,b,bets);
}
function render(A,B,a,b,bets){
 $("results").classList.remove("hidden");
 $("summary").innerHTML=[
  ["Prom. goles A",fmt(a.gf)],["Prom. goles B",fmt(b.gf)],
  ["Prom. recibidos A",fmt(a.gc)],["Prom. recibidos B",fmt(b.gc)],
  ["Over 1.5 A/B",`${fmt(a.over15)}% / ${fmt(b.over15)}%`],
  ["Over 2.5 A/B",`${fmt(a.over25)}% / ${fmt(b.over25)}%`],
  ["BTTS A/B",`${fmt(a.btts)}% / ${fmt(b.btts)}%`],
  ["Portería a cero A/B",`${fmt(a.clean)}% / ${fmt(b.clean)}%`]
 ].map(x=>`<div class="stat">${x[0]}<b>${x[1]}</b></div>`).join("");
 $("bets").innerHTML=bets.map((b,i)=>{
   const cls=b.score>=75?"high":b.score>=60?"medium":"low";
   return `<div class="bet"><div><b>${i+1}. ${b.name}</b><div class="hint">${b.detail}</div></div><div class="confidence">${b.score.toFixed(0)}%</div><div class="tag ${cls}">${b.score>=75?"ALTA":b.score>=60?"MEDIA":"BAJA"}</div></div>`
 }).join("");
 const warnings=[];
 if(Math.abs(a.gf-b.gf)>1.2) warnings.push("Hay una diferencia importante en producción ofensiva entre los equipos.");
 if(a.btts<50&&b.btts<50) warnings.push("BTTS tiene poco respaldo: ambos equipos muestran baja frecuencia de marcar y recibir.");
 if(a.over25<50&&b.over25<50) warnings.push("El Over 2.5 no tiene respaldo fuerte en los datos cargados.");
 warnings.push("La puntuación no incorpora cuotas, localía, lesiones, alineaciones, motivación ni información en vivo.");
 $("warnings").innerHTML=warnings.map(x=>`<div class="warning">• ${x}</div>`).join("");
 window.scrollTo({top:$("results").offsetTop-10,behavior:"smooth"});
}
$("analyze").onclick=analyze;
$("demoBtn").onclick=()=>{
 const A=["2-0","1-1","2-1","1-0","0-0","3-1","2-0","1-0","2-2","1-0"];
 const B=["0-1","1-1","0-0","1-0","1-2","0-1","2-1","0-0","1-1","0-2"];
 [...$("inputsA").querySelectorAll("input")].forEach((x,i)=>x.value=A[i]);
 [...$("inputsB").querySelectorAll("input")].forEach((x,i)=>x.value=B[i]);
 $("teamA").value="Local"; $("teamB").value="Visitante";
 analyze();
};