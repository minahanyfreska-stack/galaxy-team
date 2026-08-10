const T=[
  ["jupiter","المشتري","Jupiter","🪐"],
  ["saturn","زحل","Saturn","💍"],
  ["neptune","نبتون","Neptune","🔵"],
  ["uranus","أورانوس","Uranus","🩵"]
];

const ADMIN_PASSWORD = "Galaxy2026";
let selected=null, member=null;

const $=id=>document.getElementById(id);
const key=k=>"galaxy_"+k;

function load(k, fallback){
  try { return JSON.parse(localStorage.getItem(key(k))) ?? fallback; }
  catch { return fallback; }
}
function save(k,v){ localStorage.setItem(key(k), JSON.stringify(v)); }

function team(t){ return T.find(x=>x[0]===t); }
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function teamsHTML(){
  $("teams").innerHTML=T.map(t=>`
    <div class="team ${selected===t[0]?"sel":""}" onclick="selected='${t[0]}';teamsHTML()">
      <div class="icon">${t[3]}</div><b>${t[1]}</b><small>${t[2]}</small>
    </div>`).join("");
}

function getMembers(){ return load("members",[]); }
function getPosts(){ return load("posts",[]); }
function getScores(){ return load("scores",T.map(t=>({id:t[0],score:0}))); }

function join(){
  const name=$("name").value.trim();
  if(name.length<2 || !selected){ $("msg").textContent="اكتب اسمك واختار فريقك."; return; }
  const members=getMembers();
  const existing=members.find(m=>m.name.toLowerCase()===name.toLowerCase());
  if(existing){
    member=existing;
  }else{
    member={id:Date.now().toString(),name,team:selected};
    members.push(member); save("members",members);
  }
  localStorage.setItem("memberId",member.id);
  showMember();
}

function showMember(){
  if(!member){
    const id=localStorage.getItem("memberId");
    member=getMembers().find(m=>m.id===id);
  }
  if(!member) return;
  $("join").classList.add("hidden");
  $("admin").classList.add("hidden");
  $("member").classList.remove("hidden");
  const t=team(member.team);
  $("memberName").textContent=member.name;
  $("memberTeam").textContent=`فريق ${t[1]} • ${t[2]}`;
  $("memberIcon").textContent=t[3];
  refreshMember();
}

function refreshMember(){
  const posts=getPosts();
  $("posts").innerHTML=posts
    .filter(p=>p.team==="all"||p.team===member.team)
    .slice().reverse()
    .map(p=>`<article class="post"><small>${esc(p.date)}</small><h3>${esc(p.title)}</h3><p>${esc(p.body).replace(/\n/g,"<br>")}</p></article>`)
    .join("") || "<p>لا يوجد محتوى حاليًا.</p>";

  const scores=getScores();
  const ranking=T.map(t=>({ ...t, score:(scores.find(s=>s.id===t[0])||{score:0}).score }))
    .sort((a,b)=>b.score-a.score);
  $("ranking").innerHTML=ranking.map((t,i)=>`
    <div class="rank"><span>#${i+1} ${t[3]} ${t[1]}</span><b>⭐ ${t.score}</b></div>`).join("");
}

function openAdmin(){ $("loginModal").classList.remove("hidden"); $("adminPass").focus(); }
function loginAdmin(){
  if($("adminPass").value!==ADMIN_PASSWORD){
    $("loginMsg").textContent="كلمة المرور غير صحيحة.";
    return;
  }
  $("loginMsg").textContent="";
  $("adminPass").value="";
  $("loginModal").classList.add("hidden");
  $("join").classList.add("hidden");
  $("member").classList.add("hidden");
  $("admin").classList.remove("hidden");
  refreshAdmin();
}

function refreshAdmin(){
  $("postTeam").innerHTML='<option value="all">كل الفرق</option>'+T.map(t=>`<option value="${t[0]}">${t[3]} ${t[1]}</option>`).join("");
  const members=getMembers();
  $("members").innerHTML=members.map(m=>{
    const t=team(m.team);
    return `<div class="member"><span>${t[3]} ${esc(m.name)}</span><small>${t[1]}</small></div>`;
  }).join("") || "لا يوجد أعضاء";

  const scores=getScores();
  $("scores").innerHTML=T.map(t=>{
    const s=scores.find(x=>x.id===t[0])||{score:0};
    return `<div class="score"><span>${t[3]} ${t[1]}: <b>${s.score}</b></span><button onclick="addScore('${t[0]}')">+100</button></div>`;
  }).join("");
}

function postContent(){
  const title=$("postTitle").value.trim(), body=$("postBody").value.trim(), t=$("postTeam").value;
  if(!title||!body){alert("اكتب عنوان وتفاصيل المنشور.");return;}
  const posts=getPosts();
  posts.push({title,body,team:t,date:new Date().toLocaleString("ar-EG")});
  save("posts",posts);
  $("postTitle").value=""; $("postBody").value="";
  alert("تم النشر 🚀");
  refreshAdmin();
}

function addScore(id){
  const scores=getScores();
  const s=scores.find(x=>x.id===id);
  s.score+=100;
  save("scores",scores);
  refreshAdmin();
}

$("joinBtn").onclick=join;
$("adminOpen").onclick=openAdmin;
$("closeModal").onclick=()=>$("loginModal").classList.add("hidden");
$("loginBtn").onclick=loginAdmin;
$("postBtn").onclick=postContent;
$("adminLogout").onclick=()=>{$("admin").classList.add("hidden");$("join").classList.remove("hidden");};
$("logout").onclick=()=>{
  localStorage.removeItem("memberId"); member=null;
  $("member").classList.add("hidden"); $("join").classList.remove("hidden");
};
$("adminPass").addEventListener("keydown",e=>{if(e.key==="Enter")loginAdmin();});

teamsHTML();
if(localStorage.getItem("memberId")) showMember();
