/* =====================================================
   INFINITY - APP.JS
===================================================== */

const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_zF7z4wuwluqfPDfAH0-7qg_8-tjtrSr"

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =====================================================
   INFINITY PLANETS
===================================================== */

const T = [
  {
    id: 1,
    name: "المشتري",
    english: "Jupiter",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg"
  },
  {
    id: 2,
    name: "زحل",
    english: "Saturn",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg"
  },
  {
    id: 3,
    name: "نبتون",
    english: "Neptune",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg"
  },
  {
    id: 4,
    name: "أورانوس",
    english: "Uranus",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg"
  }
];

let member = null;
let admin = false;
let scanner = null;

const ADMIN_PASSWORD = "1234";


/* =====================================================
   HELPERS
===================================================== */

function $(id) {
  return document.getElementById(id);
}

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c])
  );
}

function getTeam(id) {
  return T.find(t => Number(t.id) === Number(id));
}


/* =====================================================
   RENDER PLANETS
===================================================== */

function renderTeams() {
  const box = $("teams");

  if (!box) return;

  box.innerHTML = T.map(team => `
    <div class="team-card">

      <div class="planet-box">
        <img
          src="${team.image}"
          alt="${esc(team.name)}"
          onerror="this.src='';"
        >
      </div>

      <div class="team-info">
        <span>PLANET TEAM</span>

        <h2>${esc(team.name)}</h2>

        <p>${esc(team.english)}</p>
      </div>

    </div>
  `).join("");
}


/* =====================================================
   DATABASE TEAMS
===================================================== */

async function loadDatabaseTeams() {
  const { data, error } = await sb
    .from("teams")
    .select("*")
    .order("id");

  if (error) {
    console.error("Teams:", error);
    return [];
  }

  return data || [];
}


/* =====================================================
   ADMIN TEAM SELECT
===================================================== */

async function loadAdminTeamSelects() {

  const memberSelect = $("newMemberTeam");
  const postSelect = $("postTeam");

  if (!memberSelect) return;

  const teams = await loadDatabaseTeams();

  /*
    لو قاعدة البيانات فيها الفرق
  */

  if (teams.length) {

    memberSelect.innerHTML = `
      <option value="">اختر الفريق</option>

      ${teams.map(team => `
        <option value="${team.id}">
          ${esc(team.name)}
        </option>
      `).join("")}
    `;

    if (postSelect) {
      postSelect.innerHTML = `
        <option value="all">كل الفرق</option>

        ${teams.map(team => `
          <option value="${team.id}">
            ${esc(team.name)}
          </option>
        `).join("")}
      `;
    }

    return;
  }

  /*
    FALLBACK
  */

  memberSelect.innerHTML = `
    <option value="">اختر الفريق</option>
    <option value="1">المشتري</option>
    <option value="2">زحل</option>
    <option value="3">نبتون</option>
    <option value="4">أورانوس</option>
  `;

  if (postSelect) {
    postSelect.innerHTML = `
      <option value="all">كل الفرق</option>
      <option value="1">المشتري</option>
      <option value="2">زحل</option>
      <option value="3">نبتون</option>
      <option value="4">أورانوس</option>
    `;
  }
}


/* =====================================================
   GENERATE CODE
===================================================== */

function generateCode() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "INF-";

  for (let i = 0; i < 6; i++) {
    code += chars[
      Math.floor(
        Math.random() * chars.length
      )
    ];
  }

  return code;
}


/* =====================================================
   SHOW JOIN
===================================================== */

function showJoin() {

  $("join")?.classList.remove("hidden");
  $("member")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
}


/* =====================================================
   ADMIN LOGIN
===================================================== */

function openAdmin() {

  $("loginModal")?.classList.remove("hidden");

  if ($("adminPass")) {
    $("adminPass").value = "";
  }
}

function closeAdmin() {
  $("loginModal")?.classList.add("hidden");
}

async function loginAdmin() {

  const password =
    $("adminPass")?.value || "";

  if (password !== ADMIN_PASSWORD) {

    $("loginMsg").textContent =
      "كلمة المرور غير صحيحة.";

    return;
  }

  admin = true;

  $("loginModal")?.classList.add("hidden");
  $("join")?.classList.add("hidden");
  $("member")?.classList.add("hidden");
  $("admin")?.classList.remove("hidden");

  await loadAdminTeamSelects();
  await refreshAdmin();
}

function adminLogout() {

  admin = false;

  $("admin")?.classList.add("hidden");
  $("join")?.classList.remove("hidden");
}


/* =====================================================
   ADD MEMBER
===================================================== */

async function addMember() {

  const name =
    $("newMemberName")?.value.trim();

  const teamId =
    $("newMemberTeam")?.value;

  const result =
    $("newMemberResult");

  if (!name) {
    alert("اكتب اسم العضو.");
    return;
  }

  if (!teamId) {
    alert("اختار الفريق.");
    return;
  }

  try {

    /*
      إنشاء كود جديد
    */

    let accessCode = generateCode();

    /*
      نتأكد إن الكود غير مستخدم
    */

    for (let i = 0; i < 10; i++) {

      const { data, error } = await sb
        .from("members")
        .select("id")
        .eq("access_code", accessCode)
        .limit(1);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        break;
      }

      accessCode = generateCode();
    }


    /*
      إضافة العضو
    */

    const { data, error } = await sb
      .from("members")
      .insert({
        name: name,
        team_id: Number(teamId),
        access_code: accessCode,
        score: 0
      })
      .select()
      .single();

    if (error) {
      throw error;
    }


    /*
      نجاح
    */

    if ($("newMemberName")) {
      $("newMemberName").value = "";
    }

    if ($("newMemberTeam")) {
      $("newMemberTeam").value = "";
    }

    if (result) {

      result.innerHTML = `
        <div class="login-result">

          <h3>تم إنشاء العضو ✅</h3>

          <p>
            الاسم:
            <b>${esc(data.name)}</b>
          </p>

          <p>
            كود الدخول:
          </p>

          <strong>
            ${esc(data.access_code)}
          </strong>

        </div>
      `;
    }

    await refreshAdmin();

    alert("تم إضافة العضو بنجاح ✅");

  } catch (error) {

    console.error(
      "ADD MEMBER ERROR:",
      error
    );

    alert(
      "لم يتم إضافة العضو:\n" +
      error.message
    );
  }
}


/* =====================================================
   LOGIN MEMBER
===================================================== */

async function loginWithCode() {

  const input = $("accessCode");

  if (!input) return;

  const code =
    input.value.trim().toUpperCase();

  if (!code) {
    $("msg").textContent =
      "اكتب كود الدخول.";
    return;
  }

  try {

    const { data, error } = await sb
      .from("members")
      .select(`
        id,
        name,
        team_id,
        access_code,
        photo_url,
        teams (
          id,
          name
        )
      `)
      .eq("access_code", code)
      .single();

    if (error || !data) {

      $("msg").textContent =
        "كود الدخول غير صحيح.";

      return;
    }

    member = {
      id: data.id,
      name: data.name,
      teamId: data.team_id,
      accessCode: data.access_code,
      photoUrl: data.photo_url || ""
    };

    localStorage.setItem(
      "memberId",
      String(data.id)
    );

    await showMember();

  } catch (error) {

    console.error(error);

    $("msg").textContent =
      "حدث خطأ أثناء تسجيل الدخول.";
  }
}


/* =====================================================
   SHOW MEMBER
===================================================== */

async function showMember() {

  if (!member) return;

  $("join")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
  $("member")?.classList.remove("hidden");

  const team =
    getTeam(member.teamId);

  if ($("memberName")) {
    $("memberName").textContent =
      member.name;
  }

  if ($("memberTeam")) {

    $("memberTeam").textContent =
      team
        ? `فريق ${team.name} • ${team.english}`
        : "بدون فريق";
  }

  if ($("memberPhoto")) {

    $("memberPhoto").src =
      member.photoUrl ||
      team?.image ||
      "";
  }

  await refreshMember();
}


/* =====================================================
   REFRESH MEMBER
===================================================== */

async function refreshMember() {

  if (!member) return;

  try {

    const {
      data: posts
    } = await sb
      .from("posts")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    const visible =
      (posts || []).filter(post =>
        post.team_id == null ||
        Number(post.team_id) ===
        Number(member.teamId)
      );

    if ($("posts")) {

      $("posts").innerHTML =
        visible.length
          ? visible.map(post => `
              <article class="post">

                <small>
                  ${new Date(
                    post.created_at
                  ).toLocaleString("ar-EG")}
                </small>

                <h3>
                  ${esc(post.title)}
                </h3>

                <p>
                  ${esc(post.body)}
                </p>

                ${
                  post.image_url
                    ? `
                      <img
                        class="post-image"
                        src="${esc(
                          post.image_url
                        )}"
                      >
                    `
                    : ""
                }

              </article>
            `).join("")
          : "<p>لا يوجد محتوى حاليًا.</p>";
    }


    const {
      data: teams
    } = await sb
      .from("teams")
      .select("*")
      .order("score", {
        ascending: false
      });

    if ($("ranking")) {

      $("ranking").innerHTML =
        (teams || []).map(
          (team, index) => {

            const planet =
              T.find(t =>
                Number(t.id) ===
                Number(team.id)
              );

            return `
              <div class="rank">

                <span>
                  #${index + 1}
                  🪐
                  ${esc(
                    team.name
                  )}
                </span>

                <b>
                  ${Number(
                    team.score || 0
                  )}
                  نقطة
                </b>

              </div>
            `;
          }
        ).join("");
    }

  } catch (error) {

    console.error(
      "MEMBER ERROR:",
      error
    );
  }
}


/* =====================================================
   REFRESH ADMIN
===================================================== */

async function refreshAdmin() {

  try {

    await loadAdminTeamSelects();

    const {
      data: teams,
      error: teamsError
    } = await sb
      .from("teams")
      .select("*")
      .order("id");

    if (teamsError) {
      throw teamsError;
    }


    const {
      data: members,
      error: membersError
    } = await sb
      .from("members")
      .select(`
        id,
        name,
        team_id,
        access_code,
        score,
        photo_url,
        teams (
          name
        )
      `)
      .order("id", {
        ascending: false
      });

    if (membersError) {
      throw membersError;
    }


    if ($("members")) {

      $("members").innerHTML =
        members?.length
          ? members.map(m => `

              <div class="member">

                <div>

                  <b>
                    ${esc(m.name)}
                  </b>

                  <br>

                  <small>
                    ${esc(
                      m.teams?.name ||
                      "بدون فريق"
                    )}
                  </small>

                  <br>

                  <small>
                    🔐
                    ${esc(
                      m.access_code
                    )}
                  </small>

                </div>

                <button
                  class="delete-btn"
                  onclick="deleteMember(${m.id})"
                >
                  حذف
                </button>

              </div>

            `).join("")
          : "لا يوجد أعضاء";
    }


    if ($("scores")) {

      $("scores").innerHTML =
        (teams || []).map(team => `

          <div class="score">

            <span>
              ${esc(team.name)}
              :
              <b>
                ${Number(
                  team.score || 0
                )}
              </b>
            </span>

            <button
              onclick="changeScore(${team.id},5)"
            >
              +5
            </button>

            <button
              onclick="changeScore(${team.id},-5)"
            >
              -5
            </button>

          </div>

        `).join("");
    }

  } catch (error) {

    console.error(
      "ADMIN ERROR:",
      error
    );

    alert(
      "خطأ في لوحة التحكم:\n" +
      error.message
    );
  }
}


/* =====================================================
   CHANGE SCORE
===================================================== */

async function changeScore(id, amount) {

  try {

    const {
      data,
      error
    } = await sb
      .from("teams")
      .select("score")
      .eq("id", id)
      .single();

    if (error) throw error;

    const score =
      Number(data.score || 0) +
      Number(amount);

    const { error: updateError } =
      await sb
        .from("teams")
        .update({
          score
        })
        .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    await refreshAdmin();

  } catch (error) {

    alert(
      "لم يتم تعديل النقاط:\n" +
      error.message
    );
  }
}


/* =====================================================
   DELETE MEMBER
===================================================== */

async function deleteMember(id) {

  if (!confirm(
    "هل أنت متأكد من حذف العضو؟"
  )) {
    return;
  }

  try {

    const { error } = await sb
      .from("members")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    await refreshAdmin();

    alert("تم حذف العضو ✅");

  } catch (error) {

    alert(
      "لم يتم حذف العضو:\n" +
      error.message
    );
  }
}


/* =====================================================
   PUBLISH POST
===================================================== */

async function publishPost() {

  const title =
    $("postTitle")?.value.trim();

  const body =
    $("postBody")?.value.trim();

  const team =
    $("postTeam")?.value;

  if (!title || !body) {
    alert(
      "اكتب عنوان وتفاصيل المنشور."
    );
    return;
  }

  try {

    const { error } = await sb
      .from("posts")
      .insert({
        title,
        body,
        team_id:
          team === "all"
            ? null
            : Number(team)
      });

    if (error) {
      throw error;
    }

    $("postTitle").value = "";
    $("postBody").value = "";

    alert("تم نشر المنشور ✅");

  } catch (error) {

    alert(
      "لم يتم النشر:\n" +
      error.message
    );
  }
}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

  localStorage.removeItem(
    "memberId"
  );

  member = null;

  showJoin();
}


/* =====================================================
   RESTORE MEMBER
===================================================== */

async function restoreSavedMember() {

  const id =
    localStorage.getItem(
      "memberId"
    );

  if (!id) return;

  try {

    const {
      data,
      error
    } = await sb
      .from("members")
      .select(`
        id,
        name,
        team_id,
        access_code,
        photo_url
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      logout();
      return;
    }

    member = {
      id: data.id,
      name: data.name,
      teamId: data.team_id,
      accessCode: data.access_code,
      photoUrl: data.photo_url || ""
    };

    await showMember();

  } catch (error) {

    console.error(error);
  }
}


/* =====================================================
   EVENTS
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    renderTeams();
    showJoin();

    $("codeLoginBtn")
      ?.addEventListener(
        "click",
        loginWithCode
      );

    $("adminOpen")
      ?.addEventListener(
        "click",
        openAdmin
      );

    $("closeModal")
      ?.addEventListener(
        "click",
        closeAdmin
      );

    $("loginBtn")
      ?.addEventListener(
        "click",
        loginAdmin
      );

    $("adminLogout")
      ?.addEventListener(
        "click",
        adminLogout
      );

    $("addMemberBtn")
      ?.addEventListener(
        "click",
        addMember
      );

    $("postBtn")
      ?.addEventListener(
        "click",
        publishPost
      );

    $("logout")
      ?.addEventListener(
        "click",
        logout
      );

    $("accessCode")
      ?.addEventListener(
        "keydown",
        e => {
          if (e.key === "Enter") {
            loginWithCode();
          }
        }
      );

    $("adminPass")
      ?.addEventListener(
        "keydown",
        e => {
          if (e.key === "Enter") {
            loginAdmin();
          }
        }
      );

    await restoreSavedMember();
  }
);
