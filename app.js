/* =========================================================
   INFINITY
   APP.JS - FULL VERSION
   ========================================================= */
/* =========================
   SUPABASE
   ========================= */
const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_zF7z4wuwluqfPDfAH0-7qg_8-tjtrSr";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
/* =========================
   SETTINGS
   ========================= */
const ADMIN_PASSWORD = "1234";
let member = null;
let admin = false;
let scanner = null;
/* =========================
   LOCAL TEAMS
   =========================
   الفرق الأساسية للموقع.
   الـ IDs مطابقة للفرق الموجودة عندك في Supabase.
*/
const TEAMS = [
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
/* =========================
   SHORTCUT
   ========================= */
function $(id) {
  return document.getElementById(id);
}
/* =========================
   ESCAPE HTML
   ========================= */
function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    }
  );
}
/* =========================
   GET TEAM
   ========================= */
function getTeam(teamId) {
  return TEAMS.find(
    team => Number(team.id) === Number(teamId)
  ) || null;
}
/* =========================
   FIND TEAM
   ========================= */
function findTeam(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }
  const text =
    String(value).trim().toLowerCase();
  return TEAMS.find(team =>
    String(team.id) === text ||
    team.name.toLowerCase() === text ||
    team.english.toLowerCase() === text
  ) || null;
}
/* =========================
   SHOW PAGE
   ========================= */
function showJoin() {
  $("join")?.classList.remove("hidden");
  $("member")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
}
/* =========================
   RENDER TEAMS
   ========================= */
function renderTeams() {
  const box = $("teams");
  if (!box) {
    console.warn(
      "INFINITY: #teams غير موجود في index.html"
    );
    return;
  }
  box.innerHTML = TEAMS.map(team => {
    return `
      <div class="team-card">
        <div class="planet-wrap">
          <img
            src="${team.image}"
            alt="${esc(team.name)}"
            class="planet-image"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg';"
          >
        </div>
        <div class="team-info">
          <span class="planet-label">
            PLANET ${team.id}
          </span>
          <h3>
            ${esc(team.name)}
          </h3>
          <small>
            ${esc(team.english)}
          </small>
        </div>
      </div>
    `;
  }).join("");
  console.log(
    "INFINITY: تم عرض الفرق الأربعة"
  );
}
/* =========================
   RENDER ADMIN TEAM SELECT
   ========================= */
function renderAdminTeamSelects() {
  const memberSelect =
    $("newMemberTeam");
  const postSelect =
    $("postTeam");
  /*
    اختيار فريق العضو
  */
  if (memberSelect) {
    memberSelect.innerHTML = `
      <option value="">
        اختر الفريق
      </option>
      ${TEAMS.map(team => `
        <option value="${team.id}">
          ${esc(team.name)} - ${esc(team.english)}
        </option>
      `).join("")}
    `;
  }
  /*
    اختيار فريق المنشور
  */
  if (postSelect) {
    postSelect.innerHTML = `
      <option value="all">
        كل الفرق
      </option>
      ${TEAMS.map(team => `
        <option value="${team.id}">
          ${esc(team.name)} - ${esc(team.english)}
        </option>
      `).join("")}
    `;
  }
  console.log(
    "INFINITY: تم تحميل اختيار الفرق للأدمن"
  );
}
/* =========================
   LOAD DATABASE TEAMS
   ========================= */
async function loadDatabaseTeams() {
  try {
    const result =
      await sb
        .from("teams")
        .select("*")
        .order("id");
    if (result.error) {
      console.warn(
        "Supabase teams:",
        result.error.message
      );
      return TEAMS;
    }
    return result.data?.length
      ? result.data
      : TEAMS;
  } catch (error) {
    console.warn(
      "Database teams error:",
      error
    );
    return TEAMS;
  }
}
/* =========================
   GENERATE MEMBER CODE
   ========================= */
function generateCode() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "INF-";
  for (let i = 0; i < 6; i++) {
    code +=
      chars[
        Math.floor(
          Math.random() * chars.length
        )
      ];
  }
  return code;
}
/* =========================
   UNIQUE MEMBER CODE
   ========================= */
async function getUniqueCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code =
      generateCode();
    try {
      const {
        data,
        error
      } = await sb
        .from("members")
        .select("id")
        .eq(
          "access_code",
          code
        )
        .limit(1);
      if (error) {
        throw error;
      }
      if (!data || data.length === 0) {
        return code;
      }
    } catch (error) {
      console.warn(
        "Code check:",
        error
      );
      /*
        لو قراءة members ممنوعة،
        نستخدم الكود ونترك قاعدة البيانات
        تتعامل مع أي unique constraint.
      */
      return code;
    }
  }
  throw new Error(
    "تعذر إنشاء كود عضو جديد."
  );
}
/* =========================
   LOGIN MEMBER
   ========================= */
async function loginWithCode() {
  const input =
    $("accessCode");
  const msg =
    $("msg");
  if (!input) {
    return;
  }
  const code =
    input.value
      .trim()
      .toUpperCase();
  if (!code) {
    if (msg) {
      msg.textContent =
        "اكتب كود الدخول.";
    }
    return;
  }
  if (msg) {
    msg.textContent =
      "جاري تسجيل الدخول...";
  }
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
      .eq(
        "access_code",
        code
      )
      .maybeSingle();
    if (error) {
      throw error;
    }
    if (!data) {
      if (msg) {
        msg.textContent =
          "كود الدخول غير صحيح.";
      }
      return;
    }
    const team =
      getTeam(data.team_id);
    if (!team) {
      if (msg) {
        msg.textContent =
          "فريق العضو غير موجود.";
      }
      return;
    }
    member = {
      id:
        data.id,
      name:
        data.name,
      teamId:
        Number(data.team_id),
      accessCode:
        data.access_code,
      photoUrl:
        data.photo_url || ""
    };
    localStorage.setItem(
      "memberId",
      String(data.id)
    );
    if (msg) {
      msg.textContent = "";
    }
    await showMember();
  } catch (error) {
    console.error(
      "Member login error:",
      error
    );
    if (msg) {
      msg.textContent =
        "حدث خطأ: " +
        error.message;
    }
  }
}
/* =========================
   SHOW MEMBER
   ========================= */
async function showMember() {
  if (!member) {
    return;
  }
  $("join")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
  $("member")?.classList.remove("hidden");
  const team =
    getTeam(member.teamId);
  if ($("memberName")) {
    $("memberName").textContent =
      member.name || "";
  }
  if ($("memberTeam")) {
    $("memberTeam").textContent =
      team
        ? `فريق ${team.name} • ${team.english}`
        : "بدون فريق";
  }
  const photo =
    $("memberPhoto");
  if (photo) {
    photo.src =
      member.photoUrl ||
      team?.image ||
      "";
  }
  await refreshMember();
}
/* =========================
   REFRESH MEMBER
   ========================= */
async function refreshMember() {
  if (!member) {
    return;
  }
  try {
    /*
      المنشورات
    */
    const {
      data: posts,
      error: postsError
    } = await sb
      .from("posts")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );
    if (postsError) {
      throw postsError;
    }
    const visiblePosts =
      (posts || []).filter(post => {
        if (
          post.team_id === null ||
          post.team_id === undefined
        ) {
          return true;
        }
        return (
          Number(post.team_id) ===
          Number(member.teamId)
        );
      });
    if ($("posts")) {
      $("posts").innerHTML =
        visiblePosts.length
          ? visiblePosts
              .map(renderMemberPost)
              .join("")
          : "<p>لا يوجد منشورات حاليًا.</p>";
    }
    await loadRepliesForPosts(
      visiblePosts
    );
    /*
      ترتيب الفرق
    */
    const {
      data: teams,
      error: teamsError
    } = await sb
      .from("teams")
      .select("*")
      .order("score", {
        ascending: false
      });
    if (teamsError) {
      console.warn(
        "Ranking error:",
        teamsError.message
      );
      return;
    }
    if ($("ranking")) {
      $("ranking").innerHTML =
        (teams || []).map(
          (team, index) => {
            const localTeam =
              findTeam(team.id) ||
              findTeam(team.name);
            return `
              <div class="rank">
                <span>
                  #${index + 1}
                  ${
                    localTeam
                      ? esc(localTeam.name)
                      : esc(team.name)
                  }
                </span>
                <b>
                  ${Number(team.score || 0)}
                  نقطة
                </b>
              </div>
            `;
          }
        ).join("");
    }
  } catch (error) {
    console.error(
      "Refresh member:",
      error
    );
  }
}
/* =========================
   MEMBER POST
   ========================= */
function renderMemberPost(post) {
  return `
    <article
      class="post"
      id="post-${post.id}"
    >
      <small>
        ${post.created_at
          ? new Date(
              post.created_at
            ).toLocaleString("ar-EG")
          : ""}
      </small>
      <h3>
        ${esc(post.title)}
      </h3>
      <p>
        ${esc(post.body)
          .replace(/\n/g, "<br>")}
      </p>
      ${
        post.image_url
          ? `
            <img
              class="post-image"
              src="${esc(post.image_url)}"
              alt="صورة المنشور"
              loading="lazy"
            >
          `
          : ""
      }
      <div class="replies">
        <h4>
          الردود
        </h4>
        <div
          id="replies-${post.id}"
          class="reply-list"
        >
          جاري تحميل الردود...
        </div>
        <div class="reply-box">
          <textarea
            id="reply-input-${post.id}"
            placeholder="اكتب ردك هنا..."
          ></textarea>
          <button
            onclick="sendReply(${Number(post.id)})"
          >
            إرسال الرد
          </button>
        </div>
      </div>
    </article>
  `;
}
/* =========================
   LOAD REPLIES
   ========================= */
async function loadRepliesForPosts(posts) {
  if (!posts?.length) {
    return;
  }
  const ids =
    posts.map(post => post.id);
  try {
    const {
      data,
      error
    } = await sb
      .from("replies")
      .select(`
        id,
        post_id,
        member_id,
        body,
        created_at,
        members (
          name,
          photo_url
        )
      `)
      .in(
        "post_id",
        ids
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );
    if (error) {
      throw error;
    }
    posts.forEach(post => {
      const box =
        $(`replies-${post.id}`);
      if (!box) {
        return;
      }
      const replies =
        (data || []).filter(
          reply =>
            Number(reply.post_id) ===
            Number(post.id)
        );
      if (!replies.length) {
        box.innerHTML =
          "<small>لا توجد ردود حتى الآن.</small>";
        return;
      }
      box.innerHTML =
        replies.map(
          reply => {
            return `
              <div
                class="reply"
                id="reply-${reply.id}"
              >
                <b>
                  ${esc(
                    reply.members?.name ||
                    "عضو"
                  )}
                </b>
                <small>
                  ${
                    reply.created_at
                      ? new Date(
                          reply.created_at
                        ).toLocaleString("ar-EG")
                      : ""
                  }
                </small>
                <p>
                  ${esc(reply.body)
                    .replace(
                      /\n/g,
                      "<br>"
                    )}
                </p>
              </div>
            `;
          }
        ).join("");
    });
  } catch (error) {
    console.error(
      "Replies:",
      error
    );
  }
}
/* =========================
   SEND REPLY
   ========================= */
async function sendReply(postId) {
  if (!member) {
    alert(
      "يجب تسجيل الدخول أولًا."
    );
    return;
  }
  const input =
    $(`reply-input-${postId}`);
  if (!input) {
    return;
  }
  const body =
    input.value.trim();
  if (!body) {
    alert(
      "اكتب الرد أولًا."
    );
    return;
  }
  try {
    const {
      error
    } = await sb
      .from("replies")
      .insert({
        post_id:
          Number(postId),
        member_id:
          Number(member.id),
        body
      });
    if (error) {
      throw error;
    }
    input.value = "";
    await refreshMember();
  } catch (error) {
    console.error(
      "Send reply:",
      error
    );
    alert(
      "لم يتم إرسال الرد: " +
      error.message
    );
  }
}
/* =========================
   OPEN ADMIN
   ========================= */
function openAdmin() {
  $("loginModal")
    ?.classList.remove("hidden");
  if ($("adminPass")) {
    $("adminPass").value = "";
    $("adminPass").focus();
  }
  if ($("loginMsg")) {
    $("loginMsg").textContent = "";
  }
}
/* =========================
   CLOSE ADMIN
   ========================= */
function closeAdmin() {
  $("loginModal")
    ?.classList.add("hidden");
}
/* =========================
   ADMIN LOGIN
   ========================= */
async function loginAdmin() {
  const password =
    $("adminPass")?.value || "";
  if (password !== ADMIN_PASSWORD) {
    if ($("loginMsg")) {
      $("loginMsg").textContent =
        "كلمة المرور غير صحيحة.";
    }
    return;
  }
  admin = true;
  $("loginModal")
    ?.classList.add("hidden");
  $("join")
    ?.classList.add("hidden");
  $("member")
    ?.classList.add("hidden");
  $("admin")
    ?.classList.remove("hidden");
  /*
    الأهم:
    نعرض الفرق محليًا فورًا.
  */
  renderAdminTeamSelects();
  await refreshAdmin();
}
/* =========================
   ADMIN LOGOUT
   ========================= */
function adminLogout() {
  admin = false;
  $("admin")
    ?.classList.add("hidden");
  showJoin();
}
/* =========================
   REFRESH ADMIN
   ========================= */
async function refreshAdmin() {
  /*
    لا ننتظر Supabase لعرض الفرق.
  */
  renderAdminTeamSelects();
  try {
    const {
      data: teams,
      error: teamsError
    } = await sb
      .from("teams")
      .select("*")
      .order("id");
    if (teamsError) {
      console.warn(
        "Teams admin:",
        teamsError.message
      );
    } else {
      renderScores(
        teams?.length
          ? teams
          : TEAMS.map(team => ({
              id: team.id,
              name: team.name,
              score: 0
            }))
      );
    }
    /*
      MEMBERS
    */
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
        photo_url
      `)
      .order(
        "id",
        {
          ascending: false
        }
      );
    if (membersError) {
      throw membersError;
    }
    if ($("members")) {
      $("members").innerHTML =
        members?.length
          ? members.map(renderAdminMember).join("")
          : "لا يوجد أعضاء حاليًا.";
    }
    await refreshAdminPosts();
  } catch (error) {
    console.error(
      "Admin refresh:",
      error
    );
    if ($("members")) {
      $("members").innerHTML =
        `
          <p>
            تعذر تحميل الأعضاء:
            ${esc(error.message)}
          </p>
        `;
    }
  }
}
/* =========================
   ADMIN MEMBER
   ========================= */
function renderAdminMember(memberData) {
  const team =
    getTeam(memberData.team_id);
  return `
    <div class="member">
      <div class="admin-member-left">
        ${
          memberData.photo_url
            ? `
              <img
                class="admin-member-photo"
                src="${esc(memberData.photo_url)}"
                alt="صورة العضو"
              >
            `
            : `
              <div class="admin-member-photo"></div>
            `
        }
        <div>
          <b>
            ${esc(memberData.name)}
          </b>
          <br>
          <small>
            ${
              team
                ? esc(team.name)
                : "بدون فريق"
            }
          </small>
          <br>
          <small>
            🔐 ${esc(
              memberData.access_code ||
              "بدون كود"
            )}
          </small>
        </div>
      </div>
      <div class="admin-member-buttons">
        <button
          onclick="showMemberQR('${esc(
            memberData.access_code || ""
          )}')"
        >
          QR
        </button>
        <button
          onclick="changeMemberPhoto(${Number(
            memberData.id
          )})"
        >
          صورة
        </button>
        <button
          class="delete-btn"
          onclick="deleteMember(${Number(
            memberData.id
          )})"
        >
          حذف
        </button>
      </div>
    </div>
  `;
}
/* =========================
   SCORES
   ========================= */
function renderScores(teams) {
  if (!$("scores")) {
    return;
  }
  $("scores").innerHTML =
    teams.map(team => {
      const localTeam =
        getTeam(team.id) ||
        findTeam(team.name);
      return `
        <div class="score">
          <span>
            ${
              localTeam
                ? esc(localTeam.name)
                : esc(team.name)
            }
            :
            <b>
              ${Number(team.score || 0)}
            </b>
          </span>
          <button
            onclick="changeScore(${Number(
              team.id
            )},5)"
          >
            +5
          </button>
          <button
            onclick="changeScore(${Number(
              team.id
            )},10)"
          >
            +10
          </button>
          <button
            onclick="changeScore(${Number(
              team.id
            )},-5)"
          >
            -5
          </button>
          <button
            onclick="changeScore(${Number(
              team.id
            )},-10)"
          >
            -10
          </button>
        </div>
      `;
    }).join("");
}
/* =========================
   UPLOAD IMAGE
   ========================= */
async function uploadImage(
  file,
  folder
) {
  if (!file) {
    return null;
  }
  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();
  const fileName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;
  const path =
    `${folder}/${fileName}`;
  const {
    error
  } = await sb
    .storage
    .from("site-images")
    .upload(
      path,
      file,
      {
        cacheControl: "3600",
        upsert: false
      }
    );
  if (error) {
    throw error;
  }
  const {
    data
  } = sb
    .storage
    .from("site-images")
    .getPublicUrl(path);
  return data.publicUrl;
}
/* =========================
   ADD MEMBER
   ========================= */
async function addMember() {
  const name =
    $("newMemberName")
      ?.value
      .trim();
  const teamValue =
    $("newMemberTeam")
      ?.value;
  const file =
    $("newMemberPhoto")
      ?.files?.[0];
  /*
    التحقق
  */
  if (!name) {
    alert(
      "اكتب اسم العضو."
    );
    return;
  }
  if (!teamValue) {
    alert(
      "اختار الفريق أولًا."
    );
    return;
  }
  const teamId =
    Number(teamValue);
  const team =
    getTeam(teamId);
  if (!team) {
    alert(
      "الفريق المختار غير صحيح."
    );
    return;
  }
  const button =
    $("addMemberBtn");
  if (button) {
    button.disabled = true;
    button.textContent =
      "جاري الإضافة...";
  }
  try {
    /*
      إنشاء كود
    */
    const accessCode =
      await getUniqueCode();
    /*
      رفع الصورة
    */
    let photoUrl = null;
    if (file) {
      photoUrl =
        await uploadImage(
          file,
          "members"
        );
    }
    /*
      إضافة العضو
    */
    const {
      data,
      error
    } = await sb
      .from("members")
      .insert({
        name,
        team_id: teamId,
        access_code: accessCode,
        score: 0,
        photo_url: photoUrl
      })
      .select()
      .single();
    if (error) {
      throw error;
    }
    /*
      تنظيف
    */
    $("newMemberName").value = "";
    $("newMemberTeam").value = "";
    if ($("newMemberPhoto")) {
      $("newMemberPhoto").value = "";
    }
    /*
      النتيجة
    */
    if ($("newMemberResult")) {
      $("newMemberResult").innerHTML = `
        <div class="login-result">
          <h3>
            تم إنشاء العضو بنجاح ✅
          </h3>
          <p>
            الاسم:
            <b>
              ${esc(data.name)}
            </b>
          </p>
          <p>
            الفريق:
            <b>
              ${esc(team.name)}
            </b>
          </p>
          <p>
            كود الدخول:
          </p>
          <strong>
            ${esc(data.access_code)}
          </strong>
          <div id="adminQR"></div>
        </div>
      `;
    }
    createAdminQR(
      data.access_code
    );
    await refreshAdmin();
    alert(
      `تم إضافة ${team.name} بنجاح ✅`
    );
  } catch (error) {
    console.error(
      "ADD MEMBER ERROR:",
      error
    );
    alert(
      "لم يتم إضافة العضو:\n" +
      error.message
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent =
        "إضافة العضو";
    }
  }
}
/* =========================
   PUBLISH POST
   ========================= */
async function publishPost() {
  const title =
    $("postTitle")
      ?.value
      .trim();
  const body =
    $("postBody")
      ?.value
      .trim();
  const teamValue =
    $("postTeam")
      ?.value || "all";
  const file =
    $("postImage")
      ?.files?.[0];
  if (!title || !body) {
    alert(
      "اكتب عنوان وتفاصيل المنشور."
    );
    return;
  }
  try {
    let teamId = null;
    if (teamValue !== "all") {
      teamId =
        Number(teamValue);
      if (!getTeam(teamId)) {
        alert(
          "الفريق غير صحيح."
        );
        return;
      }
    }
    let imageUrl = null;
    if (file) {
      imageUrl =
        await uploadImage(
          file,
          "posts"
        );
    }
    const {
      error
    } = await sb
      .from("posts")
      .insert({
        title,
        body,
        team_id: teamId,
        image_url: imageUrl
      });
    if (error) {
      throw error;
    }
    $("postTitle").value = "";
    $("postBody").value = "";
    if ($("postImage")) {
      $("postImage").value = "";
    }
    await refreshAdmin();
    if (member) {
      await refreshMember();
    }
    alert(
      "تم نشر المنشور بنجاح ✅"
    );
  } catch (error) {
    console.error(
      "Publish post:",
      error
    );
    alert(
      "لم يتم النشر:\n" +
      error.message
    );
  }
}
/* =========================
   ADMIN POSTS
   ========================= */
async function refreshAdminPosts() {
  const box =
    $("adminPosts");
  if (!box) {
    return;
  }
  try {
    const {
      data: posts,
      error
    } = await sb
      .from("posts")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );
    if (error) {
      throw error;
    }
    if (!posts?.length) {
      box.innerHTML =
        "لا يوجد منشورات.";
      return;
    }
    box.innerHTML =
      posts.map(post => {
        const team =
          post.team_id === null
            ? null
            : getTeam(post.team_id);
        return `
          <div
            class="admin-post"
            id="admin-post-${post.id}"
          >
            <h4>
              ${esc(post.title)}
            </h4>
            <p>
              ${esc(post.body)}
            </p>
            <small>
              ${
                team
                  ? esc(team.name)
                  : "كل الفرق"
              }
            </small>
            ${
              post.image_url
                ? `
                  <img
                    class="admin-post-image"
                    src="${esc(post.image_url)}"
                    alt="صورة المنشور"
                  >
                `
                : ""
            }
            <br>
            <button
              class="delete-btn"
              onclick="deletePost(${Number(
                post.id
              )})"
            >
              🗑 حذف المنشور
            </button>
          </div>
        `;
      }).join("");
  } catch (error) {
    console.error(
      "Admin posts:",
      error
    );
    box.innerHTML =
      "تعذر تحميل المنشورات.";
  }
}
/* =========================
   CHANGE SCORE
   ========================= */
async function changeScore(
  teamId,
  amount
) {
  try {
    const {
      data,
      error
    } = await sb
      .from("teams")
      .select("score")
      .eq(
        "id",
        teamId
      )
      .single();
    if (error) {
      throw error;
    }
    const newScore =
      Number(data.score || 0) +
      Number(amount);
    const {
      error: updateError
    } = await sb
      .from("teams")
      .update({
        score: newScore
      })
      .eq(
        "id",
        teamId
      );
    if (updateError) {
      throw updateError;
    }
    await refreshAdmin();
    if (member) {
      await refreshMember();
    }
  } catch (error) {
    console.error(
      "Score error:",
      error
    );
    alert(
      "لم يتم تعديل النقاط:\n" +
      error.message
    );
  }
}
/* =========================
   DELETE MEMBER
   ========================= */
async function deleteMember(id) {
  if (
    !confirm(
      "هل أنت متأكد من حذف العضو؟"
    )
  ) {
    return;
  }
  try {
    const {
      error
    } = await sb
      .from("members")
      .delete()
      .eq(
        "id",
        id
      );
    if (error) {
      throw error;
    }
    await refreshAdmin();
    if (
      member &&
      Number(member.id) ===
      Number(id)
    ) {
      logout();
    }
    alert(
      "تم حذف العضو ✅"
    );
  } catch (error) {
    console.error(
      "Delete member:",
      error
    );
    alert(
      "لم يتم حذف العضو:\n" +
      error.message
    );
  }
}
/* =========================
   CHANGE MEMBER PHOTO
   ========================= */
async function changeMemberPhoto(id) {
  const input =
    document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange =
    async function () {
      const file =
        input.files?.[0];
      if (!file) {
        return;
      }
      try {
        const photoUrl =
          await uploadImage(
            file,
            "members"
          );
        const {
          error
        } = await sb
          .from("members")
          .update({
            photo_url: photoUrl
          })
          .eq(
            "id",
            id
          );
        if (error) {
          throw error;
        }
        await refreshAdmin();
        if (
          member &&
          Number(member.id) ===
          Number(id)
        ) {
          member.photoUrl =
            photoUrl;
          await showMember();
        }
        alert(
          "تم تغيير الصورة ✅"
        );
      } catch (error) {
        console.error(
          "Photo error:",
          error
        );
        alert(
          "لم يتم تغيير الصورة:\n" +
          error.message
        );
      }
    };
  input.click();
}
/* =========================
   DELETE POST
   ========================= */
async function deletePost(postId) {
  if (
    !confirm(
      "هل أنت متأكد من حذف المنشور؟"
    )
  ) {
    return;
  }
  try {
    const {
      error: repliesError
    } = await sb
      .from("replies")
      .delete()
      .eq(
        "post_id",
        postId
      );
    if (repliesError) {
      console.warn(
        "Replies delete:",
        repliesError.message
      );
    }
    const {
      error
    } = await sb
      .from("posts")
      .delete()
      .eq(
        "id",
        postId
      );
    if (error) {
      throw error;
    }
    await refreshAdmin();
    if (member) {
      await refreshMember();
    }
    alert(
      "تم حذف المنشور ✅"
    );
  } catch (error) {
    console.error(
      "Delete post:",
      error
    );
    alert(
      "لم يتم حذف المنشور:\n" +
      error.message
    );
  }
}
/* =========================
   CREATE QR
   ========================= */
function createAdminQR(code) {
  const box =
    $("adminQR");
  if (
    !box ||
    typeof QRCode === "undefined"
  ) {
    return;
  }
  box.innerHTML = "";
  new QRCode(
    box,
    {
      text: code,
      width: 180,
      height: 180
    }
  );
}
/* =========================
   MEMBER QR
   ========================= */
function showMemberQR(code) {
  if (!code) {
    alert(
      "العضو ليس لديه كود."
    );
    return;
  }
  const overlay =
    document.createElement("div");
  overlay.style.cssText = `
    position:fixed;
    inset:0;
    z-index:99999;
    display:grid;
    place-items:center;
    background:rgba(0,0,0,.92);
  `;
  overlay.innerHTML = `
    <div
      style="
        background:#101827;
        padding:30px;
        border-radius:24px;
        text-align:center;
        color:white;
      "
    >
      <h2>
        QR Code
      </h2>
      <div id="popupQR"></div>
      <p>
        ${esc(code)}
      </p>
      <button id="closeQR">
        إغلاق
      </button>
    </div>
  `;
  document.body.appendChild(
    overlay
  );
  if (
    typeof QRCode !== "undefined"
  ) {
    new QRCode(
      overlay.querySelector(
        "#popupQR"
      ),
      {
        text: code,
        width: 220,
        height: 220
      }
    );
  }
  overlay.querySelector(
    "#closeQR"
  ).onclick =
    () => overlay.remove();
}
/* =========================
   QR SCANNER
   ========================= */
async function startQRScanner() {
  const box =
    $("qrScanner");
  if (!box) {
    return;
  }
  box.classList.remove(
    "hidden"
  );
  if ($("scanMsg")) {
    $("scanMsg").textContent =
      "وجّه الكاميرا إلى QR Code.";
  }
  if (scanner) {
    try {
      await scanner.stop();
    } catch {}
  }
  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {
    if ($("scanMsg")) {
      $("scanMsg").textContent =
        "ماسح QR غير متاح.";
    }
    return;
  }
  scanner =
    new Html5Qrcode(
      "qrScanner"
    );
  try {
    await scanner.start(
      {
        facingMode:
          "environment"
      },
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250
        }
      },
      async decodedText => {
        $("accessCode").value =
          decodedText;
        if ($("scanMsg")) {
          $("scanMsg").textContent =
            "تم قراءة الكود ✅";
        }
        try {
          await scanner.stop();
        } catch {}
        box.classList.add(
          "hidden"
        );
        await loginWithCode();
      },
      () => {}
    );
  } catch (error) {
    console.error(
      "QR scanner:",
      error
    );
    if ($("scanMsg")) {
      $("scanMsg").textContent =
        "تعذر تشغيل الكاميرا.";
    }
  }
}
/* =========================
   LOGOUT MEMBER
   ========================= */
function logout() {
  localStorage.removeItem(
    "memberId"
  );
  member = null;
  if ($("accessCode")) {
    $("accessCode").value = "";
  }
  if ($("msg")) {
    $("msg").textContent = "";
  }
  showJoin();
}
/* =========================
   RESTORE MEMBER
   ========================= */
async function restoreSavedMember() {
  const savedId =
    localStorage.getItem(
      "memberId"
    );
  if (!savedId) {
    return;
  }
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
      .eq(
        "id",
        savedId
      )
      .maybeSingle();
    if (error) {
      throw error;
    }
    if (!data) {
      localStorage.removeItem(
        "memberId"
      );
      return;
    }
    const team =
      getTeam(data.team_id);
    if (!team) {
      localStorage.removeItem(
        "memberId"
      );
      return;
    }
    member = {
      id:
        data.id,
      name:
        data.name,
      teamId:
        Number(data.team_id),
      accessCode:
        data.access_code,
      photoUrl:
        data.photo_url || ""
    };
    await showMember();
  } catch (error) {
    console.warn(
      "Restore member:",
      error
    );
  }
}
/* =========================
   EVENT LISTENERS
   ========================= */
function initInfinity() {
  console.log(
    "INFINITY started 🚀"
  );
  /*
    عرض الكواكب فورًا
  */
  renderTeams();
  /*
    تحميل اختيارات الأدمن فورًا
  */
  renderAdminTeamSelects();
  /*
    Login
  */
  $("codeLoginBtn")
    ?.addEventListener(
      "click",
      loginWithCode
    );
  $("accessCode")
    ?.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter"
        ) {
          loginWithCode();
        }
      }
    );
  /*
    QR
  */
  $("scanQRBtn")
    ?.addEventListener(
      "click",
      startQRScanner
    );
  /*
    Admin
  */
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
  $("adminPass")
    ?.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter"
        ) {
          loginAdmin();
        }
      }
    );
  $("adminLogout")
    ?.addEventListener(
      "click",
      adminLogout
    );
  /*
    Admin actions
  */
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
  /*
    Member logout
  */
  $("logout")
    ?.addEventListener(
      "click",
      logout
    );
  /*
    الصفحة الرئيسية
  */
  showJoin();
  /*
    العضو المحفوظ
  */
  restoreSavedMember();
}
/* =========================
   START
   ========================= */
if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initInfinity
  );
} else {
  initInfinity();
}
