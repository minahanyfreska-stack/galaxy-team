/* =========================================================
   INFINITY V2
   FAST / 150+ MEMBERS
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
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);


/* =========================
   CONFIG
========================= */

const ADMIN_PASSWORD = "1234";

const PAGE_SIZE = 10;

let member = null;
let admin = false;
let scanner = null;

let teamsCache = null;
let loading = false;


/* =========================
   TEAMS
========================= */

const T = [
  {
    id: "jupiter",
    name: "المشتري",
    english: "Jupiter",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg"
  },
  {
    id: "saturn",
    name: "زحل",
    english: "Saturn",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg"
  },
  {
    id: "neptune",
    name: "نبتون",
    english: "Neptune",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg"
  },
  {
    id: "uranus",
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
   ESCAPE
========================= */

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[c]
  );
}


/* =========================
   TEAM HELPERS
========================= */

function getLocalTeam(id) {
  return T.find(t => t.id === id) || null;
}


function findLocalTeamByName(name) {

  if (!name) return null;

  const value =
    String(name).trim().toLowerCase();

  return T.find(t =>
    t.name.toLowerCase() === value ||
    t.english.toLowerCase() === value
  ) || null;
}


/* =========================
   RENDER FRONT TEAMS
========================= */

function renderTeams() {

  const box = $("teams");

  if (!box) return;

  box.innerHTML = T.map(team => `
    <div class="team" data-team="${team.id}">

      <img
        src="${team.image}"
        alt="${esc(team.name)}"
        loading="lazy"
        decoding="async"
        onerror="this.style.display='none'"
      >

      <div class="team-info">

        <span>PLANET</span>

        <strong>
          ${esc(team.name)}
        </strong>

        <small>
          ${esc(team.english)}
        </small>

      </div>

    </div>
  `).join("");
}


/* =========================
   DATABASE TEAMS
========================= */

let teamsCache = null;

async function getTeams() {
  if (teamsCache) {
    return teamsCache;
  }

  const { data, error } = await sb
    .from("teams")
    .select("id, name, score")
    .order("id");

  if (error) {
    console.error("Teams loading error:", error);
    return [];
  }

  teamsCache = data || [];

  return teamsCache;
}

/* =========================
   ADMIN TEAM SELECTS
========================= */

async function loadAdminTeamSelects() {

  const memberSelect =
    $("newMemberTeam");

  const postSelect =
    $("postTeam");

  if (!memberSelect) return;

  const teams =
    await getTeams();

  if (!teams.length) {

    memberSelect.innerHTML = `
      <option value="">
        لا توجد فرق
      </option>
    `;

    if (postSelect) {
      postSelect.innerHTML = `
        <option value="all">
          كل الفرق
        </option>
      `;
    }

    return;
  }

  memberSelect.innerHTML = `
    <option value="">
      اختر الفريق
    </option>

    ${teams.map(t => `
      <option value="${t.id}">
        ${esc(t.name)}
      </option>
    `).join("")}
  `;

  if (postSelect) {

    postSelect.innerHTML = `
      <option value="all">
        كل الفرق
      </option>

      ${teams.map(t => `
        <option value="${t.id}">
          ${esc(t.name)}
        </option>
      `).join("")}
    `;
  }
}


/* =========================
   GENERATE ACCESS CODE
========================= */

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


/* =========================
   SHOW JOIN
========================= */

function showJoin() {

  $("join")?.classList.remove("hidden");
  $("member")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
}


/* =========================
   LOGIN MEMBER
========================= */

async function loginWithCode() {

  if (loading) return;

  const input =
    $("accessCode");

  const code =
    input?.value.trim().toUpperCase();

  if (!code) {

    $("msg").textContent =
      "اكتب كود الدخول.";

    return;
  }

  loading = true;

  $("msg").textContent =
    "جاري تسجيل الدخول...";

  try {

    const { data, error } =
      await sb
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
        .maybeSingle();

    if (error) throw error;

    if (!data) {

      $("msg").textContent =
        "كود الدخول غير صحيح.";

      return;
    }

    member = {
      id: data.id,
      name: data.name,
      teamId: data.team_id,
      teamName: data.teams?.name || "",
      accessCode: data.access_code,
      photoUrl: data.photo_url || ""
    };

    localStorage.setItem(
      "memberId",
      String(data.id)
    );

    $("msg").textContent = "";

    await showMember();

  } catch (error) {

    console.error(error);

    $("msg").textContent =
      "حدث خطأ أثناء تسجيل الدخول.";

  } finally {

    loading = false;
  }
}


/* =========================
   SHOW MEMBER
========================= */

async function showMember() {

  if (!member) return;

  $("join")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
  $("member")?.classList.remove("hidden");

  if ($("memberName")) {
    $("memberName").textContent =
      member.name;
  }

  if ($("memberTeam")) {
    $("memberTeam").textContent =
      `فريق ${member.teamName}`;
  }

  const photo =
    $("memberPhoto");

  if (photo) {

    const local =
      findLocalTeamByName(
        member.teamName
      );

    photo.src =
      member.photoUrl ||
      local?.image ||
      "";
  }

  await loadMemberPosts();
  await loadRanking();
}


/* =========================
   MEMBER POSTS
========================= */

async function loadMemberPosts() {

  const box = $("posts");

  if (!box || !member) return;

  box.innerHTML =
    "<p>جاري تحميل المنشورات...</p>";

  try {

    /*
      IMPORTANT:
      لا نحمل كل المنشورات.
      فقط منشورات الفريق + المنشورات العامة.
    */

    const { data, error } =
      await sb
        .from("posts")
        .select(`
          id,
          title,
          body,
          image_url,
          created_at,
          team_id
        `)
        .or(
          `team_id.is.null,team_id.eq.${member.teamId}`
        )
        .order(
          "created_at",
          { ascending: false }
        )
        .limit(PAGE_SIZE);

    if (error) throw error;

    if (!data?.length) {

      box.innerHTML =
        "<p>لا يوجد منشورات حاليًا.</p>";

      return;
    }

    box.innerHTML =
      data.map(renderPost).join("");

  } catch (error) {

    console.error(error);

    box.innerHTML =
      "<p>تعذر تحميل المنشورات.</p>";
  }
}


/* =========================
   RENDER POST
========================= */

function renderPost(post) {

  return `
    <article
      class="post"
      id="post-${post.id}"
    >

      <small>
        ${new Date(
          post.created_at
        ).toLocaleString("ar-EG")}
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
              loading="lazy"
              decoding="async"
              alt="صورة المنشور"
            >
          `
          : ""
      }

      <div class="replies">

        <h4>
          💬 الردود
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
            placeholder="اكتب ردك..."
            maxlength="1000"
          ></textarea>

          <button
            type="button"
            onclick="sendReply(${post.id})"
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

async function loadReplies(postId) {

  const box =
    $(`replies-${postId}`);

  if (!box) return;

  try {

    const { data, error } =
      await sb
        .from("replies")
        .select(`
          id,
          body,
          created_at,
          members (
            name
          )
        `)
        .eq(
          "post_id",
          postId
        )
        .order(
          "created_at",
          { ascending: true }
        )
        .limit(30);

    if (error) throw error;

    if (!data?.length) {

      box.innerHTML =
        "<small>لا توجد ردود حتى الآن.</small>";

      return;
    }

    box.innerHTML =
      data.map(reply => `
        <div class="reply">

          <b>
            ${esc(
              reply.members?.name ||
              "عضو"
            )}
          </b>

          <small>
            ${new Date(
              reply.created_at
            ).toLocaleString("ar-EG")}
          </small>

          <p>
            ${esc(reply.body)
              .replace(/\n/g, "<br>")}
          </p>

        </div>
      `).join("");

  } catch (error) {

    console.error(error);

    box.innerHTML =
      "<small>تعذر تحميل الردود.</small>";
  }
}


/* =========================
   LOAD REPLIES AFTER POSTS
========================= */

async function loadPostReplies() {

  const posts =
    document.querySelectorAll(
      ".post"
    );

  /*
    تحميل الردود بالتتابع
    بدل عمل عشرات الطلبات في نفس اللحظة.
  */

  for (const post of posts) {

    const id =
      post.id.replace(
        "post-",
        ""
      );

    await loadReplies(
      Number(id)
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

  if (!input) return;

  const body =
    input.value.trim();

  if (!body) {

    alert(
      "اكتب الرد أولًا."
    );

    return;
  }

  const button =
    input.parentElement
      ?.querySelector("button");

  if (button) {
    button.disabled = true;
  }

  try {

    const { error } =
      await sb
        .from("replies")
        .insert({
          post_id: Number(postId),
          member_id: Number(member.id),
          body
        });

    if (error) throw error;

    input.value = "";

    await loadReplies(
      Number(postId)
    );

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم إرسال الرد: " +
      error.message
    );

  } finally {

    if (button) {
      button.disabled = false;
    }
  }
}


/* =========================
   RANKING
========================= */

async function loadRanking() {

  const box =
    $("ranking");

  if (!box) return;

  try {

    const teams =
      await getTeams();

    const ranking =
      [...teams].sort(
        (a, b) =>
          Number(b.score || 0) -
          Number(a.score || 0)
      );

    box.innerHTML =
      ranking.map(
        (team, index) => {

          const local =
            findLocalTeamByName(
              team.name
            );

          return `
            <div class="rank">

              <span>
                #${index + 1}
                ${local ? "🪐" : ""}
                ${esc(team.name)}
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

  } catch (error) {

    console.error(error);

    box.innerHTML =
      "<p>تعذر تحميل الترتيب.</p>";
  }
}


/* =========================
   ADMIN LOGIN
========================= */

async function loginAdmin() {

  const password =
    $("adminPass")?.value || "";

  if (
    password !==
    ADMIN_PASSWORD
  ) {

    $("loginMsg").textContent =
      "كلمة المرور غير صحيحة.";

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

  await loadAdminTeamSelects();
  await refreshAdmin();
}


/* =========================
   OPEN ADMIN
========================= */

function openAdmin() {

  $("loginModal")
    ?.classList.remove("hidden");

  if ($("adminPass")) {
    $("adminPass").value = "";
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
   ADMIN LOGOUT
========================= */

function adminLogout() {

  admin = false;

  $("admin")
    ?.classList.add("hidden");

  showJoin();
}


/* =========================
   ADMIN
========================= */

async function refreshAdmin() {

  if (!admin) return;

  try {

    const [
      teams,
      members
    ] = await Promise.all([

      getTeams(),

      sb
        .from("members")
        .select(`
          id,
          name,
          team_id,
          access_code,
          photo_url
        `)
        .order(
          "id",
          { ascending: false }
        )
        .limit(200)
        .then(r => {

          if (r.error)
            throw r.error;

          return r.data || [];
        })

    ]);

    renderAdminMembers(
      members,
      teams
    );

    renderScores(teams);

    await refreshAdminPosts();

  } catch (error) {

    console.error(error);

    alert(
      "خطأ في لوحة التحكم: " +
      error.message
    );
  }
}


/* =========================
   ADMIN MEMBERS
========================= */

function renderAdminMembers(
  members,
  teams
) {

  const box =
    $("members");

  if (!box) return;

  if (!members.length) {

    box.innerHTML =
      "لا يوجد أعضاء.";

    return;
  }

  box.innerHTML =
    members.map(m => {

      const team =
        teams.find(
          t =>
            Number(t.id) ===
            Number(m.team_id)
        );

      return `
        <div class="member">

          <div class="admin-member-left">

            ${
              m.photo_url
                ? `
                  <img
                    class="admin-member-photo"
                    src="${esc(m.photo_url)}"
                    loading="lazy"
                    alt=""
                  >
                `
                : `
                  <div
                    class="admin-member-photo"
                  ></div>
                `
            }

            <div>

              <b>
                ${esc(m.name)}
              </b>

              <br>

              <small>
                ${esc(
                  team?.name ||
                  "بدون فريق"
                )}
              </small>

              <br>

              <small>
                🔐
                ${esc(
                  m.access_code ||
                  ""
                )}
              </small>

            </div>

          </div>

          <div
            class="admin-member-buttons"
          >

            <button
              onclick="showMemberQR('${esc(
                m.access_code || ""
              )}')"
            >
              QR
            </button>

            <button
              onclick="changeMemberPhoto(${m.id})"
            >
              صورة
            </button>

            <button
              class="delete-btn"
              onclick="deleteMember(${m.id})"
            >
              حذف
            </button>

          </div>

        </div>
      `;
    }).join("");
}


/* =========================
   SCORES
========================= */

function renderScores(teams) {

  const box =
    $("scores");

  if (!box) return;

  box.innerHTML =
    teams.map(team => `

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
          onclick="changeScore(${team.id},10)"
        >
          +10
        </button>

        <button
          onclick="changeScore(${team.id},-5)"
        >
          -5
        </button>

        <button
          onclick="changeScore(${team.id},-10)"
        >
          -10
        </button>

      </div>

    `).join("");
}


/* =========================
   ADD MEMBER
========================= */

async function addMember() {

  const name =
    $("newMemberName")
      ?.value.trim();

  const teamId =
    $("newMemberTeam")
      ?.value;

  if (!name) {

    alert(
      "اكتب اسم العضو."
    );

    return;
  }

  if (!teamId) {

    alert(
      "اختار الفريق."
    );

    return;
  }

  const button =
    $("addMemberBtn");

  if (button) {
    button.disabled = true;
  }

  try {

    let accessCode =
      generateCode();

    /*
      نتأكد أن الكود غير مستخدم.
    */

    for (;;) {

      const { data, error } =
        await sb
          .from("members")
          .select("id")
          .eq(
            "access_code",
            accessCode
          )
          .limit(1);

      if (error) throw error;

      if (!data?.length) {
        break;
      }

      accessCode =
        generateCode();
    }

    const file =
      $("newMemberPhoto")
        ?.files?.[0];

    let photoUrl = null;

    if (file) {

      photoUrl =
        await uploadImage(
          file,
          "members"
        );
    }

    const { data, error } =
      await sb
        .from("members")
        .insert({
          name,
          team_id: Number(teamId),
          access_code: accessCode,
          score: 0,
          photo_url: photoUrl
        })
        .select()
        .single();

    if (error) throw error;

    $("newMemberName").value = "";

    $("newMemberTeam").value = "";

    if ($("newMemberPhoto")) {
      $("newMemberPhoto").value = "";
    }

    if ($("newMemberResult")) {

      $("newMemberResult").innerHTML = `
        <div class="login-result">

          <h3>
            تم إنشاء العضو ✅
          </h3>

          <p>
            الاسم:
            ${esc(data.name)}
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

      createAdminQR(
        data.access_code
      );
    }

    await refreshAdmin();

    alert(
      "تم إضافة العضو بنجاح ✅"
    );

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم إضافة العضو: " +
      error.message
    );

  } finally {

    if (button) {
      button.disabled = false;
    }
  }
}


/* =========================
   IMAGE UPLOAD
========================= */

async function uploadImage(
  file,
  folder
) {

  if (!file) return null;

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

  const { error } =
    await sb
      .storage
      .from("site-images")
      .upload(
        path,
        file,
        {
          cacheControl: "86400",
          upsert: false
        }
      );

  if (error) throw error;

  const { data } =
    sb
      .storage
      .from("site-images")
      .getPublicUrl(path);

  return data.publicUrl;
}


/* =========================
   PUBLISH POST
========================= */

async function publishPost() {

  const title =
    $("postTitle")
      ?.value.trim();

  const body =
    $("postBody")
      ?.value.trim();

  const selectedTeam =
    $("postTeam")
      ?.value;

  if (!title || !body) {

    alert(
      "اكتب عنوان وتفاصيل المنشور."
    );

    return;
  }

  const button =
    $("postBtn");

  if (button) {
    button.disabled = true;
  }

  try {

    let teamId = null;

    if (
      selectedTeam &&
      selectedTeam !== "all"
    ) {
      teamId =
        Number(selectedTeam);
    }

    let imageUrl = null;

    const file =
      $("postImage")
        ?.files?.[0];

    if (file) {

      imageUrl =
        await uploadImage(
          file,
          "posts"
        );
    }

    const { error } =
      await sb
        .from("posts")
        .insert({
          title,
          body,
          team_id: teamId,
          image_url: imageUrl
        });

    if (error) throw error;

    $("postTitle").value = "";
    $("postBody").value = "";

    if ($("postImage")) {
      $("postImage").value = "";
    }

    await refreshAdmin();

    alert(
      "تم النشر بنجاح ✅"
    );

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم النشر: " +
      error.message
    );

  } finally {

    if (button) {
      button.disabled = false;
    }
  }
}


/* =========================
   ADMIN POSTS
========================= */

async function refreshAdminPosts() {

  const box =
    $("adminPosts");

  if (!box) return;

  try {

    const { data, error } =
      await sb
        .from("posts")
        .select(`
          id,
          title,
          body,
          image_url,
          created_at,
          team_id,
          teams (
            name
          )
        `)
        .order(
          "created_at",
          { ascending: false }
        )
        .limit(100);

    if (error) throw error;

    if (!data?.length) {

      box.innerHTML =
        "لا يوجد منشورات.";

      return;
    }

    box.innerHTML =
      data.map(post => `

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
              esc(
                post.teams?.name ||
                "كل الفرق"
              )
            }
          </small>

          ${
            post.image_url
              ? `
                <img
                  class="admin-post-image"
                  src="${esc(post.image_url)}"
                  loading="lazy"
                  alt=""
                >
              `
              : ""
          }

          <br>

          <button
            class="delete-btn"
            onclick="deletePost(${post.id})"
          >
            🗑 حذف المنشور
          </button>

        </div>

      `).join("");

  } catch (error) {

    console.error(error);

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

    const { data, error } =
      await sb
        .from("teams")
        .select("score")
        .eq("id", teamId)
        .single();

    if (error) throw error;

    const newScore =
      Number(data.score || 0) +
      Number(amount);

    const { error: updateError } =
      await sb
        .from("teams")
        .update({
          score: newScore
        })
        .eq("id", teamId);

    if (updateError)
      throw updateError;

    teamsCache = null;

    await refreshAdmin();

    if (member) {
      await loadRanking();
    }

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم تعديل النقاط: " +
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

    const { error } =
      await sb
        .from("members")
        .delete()
        .eq("id", id);

    if (error) throw error;

    await refreshAdmin();

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف العضو: " +
      error.message
    );
  }
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

    /*
      حذف الردود أولًا
    */

    const { error: repliesError } =
      await sb
        .from("replies")
        .delete()
        .eq(
          "post_id",
          postId
        );

    if (repliesError)
      throw repliesError;

    const { error } =
      await sb
        .from("posts")
        .delete()
        .eq(
          "id",
          postId
        );

    if (error) throw error;

    await refreshAdminPosts();

    if (member) {
      await loadMemberPosts();
    }

    alert(
      "تم حذف المنشور ✅"
    );

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف المنشور: " +
      error.message
    );
  }
}


/* =========================
   CHANGE PHOTO
========================= */

async function changeMemberPhoto(id) {

  const input =
    document.createElement(
      "input"
    );

  input.type = "file";
  input.accept = "image/*";

  input.onchange =
    async () => {

      const file =
        input.files?.[0];

      if (!file) return;

      try {

        const photoUrl =
          await uploadImage(
            file,
            "members"
          );

        const { error } =
          await sb
            .from("members")
            .update({
              photo_url:
                photoUrl
            })
            .eq(
              "id",
              id
            );

        if (error)
          throw error;

        await refreshAdmin();

      } catch (error) {

        console.error(error);

        alert(
          "لم يتم تغيير الصورة: " +
          error.message
        );
      }
    };

  input.click();
}


/* =========================
   QR
========================= */

function createAdminQR(code) {

  const box =
    $("adminQR");

  if (
    !box ||
    typeof QRCode ===
    "undefined"
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


function showMemberQR(code) {

  if (!code) return;

  const popup =
    document.createElement(
      "div"
    );

  popup.style.cssText = `
    position:fixed;
    inset:0;
    z-index:99999;
    display:grid;
    place-items:center;
    background:rgba(0,0,0,.9);
  `;

  popup.innerHTML = `
    <div
      style="
        background:#101827;
        padding:25px;
        border-radius:20px;
        text-align:center;
      "
    >

      <div id="popupQR"></div>

      <p>
        ${esc(code)}
      </p>

      <button>
        إغلاق
      </button>

    </div>
  `;

  document.body.appendChild(
    popup
  );

  new QRCode(
    popup.querySelector(
      "#popupQR"
    ),
    {
      text: code,
      width: 220,
      height: 220
    }
  );

  popup
    .querySelector("button")
    .onclick = () =>
      popup.remove();
}


/* =========================
   LOGOUT
========================= */

function logout() {

  localStorage.removeItem(
    "memberId"
  );

  member = null;

  if ($("accessCode")) {
    $("accessCode").value = "";
  }

  showJoin();
}


/* =========================
   RESTORE MEMBER
========================= */

async function restoreSavedMember() {

  const id =
    localStorage.getItem(
      "memberId"
    );

  if (!id) return;

  try {

    const { data, error } =
      await sb
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
        .eq("id", id)
        .maybeSingle();

    if (error)
      throw error;

    if (!data) {

      localStorage.removeItem(
        "memberId"
      );

      return;
    }

    member = {
      id: data.id,
      name: data.name,
      teamId: data.team_id,
      teamName: data.teams?.name || "",
      accessCode: data.access_code,
      photoUrl: data.photo_url || ""
    };

    await showMember();

  } catch (error) {

    console.error(
      "Restore error:",
      error
    );
  }
}


/* =========================
   EVENTS
========================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    renderTeams();

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

          if (
            e.key ===
            "Enter"
          ) {
            loginWithCode();
          }
        }
      );

    $("adminPass")
      ?.addEventListener(
        "keydown",
        e => {

          if (
            e.key ===
            "Enter"
          ) {
            loginAdmin();
          }
        }
      );

    showJoin();

    await restoreSavedMember();
  }
);
