/* =====================================================
   INFINITY SPACE MISSION
   APP.JS — OPTIMIZED VERSION
===================================================== */

const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_zF7z4wuwluqfPDfAH0-7qg_8-tjtrSr";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* =====================================================
   PLANETS
===================================================== */

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

/* =====================================================
   STATE
===================================================== */

let member = null;
let admin = false;
let scanner = null;

let teamsCache = null;
let teamsCacheTime = 0;

let postsCache = null;
let postsCacheTime = 0;

let refreshTimer = null;
let busy = false;

const CACHE_TIME = 30000;
const ADMIN_PASSWORD = "1234";

/* =====================================================
   SHORTCUT
===================================================== */

function $(id) {
  return document.getElementById(id);
}

/* =====================================================
   ESCAPE
===================================================== */

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

/* =====================================================
   TEAM HELPERS
===================================================== */

function getLocalTeam(id) {
  return T.find(
    t => String(t.id) === String(id)
  );
}

function findLocalTeamByName(name) {
  if (!name) return null;

  const value = String(name).trim();

  return T.find(
    t =>
      t.name === value ||
      t.english.toLowerCase() ===
        value.toLowerCase()
  ) || null;
}

/* =====================================================
   CACHE
===================================================== */

function clearTeamsCache() {
  teamsCache = null;
  teamsCacheTime = 0;
}

function clearPostsCache() {
  postsCache = null;
  postsCacheTime = 0;
}

/* =====================================================
   LOAD TEAMS
===================================================== */

async function getTeams(force = false) {

  const now = Date.now();

  if (
    !force &&
    teamsCache &&
    now - teamsCacheTime < CACHE_TIME
  ) {
    return teamsCache;
  }

  const {
    data,
    error
  } = await sb
    .from("teams")
    .select("id,name,score")
    .order("id");

  if (error) {
    console.error(
      "Teams error:",
      error
    );

    return teamsCache || [];
  }

  teamsCache = data || [];
  teamsCacheTime = now;

  return teamsCache;
}

/* =====================================================
   GENERATE CODE
===================================================== */

function generateCode() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "INF-";

  for (let i = 0; i < 6; i++) {
    code +=
      chars[
        Math.floor(
          Math.random() *
          chars.length
        )
      ];
  }

  return code;
}

/* =====================================================
   SHOW JOIN
===================================================== */

function showJoin() {

  $("member")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
  $("join")?.classList.remove("hidden");
}

/* =====================================================
   RENDER TEAMS
===================================================== */

function renderTeams() {

  const box = $("teams");

  if (!box) return;

  box.innerHTML = T.map(team => `
    <div
      class="team"
      data-team="${esc(team.id)}"
    >

      <img
        src="${esc(team.image)}"
        alt="${esc(team.name)}"
        loading="lazy"
        decoding="async"
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

/* =====================================================
   ADMIN TEAM SELECTS
===================================================== */

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

    ${teams.map(team => `
      <option value="${team.id}">
        ${esc(team.name)}
      </option>
    `).join("")}
  `;

  if (postSelect) {

    postSelect.innerHTML = `
      <option value="all">
        كل الفرق
      </option>

      ${teams.map(team => `
        <option value="${team.id}">
          ${esc(team.name)}
        </option>
      `).join("")}
    `;
  }
}

/* =====================================================
   LOGIN
===================================================== */

async function loginWithCode() {

  if (busy) return;

  const input = $("accessCode");

  if (!input) return;

  const code =
    input.value
      .trim()
      .toUpperCase();

  if (!code) {
    $("msg").textContent =
      "اكتب كود الدخول.";
    return;
  }

  busy = true;

  $("codeLoginBtn")?.setAttribute(
    "disabled",
    "true"
  );

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
        photo_url,
        teams (
          id,
          name
        )
      `)
      .eq(
        "access_code",
        code
      )
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
      teamName:
        data.teams?.name || "",
      accessCode:
        data.access_code,
      photoUrl:
        data.photo_url || ""
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
      "حدث خطأ: " +
      error.message;

  } finally {

    busy = false;

    $("codeLoginBtn")?.removeAttribute(
      "disabled"
    );
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

  if ($("memberName")) {
    $("memberName").textContent =
      member.name;
  }

  if ($("memberTeam")) {
    $("memberTeam").textContent =
      `فريق ${member.teamName}`;
  }

  const team =
    findLocalTeamByName(
      member.teamName
    );

  const photo =
    $("memberPhoto");

  if (photo) {

    photo.src =
      member.photoUrl ||
      team?.image ||
      "";

    photo.loading = "lazy";
  }

  await refreshMember();
}

/* =====================================================
   LOAD POSTS
===================================================== */

async function getPosts(force = false) {

  const now = Date.now();

  if (
    !force &&
    postsCache &&
    now - postsCacheTime < CACHE_TIME
  ) {
    return postsCache;
  }

  const {
    data,
    error
  } = await sb
    .from("posts")
    .select(`
      id,
      title,
      body,
      image_url,
      team_id,
      created_at
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    )
    .limit(50);

  if (error) {

    console.error(
      "Posts error:",
      error
    );

    return postsCache || [];
  }

  postsCache = data || [];
  postsCacheTime = now;

  return postsCache;
}

/* =====================================================
   MEMBER REFRESH
===================================================== */

async function refreshMember() {

  if (!member) return;

  try {

    const teams =
      await getTeams();

    const posts =
      await getPosts();

    const currentTeam =
      teams.find(
        t =>
          Number(t.id) ===
          Number(member.teamId)
      );

    const visiblePosts =
      posts.filter(post => {

        if (
          post.team_id === null ||
          post.team_id === undefined
        ) {
          return true;
        }

        return Number(post.team_id) ===
          Number(member.teamId);
      });

    renderMemberPosts(
      visiblePosts
    );

    renderRanking(
      teams
    );

    await loadRepliesForPosts(
      visiblePosts
    );

  } catch (error) {

    console.error(
      "Member refresh:",
      error
    );
  }
}

/* =====================================================
   RENDER POSTS
===================================================== */

function renderMemberPosts(posts) {

  const box = $("posts");

  if (!box) return;

  if (!posts.length) {

    box.innerHTML =
      "<p>لا يوجد محتوى حاليًا.</p>";

    return;
  }

  box.innerHTML =
    posts.map(
      renderMemberPost
    ).join("");
}

/* =====================================================
   MEMBER POST
===================================================== */

function renderMemberPost(post) {

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

/* =====================================================
   LOAD REPLIES
===================================================== */

async function loadRepliesForPosts(posts) {

  if (!posts.length) return;

  const ids =
    posts.map(
      p => p.id
    );

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
      )
      .limit(300);

    if (error) throw error;

    posts.forEach(post => {

      const box =
        $(
          `replies-${post.id}`
        );

      if (!box) return;

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
          reply => `
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
                ${esc(
                  reply.body
                ).replace(
                  /\n/g,
                  "<br>"
                )}
              </p>

            </div>
          `
        ).join("");
    });

  } catch (error) {

    console.error(
      "Replies error:",
      error
    );
  }
}

/* =====================================================
   SEND REPLY
===================================================== */

async function sendReply(postId) {

  if (!member) {

    alert(
      "يجب تسجيل الدخول أولًا."
    );

    return;
  }

  const input =
    $(
      `reply-input-${postId}`
    );

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
      ?.querySelector(
        "button"
      );

  if (button) {
    button.disabled = true;
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

    if (error) throw error;

    input.value = "";

    await refreshMember();

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

/* =====================================================
   RANKING
===================================================== */

function renderRanking(teams) {

  const box =
    $("ranking");

  if (!box) return;

  const ranking =
    [...teams].sort(
      (a, b) =>
        Number(b.score || 0) -
        Number(a.score || 0)
    );

  box.innerHTML =
    ranking.map(
      (team, index) => `
        <div class="rank">

          <span>
            #${index + 1}
            🪐
            ${esc(team.name)}
          </span>

          <b>
            ${Number(team.score || 0)}
            نقطة
          </b>

        </div>
      `
    ).join("");
}

/* =====================================================
   ADMIN LOGIN
===================================================== */

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

/* =====================================================
   OPEN ADMIN
===================================================== */

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

function closeAdmin() {

  $("loginModal")
    ?.classList.add("hidden");
}

function adminLogout() {

  admin = false;

  $("admin")
    ?.classList.add("hidden");

  showJoin();
}

/* =====================================================
   REFRESH ADMIN
===================================================== */

async function refreshAdmin() {

  try {

    const teams =
      await getTeams(true);

    await loadAdminTeamSelects();

    const {
      data: members,
      error
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
      .order(
        "id",
        {
          ascending: false
        }
      )
      .limit(200);

    if (error) throw error;

    renderAdminMembers(
      members || []
    );

    renderAdminScores(
      teams
    );

    await refreshAdminPosts();

  } catch (error) {

    console.error(
      "Admin error:",
      error
    );

    alert(
      "خطأ في لوحة التحكم: " +
      error.message
    );
  }
}

/* =====================================================
   ADMIN MEMBERS
===================================================== */

function renderAdminMembers(
  members
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
    members.map(
      m => `
        <div class="member">

          <div class="admin-member-left">

            ${
              m.photo_url
                ? `
                  <img
                    class="admin-member-photo"
                    src="${esc(
                      m.photo_url
                    )}"
                    loading="lazy"
                    alt="صورة العضو"
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
                  m.teams?.name ||
                  "بدون فريق"
                )}
              </small>

              <br>

              <small>
                🔐
                ${esc(
                  m.access_code ||
                  "بدون كود"
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
      `
    ).join("");
}

/* =====================================================
   ADMIN SCORES
===================================================== */

function renderAdminScores(
  teams
) {

  const box =
    $("scores");

  if (!box) return;

  box.innerHTML =
    teams.map(
      team => `
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
      `
    ).join("");
}

/* =====================================================
   CHANGE SCORE
===================================================== */

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

    if (error) throw error;

    const newScore =
      Number(data.score || 0) +
      Number(amount);

    const {
      error:
        updateError
    } = await sb
      .from("teams")
      .update({
        score:
          newScore
      })
      .eq(
        "id",
        teamId
      );

    if (updateError) {
      throw updateError;
    }

    clearTeamsCache();

    await refreshAdmin();

    if (member) {
      await refreshMember();
    }

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم تعديل النقاط: " +
      error.message
    );
  }
}

/* =====================================================
   STORAGE
===================================================== */

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

  const filename =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

  const path =
    `${folder}/${filename}`;

  const {
    error
  } = await sb
    .storage
    .from("site-images")
    .upload(
      path,
      file,
      {
        cacheControl:
          "3600",
        upsert:
          false
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
    .getPublicUrl(
      path
    );

  return data.publicUrl;
}

/* =====================================================
   ADD MEMBER
===================================================== */

async function addMember() {

  if (busy) return;

  const name =
    $("newMemberName")
      ?.value
      .trim();

  const teamId =
    $("newMemberTeam")
      ?.value;

  const file =
    $("newMemberPhoto")
      ?.files?.[0];

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

  busy = true;

  const button =
    $("addMemberBtn");

  if (button) {
    button.disabled = true;
  }

  try {

    let code;

    for (;;) {

      code =
        generateCode();

      const {
        data
      } = await sb
        .from("members")
        .select("id")
        .eq(
          "access_code",
          code
        )
        .limit(1);

      if (!data?.length) {
        break;
      }
    }

    let photoUrl = null;

    if (file) {

      photoUrl =
        await uploadImage(
          file,
          "members"
        );
    }

    const {
      data,
      error
    } = await sb
      .from("members")
      .insert({
        name,
        team_id:
          Number(teamId),
        access_code:
          code,
        score:
          0,
        photo_url:
          photoUrl
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
    }

    createAdminQR(
      data.access_code
    );

    alert(
      "تم إضافة العضو بنجاح ✅"
    );

    await refreshAdmin();

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم إضافة العضو: " +
      error.message
    );

  } finally {

    busy = false;

    if (button) {
      button.disabled = false;
    }
  }
}

/* =====================================================
   PUBLISH POST
===================================================== */

async function publishPost() {

  if (busy) return;

  const title =
    $("postTitle")
      ?.value
      .trim();

  const body =
    $("postBody")
      ?.value
      .trim();

  const selectedTeam =
    $("postTeam")
      ?.value;

  const file =
    $("postImage")
      ?.files?.[0];

  if (!title || !body) {

    alert(
      "اكتب عنوان وتفاصيل المنشور."
    );

    return;
  }

  busy = true;

  try {

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
        team_id:
          selectedTeam &&
          selectedTeam !== "all"
            ? Number(
                selectedTeam
              )
            : null,
        image_url:
          imageUrl
      });

    if (error) throw error;

    clearPostsCache();

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
      "تم النشر بنجاح ✅"
    );

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم النشر: " +
      error.message
    );

  } finally {

    busy = false;
  }
}

/* =====================================================
   ADMIN POSTS
===================================================== */

async function refreshAdminPosts() {

  const box =
    $("adminPosts");

  if (!box) return;

  try {

    const {
      data,
      error
    } = await sb
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
        {
          ascending: false
        }
      )
      .limit(100);

    if (error) throw error;

    if (!data?.length) {

      box.innerHTML =
        "لا يوجد منشورات.";

      return;
    }

    box.innerHTML =
      data.map(
        post => `
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
              ${esc(
                post.teams?.name ||
                "كل الفرق"
              )}
            </small>

            ${
              post.image_url
                ? `
                  <img
                    class="admin-post-image"
                    src="${esc(
                      post.image_url
                    )}"
                    loading="lazy"
                    decoding="async"
                    alt="صورة المنشور"
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
        `
      ).join("");

  } catch (error) {

    console.error(error);

    box.innerHTML =
      "تعذر تحميل المنشورات.";
  }
}

/* =====================================================
   DELETE MEMBER
===================================================== */

async function deleteMember(id) {

  if (
    !confirm(
      "هل أنت متأكد من حذف العضو؟"
    )
  ) return;

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

    if (error) throw error;

    alert(
      "تم حذف العضو ✅"
    );

    await refreshAdmin();

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف العضو: " +
      error.message
    );
  }
}

/* =====================================================
   DELETE POST
===================================================== */

async function deletePost(
  postId
) {

  if (
    !confirm(
      "هل أنت متأكد من حذف المنشور؟"
    )
  ) return;

  try {

    const {
      error:
        replyError
    } = await sb
      .from("replies")
      .delete()
      .eq(
        "post_id",
        postId
      );

    if (
      replyError
    ) {
      console.warn(
        "Reply delete:",
        replyError
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

    if (error) throw error;

    clearPostsCache();

    alert(
      "تم حذف المنشور ✅"
    );

    await refreshAdminPosts();

    if (member) {
      await refreshMember();
    }

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف المنشور: " +
      error.message
    );
  }
}

/* =====================================================
   CHANGE MEMBER PHOTO
===================================================== */

async function changeMemberPhoto(
  id
) {

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

        const {
          error
        } = await sb
          .from("members")
          .update({
            photo_url:
              photoUrl
          })
          .eq(
            "id",
            id
          );

        if (error) throw error;

        alert(
          "تم تغيير الصورة ✅"
        );

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

/* =====================================================
   QR
===================================================== */

function createAdminQR(
  code
) {

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
      text:
        code,
      width:
        180,
      height:
        180
    }
  );
}

function showMemberQR(
  code
) {

  if (!code) {

    alert(
      "لا يوجد كود."
    );

    return;
  }

  const overlay =
    document.createElement(
      "div"
    );

  overlay.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.9);
    display:grid;
    place-items:center;
    z-index:99999;
  `;

  overlay.innerHTML = `
    <div
      style="
        background:#101827;
        padding:30px;
        border-radius:25px;
        text-align:center;
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

  new QRCode(
    overlay.querySelector(
      "#popupQR"
    ),
    {
      text:
        code,
      width:
        220,
      height:
        220
    }
  );

  overlay.querySelector(
    "#closeQR"
  ).onclick =
    () => overlay.remove();
}

/* =====================================================
   QR SCANNER
===================================================== */

async function startQRScanner() {

  const box =
    $("qrScanner");

  if (!box) return;

  box.classList.remove(
    "hidden"
  );

  if (scanner) {

    try {
      await scanner.stop();
    } catch {}
  }

  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    $("scanMsg").textContent =
      "ماسح QR غير متاح.";

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
        fps:
          10,
        qrbox: {
          width:
            250,
          height:
            250
        }
      },
      async code => {

        $("accessCode").value =
          code;

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

    console.error(error);

    $("scanMsg").textContent =
      "تعذر تشغيل الكاميرا.";
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

  clearPostsCache();

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
        photo_url,
        teams (
          id,
          name
        )
      `)
      .eq(
        "id",
        id
      )
      .maybeSingle();

    if (error || !data) {

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
        data.team_id,
      teamName:
        data.teams?.name || "",
      accessCode:
        data.access_code,
      photoUrl:
        data.photo_url || ""
    };

    await showMember();

  } catch (error) {

    console.error(
      "Restore error:",
      error
    );
  }
}

/* =====================================================
   EVENTS
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderTeams();

    showJoin();

    $("codeLoginBtn")
      ?.addEventListener(
        "click",
        loginWithCode
      );

    $("scanQRBtn")
      ?.addEventListener(
        "click",
        startQRScanner
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

    $("postBtn")
      ?.addEventListener(
        "click",
        publishPost
      );

    $("addMemberBtn")
      ?.addEventListener(
        "click",
        addMember
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

    restoreSavedMember();
  }
);
