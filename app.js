const SUPABASE_URL = "https://jbdjhdbbmfowdwmejdtw.supabase.co";
const SUPABASE_KEY = "sb_publishable_zF7z4wuwluqfPDfAH0-7qg_8-tjtrSr

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

/* =========================
   الفرق
========================= */

function teamsHTML() {
  $("teams").innerHTML = T.map(t => `
    <div class="team ${selected === t[0] ? "sel" : ""}"
         onclick="selectTeam('${t[0]}')">
      <div class="icon">${t[3]}</div>
      <b>${t[1]}</b>
      <small>${t[2]}</small>
    </div>
  `).join("");
}

function selectTeam(id) {
  selected = id;
  teamsHTML();
}

/* =========================
   الأعضاء
========================= */

async function join() {
  const name = $("name").value.trim();

  if (name.length < 2 || !selected) {
    $("msg").textContent = "اكتب اسمك واختار فريقك.";
    return;
  }

  try {
    const { data, error } = await sb
      .from("teams")
      .select("id,name");

    if (error) throw error;

    const selectedTeam = team(selected);

    if (!selectedTeam) {
      $("msg").textContent = "الفريق غير موجود.";
      return;
    }

    const databaseTeam = data.find(
      t => t.name === selectedTeam[1]
    );

    if (!databaseTeam) {
      $("msg").textContent = "الفريق غير موجود في قاعدة البيانات.";
      return;
    }

    const { data: newMember, error: insertError } = await sb
      .from("members")
      .insert({
        name: name,
        team_id: databaseTeam.id
      })
      .select()
      .single();

    if (insertError) throw insertError;

    member = {
      id: newMember.id,
      name: newMember.name,
      team: selected
    };

    localStorage.setItem("memberId", newMember.id);

    $("msg").textContent = "";

    showMember();

  } catch (error) {
    console.error(error);
    $("msg").textContent =
      "حصل خطأ أثناء التسجيل: " + error.message;
  }
}

/* =========================
   صفحة العضو
========================= */

async function showMember() {
  if (!member) return;

  $("join").classList.add("hidden");
  $("admin").classList.add("hidden");
  $("member").classList.remove("hidden");

  const t = team(member.team);

  $("memberName").textContent = member.name;
  $("memberTeam").textContent =
    `فريق ${t[1]} • ${t[2]}`;

  $("memberIcon").textContent = t[3];

  await refreshMember();
}

async function refreshMember() {
  if (!member) return;

  try {
    const { data: teams, error: teamsError } =
      await sb.from("teams").select("*");

    if (teamsError) throw teamsError;

    const currentTeam = team(member.team);

    const currentDatabaseTeam = teams.find(
      t => t.name === currentTeam[1]
    );

    const { data: posts, error: postsError } =
      await sb
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

    if (postsError) throw postsError;

    const visiblePosts = (posts || []).filter(p => {
      if (!p.team_id) return true;

      return currentDatabaseTeam &&
             p.team_id === currentDatabaseTeam.id;
    });

    $("posts").innerHTML =
      visiblePosts.map(p => `
        <article class="post">
          <small>
            ${new Date(p.created_at).toLocaleDateString("ar-EG")}
          </small>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.body).replace(/\n/g, "<br>")}</p>
        </article>
      `).join("") ||
      "<p>لا يوجد محتوى حاليًا.</p>";

    const ranking = [...(teams || [])]
      .sort((a, b) => b.score - a.score);

    $("ranking").innerHTML =
      ranking.map((t, i) => `
        <div class="rank">
          <span>
            #${i + 1} ${t.icon} ${esc(t.name)}
          </span>
          <b>⭐ ${t.score}</b>
        </div>
      `).join("");

  } catch (error) {
    console.error(error);
  }
}

/* =========================
   لوحة الإدارة
========================= */

async function refreshAdmin() {
  try {
    const { data: teams, error: teamsError } =
      await sb.from("teams").select("*").order("id");

    if (teamsError) throw teamsError;

    $("postTeam").innerHTML =
      '<option value="all">كل الفرق</option>' +
      (teams || []).map(t => `
        <option value="${t.id}">
          ${t.icon} ${esc(t.name)}
        </option>
      `).join("");

    const { data: members, error: membersError } =
      await sb
        .from("members")
        .select("*, teams(name,icon)")
        .order("created_at", { ascending: false });

    if (membersError) throw membersError;

    $("members").innerHTML =
      (members || []).map(m => `
        <div class="member">
          <span>
            ${m.teams?.icon || "👤"}
            ${esc(m.name)}
          </span>
          <small>
            ${esc(m.teams?.name || "بدون فريق")}
          </small>
        </div>
      `).join("") || "لا يوجد أعضاء";

    $("scores").innerHTML =
      (teams || []).map(t => `
        <div class="score">
          <span>
            ${t.icon} ${esc(t.name)}:
            <b>${t.score}</b>
          </span>

          <button onclick="changeScore(${t.id}, 10)">
            +10
          </button>

          <button onclick="changeScore(${t.id}, -10)">
            -10
          </button>
        </div>
      `).join("");

  } catch (error) {
    console.error(error);
    alert("خطأ في تحميل لوحة التحكم: " + error.message);
  }
}

/* =========================
   النقاط
========================= */

async function changeScore(teamId, amount) {
  try {
    const { data: current, error: getError } =
      await sb
        .from("teams")
        .select("score")
        .eq("id", teamId)
        .single();

    if (getError) throw getError;

    const newScore = current.score + amount;

    const { error } =
      await sb
        .from("teams")
        .update({ score: newScore })
        .eq("id", teamId);

    if (error) throw error;

    await refreshAdmin();

    if (member) {
      await refreshMember();
    }

  } catch (error) {
    console.error(error);
    alert("لم يتم تعديل النقاط: " + error.message);
  }
}

/* =========================
   نشر المحتوى
========================= */

async function publishPost() {
  const title = $("postTitle").value.trim();
  const body = $("postBody").value.trim();
  const selectedTeam = $("postTeam").value;

  if (!title || !body) {
    alert("اكتب عنوان وتفاصيل المنشور.");
    return;
  }

  try {
    let teamId = null;

    if (selectedTeam !== "all") {
      teamId = Number(selectedTeam);
    }

    const { error } =
      await sb
        .from("posts")
        .insert({
          title: title,
          body: body,
          team_id: teamId
        });

    if (error) throw error;

    $("postTitle").value = "";
    $("postBody").value = "";

    await refreshAdmin();

    if (member) {
      await refreshMember();
    }

    alert("تم النشر 🚀");

  } catch (error) {
    console.error(error);
    alert("لم يتم النشر: " + error.message);
  }
}

/* =========================
   خروج العضو
========================= */

function logout() {
  localStorage.removeItem("memberId");

  member = null;
  selected = null;

  $("member").classList.add("hidden");
  $("admin").classList.add("hidden");
  $("join").classList.remove("hidden");

  $("name").value = "";

  teamsHTML();
}

/* =========================
   الإدارة
========================= */

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

async function loginAdmin() {
  const password = $("adminPass").value;

  if (password !== ADMIN_PASSWORD) {
    $("loginMsg").textContent =
      "كلمة المرور غير صحيحة.";
    return;
  }

  admin = true;

  $("loginModal").classList.add("hidden");
  $("join").classList.add("hidden");
  $("member").classList.add("hidden");
  $("admin").classList.remove("hidden");

  await refreshAdmin();
}

/* =========================
   الأزرار
========================= */

$("joinBtn").onclick = join;
$("adminOpen").onclick = openAdmin;
$("closeModal").onclick = closeAdmin;
$("loginBtn").onclick = loginAdmin;
$("postBtn").onclick = publishPost;
$("logout").onclick = logout;
$("adminLogout").onclick = adminLogout;

/* =========================
   البداية
========================= */

teamsHTML();

const savedMemberId =
  localStorage.getItem("memberId");

if (savedMemberId) {

  sb
    .from("members")
    .select("*, teams(name)")
    .eq("id", savedMemberId)
    .single()
    .then(({ data, error }) => {

      if (error || !data) {
        localStorage.removeItem("memberId");
        return;
      }

      const foundTeam =
        T.find(t => t[1] === data.teams?.name);

      if (!foundTeam) return;

      member = {
        id: data.id,
        name: data.name,
        team: foundTeam[0]
      };

      showMember();
    });
}
