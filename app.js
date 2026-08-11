const T = [
  ["jupiter", "المشتري", "Jupiter", "🪐"],
  ["saturn", "زحل", "Saturn", "💍"],
  ["neptune", "نبتون", "Neptune", "🔵"],
  ["uranus", "أورانوس", "Uranus", "🩵"]
];
let selected = null;
let member = null;
let admin = false;
const $ = id => document.getElementById(id);
const ADMIN_PASSWORD = "1234";
const defaultData = {
  members: [],
  posts: [],
  teams: [
    { id: "jupiter", name: "المشتري", icon: "🪐", score: 0 },
    { id: "saturn", name: "زحل", icon: "💍", score: 0 },
    { id: "neptune", name: "نبتون", icon: "🔵", score: 0 },
    { id: "uranus", name: "أورانوس", icon: "🩵", score: 0 }
  ]
};
function getData() {
  const saved = localStorage.getItem("galaxyData");
  if (!saved) {
    localStorage.setItem("galaxyData", JSON.stringify(defaultData));
    return JSON.parse(JSON.stringify(defaultData));
  }
  return JSON.parse(saved);
}
function saveData(data) {
  localStorage.setItem("galaxyData", JSON.stringify(data));
}
function team(id) {
  return T.find(x => x[0] === id);
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}
function teamsHTML() {
  $("teams").innerHTML = T.map(t => `
    <div class="team ${selected === t[0] ? "sel" : ""}"
         onclick="selected='${t[0]}';teamsHTML()">
      <div class="icon">${t[3]}</div>
      <b>${t[1]}</b>
      <small>${t[2]}</small>
    </div>
  `).join("");
}
function join() {
  const name = $("name").value.trim();
  if (name.length < 2 || !selected) {
    $("msg").textContent = "اكتب اسمك واختار فريقك.";
    return;
  }
  const data = getData();
  const memberData = {
    id: Date.now().toString(),
    name,
    team: selected
  };
  data.members.push(memberData);
  saveData(data);
  member = memberData;
  localStorage.setItem("memberId", member.id);
  $("msg").textContent = "";
  showMember();
}
function showMember() {
  if (!member) return;
  $("join").classList.add("hidden");
  $("admin").classList.add("hidden");
  $("member").classList.remove("hidden");
  const t = team(member.team);
  $("memberName").textContent = member.name;
  $("memberTeam").textContent = `فريق ${t[1]} • ${t[2]}`;
  $("memberIcon").textContent = t[3];
  refreshMember();
}
function refreshMember() {
  const data = getData();
  const posts = data.posts.filter(
    p => p.team === "all" || p.team === member.team
  );
  $("posts").innerHTML =
    posts.map(p => `
      <article class="post">
        <small>${esc(p.date)}</small>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.body).replace(/\n/g, "<br>")}</p>
      </article>
    `).join("") || "<p>لا يوجد محتوى حاليًا.</p>";
  const ranking = [...data.teams]
    .sort((a, b) => b.score - a.score);
  $("ranking").innerHTML = ranking.map((t, i) => `
    <div class="rank">
      <span>#${i + 1} ${t.icon} ${t.name}</span>
      <b>⭐ ${t.score}</b>
    </div>
  `).join("");
}
function refreshAdmin() {
  const data = getData();
  $("postTeam").innerHTML =
    '<option value="all">كل الفرق</option>' +
    T.map(t =>
      `<option value="${t[0]}">${t[3]} ${t[1]}</option>`
    ).join("");
  $("members").innerHTML =
    data.members.map(m => {
      const t = team(m.team);
      return `
        <div class="member">
          <span>${t[3]} ${esc(m.name)}</span>
          <small>${t[1]}</small>
        </div>
      `;
    }).join("") || "لا يوجد أعضاء";
  $("scores").innerHTML = data.teams.map(t => `
    <div class="score">
      <span>${t.icon} ${t.name}: <b>${t.score}</b></span>
      <button onclick="addScore('${t.id}')">+100</button>
    </div>
  `).join("");
}
function addScore(id) {
  const data = getData();
  const t = data.teams.find(team => team.id === id);
  if (!t) return;
  t.score += 100;
  saveData(data);
  refreshAdmin();
  if (member) {
    refreshMember();
  }
}
function publishPost() {
  const title = $("postTitle").value.trim();
  const body = $("postBody").value.trim();
  const selectedTeam = $("postTeam").value;
  if (!title || !body) {
    alert("اكتب عنوان وتفاصيل المنشور.");
    return;
  }
  const data = getData();
  data.posts.unshift({
    id: Date.now().toString(),
    title,
    body,
    team: selectedTeam,
    date: new Date().toLocaleDateString("ar-EG")
  });
  saveData(data);
  $("postTitle").value = "";
  $("postBody").value = "";
  refreshAdmin();
  if (member) {
    refreshMember();
  }
  alert("تم النشر 🚀");
}
function logout() {
  localStorage.removeItem("memberId");
  member = null;
  $("member").classList.add("hidden");
  $("admin").classList.add("hidden");
  $("join").classList.remove("hidden");
  $("name").value = "";
  selected = null;
  teamsHTML();
}
function adminLogout() {
  admin = false;
  $("admin").classList.add("hidden");
  $("join").classList.remove("hidden");
}
function openAdmin() {
  $("loginModal").classList.remove("hidden");
  $("adminPass").value = "";
  $("loginMsg").textContent = "";
}
function closeAdmin() {
  $("loginModal").classList.add("hidden");
}
function loginAdmin() {
  const password = $("adminPass").value;
  if (password !== ADMIN_PASSWORD) {
    $("loginMsg").textContent = "كلمة المرور غير صحيحة.";
    return;
  }
  admin = true;
  $("loginModal").classList.add("hidden");
  $("join").classList.add("hidden");
  $("member").classList.add("hidden");
  $("admin").classList.remove("hidden");
  refreshAdmin();
}
$("joinBtn").onclick = join;
$("adminOpen").onclick = openAdmin;
$("closeModal").onclick = closeAdmin;
$("loginBtn").onclick = loginAdmin;
$("postBtn").onclick = publishPost;
$("logout").onclick = logout;
$("adminLogout").onclick = adminLogout;
teamsHTML();
const savedMemberId = localStorage.getItem("memberId");
if (savedMemberId) {
  const data = getData();
  const savedMember = data.members.find(
    m => m.id === savedMemberId
  );
  if (savedMember) {
    member = savedMember;
    showMember();
  } else {
    localStorage.removeItem("memberId");
  }
}
