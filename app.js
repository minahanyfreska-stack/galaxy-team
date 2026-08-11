/* =====================================================
   INFINITY - GALAXY TEAMS
   APP.JS
===================================================== */

/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_zF7z4wuwluqfPDfAH0-7qg8_8-tjtrSr";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =====================================================
   INFINITY TEAMS
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
   GET LOCAL TEAM
===================================================== */

function getTeam(id) {
  return T.find(
    team => team.id === id
  );
}


/* =====================================================
   FIND TEAM BY DATABASE NAME
===================================================== */

function findLocalTeamByName(name) {

  if (!name) {
    return null;
  }

  const value =
    String(name).trim();

  return T.find(
    team =>
      team.name === value ||
      team.english.toLowerCase() ===
      value.toLowerCase()
  ) || null;
}


/* =====================================================
   GENERATE MEMBER CODE
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
   SHOW JOIN PAGE
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

  if (!box) {
    console.error(
      "INFINITY: teams element not found"
    );

    return;
  }

  box.innerHTML = T.map(team => {

    return `
      <div
        class="team"
        data-team="${team.id}"
      >

        <img
          src="${team.image}"
          alt="${esc(team.name)}"
          loading="lazy"
          onerror="this.style.display='none'"
        >

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
    `;

  }).join("");

  console.log(
    "INFINITY: teams rendered successfully"
  );
}


/* =====================================================
   LOAD DATABASE TEAMS
===================================================== */

async function loadDatabaseTeams() {

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
        "Could not load database teams:",
        error.message
      );

      return [];
    }

    return data || [];

  } catch (error) {

    console.warn(
      "Teams loading error:",
      error
    );

    return [];
  }
}


/* =====================================================
   ADMIN TEAM SELECTS
===================================================== */

async function loadAdminTeamSelects() {

  const memberSelect =
    $("newMemberTeam");

  const postSelect =
    $("postTeam");

  if (!memberSelect) {
    console.warn(
      "newMemberTeam not found"
    );

    return;
  }

  const dbTeams =
    await loadDatabaseTeams();

  /*
     لو Supabase رجع الفرق:
     نستخدم IDs الحقيقية.
  */

  if (dbTeams.length) {

    memberSelect.innerHTML = `
      <option value="">
        اختر الفريق
      </option>

      ${
        dbTeams.map(team => `
          <option value="${team.id}">
            ${esc(team.name)}
          </option>
        `).join("")
      }
    `;

    if (postSelect) {

      postSelect.innerHTML = `
        <option value="all">
          كل الفرق
        </option>

        ${
          dbTeams.map(team => `
            <option value="${team.id}">
              ${esc(team.name)}
            </option>
          `).join("")
        }
      `;
    }

    console.log(
      "INFINITY: database teams loaded"
    );

    return;
  }


  /*
     FALLBACK
     لو Supabase لم يرجع الفرق،
     نعرض الفرق الثابتة بدلًا من ترك القائمة فارغة.
  */

  memberSelect.innerHTML = `
    <option value="">
      اختر الفريق
    </option>

    <option value="1">
      المشتري
    </option>

    <option value="2">
      زحل
    </option>

    <option value="3">
      نبتون
    </option>

    <option value="4">
      أورانوس
    </option>
  `;


  if (postSelect) {

    postSelect.innerHTML = `
      <option value="all">
        كل الفرق
      </option>

      <option value="1">
        المشتري
      </option>

      <option value="2">
        زحل
      </option>

      <option value="3">
        نبتون
      </option>

      <option value="4">
        أورانوس
      </option>
    `;
  }

  console.log(
    "INFINITY: fallback teams loaded"
  );
}


/* =====================================================
   LOGIN WITH ACCESS CODE
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

    $("msg").textContent =
      "اكتب كود الدخول.";

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
        "access_code",
        code
      )
      .single();


    if (error || !data) {

      $("msg").textContent =
        "كود الدخول غير صحيح.";

      return;
    }


    const foundTeam =
      findLocalTeamByName(
        data.teams?.name
      );


    if (!foundTeam) {

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
        foundTeam.id,

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

    showMember();

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

  if (!member) {
    return;
  }

  $("join")?.classList.add("hidden");

  $("admin")?.classList.add("hidden");

  $("member")?.classList.remove("hidden");


  const t =
    getTeam(member.team);


  if (t) {

    if ($("memberName")) {

      $("memberName").textContent =
        member.name;
    }


    if ($("memberTeam")) {

      $("memberTeam").textContent =
        `فريق ${t.name} • ${t.english}`;
    }


    const photo =
      $("memberPhoto");


    if (photo) {

      photo.src =
        member.photoUrl ||
        t.image;
    }
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

    const {
      data: teams,
      error: teamsError
    } = await sb
      .from("teams")
      .select("*");

    if (teamsError) {
      throw teamsError;
    }


    const currentTeam =
      getTeam(member.team);


    const dbTeam =
      (teams || []).find(
        t =>
          t.name ===
          currentTeam?.name
      );


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
      (posts || []).filter(
        post => {

          if (
            post.team_id === null
          ) {
            return true;
          }

          return (
            dbTeam &&
            Number(post.team_id) ===
            Number(dbTeam.id)
          );
        }
      );


    if ($("posts")) {

      $("posts").innerHTML =
        visiblePosts.length

          ? visiblePosts
              .map(renderMemberPost)
              .join("")

          : "<p>لا يوجد محتوى حاليًا.</p>";
    }


    await loadRepliesForPosts(
      visiblePosts
    );


    const ranking =
      [...(teams || [])].sort(
        (a, b) =>
          Number(b.score || 0) -
          Number(a.score || 0)
      );


    if ($("ranking")) {

      $("ranking").innerHTML =
        ranking.map(
          (t, i) => {

            const planet =
              findLocalTeamByName(
                t.name
              );

            return `
              <div class="rank">

                <span>

                  #${i + 1}

                  ${
                    planet
                      ? `🪐 ${esc(t.name)}`
                      : esc(t.name)
                  }

                </span>

                <b>
                  ${Number(t.score || 0)}
                  نقطة
                </b>

              </div>
            `;
          }
        ).join("");
    }

  } catch (error) {

    console.error(
      "Member error:",
      error
    );
  }
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
      throw error;
    }


    posts.forEach(post => {

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

        body:
          body
      });


    if (error) {
      throw error;
    }


    input.value = "";

    await refreshMember();

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم إرسال الرد: " +
      error.message
    );
  }
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


  /*
     أهم جزء:
     تحميل الفرق أولًا
  */

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


/* =====================================================
   CLOSE ADMIN MODAL
===================================================== */

function closeAdmin() {

  $("loginModal")
    ?.classList.add("hidden");
}


/* =====================================================
   ADMIN LOGOUT
===================================================== */

function adminLogout() {

  admin = false;

  $("admin")
    ?.classList.add("hidden");

  $("join")
    ?.classList.remove("hidden");
}


/* =====================================================
   REFRESH ADMIN
===================================================== */

async function refreshAdmin() {

  try {

    /*
       نعيد تحميل القوائم كل مرة
    */

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


    if (membersError) {
      throw membersError;
    }


    if ($("members")) {

      $("members").innerHTML =
        (members || [])
          .map(m => `

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
                      "بدون كود"
                    )}
                  </small>

                </div>

              </div>


              <div class="admin-member-buttons">

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

          `)
          .join("")

        || "لا يوجد أعضاء";
    }


    /*
       SCORES
    */

    if ($("scores")) {

      $("scores").innerHTML =
        (teams || [])
          .map(t => `

            <div class="score">

              <span>

                ${esc(t.name)}

                :

                <b>
                  ${Number(
                    t.score || 0
                  )}
                </b>

              </span>


              <button
                onclick="changeScore(${t.id},5)"
              >
                +5
              </button>

              <button
                onclick="changeScore(${t.id},10)"
              >
                +10
              </button>

              <button
                onclick="changeScore(${t.id},-5)"
              >
                -5
              </button>

              <button
                onclick="changeScore(${t.id},-10)"
              >
                -10
              </button>

            </div>

          `)
          .join("");
    }


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
   UPLOAD IMAGE
===================================================== */

async function uploadImage(file, folder) {

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


/* =====================================================
   DELETE STORAGE IMAGE
===================================================== */

async function deleteStorageImage(url) {

  if (!url) {
    return;
  }


  try {

    const marker =
      "/storage/v1/object/public/site-images/";


    const index =
      url.indexOf(marker);


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
      .remove([path]);

  } catch (error) {

    console.warn(
      "Storage delete error:",
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


  try {

    let accessCode =
      generateCode();


    let unique = false;


    while (!unique) {

      const {
        data: check
      } = await sb
        .from("members")
        .select("id")
        .eq(
          "access_code",
          accessCode
        )
        .limit(1);


      if (
        !check ||
        check.length === 0
      ) {

        unique = true;

      } else {

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

    console.error(error);

    alert(
      "لم يتم إضافة العضو: " +
      error.message
    );
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
      "تم النشر بنجاح ✅"
    );

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم النشر: " +
      error.message
    );
  }
}


/* =====================================================
   REFRESH ADMIN POSTS
===================================================== */

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
      throw error;
    }


    if (!posts?.length) {

      box.innerHTML =
        "لا يوجد منشورات.";

      return;
    }


    box.innerHTML =
      posts.map(
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
   CHANGE SCORE
===================================================== */

async function changeScore(
  teamId,
  amount
) {

  try {

    const {
      data: current,
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
        current.score || 0
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


    if (
      member &&
      Number(member.id) ===
      Number(id)
    ) {

      logout();
    }


  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف العضو: " +
      error.message
    );
  }
}


/* =====================================================
   CHANGE MEMBER PHOTO
===================================================== */

async function changeMemberPhoto(id) {

  const input =
    document.createElement("input");


  input.type = "file";

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
          .select("photo_url")
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
          throw error;
        }


        if (
          oldMember?.photo_url
        ) {

          await deleteStorageImage(
            oldMember.photo_url
          );
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
   DELETE POST
===================================================== */

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


    await sb
      .from("replies")
      .delete()
      .eq(
        "post_id",
        postId
      );


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


    await refreshAdmin();


    if (member) {
      await refreshMember();
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


/* =====================================================
   QR CODE
===================================================== */

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

function showMemberQR(code) {

  if (!code) {

    alert(
      "العضو ليس لديه كود."
    );

    return;
  }


  const box =
    document.createElement(
      "div"
    );


  box.style.position =
    "fixed";

  box.style.inset =
    "0";

  box.style.background =
    "rgba(0,0,0,.9)";

  box.style.display =
    "grid";

  box.style.placeItems =
    "center";

  box.style.zIndex =
    "99999";


  box.innerHTML = `

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
    box
  );


  new QRCode(
    box.querySelector(
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


  box.querySelector(
    "#closeQR"
  ).onclick =
    () => box.remove();
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

      async decodedText => {

        $("accessCode").value =
          decodedText;


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


  if ($("accessCode")) {
    $("accessCode").value = "";
  }


  if ($("msg")) {
    $("msg").textContent = "";
  }


  if ($("scanMsg")) {
    $("scanMsg").textContent = "";
  }


  showJoin();
}


/* =====================================================
   EVENT LISTENERS
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    /*
       مهم جدًا:
       إظهار الكواكب فورًا
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


    /*
       Enter login
    */

    $("accessCode")
      ?.addEventListener(
        "keydown",
        function (e) {

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
        function (e) {

          if (
            e.key ===
            "Enter"
          ) {

            loginAdmin();
          }
        }
      );


    /*
       Start
    */

    showJoin();


    /*
       Load saved member
    */

    restoreSavedMember();

  }
);


/* =====================================================
   RESTORE SAVED MEMBER
===================================================== */

async function restoreSavedMember() {

  const savedMemberId =
    localStorage.getItem(
      "memberId"
    );


  if (!savedMemberId) {
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
        savedMemberId
      )
      .single();


    if (
      error ||
      !data
    ) {

      localStorage.removeItem(
        "memberId"
      );

      return;
    }


    const foundTeam =
      findLocalTeamByName(
        data.teams?.name
      );


    if (!foundTeam) {

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
        foundTeam.id,

      accessCode:
        data.access_code,

      photoUrl:
        data.photo_url || ""
    };


    await showMember();


  } catch (error) {

    console.error(
      "Restore member error:",
      error
    );
  }
}


/* =====================================================
   INITIAL FALLBACK
===================================================== */

if (
  document.readyState !==
  "loading"
) {

  renderTeams();

  showJoin();

  restoreSavedMember();
}
