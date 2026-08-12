/* =========================================================
   INFINITY - OPTIMIZED APP.JS
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

const TEAM_CACHE_TIME = 5 * 60 * 1000;

const POST_CACHE_TIME = 30 * 1000;

let member = null;
let admin = false;
let scanner = null;

let teamsCache = null;
let teamsCacheTime = 0;

let postsCache = null;
let postsCacheTime = 0;


/* =========================================================
   FALLBACK TEAMS
========================================================= */

const PLANETS = [
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

function getLocalPlanet(id) {

  return PLANETS.find(
    p => Number(p.id) === Number(id)
  ) || null;
}


function findPlanetByName(name) {

  if (!name) return null;

  const value =
    String(name).trim().toLowerCase();

  return PLANETS.find(
    p =>
      p.name.toLowerCase() === value ||
      p.english.toLowerCase() === value
  ) || null;
}


/* =========================================================
   LOAD TEAMS - CACHE
========================================================= */

async function getTeams(force = false) {

  const now = Date.now();

  if (
    !force &&
    teamsCache &&
    now - teamsCacheTime < TEAM_CACHE_TIME
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
      console.warn(
        "Teams:",
        error.message
      );

      return teamsCache || PLANETS;
    }

    teamsCache =
      data?.length
        ? data
        : PLANETS;

    teamsCacheTime = now;

    return teamsCache;

  } catch (error) {

    console.error(error);

    return teamsCache || PLANETS;
  }
}


/* =========================================================
   RENDER PUBLIC TEAMS
========================================================= */

function renderTeams() {

  const box = $("teams");

  if (!box) return;

  box.innerHTML =
    PLANETS.map(
      planet => `

        <div
          class="team"
          data-team="${planet.id}"
        >

          <div class="planet-image-wrap">

            <img
              src="${planet.image}"
              alt="${esc(planet.name)}"
              loading="lazy"
              onerror="this.style.opacity='.3'"
            >

          </div>

          <div class="team-info">

            <span>PLANET</span>

            <strong>
              ${esc(planet.name)}
            </strong>

            <small>
              ${esc(planet.english)}
            </small>

          </div>

        </div>

      `
    ).join("");
}


/* =========================================================
   LOAD TEAM SELECTS
========================================================= */

async function loadTeamSelects() {

  const memberSelect =
    $("newMemberTeam");

  const postSelect =
    $("postTeam");

  if (!memberSelect) return;

  const teams =
    await getTeams();

  memberSelect.innerHTML = `
    <option value="">
      اختر الفريق
    </option>

    ${
      teams.map(
        team => `
          <option value="${team.id}">
            ${esc(team.name)}
          </option>
        `
      ).join("")
    }
  `;


  if (postSelect) {

    postSelect.innerHTML = `
      <option value="all">
        كل الفرق
      </option>

      ${
        teams.map(
          team => `
            <option value="${team.id}">
              ${esc(team.name)}
            </option>
          `
        ).join("")
      }
    `;
  }
}


/* =========================================================
   SHOW JOIN
========================================================= */

function showJoin() {

  $("join")?.classList.remove("hidden");

  $("member")?.classList.add("hidden");

  $("admin")?.classList.add("hidden");
}


/* =========================================================
   MEMBER LOGIN
========================================================= */

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

  const button =
    $("codeLoginBtn");

  if (button) {
    button.disabled = true;
    button.textContent = "جاري الدخول...";
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
          id,
          name,
          score
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
      teamId: Number(data.team_id),
      accessCode: data.access_code,
      photoUrl: data.photo_url || "",
      teamName:
        data.teams?.name || ""
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
      "حدث خطأ أثناء الدخول: " +
      error.message;

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "دخول إلى INFINITY 🚀";
    }
  }
}


/* =========================================================
   SHOW MEMBER
========================================================= */

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

    const planet =
      getLocalPlanet(member.teamId);

    photo.src =
      member.photoUrl ||
      planet?.image ||
      "";
  }


  await refreshMember();
}


/* =========================================================
   LOAD POSTS
========================================================= */

async function getPosts(force = false) {

  const now = Date.now();

  if (
    !force &&
    postsCache &&
    now - postsCacheTime < POST_CACHE_TIME
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
    throw error;
  }


  postsCache =
    data || [];

  postsCacheTime =
    now;

  return postsCache;
}


/* =========================================================
   REFRESH MEMBER
========================================================= */

async function refreshMember() {

  if (!member) return;

  try {

    const posts =
      await getPosts();


    const visiblePosts =
      posts.filter(
        post =>
          post.team_id === null ||
          Number(post.team_id) ===
          Number(member.teamId)
      );


    if ($("posts")) {

      $("posts").innerHTML =
        visiblePosts.length
          ? visiblePosts
              .map(renderPost)
              .join("")
          : "<p>لا يوجد منشورات حاليًا.</p>";
    }


    /*
       الردود يتم تحميلها مرة واحدة
       لكل المنشورات الظاهرة
    */

    await loadReplies(
      visiblePosts
    );


    const teams =
      await getTeams();


    const ranking =
      [...teams].sort(
        (a, b) =>
          Number(b.score || 0) -
          Number(a.score || 0)
      );


    if ($("ranking")) {

      $("ranking").innerHTML =
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
      "Member refresh:",
      error
    );
  }
}


/* =========================================================
   RENDER POST
========================================================= */

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
            placeholder="اكتب ردك هنا..."
            maxlength="1000"
          ></textarea>

          <button
            type="button"
            data-reply="${post.id}"
            onclick="sendReply(${post.id})"
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

async function loadReplies(posts) {

  if (!posts.length) return;

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
      .limit(500);


    if (error) {

      console.warn(
        "Replies:",
        error.message
      );

      return;
    }


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
      "Reply loading error:",
      error
    );
  }
}


/* =========================================================
   SEND REPLY
========================================================= */

const sendingReplies =
  new Set();


async function sendReply(postId) {

  if (!member) {

    alert(
      "يجب تسجيل الدخول أولًا."
    );

    return;
  }


  if (
    sendingReplies.has(
      Number(postId)
    )
  ) {
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
    document.querySelector(
      `[data-reply="${postId}"]`
    );


  sendingReplies.add(
    Number(postId)
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

        body:
          body
      });


    if (error) {
      throw error;
    }


    input.value = "";

    postsCache = null;

    await refreshMember();

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم إرسال الرد: " +
      error.message
    );

  } finally {

    sendingReplies.delete(
      Number(postId)
    );

    if (button) {

      button.disabled = false;

      button.textContent =
        "إرسال الرد";
    }
  }
}


/* =========================================================
   ADMIN OPEN
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
   ADMIN LOGIN
========================================================= */

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


  await loadTeamSelects();

  await refreshAdmin();
}


/* =========================================================
   CLOSE ADMIN
========================================================= */

function closeAdmin() {

  $("loginModal")
    ?.classList.add("hidden");
}


/* =========================================================
   ADMIN LOGOUT
========================================================= */

function adminLogout() {

  admin = false;

  $("admin")
    ?.classList.add("hidden");

  showJoin();
}


/* =========================================================
   UPLOAD IMAGE
========================================================= */

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
      .substring(2)}.${extension}`;


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

let addingMember = false;


async function addMember() {

  if (addingMember) return;


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


  addingMember = true;


  const button =
    $("addMemberBtn");


  if (button) {

    button.disabled = true;

    button.textContent =
      "جاري إضافة العضو...";
  }


  try {

    /*
       توليد كود بشكل سريع
    */

    let accessCode =
      generateCode();


    let found = true;


    while (found) {

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


      found =
        Boolean(
          data?.length
        );


      if (found) {

        accessCode =
          generateCode();
      }
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
        name: name,
        team_id: Number(teamId),
        access_code: accessCode,
        score: 0,
        photo_url: photoUrl
      })
      .select()
      .single();


    if (error) {

      /*
         لو حصل تعارض في الكود
         نجرب مرة أخرى بدل فشل الإضافة
      */

      if (
        error.code ===
        "23505"
      ) {

        throw new Error(
          "حدث تعارض مؤقت في كود العضو، اضغط إضافة مرة أخرى."
        );
      }

      throw error;
    }


    if ($("newMemberName")) {

      $("newMemberName").value = "";
    }


    if ($("newMemberTeam")) {

      $("newMemberTeam").value = "";
    }


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
            الفريق:
            ${esc(
              getLocalPlanet(
                Number(teamId)
              )?.name || ""
            )}
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

    addingMember = false;

    if (button) {

      button.disabled = false;

      button.textContent =
        "إضافة العضو";
    }
  }
}


/* =========================================================
   GENERATE CODE
========================================================= */

function generateCode() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code =
    "INF-";

  for (
    let i = 0;
    i < 6;
    i++
  ) {

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


/* =========================================================
   PUBLISH POST
========================================================= */

let publishingPost = false;


async function publishPost() {

  if (publishingPost) return;


  const title =
    $("postTitle")
      ?.value
      .trim();


  const body =
    $("postBody")
      ?.value
      .trim();


  const team =
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


  publishingPost = true;


  const button =
    $("postBtn");


  if (button) {

    button.disabled = true;

    button.textContent =
      "جاري النشر...";
  }


  try {

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
        title: title,
        body: body,
        team_id:
          team === "all"
            ? null
            : Number(team),
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


    postsCache = null;


    await refreshAdmin();


    alert(
      "تم نشر المنشور بنجاح ✅"
    );

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم نشر المنشور: " +
      error.message
    );

  } finally {

    publishingPost = false;

    if (button) {

      button.disabled = false;

      button.textContent =
        "نشر 🚀";
    }
  }
}


/* =========================================================
   REFRESH ADMIN
========================================================= */

async function refreshAdmin() {

  if (!admin) return;


  try {

    await loadTeamSelects();


    const teams =
      await getTeams(
        true
      );


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
        photo_url
      `)
      .order(
        "id",
        {
          ascending: false
        }
      )
      .limit(500);


    if (membersError) {
      throw membersError;
    }


    if ($("members")) {

      $("members").innerHTML =
        members?.length

          ? members.map(
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
                            alt=""
                            loading="lazy"
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
                        ${
                          esc(
                            teams.find(
                              t =>
                                Number(t.id) ===
                                Number(m.team_id)
                            )?.name ||
                            "بدون فريق"
                          )
                        }
                      </small>

                      <br>

                      <small>
                        🔐
                        ${esc(
                          m.access_code
                        )}
                      </small>

                    </div>

                  </div>

                  <div class="admin-member-buttons">

                    <button
                      onclick="showMemberQR('${esc(
                        m.access_code
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
            ).join("")

          : "لا يوجد أعضاء";
    }


    /*
       SCORES
    */

    if ($("scores")) {

      $("scores").innerHTML =
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


    await refreshAdminPosts();

  } catch (error) {

    console.error(
      "Admin:",
      error
    );

    alert(
      "خطأ في لوحة التحكم: " +
      error.message
    );
  }
}


/* =========================================================
   ADMIN POSTS
========================================================= */

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
        team_id,
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
                    src="${esc(
                      post.image_url
                    )}"
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

        `
      ).join("");

  } catch (error) {

    console.error(error);

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
      data: team,
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
      Number(team.score || 0) +
      Number(amount);


    const {
      error: updateError
    } = await sb
      .from("teams")
      .update({
        score:
          Math.max(
            0,
            newScore
          )
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

  } catch (error) {

    console.error(error);

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
      data,
      error: getError
    } = await sb
      .from("members")
      .select("photo_url")
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


    await refreshAdmin();

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف العضو: " +
      error.message
    );
  }
}


/* =========================================================
   DELETE POST
========================================================= */

async function deletePost(id) {

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
      error: getError
    } = await sb
      .from("posts")
      .select(
        "image_url"
      )
      .eq(
        "id",
        id
      )
      .single();


    if (getError) {
      throw getError;
    }


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
        id
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
        id
      );


    if (error) {
      throw error;
    }


    if (post?.image_url) {

      await deleteStorageImage(
        post.image_url
      );
    }


    postsCache = null;


    await refreshAdmin();


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


/* =========================================================
   DELETE STORAGE
========================================================= */

async function deleteStorageImage(url) {

  if (!url) return;


  const marker =
    "/storage/v1/object/public/site-images/";


  const index =
    url.indexOf(marker);


  if (index === -1) return;


  const path =
    decodeURIComponent(
      url.substring(
        index + marker.length
      )
    );


  try {

    await sb
      .storage
      .from("site-images")
      .remove([
        path
      ]);

  } catch (error) {

    console.warn(
      "Storage:",
      error
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


  input.type =
    "file";

  input.accept =
    "image/*";


  input.onchange =
    async () => {

      const file =
        input.files?.[0];

      if (!file) return;


      try {

        const {
          data: old,
          error: oldError
        } = await sb
          .from("members")
          .select("photo_url")
          .eq(
            "id",
            id
          )
          .single();


        if (oldError) {
          throw oldError;
        }


        const url =
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
              url
          })
          .eq(
            "id",
            id
          );


        if (error) {
          throw error;
        }


        if (old?.photo_url) {

          await deleteStorageImage(
            old.photo_url
          );
        }


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


/* =========================================================
   QR CREATE
========================================================= */

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


/* =========================================================
   SHOW MEMBER QR
========================================================= */

function showMemberQR(code) {

  if (!code) {

    alert(
      "لا يوجد كود."
    );

    return;
  }


  const popup =
    document.createElement(
      "div"
    );


  popup.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.9);
    display:grid;
    place-items:center;
    z-index:99999;
  `;


  popup.innerHTML = `

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


  popup.querySelector(
    "#closeQR"
  ).onclick =
    () => popup.remove();
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


  if ($("scanMsg")) {

    $("scanMsg").textContent =
      "وجّه الكاميرا إلى QR Code.";
  }


  try {

    if (scanner) {

      try {
        await scanner.stop();
      } catch {}
    }


    if (
      typeof Html5Qrcode ===
      "undefined"
    ) {

      throw new Error(
        "QR scanner غير متاح"
      );
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
        fps: 10,

        qrbox: {
          width: 250,
          height: 250
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

    if ($("scanMsg")) {

      $("scanMsg").textContent =
        "تعذر تشغيل الكاميرا.";
    }
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
        photo_url,
        teams (
          id,
          name,
          score
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

      id: data.id,

      name: data.name,

      teamId:
        Number(data.team_id),

      accessCode:
        data.access_code,

      photoUrl:
        data.photo_url || "",

      teamName:
        data.teams?.name || ""
    };


    await showMember();

  } catch (error) {

    console.error(
      "Restore:",
      error
    );
  }
}


/* =========================================================
   EVENTS
========================================================= */

function init() {

  /*
     الكواكب تظهر فورًا
  */

  renderTeams();


  /*
     Login
  */

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


  $("logout")
    ?.addEventListener(
      "click",
      logout
    );


  /*
     Enter code
  */

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


  /*
     Enter admin password
  */

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


  /*
     Restore member
  */

  restoreSavedMember();
}


/* =========================================================
   START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

} else {

  init();
}
