/* =========================================================
   INFINITY
   OPTIMIZED APP.JS
   Supabase + Members + Teams + Posts + Replies + QR
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_zF7z4wuwluqfPDfAH0-7qg_8-tjtrSr";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================================
   SETTINGS
========================================================= */

const ADMIN_PASSWORD = "1234";

const PAGE_SIZE = 20;

let member = null;
let admin = false;
let scanner = null;

let teamsCache = [];
let postsCache = [];

let postsPage = 0;
let loadingPosts = false;

let busyAddMember = false;
let busyPost = false;


/* =========================================================
   TEAM FALLBACK
========================================================= */

const DEFAULT_TEAMS = [
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


/* =========================================================
   SHORTCUT
========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   ESCAPE HTML
========================================================= */

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


/* =========================================================
   TEAM HELPERS
========================================================= */

function getTeam(id) {

  return teamsCache.find(
    t => Number(t.id) === Number(id)
  ) ||
  DEFAULT_TEAMS.find(
    t => Number(t.id) === Number(id)
  );
}


function getTeamByName(name) {

  if (!name) return null;

  const value =
    String(name).trim().toLowerCase();

  return teamsCache.find(
    t =>
      String(t.name).trim().toLowerCase() === value ||
      String(t.english || "").trim().toLowerCase() === value
  ) ||
  DEFAULT_TEAMS.find(
    t =>
      String(t.name).trim().toLowerCase() === value ||
      String(t.english || "").trim().toLowerCase() === value
  );
}


/* =========================================================
   GENERATE CODE
========================================================= */

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


/* =========================================================
   PAGE CONTROL
========================================================= */

function showJoin() {

  $("join")?.classList.remove("hidden");
  $("member")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
}


function showMemberPage() {

  $("join")?.classList.add("hidden");
  $("member")?.classList.remove("hidden");
  $("admin")?.classList.add("hidden");
}


function showAdminPage() {

  $("join")?.classList.add("hidden");
  $("member")?.classList.add("hidden");
  $("admin")?.classList.remove("hidden");
}


/* =========================================================
   LOAD TEAMS
========================================================= */

async function loadTeams(force = false) {

  if (
    teamsCache.length &&
    !force
  ) {
    return teamsCache;
  }

  try {

    const {
      data,
      error
    } = await sb
      .from("teams")
      .select("id,name,score")
      .order("id");

    if (error) {
      throw error;
    }

    if (data?.length) {

      teamsCache = data.map(team => {

        const local =
          DEFAULT_TEAMS.find(
            t =>
              Number(t.id) === Number(team.id) ||
              t.name === team.name
          );

        return {
          ...team,
          english:
            local?.english || "",
          image:
            local?.image || ""
        };
      });

    } else {

      teamsCache =
        [...DEFAULT_TEAMS];
    }

  } catch (error) {

    console.warn(
      "Teams loading failed:",
      error.message
    );

    teamsCache =
      [...DEFAULT_TEAMS];
  }

  return teamsCache;
}


/* =========================================================
   RENDER PUBLIC TEAMS
========================================================= */

async function renderTeams() {

  const box = $("teams");

  if (!box) return;

  const teams =
    await loadTeams();

  box.innerHTML =
    teams.map(team => `

      <div
        class="team"
        data-team="${esc(team.id)}"
      >

        <div class="planet-wrap">

          <img
            src="${esc(team.image || "")}"
            alt="${esc(team.name)}"
            loading="lazy"
            onerror="this.style.display='none'"
          >

        </div>

        <div class="team-info">

          <span>
            PLANET
          </span>

          <strong>
            ${esc(team.name)}
          </strong>

          <small>
            ${esc(team.english || "")}
          </small>

        </div>

      </div>

    `).join("");
}


/* =========================================================
   ADMIN TEAM SELECTS
========================================================= */

async function loadAdminTeamSelects() {

  const memberSelect =
    $("newMemberTeam");

  const postSelect =
    $("postTeam");

  const teams =
    await loadTeams();

  if (memberSelect) {

    memberSelect.innerHTML = `
      <option value="">
        اختر الفريق
      </option>

      ${teams.map(team => `
        <option value="${esc(team.id)}">
          ${esc(team.name)}
        </option>
      `).join("")}
    `;
  }

  if (postSelect) {

    postSelect.innerHTML = `
      <option value="all">
        كل الفرق
      </option>

      ${teams.map(team => `
        <option value="${esc(team.id)}">
          ${esc(team.name)}
        </option>
      `).join("")}
    `;
  }
}


/* =========================================================
   LOGIN MEMBER
========================================================= */

async function loginWithCode() {

  const input =
    $("accessCode");

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

  $("msg").textContent =
    "جاري الدخول...";

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
        teams(
          id,
          name
        )
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

    $("msg").textContent = "";

    await showMember();

  } catch (error) {

    console.error(
      "Member login:",
      error
    );

    $("msg").textContent =
      "حدث خطأ: " +
      error.message;
  }
}


/* =========================================================
   SHOW MEMBER
========================================================= */

async function showMember() {

  if (!member) return;

  await loadTeams();

  showMemberPage();

  const team =
    getTeam(member.teamId);

  if ($("memberName")) {

    $("memberName").textContent =
      member.name;
  }

  if ($("memberTeam")) {

    $("memberTeam").textContent =
      team
        ? `فريق ${team.name} • ${team.english || ""}`
        : "بدون فريق";
  }

  if ($("memberPhoto")) {

    $("memberPhoto").src =
      member.photoUrl ||
      team?.image ||
      "";
  }

  await loadMemberContent();
}


/* =========================================================
   LOAD MEMBER CONTENT
========================================================= */

async function loadMemberContent() {

  if (!member) return;

  await Promise.all([
    loadMemberPosts(),
    loadRanking()
  ]);
}


/* =========================================================
   LOAD POSTS
========================================================= */

async function loadMemberPosts() {

  const box =
    $("posts");

  if (!box) return;

  if (loadingPosts) return;

  loadingPosts = true;

  box.innerHTML =
    "<p>جاري تحميل المنشورات...</p>";

  try {

    const teamId =
      Number(member.teamId);

    const {
      data: posts,
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
      .or(
        `team_id.is.null,team_id.eq.${teamId}`
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .range(
        0,
        PAGE_SIZE - 1
      );

    if (error) {
      throw error;
    }

    postsCache =
      posts || [];

    if (!postsCache.length) {

      box.innerHTML =
        "<p>لا يوجد منشورات حاليًا.</p>";

      return;
    }

    box.innerHTML =
      postsCache
        .map(renderPost)
        .join("");

    await loadRepliesForPosts(
      postsCache
    );

  } catch (error) {

    console.error(
      "Posts error:",
      error
    );

    box.innerHTML =
      "<p>تعذر تحميل المنشورات.</p>";
  } finally {

    loadingPosts = false;
  }
}


/* =========================================================
   RENDER POST
========================================================= */

function renderPost(post) {

  return `

    <article
      class="post"
      id="post-${esc(post.id)}"
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
              alt="صورة المنشور"
              loading="lazy"
            >
          `
          : ""
      }

      <div class="replies">

        <h4>
          💬 الردود
        </h4>

        <div
          id="replies-${esc(post.id)}"
          class="reply-list"
        >
          جاري تحميل الردود...
        </div>

        <div class="reply-box">

          <textarea
            id="reply-input-${esc(post.id)}"
            placeholder="اكتب ردك هنا..."
            maxlength="1000"
          ></textarea>

          <button
            type="button"
            class="reply-button"
            data-post-id="${esc(post.id)}"
            onclick="sendReply(${Number(post.id)})"
          >
            إرسال الرد
          </button>

        </div>

      </div>

    </article>

  `;
}


/* =========================================================
   LOAD REPLIES
========================================================= */

async function loadRepliesForPosts(posts) {

  if (!posts?.length) return;

  const ids =
    posts.map(
      post => post.id
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
        members(
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
        replies.map(reply => `

          <div
            class="reply"
            id="reply-${esc(reply.id)}"
          >

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

        `).join("");
    });

  } catch (error) {

    console.error(
      "Replies:",
      error
    );

    posts.forEach(post => {

      const box =
        $(`replies-${post.id}`);

      if (box) {

        box.innerHTML =
          "<small>تعذر تحميل الردود.</small>";
      }
    });
  }
}


/* =========================================================
   SEND REPLY
========================================================= */

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

  if (body.length > 1000) {

    alert(
      "الرد طويل جدًا."
    );

    return;
  }

  const button =
    document.querySelector(
      `[data-post-id="${postId}"]`
    );

  if (button) {

    button.disabled = true;
    button.textContent =
      "جاري الإرسال...";
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

    /*
       تحديث ردود المنشور فقط
       بدل إعادة تحميل الموقع كله
    */

    await loadRepliesForPosts([
      {
        id: postId
      }
    ]);

  } catch (error) {

    console.error(
      "Send reply:",
      error
    );

    alert(
      "لم يتم إرسال الرد: " +
      error.message
    );

  } finally {

    if (button) {

      button.disabled = false;
      button.textContent =
        "إرسال الرد";
    }
  }
}


/* =========================================================
   RANKING
========================================================= */

async function loadRanking() {

  const box =
    $("ranking");

  if (!box) return;

  try {

    const {
      data,
      error
    } = await sb
      .from("teams")
      .select(
        "id,name,score"
      )
      .order(
        "score",
        {
          ascending: false
        }
      );

    if (error) {
      throw error;
    }

    box.innerHTML =
      (data || []).map(
        (team, index) => {

          const local =
            getTeam(team.id);

          return `

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

          `;
        }
      ).join("");

  } catch (error) {

    console.error(
      "Ranking:",
      error
    );

    box.innerHTML =
      "<p>تعذر تحميل الترتيب.</p>";
  }
}


/* =========================================================
   ADMIN LOGIN
========================================================= */

async function loginAdmin() {

  const password =
    $("adminPass")?.value || "";

  if (password !== ADMIN_PASSWORD) {

    $("loginMsg").textContent =
      "كلمة المرور غير صحيحة.";

    return;
  }

  admin = true;

  $("loginModal")
    ?.classList.add("hidden");

  showAdminPage();

  await loadTeams(true);

  await loadAdminTeamSelects();

  await refreshAdmin();
}


/* =========================================================
   OPEN ADMIN
========================================================= */

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


/* =========================================================
   ADMIN LOGOUT
========================================================= */

function adminLogout() {

  admin = false;

  showJoin();
}


/* =========================================================
   REFRESH ADMIN
========================================================= */

async function refreshAdmin() {

  if (!admin) return;

  await loadTeams(true);

  await loadAdminTeamSelects();

  await Promise.all([
    loadAdminMembers(),
    loadAdminScores(),
    loadAdminPosts()
  ]);
}


/* =========================================================
   ADMIN MEMBERS
========================================================= */

async function loadAdminMembers() {

  const box =
    $("members");

  if (!box) return;

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
        score,
        photo_url,
        teams(
          name
        )
      `)
      .order(
        "id",
        {
          ascending: false
        }
      )
      .range(
        0,
        99
      );

    if (error) {
      throw error;
    }

    if (!data?.length) {

      box.innerHTML =
        "لا يوجد أعضاء.";

      return;
    }

    box.innerHTML =
      data.map(m => `

        <div class="member">

          <div class="admin-member-left">

            ${
              m.photo_url
                ? `
                  <img
                    class="admin-member-photo"
                    src="${esc(m.photo_url)}"
                    alt="عضو"
                  >
                `
                : `
                  <div class="admin-member-photo"></div>
                `
            }

            <div>

              <b>
                ${esc(m.name)}
              </b>

              <br>

              <small>
                ${
                  esc(
                    m.teams?.name ||
                    "بدون فريق"
                  )
                }
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

          <div class="admin-member-buttons">

            <button
              type="button"
              onclick="showMemberQR('${esc(
                m.access_code || ""
              )}')"
            >
              QR
            </button>

            <button
              type="button"
              onclick="changeMemberPhoto(${Number(m.id)})"
            >
              صورة
            </button>

            <button
              type="button"
              class="delete-btn"
              onclick="deleteMember(${Number(m.id)})"
            >
              حذف
            </button>

          </div>

        </div>

      `).join("");

  } catch (error) {

    console.error(
      "Admin members:",
      error
    );

    box.innerHTML =
      "تعذر تحميل الأعضاء: " +
      esc(error.message);
  }
}


/* =========================================================
   ADMIN SCORES
========================================================= */

async function loadAdminScores() {

  const box =
    $("scores");

  if (!box) return;

  try {

    const {
      data,
      error
    } = await sb
      .from("teams")
      .select(
        "id,name,score"
      )
      .order("id");

    if (error) {
      throw error;
    }

    box.innerHTML =
      (data || []).map(team => `

        <div class="score">

          <span>

            ${esc(team.name)}

            :

            <b>
              ${Number(team.score || 0)}
            </b>

          </span>

          <button
            type="button"
            onclick="changeScore(${Number(team.id)},5)"
          >
            +5
          </button>

          <button
            type="button"
            onclick="changeScore(${Number(team.id)},10)"
          >
            +10
          </button>

          <button
            type="button"
            onclick="changeScore(${Number(team.id)},-5)"
          >
            -5
          </button>

          <button
            type="button"
            onclick="changeScore(${Number(team.id)},-10)"
          >
            -10
          </button>

        </div>

      `).join("");

  } catch (error) {

    console.error(
      "Scores:",
      error
    );
  }
}


/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadImage(
  file,
  folder
) {

  if (!file) {
    return null;
  }

  const extension =
    (
      file.name.split(".").pop() ||
      "jpg"
    ).toLowerCase();

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


/* =========================================================
   ADD MEMBER
========================================================= */

async function addMember() {

  if (busyAddMember) return;

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

  busyAddMember = true;

  const button =
    $("addMemberBtn");

  if (button) {

    button.disabled = true;
    button.textContent =
      "جاري إضافة العضو...";
  }

  try {

    let accessCode;

    /*
       عدد محاولات محدود
       لمنع Loop لا نهائي
    */

    for (let i = 0; i < 10; i++) {

      const candidate =
        generateCode();

      const {
        data,
        error
      } = await sb
        .from("members")
        .select("id")
        .eq(
          "access_code",
          candidate
        )
        .limit(1);

      if (error) {
        throw error;
      }

      if (!data?.length) {

        accessCode =
          candidate;

        break;
      }
    }

    if (!accessCode) {

      throw new Error(
        "تعذر إنشاء كود دخول فريد."
      );
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
        team_id: Number(teamId),
        access_code: accessCode,
        score: 0,
        photo_url: photoUrl
      })
      .select(
        "id,name,access_code"
      )
      .single();

    if (error) {

      /*
         لو حصل تعارض في الكود
         نجرب مرة أخرى عن طريق إظهار الخطأ.
      */

      throw error;
    }

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

    await loadAdminMembers();

    alert(
      "تم إضافة العضو بنجاح ✅"
    );

  } catch (error) {

    console.error(
      "Add member:",
      error
    );

    alert(
      "لم يتم إضافة العضو: " +
      error.message
    );

  } finally {

    busyAddMember = false;

    if (button) {

      button.disabled = false;
      button.textContent =
        "إضافة العضو";
    }
  }
}


/* =========================================================
   PUBLISH POST
========================================================= */

async function publishPost() {

  if (busyPost) return;

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

  busyPost = true;

  const button =
    $("postBtn");

  if (button) {

    button.disabled = true;
    button.textContent =
      "جاري النشر...";
  }

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
            ? Number(selectedTeam)
            : null,
        image_url:
          imageUrl
      });

    if (error) {
      throw error;
    }

    $("postTitle").value = "";
    $("postBody").value = "";

    if ($("postImage")) {
      $("postImage").value = "";
    }

    await loadAdminPosts();

    if (member) {
      await loadMemberPosts();
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
      "لم يتم النشر: " +
      error.message
    );

  } finally {

    busyPost = false;

    if (button) {

      button.disabled = false;
      button.textContent =
        "نشر 🚀";
    }
  }
}


/* =========================================================
   ADMIN POSTS
========================================================= */

async function loadAdminPosts() {

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
        team_id,
        created_at,
        teams(
          name
        )
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .range(
        0,
        99
      );

    if (error) {
      throw error;
    }

    if (!data?.length) {

      box.innerHTML =
        "لا يوجد منشورات.";

      return;
    }

    box.innerHTML =
      data.map(post => `

        <div
          class="admin-post"
          id="admin-post-${esc(post.id)}"
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
                  alt="صورة المنشور"
                  loading="lazy"
                >
              `
              : ""
          }

          <br>

          <button
            type="button"
            class="delete-btn"
            onclick="deletePost(${Number(post.id)})"
          >
            🗑 حذف المنشور
          </button>

        </div>

      `).join("");

  } catch (error) {

    console.error(
      "Admin posts:",
      error
    );

    box.innerHTML =
      "تعذر تحميل المنشورات: " +
      esc(error.message);
  }
}


/* =========================================================
   CHANGE SCORE
========================================================= */

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
        Number(teamId)
      )
      .single();

    if (error) {
      throw error;
    }

    const newScore =
      Math.max(
        0,
        Number(data.score || 0) +
        Number(amount)
      );

    const {
      error: updateError
    } = await sb
      .from("teams")
      .update({
        score: newScore
      })
      .eq(
        "id",
        Number(teamId)
      );

    if (updateError) {
      throw updateError;
    }

    await loadTeams(true);

    await loadAdminScores();

    if (member) {
      await loadRanking();
    }

  } catch (error) {

    console.error(
      "Score:",
      error
    );

    alert(
      "لم يتم تعديل النقاط: " +
      error.message
    );
  }
}


/* =========================================================
   DELETE MEMBER
========================================================= */

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
        Number(id)
      );

    if (error) {
      throw error;
    }

    await loadAdminMembers();

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
      "لم يتم حذف العضو: " +
      error.message
    );
  }
}


/* =========================================================
   CHANGE MEMBER PHOTO
========================================================= */

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
            Number(id)
          );

        if (error) {
          throw error;
        }

        await loadAdminMembers();

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

        console.error(error);

        alert(
          "لم يتم تغيير الصورة: " +
          error.message
        );
      }
    };

  input.click();
}


/* =========================================================
   DELETE POST
========================================================= */

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

    const {
      error: repliesError
    } = await sb
      .from("replies")
      .delete()
      .eq(
        "post_id",
        Number(postId)
      );

    if (repliesError) {
      throw repliesError;
    }

    /*
       حذف المنشور
    */

    const {
      error
    } = await sb
      .from("posts")
      .delete()
      .eq(
        "id",
        Number(postId)
      );

    if (error) {
      throw error;
    }

    await loadAdminPosts();

    if (member) {
      await loadMemberPosts();
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
      "لم يتم حذف المنشور: " +
      error.message
    );
  }
}


/* =========================================================
   QR
========================================================= */

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


function showMemberQR(code) {

  if (!code) {

    alert(
      "لا يوجد كود لهذا العضو."
    );

    return;
  }

  const overlay =
    document.createElement(
      "div"
    );

  overlay.style.position =
    "fixed";

  overlay.style.inset = "0";

  overlay.style.background =
    "rgba(0,0,0,.9)";

  overlay.style.display =
    "grid";

  overlay.style.placeItems =
    "center";

  overlay.style.zIndex =
    "99999";

  overlay.innerHTML = `

    <div
      style="
        background:#101827;
        padding:30px;
        border-radius:25px;
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

  overlay
    .querySelector("#closeQR")
    .onclick =
      () => overlay.remove();
}


/* =========================================================
   QR SCANNER
========================================================= */

async function startQRScanner() {

  const box =
    $("qrScanner");

  if (!box) return;

  box.classList.remove(
    "hidden"
  );

  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    $("scanMsg").textContent =
      "ماسح QR غير متاح.";

    return;
  }

  if (scanner) {

    try {
      await scanner.stop();
    } catch {}
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
          decodedText.trim();

        $("scanMsg").textContent =
          "تم قراءة الكود ✅";

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
      "QR:",
      error
    );

    $("scanMsg").textContent =
      "تعذر تشغيل الكاميرا.";
  }
}


/* =========================================================
   LOGOUT
========================================================= */

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


/* =========================================================
   RESTORE MEMBER
========================================================= */

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
      .eq(
        "id",
        Number(id)
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

    member = {

      id: data.id,

      name: data.name,

      teamId: data.team_id,

      accessCode:
        data.access_code,

      photoUrl:
        data.photo_url || ""
    };

    await showMember();

  } catch (error) {

    console.warn(
      "Restore member:",
      error.message
    );
  }
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

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
      () => {
        $("loginModal")
          ?.classList.add("hidden");
      }
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
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    showJoin();

    setupEvents();

    /*
       الكواكب تظهر فورًا
       ثم يتم تحديثها من Supabase
    */

    await renderTeams();

    /*
       استرجاع العضو إن كان مسجلًا
    */

    await restoreSavedMember();

  }
);
