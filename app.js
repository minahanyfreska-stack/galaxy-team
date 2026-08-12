/* =====================================================
   INFINITY - GALAXY TEAMS
   OPTIMIZED APP.JS
===================================================== */

/* =====================================================
   SUPABASE
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
   VARIABLES
===================================================== */

let member = null;
let admin = false;
let scanner = null;

let teamsCache = null;
let teamsCacheTime = 0;

const TEAM_CACHE_TIME = 30000;

const ADMIN_PASSWORD = "1234";


/* =====================================================
   SHORTCUT
===================================================== */

function $(id) {
  return document.getElementById(id);
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function esc(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    function (c) {

      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[c];

    }
  );
}


/* =====================================================
   PLANET HELPERS
===================================================== */

function getPlanet(id) {

  return T.find(
    team =>
      String(team.id) === String(id)
  ) || null;
}


function findPlanetByName(name) {

  if (!name) {
    return null;
  }

  const value =
    String(name)
      .trim()
      .toLowerCase();

  return T.find(
    team =>
      team.name.toLowerCase() === value ||
      team.english.toLowerCase() === value
  ) || null;
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
          Math.random() * chars.length
        )
      ];

  }

  return code;
}


/* =====================================================
   PAGE CONTROL
===================================================== */

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


/* =====================================================
   RENDER PLANETS
===================================================== */

function renderTeams() {

  const box = $("teams");

  if (!box) {

    console.error(
      "INFINITY: #teams not found"
    );

    return;
  }

  box.innerHTML =
    T.map(
      team => `

        <div
          class="team"
          data-team="${esc(team.id)}"
        >

          <div class="planet-wrap">

            <img
              class="planet-image"
              src="${team.image}"
              alt="${esc(team.name)}"
              loading="eager"
              decoding="async"
              onerror="this.onerror=null;this.style.opacity='.2'"
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
              ${esc(team.english)}
            </small>

          </div>

        </div>

      `
    ).join("");

  console.log(
    "INFINITY: planets rendered"
  );
}


/* =====================================================
   TEAM CACHE
===================================================== */

async function getTeams(force = false) {

  const now = Date.now();

  if (
    !force &&
    teamsCache &&
    now - teamsCacheTime <
      TEAM_CACHE_TIME
  ) {

    return teamsCache;
  }

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

      console.error(
        "Teams loading error:",
        error
      );

      return teamsCache || [];
    }

    teamsCache =
      data || [];

    teamsCacheTime =
      now;

    return teamsCache;

  } catch (error) {

    console.error(error);

    return teamsCache || [];
  }
}


/* =====================================================
   ADMIN LOGIN
===================================================== */

function openAdmin() {

  const modal =
    $("loginModal");

  if (!modal) {

    console.error(
      "INFINITY: loginModal not found"
    );

    return;
  }

  modal.classList.remove(
    "hidden"
  );

  if ($("adminPass")) {

    $("adminPass").value = "";

    setTimeout(
      () =>
        $("adminPass").focus(),
      100
    );
  }

  if ($("loginMsg")) {

    $("loginMsg").textContent =
      "";
  }
}


function closeAdmin() {

  $("loginModal")
    ?.classList.add(
      "hidden"
    );
}


async function loginAdmin() {

  const password =
    $("adminPass")?.value || "";

  if (
    password !==
    ADMIN_PASSWORD
  ) {

    if ($("loginMsg")) {

      $("loginMsg").textContent =
        "كلمة المرور غير صحيحة.";
    }

    return;
  }

  admin = true;

  closeAdmin();

  showAdminPage();

  await loadAdminTeamSelects();

  await refreshAdmin();
}


function adminLogout() {

  admin = false;

  showJoin();
}


/* =====================================================
   ADMIN TEAM SELECTS
===================================================== */

async function loadAdminTeamSelects() {

  const memberSelect =
    $("newMemberTeam");

  const postSelect =
    $("postTeam");

  const teams =
    await getTeams();

  if (!teams.length) {

    if (memberSelect) {

      memberSelect.innerHTML = `
        <option value="">
          لا توجد فرق
        </option>
      `;
    }

    if (postSelect) {

      postSelect.innerHTML = `
        <option value="all">
          كل الفرق
        </option>
      `;
    }

    return;
  }

  if (memberSelect) {

    memberSelect.innerHTML = `
      <option value="">
        اختر الفريق
      </option>

      ${teams.map(
        team => `
          <option value="${team.id}">
            ${esc(team.name)}
          </option>
        `
      ).join("")}
    `;
  }

  if (postSelect) {

    postSelect.innerHTML = `
      <option value="all">
        كل الفرق
      </option>

      ${teams.map(
        team => `
          <option value="${team.id}">
            ${esc(team.name)}
          </option>
        `
      ).join("")}
    `;
  }
}


/* =====================================================
   LOGIN MEMBER
===================================================== */

async function loginWithCode() {

  const input =
    $("accessCode");

  if (!input) {
    return;
  }

  const code =
    input.value
      .trim()
      .toUpperCase();

  if (!code) {

    if ($("msg")) {

      $("msg").textContent =
        "اكتب كود الدخول.";
    }

    return;
  }

  if ($("msg")) {

    $("msg").textContent =
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
        photo_url,
        teams (
          name
        )
      `)
      .eq(
        "access_code",
        code
      )
      .maybeSingle();

    if (error) {

      console.error(error);

      $("msg").textContent =
        "حدث خطأ أثناء الاتصال.";
      return;
    }

    if (!data) {

      $("msg").textContent =
        "كود الدخول غير صحيح.";

      return;
    }

    const team =
      findPlanetByName(
        data.teams?.name
      );

    if (!team) {

      $("msg").textContent =
        "فريق العضو غير موجود.";

      return;
    }

    member = {

      id:
        data.id,

      name:
        data.name,

      team:
        team.id,

      teamDbId:
        data.team_id,

      accessCode:
        data.access_code,

      photoUrl:
        data.photo_url || ""
    };

    localStorage.setItem(
      "memberId",
      String(data.id)
    );

    if ($("msg")) {

      $("msg").textContent =
        "";
    }

    await showMember();

  } catch (error) {

    console.error(error);

    if ($("msg")) {

      $("msg").textContent =
        "حدث خطأ أثناء تسجيل الدخول.";
    }
  }
}


/* =====================================================
   SHOW MEMBER
===================================================== */

async function showMember() {

  if (!member) {
    return;
  }

  showMemberPage();

  const planet =
    getPlanet(
      member.team
    );

  if ($("memberName")) {

    $("memberName").textContent =
      member.name || "";
  }

  if ($("memberTeam")) {

    $("memberTeam").textContent =
      planet
        ? `فريق ${planet.name} • ${planet.english}`
        : "";
  }

  const photo =
    $("memberPhoto");

  if (photo) {

    photo.src =
      member.photoUrl ||
      planet?.image ||
      "";

    photo.onerror =
      function () {

        if (
          planet &&
          this.src !== planet.image
        ) {

          this.src =
            planet.image;
        }
      };
  }

  await refreshMember();
}


/* =====================================================
   REFRESH MEMBER
===================================================== */

async function refreshMember() {

  if (!member) {
    return;
  }

  try {

    const [
      teamsResult,
      postsResult
    ] =
      await Promise.all([

        sb
          .from("teams")
          .select(
            "id,name,score"
          )
          .order("id"),

        sb
          .from("posts")
          .select(
            "id,title,body,image_url,team_id,created_at"
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          )
          .limit(100)

      ]);

    if (teamsResult.error) {
      throw teamsResult.error;
    }

    if (postsResult.error) {
      throw postsResult.error;
    }

    const teams =
      teamsResult.data || [];

    const posts =
      postsResult.data || [];

    const currentTeamId =
      Number(member.teamDbId);

    const visiblePosts =
      posts.filter(
        post => {

          if (
            post.team_id === null ||
            post.team_id === undefined
          ) {

            return true;
          }

          return (
            Number(post.team_id) ===
            currentTeamId
          );
        }
      );

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

    if ($("posts")) {

      $("posts").innerHTML =
        "<p>تعذر تحميل المنشورات.</p>";
    }
  }
}


/* =====================================================
   RENDER MEMBER POSTS
===================================================== */

function renderMemberPosts(posts) {

  const box =
    $("posts");

  if (!box) {
    return;
  }

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
          .replace(
            /\n/g,
            "<br>"
          )}
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
          id="replies-${post.id}"
          class="reply-list"
        >
          جاري تحميل الردود...
        </div>

        <div class="reply-box">

          <textarea
            id="reply-input-${post.id}"
            placeholder="اكتب ردك هنا..."
            rows="3"
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

  if (!posts.length) {
    return;
  }

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

      console.error(
        "Replies loading:",
        error
      );

      posts.forEach(
        post => {

          const box =
            $(
              `replies-${post.id}`
            );

          if (box) {

            box.innerHTML =
              "<small>تعذر تحميل الردود.</small>";
          }
        }
      );

      return;
    }

    posts.forEach(
      post => {

        const box =
          $(
            `replies-${post.id}`
          );

        if (!box) {
          return;
        }

        const replies =
          (data || []).filter(
            reply =>
              Number(
                reply.post_id
              ) ===
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
                  ${new Date(
                    reply.created_at
                  ).toLocaleString(
                    "ar-EG"
                  )}
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

      }
    );

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

  if (!input) {

    alert(
      "خانة الرد غير موجودة."
    );

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

  const button =
    input.parentElement?.querySelector(
      "button"
    );

  if (button) {

    button.disabled =
      true;

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

        body:
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

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "إرسال الرد";
    }
  }
}


/* =====================================================
   RANKING
===================================================== */

function renderRanking(teams) {

  const box =
    $("ranking");

  if (!box) {
    return;
  }

  const ranking =
    [...teams].sort(
      (a, b) =>
        Number(b.score || 0) -
        Number(a.score || 0)
    );

  box.innerHTML =
    ranking.map(
      (team, index) => {

        const planet =
          findPlanetByName(
            team.name
          );

        return `

          <div class="rank">

            <span>

              #${index + 1}

              ${
                planet
                  ? `🪐 ${esc(team.name)}`
                  : esc(team.name)
              }

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


/* =====================================================
   UPLOAD IMAGE
===================================================== */

async function uploadImage(
  file,
  folder
) {

  if (!file) {
    return null;
  }

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    throw new Error(
      "الملف يجب أن يكون صورة."
    );
  }

  const maxSize =
    8 * 1024 * 1024;

  if (file.size > maxSize) {

    throw new Error(
      "حجم الصورة أكبر من 8MB."
    );
  }

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

  const fileName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}.${extension}`;

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
    .getPublicUrl(
      path
    );

  return data.publicUrl;
}


/* =====================================================
   DELETE STORAGE IMAGE
===================================================== */

async function deleteStorageImage(
  url
) {

  if (!url) {
    return;
  }

  try {

    const marker =
      "/storage/v1/object/public/site-images/";

    const index =
      url.indexOf(
        marker
      );

    if (index === -1) {
      return;
    }

    const path =
      decodeURIComponent(
        url.substring(
          index + marker.length
        )
      );

    await sb
      .storage
      .from("site-images")
      .remove([
        path
      ]);

  } catch (error) {

    console.warn(
      "Storage delete:",
      error
    );
  }
}


/* =====================================================
   ADD MEMBER
===================================================== */

async function addMember() {

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

  const button =
    $("addMemberBtn");

  if (button) {

    button.disabled =
      true;

    button.textContent =
      "جاري الإضافة...";
  }

  try {

    let accessCode =
      generateCode();

    let unique = false;

    for (
      let attempt = 0;
      attempt < 10 &&
      !unique;
      attempt++
    ) {

      const {
        data,
        error
      } = await sb
        .from("members")
        .select("id")
        .eq(
          "access_code",
          accessCode
        )
        .limit(1);

      if (error) {
        throw error;
      }

      if (
        !data ||
        data.length === 0
      ) {

        unique = true;

      } else {

        accessCode =
          generateCode();
      }
    }

    if (!unique) {

      throw new Error(
        "تعذر إنشاء كود فريد."
      );
    }

    let photoUrl =
      null;

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

        name:
          name,

        team_id:
          Number(teamId),

        access_code:
          accessCode,

        score:
          0,

        photo_url:
          photoUrl

      })
      .select(
        "id,name,team_id,access_code,photo_url"
      )
      .single();

    if (error) {

      if (photoUrl) {

        await deleteStorageImage(
          photoUrl
        );
      }

      throw error;
    }

    if ($("newMemberName")) {

      $("newMemberName").value =
        "";
    }

    if ($("newMemberTeam")) {

      $("newMemberTeam").value =
        "";
    }

    if ($("newMemberPhoto")) {

      $("newMemberPhoto").value =
        "";
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

    await refreshAdmin();

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

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "إضافة العضو";
    }
  }
}


/* =====================================================
   PUBLISH POST
===================================================== */

async function publishPost() {

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

  const button =
    $("postBtn");

  if (button) {

    button.disabled =
      true;

    button.textContent =
      "جاري النشر...";
  }

  try {

    let teamId =
      null;

    if (
      selectedTeam &&
      selectedTeam !== "all"
    ) {

      teamId =
        Number(selectedTeam);
    }

    let imageUrl =
      null;

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

        title:
          title,

        body:
          body,

        team_id:
          teamId,

        image_url:
          imageUrl

      });

    if (error) {

      if (imageUrl) {

        await deleteStorageImage(
          imageUrl
        );
      }

      throw error;
    }

    $("postTitle").value =
      "";

    $("postBody").value =
      "";

    if ($("postImage")) {

      $("postImage").value =
        "";
    }

    await refreshAdminPosts();

    if (member) {

      await refreshMember();
    }

    alert(
      "تم النشر بنجاح ✅"
    );

  } catch (error) {

    console.error(
      "Publish:",
      error
    );

    alert(
      "لم يتم النشر: " +
      error.message
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "نشر 🚀";
    }
  }
}


/* =====================================================
   ADMIN REFRESH
===================================================== */

async function refreshAdmin() {

  if (!admin) {
    return;
  }

  try {

    const teams =
      await getTeams(
        true
      );

    await loadAdminTeamSelects();

    renderAdminScores(
      teams
    );

    await Promise.all([
      refreshAdminMembers(),
      refreshAdminPosts()
    ]);

  } catch (error) {

    console.error(
      "Admin refresh:",
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

async function refreshAdminMembers() {

  const box =
    $("members");

  if (!box) {
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
      data.map(
        memberData => `

          <div class="member">

            <div class="admin-member-left">

              ${
                memberData.photo_url

                  ? `
                    <img
                      class="admin-member-photo"
                      src="${esc(
                        memberData.photo_url
                      )}"
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
                  ${esc(
                    memberData.name
                  )}
                </b>

                <br>

                <small>
                  ${esc(
                    memberData.teams?.name ||
                    "بدون فريق"
                  )}
                </small>

                <br>

                <small>
                  🔐
                  ${esc(
                    memberData.access_code ||
                    "بدون كود"
                  )}
                </small>

              </div>

            </div>

            <div class="admin-member-buttons">

              <button
                type="button"
                onclick="showMemberQR('${esc(
                  memberData.access_code || ""
                )}')"
              >
                QR
              </button>

              <button
                type="button"
                onclick="changeMemberPhoto(${memberData.id})"
              >
                صورة
              </button>

              <button
                type="button"
                class="delete-btn"
                onclick="deleteMember(${memberData.id})"
              >
                حذف
              </button>

            </div>

          </div>

        `
      ).join("");

  } catch (error) {

    console.error(
      "Members:",
      error
    );

    box.innerHTML =
      "تعذر تحميل الأعضاء.";
  }
}


/* =====================================================
   ADMIN SCORES
===================================================== */

function renderAdminScores(
  teams
) {

  const box =
    $("scores");

  if (!box) {
    return;
  }

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
            type="button"
            onclick="changeScore(${team.id},5)"
          >
            +5
          </button>

          <button
            type="button"
            onclick="changeScore(${team.id},10)"
          >
            +10
          </button>

          <button
            type="button"
            onclick="changeScore(${team.id},-5)"
          >
            -5
          </button>

          <button
            type="button"
            onclick="changeScore(${team.id},-10)"
          >
            -10
          </button>

        </div>

      `
    ).join("");
}


/* =====================================================
   ADMIN POSTS
===================================================== */

async function refreshAdminPosts() {

  const box =
    $("adminPosts");

  if (!box) {
    return;
  }

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
        team_id,
        image_url,
        created_at,
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

    if (error) {
      throw error;
    }

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
              الفريق:
              ${esc(
                post.teams?.name ||
                "كل الفرق"
              )}
            </small>

            <br>

            <small>
              ${new Date(
                post.created_at
              ).toLocaleString(
                "ar-EG"
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
              onclick="deletePost(${post.id})"
            >
              🗑 حذف المنشور
            </button>

          </div>

        `
      ).join("");

  } catch (error) {

    console.error(
      "Admin posts:",
      error
    );

    box.innerHTML =
      "تعذر تحميل المنشورات.";
  }
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

    if (error) {
      throw error;
    }

    const newScore =
      Number(
        data.score || 0
      ) +
      Number(amount);

    const {
      error: updateError
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

    teamsCache = null;

    await refreshAdmin();

    if (member) {

      await refreshMember();
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


/* =====================================================
   DELETE MEMBER
===================================================== */

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
      data,
      error: getError
    } = await sb
      .from("members")
      .select(
        "photo_url"
      )
      .eq(
        "id",
        id
      )
      .single();

    if (getError) {
      throw getError;
    }

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

    if (data?.photo_url) {

      await deleteStorageImage(
        data.photo_url
      );
    }

    await refreshAdminMembers();

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

  input.type =
    "file";

  input.accept =
    "image/*";

  input.onchange =
    async function () {

      const file =
        input.files?.[0];

      if (!file) {
        return;
      }

      try {

        const {
          data: oldMember,
          error: oldError
        } = await sb
          .from("members")
          .select(
            "photo_url"
          )
          .eq(
            "id",
            id
          )
          .single();

        if (oldError) {
          throw oldError;
        }

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

        if (error) {

          await deleteStorageImage(
            photoUrl
          );

          throw error;
        }

        if (
          oldMember?.photo_url
        ) {

          await deleteStorageImage(
            oldMember.photo_url
          );
        }

        await refreshAdminMembers();

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
          "Change photo:",
          error
        );

        alert(
          "لم يتم تغيير الصورة: " +
          error.message
        );
      }
    };

  input.click();
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
  ) {
    return;
  }

  try {

    const {
      data: post,
      error: postError
    } = await sb
      .from("posts")
      .select(
        "id,image_url"
      )
      .eq(
        "id",
        postId
      )
      .single();

    if (postError) {
      throw postError;
    }

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
      throw repliesError;
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

    if (
      post?.image_url
    ) {

      await deleteStorageImage(
        post.image_url
      );
    }

    await refreshAdminPosts();

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
      "لم يتم حذف المنشور: " +
      error.message
    );
  }
}


/* =====================================================
   QR CREATE
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

  box.innerHTML =
    "";

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


/* =====================================================
   SHOW MEMBER QR
===================================================== */

function showMemberQR(
  code
) {

  if (!code) {

    alert(
      "العضو ليس لديه كود."
    );

    return;
  }

  if (
    typeof QRCode ===
    "undefined"
  ) {

    alert(
      "QR Code غير متاح."
    );

    return;
  }

  const overlay =
    document.createElement(
      "div"
    );

  overlay.style.position =
    "fixed";

  overlay.style.inset =
    "0";

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

      <button
        id="closeQR"
        type="button"
      >
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
    () =>
      overlay.remove();

  overlay.onclick =
    event => {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();
      }
    };
}


/* =====================================================
   QR SCANNER
===================================================== */

async function startQRScanner() {

  const box =
    $("qrScanner");

  if (!box) {
    return;
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

  box.classList.remove(
    "hidden"
  );

  if ($("scanMsg")) {

    $("scanMsg").textContent =
      "وجّه الكاميرا إلى QR Code.";
  }

  try {

    if (scanner) {

      try {
        await scanner.stop();
      } catch {}

      try {
        scanner.clear();
      } catch {}
    }

    scanner =
      new Html5Qrcode(
        "qrScanner"
      );

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

      async decodedText => {

        if ($("accessCode")) {

          $("accessCode").value =
            decodedText;
        }

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


/* =====================================================
   LOGOUT MEMBER
===================================================== */

function logout() {

  localStorage.removeItem(
    "memberId"
  );

  member = null;

  if ($("accessCode")) {

    $("accessCode").value =
      "";
  }

  if ($("msg")) {

    $("msg").textContent =
      "";
  }

  if ($("scanMsg")) {

    $("scanMsg").textContent =
      "";
  }

  showJoin();
}


/* =====================================================
   RESTORE MEMBER
===================================================== */

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
        photo_url,
        teams (
          name
        )
      `)
      .eq(
        "id",
        savedId
      )
      .maybeSingle();

    if (
      error ||
      !data
    ) {

      localStorage.removeItem(
        "memberId"
      );

      return;
    }

    const planet =
      findPlanetByName(
        data.teams?.name
      );

    if (!planet) {

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

      team:
        planet.id,

      teamDbId:
        data.team_id,

      accessCode:
        data.access_code,

      photoUrl:
        data.photo_url || ""

    };

    await showMember();

  } catch (error) {

    console.error(
      "Restore member:",
      error
    );
  }
}


/* =====================================================
   EVENTS
===================================================== */

function setupEvents() {

  /* MEMBER LOGIN */

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
          event.key ===
          "Enter"
        ) {

          loginWithCode();
        }
      }
    );


  /* QR */

  $("scanQRBtn")
    ?.addEventListener(
      "click",
      startQRScanner
    );


  /* ADMIN */

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


  $("adminPass")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          loginAdmin();
        }
      }
    );


  /* ADMIN ACTIONS */

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


  /* MEMBER LOGOUT */

  $("logout")
    ?.addEventListener(
      "click",
      logout
    );
}


/* =====================================================
   INITIALIZE
===================================================== */

async function init() {

  console.log(
    "INFINITY: initializing..."
  );

  renderTeams();

  setupEvents();

  showJoin();

  await restoreSavedMember();

  console.log(
    "INFINITY: ready"
  );
}


/* =====================================================
   START
===================================================== */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    init,
    {
      once: true
    }
  );

} else {

  init();
}


/* =====================================================
   GLOBAL FUNCTIONS
   Required for inline onclick
===================================================== */

window.sendReply =
  sendReply;

window.deletePost =
  deletePost;

window.deleteMember =
  deleteMember;

window.changeScore =
  changeScore;

window.changeMemberPhoto =
  changeMemberPhoto;

window.showMemberQR =
  showMemberQR;

window.createAdminQR =
  createAdminQR;

window.loginWithCode =
  loginWithCode;

window.loginAdmin =
  loginAdmin;

window.openAdmin =
  openAdmin;

window.closeAdmin =
  closeAdmin;

window.logout =
  logout;

window.adminLogout =
  adminLogout;

window.addMember =
  addMember;

window.publishPost =
  publishPost;

window.startQRScanner =
  startQRScanner;
