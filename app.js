/* =========================================================
   INFINITY - APP.JS
   Compatible with current index.html
========================================================= */

/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";

const SUPABASE_KEY =
  sb_publishable_zF7z4wuwluqfPDfAH0-7qg_8-tjtrSr"";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================
   INFINITY PLANETS
========================= */

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
   VARIABLES
========================= */

let member = null;
let admin = false;
let scanner = null;

const ADMIN_PASSWORD = "1234";


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
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c])
  );
}


/* =========================
   TEAM HELPERS
========================= */

function getLocalTeam(id) {

  return TEAMS.find(
    t => Number(t.id) === Number(id)
  );
}


function getTeamName(id) {

  const team = getLocalTeam(id);

  return team
    ? team.name
    : "بدون فريق";
}


function getPlanetByName(name) {

  if (!name) return null;

  return TEAMS.find(
    t =>
      t.name === String(name).trim() ||
      t.english.toLowerCase() ===
      String(name).trim().toLowerCase()
  );
}


/* =========================
   MEMBER CODE
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
   PAGE CONTROL
========================= */

function showJoin() {

  $("join")?.classList.remove("hidden");
  $("member")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
}


function showMemberPage() {

  $("join")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
  $("member")?.classList.remove("hidden");
}


function showAdminPage() {

  $("join")?.classList.add("hidden");
  $("member")?.classList.add("hidden");
  $("admin")?.classList.remove("hidden");
}


/* =========================================================
   RENDER PLANETS
========================================================= */

function renderTeams() {

  const box = $("teams");

  if (!box) return;

  box.innerHTML = TEAMS.map(team => {

    return `
      <div class="team planet-card">

        <div class="planet-image-wrap">

          <img
            src="${team.image}"
            alt="${esc(team.name)}"
            class="planet-image"
            loading="lazy"
            onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg'"
          >

        </div>

        <div class="team-info">

          <span>INFINITY PLANET</span>

          <strong>
            ${esc(team.name)}
          </strong>

          <small>
            ${esc(team.english)}
          </small>

        </div>

      </div>
    `;

  }).join("");
}


/* =========================================================
   LOAD TEAMS FROM SUPABASE
========================================================= */

async function loadTeams() {

  try {

    const {
      data,
      error
    } = await sb
      .from("teams")
      .select("*")
      .order("id");

    if (error) {

      console.warn(
        "Teams database error:",
        error.message
      );

      return TEAMS;
    }

    if (!data || !data.length) {

      return TEAMS;
    }

    return data;

  } catch (error) {

    console.error(error);

    return TEAMS;
  }
}


/* =========================================================
   ADMIN TEAM SELECTS
========================================================= */

async function loadAdminTeamSelects() {

  const memberSelect =
    $("newMemberTeam");

  const postSelect =
    $("postTeam");

  if (!memberSelect) return;

  const dbTeams =
    await loadTeams();


  memberSelect.innerHTML = `
    <option value="">
      اختر الفريق
    </option>

    ${
      dbTeams.map(team => {

        return `
          <option value="${team.id}">
            ${esc(team.name)}
          </option>
        `;

      }).join("")
    }
  `;


  if (postSelect) {

    postSelect.innerHTML = `
      <option value="all">
        كل الفرق
      </option>

      ${
        dbTeams.map(team => {

          return `
            <option value="${team.id}">
              ${esc(team.name)}
            </option>
          `;

        }).join("")
      }
    `;
  }
}


/* =========================================================
   LOGIN MEMBER
========================================================= */

async function loginWithCode() {

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


  $("msg").textContent =
    "جاري تسجيل الدخول...";


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


    if (error) {

      console.error(error);

      $("msg").textContent =
        "حدث خطأ: " +
        error.message;

      return;
    }


    if (!data) {

      $("msg").textContent =
        "كود الدخول غير صحيح.";

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


    $("msg").textContent = "";

    await showMember();

  } catch (error) {

    console.error(error);

    $("msg").textContent =
      "حدث خطأ أثناء تسجيل الدخول.";
  }
}


/* =========================================================
   SHOW MEMBER
========================================================= */

async function showMember() {

  if (!member) return;

  showMemberPage();


  const team =
    getLocalTeam(member.teamId);


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
      TEAMS[0].image;
  }


  await refreshMember();
}


/* =========================================================
   LOAD MEMBER POSTS + RANKING
========================================================= */

async function refreshMember() {

  if (!member) return;


  try {

    const {
      data: teams,
      error: teamsError
    } = await sb
      .from("teams")
      .select("*")
      .order("id");


    if (teamsError) {

      console.error(teamsError);
    }


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

      console.error(postsError);

      if ($("posts")) {

        $("posts").innerHTML =
          "تعذر تحميل المنشورات.";
      }

    } else {

      const visiblePosts =
        (posts || []).filter(post => {

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


      await loadRepliesForPosts(
        visiblePosts
      );
    }


    renderRanking(
      teams || []
    );

  } catch (error) {

    console.error(
      "Member refresh:",
      error
    );
  }
}


/* =========================================================
   RENDER POSTS
========================================================= */

function renderMemberPosts(posts) {

  const box = $("posts");

  if (!box) return;


  if (!posts.length) {

    box.innerHTML = `
      <div class="empty-state">
        لا توجد منشورات حاليًا 🚀
      </div>
    `;

    return;
  }


  box.innerHTML =
    posts.map(
      renderPost
    ).join("");
}


/* =========================================================
   RENDER SINGLE POST
========================================================= */

function renderPost(post) {

  return `
    <article
      class="post"
      id="post-${post.id}"
    >

      <div class="post-header">

        <span>
          📡 INFINITY
        </span>

        <small>
          ${
            post.created_at
              ? new Date(
                  post.created_at
                ).toLocaleString(
                  "ar-EG"
                )
              : ""
          }
        </small>

      </div>


      <h3>
        ${esc(post.title)}
      </h3>


      <p class="post-body">
        ${esc(post.body)
          .replace(/\n/g, "<br>")}
      </p>


      ${
        post.image_url
          ? `
            <img
              src="${esc(post.image_url)}"
              class="post-image"
              alt="صورة المنشور"
              loading="lazy"
            >
          `
          : ""
      }


      <!-- =========================
           REPLIES
      ========================== -->

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
            class="reply-button"
            onclick="sendReply(${post.id})"
          >
            إرسال الرد 🚀
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

  if (!posts || !posts.length) return;


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
        "Replies loading error:",
        error
      );

      posts.forEach(post => {

        const box =
          $(
            `replies-${post.id}`
          );

        if (box) {

          box.innerHTML =
            `<small>تعذر تحميل الردود.</small>`;
        }

      });

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
          `<small>لا توجد ردود حتى الآن.</small>`;

        return;
      }


      box.innerHTML =
        replies.map(reply => {

          return `
            <div class="reply">

              <div class="reply-user">

                ${
                  reply.members?.photo_url
                    ? `
                      <img
                        src="${esc(
                          reply.members.photo_url
                        )}"
                        alt=""
                      >
                    `
                    : ""
                }

                <b>
                  ${esc(
                    reply.members?.name ||
                    "عضو"
                  )}
                </b>

              </div>


              <small>
                ${
                  reply.created_at
                    ? new Date(
                        reply.created_at
                      ).toLocaleString(
                        "ar-EG"
                      )
                    : ""
                }
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
          `;

        }).join("");
    });

  } catch (error) {

    console.error(error);
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
    input.parentElement
      ?.querySelector(
        "button"
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

      console.error(
        "Reply insert error:",
        error
      );

      alert(
        "لم يتم إرسال الرد:\n" +
        error.message
      );

      return;
    }


    input.value = "";


    await refreshMember();

  } catch (error) {

    console.error(error);

    alert(
      "حدث خطأ أثناء إرسال الرد:\n" +
      error.message
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "إرسال الرد 🚀";
    }
  }
}


/* =========================================================
   RANKING
========================================================= */

function renderRanking(teams) {

  const box = $("ranking");

  if (!box) return;


  const sorted =
    [...teams].sort(
      (a, b) =>
        Number(b.score || 0) -
        Number(a.score || 0)
    );


  box.innerHTML =
    sorted.map(
      (team, index) => {

        const local =
          getPlanetByName(
            team.name
          );


        return `
          <div class="rank">

            <span>

              #${index + 1}

              ${
                local
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


/* =========================================================
   ADMIN LOGIN
========================================================= */

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


function closeAdmin() {

  $("loginModal")
    ?.classList.add("hidden");
}


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

  closeAdmin();

  showAdminPage();


  await loadAdminTeamSelects();

  await refreshAdmin();
}


function adminLogout() {

  admin = false;

  showJoin();
}


/* =========================================================
   REFRESH ADMIN
========================================================= */

async function refreshAdmin() {

  if (!admin) return;


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


    renderScores(
      teams || []
    );


    await loadMembers();

    await refreshAdminPosts();

  } catch (error) {

    console.error(
      "Admin error:",
      error
    );

    alert(
      "خطأ في لوحة التحكم:\n" +
      error.message
    );
  }
}


/* =========================================================
   MEMBERS ADMIN
========================================================= */

async function loadMembers() {

  const box = $("members");

  if (!box) return;


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

    console.error(error);

    box.innerHTML =
      "تعذر تحميل الأعضاء.";

    return;
  }


  if (!data?.length) {

    box.innerHTML =
      "لا يوجد أعضاء.";

    return;
  }


  box.innerHTML =
    data.map(memberData => {

      return `
        <div class="member admin-member">

          <div class="admin-member-left">

            ${
              memberData.photo_url
                ? `
                  <img
                    src="${esc(
                      memberData.photo_url
                    )}"
                    class="admin-member-photo"
                    alt=""
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
                الفريق:
                ${esc(
                  memberData.teams?.name ||
                  getTeamName(
                    memberData.team_id
                  )
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
      `;

    }).join("");
}


/* =========================================================
   ADD MEMBER
========================================================= */

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


  try {

    let accessCode =
      generateCode();


    let exists = true;


    while (exists) {

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


      exists =
        !!data?.length;


      if (exists) {

        accessCode =
          generateCode();
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
      .select()
      .single();


    if (error) {

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
            الفريق:
            ${esc(
              getTeamName(
                data.team_id
              )
            )}
          </p>

          <p>
            كود الدخول:
          </p>

          <strong>
            ${esc(
              data.access_code
            )}
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

    console.error(
      "Add member error:",
      error
    );

    alert(
      "لم يتم إضافة العضو:\n" +
      error.message
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
   PUBLISH POST
========================================================= */

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


  try {

    let imageUrl = null;


    if (file) {

      imageUrl =
        await uploadImage(
          file,
          "posts"
        );
    }


    const teamId =
      teamValue &&
      teamValue !== "all"
        ? Number(teamValue)
        : null;


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

    console.error(error);

    alert(
      "لم يتم نشر المنشور:\n" +
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


  const {
    data,
    error
  } = await sb
    .from("posts")
    .select(`
      *,
      teams (
        name
      )
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "Admin posts error:",
      error
    );

    box.innerHTML = `
      <p>
        تعذر تحميل المنشورات.
      </p>
    `;

    return;
  }


  if (!data?.length) {

    box.innerHTML =
      "لا يوجد منشورات.";

    return;
  }


  box.innerHTML =
    data.map(post => {

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
            الفريق:
            ${esc(
              post.teams?.name ||
              "كل الفرق"
            )}
          </small>


          ${
            post.image_url
              ? `
                <img
                  src="${esc(
                    post.image_url
                  )}"
                  class="admin-post-image"
                  alt=""
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
      `;

    }).join("");
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
      نحذف الردود أولًا
    */

    const {
      error: replyDeleteError
    } = await sb
      .from("replies")
      .delete()
      .eq(
        "post_id",
        postId
      );


    if (replyDeleteError) {

      console.warn(
        "Reply delete:",
        replyDeleteError.message
      );
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
        postId
      );


    if (error) {

      throw error;
    }


    await refreshAdminPosts();


    if (member) {

      await refreshMember();
    }


    alert(
      "تم حذف المنشور ✅"
    );

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف المنشور:\n" +
      error.message
    );
  }
}


/* =========================================================
   SCORES
========================================================= */

function renderScores(teams) {

  const box =
    $("scores");

  if (!box) return;


  box.innerHTML =
    teams.map(team => {

      return `
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
      `;

    }).join("");
}


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


    await refreshAdmin();


    if (member) {

      await refreshMember();
    }

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم تعديل النقاط:\n" +
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
        id
      );


    if (error) {

      throw error;
    }


    await loadMembers();


    alert(
      "تم حذف العضو ✅"
    );

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف العضو:\n" +
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

  input.accept =
    "image/*";


  input.onchange =
    async () => {

      const file =
        input.files?.[0];


      if (!file) return;


      try {

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


        await loadMembers();


        if (
          member &&
          Number(member.id) ===
          Number(id)
        ) {

          member.photoUrl =
            url;

          await showMember();
        }


        alert(
          "تم تغيير الصورة ✅"
        );

      } catch (error) {

        console.error(error);

        alert(
          "لم يتم تغيير الصورة:\n" +
          error.message
        );
      }
    };


  input.click();
}


/* =========================================================
   QR CODE
========================================================= */

function createAdminQR(code) {

  const box =
    $("adminQR");

  if (!box) return;

  if (
    typeof QRCode ===
    "undefined"
  ) return;


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


function showMemberQR(code) {

  if (!code) {

    alert(
      "لا يوجد كود للعضو."
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
    background:rgba(0,0,0,.92);
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

      async decodedText => {

        $("accessCode").value =
          decodedText;


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
        photo_url
      `)
      .eq(
        "id",
        id
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

    console.error(
      "Restore error:",
      error
    );
  }
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function initInfinity() {

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


  $("accessCode")
    ?.addEventListener(
      "keydown",
      e => {

        if (
          e.key === "Enter"
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
    ADMIN
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
      e => {

        if (
          e.key === "Enter"
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
    ADMIN ACTIONS
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
    MEMBER LOGOUT
  */

  $("logout")
    ?.addEventListener(
      "click",
      logout
    );


  /*
    Start
  */

  showJoin();


  /*
    Restore saved member
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
    initInfinity
  );

} else {

  initInfinity();
}
