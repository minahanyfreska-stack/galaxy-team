/* =========================================================
   INFINITY - APP.JS
   ========================================================= */

/* ================= SUPABASE ================= */

const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_zF7z4wuwluqfPDfAH0-7qg_8-tjtrSr";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* ================= SETTINGS ================= */

const ADMIN_PASSWORD = "1234";

let member = null;
let admin = false;
let scanner = null;


/* ================= TEAMS ================= */

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


/* ================= SHORTCUT ================= */

function $(id) {
  return document.getElementById(id);
}


/* ================= ESCAPE ================= */

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


/* ================= TEAM ================= */

function getTeam(id) {
  return T.find(
    t => Number(t.id) === Number(id)
  );
}


function getTeamName(id) {
  return getTeam(id)?.name || "بدون فريق";
}


/* =========================================================
   RENDER PLANETS
   ========================================================= */

function renderTeams() {

  const box = $("teams");

  if (!box) return;

  box.innerHTML = T.map(team => `
    
    <div class="team">

      <div class="planet-image">

        <img
          src="${team.image}"
          alt="${esc(team.name)}"
          loading="lazy"
          onerror="this.src='${team.image}'"
        >

      </div>

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


/* =========================================================
   LOAD TEAMS
   ========================================================= */

async function loadTeams() {

  try {

    const { data, error } =
      await sb
        .from("teams")
        .select("*")
        .order("id");

    if (error) {
      console.warn(
        "Teams:",
        error.message
      );

      return T;
    }

    return data?.length ? data : T;

  } catch (e) {

    console.warn(e);

    return T;
  }
}


/* =========================================================
   ADMIN TEAM SELECT
   ========================================================= */

async function loadAdminTeamSelects() {

  const memberSelect =
    $("newMemberTeam");

  const postSelect =
    $("postTeam");

  if (!memberSelect) return;


  const teams =
    await loadTeams();


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


/* =========================================================
   GENERATE MEMBER CODE
   ========================================================= */

function generateCode() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "INF-";

  for (let i = 0; i < 6; i++) {

    code += chars[
      Math.floor(
        Math.random() *
        chars.length
      )
    ];
  }

  return code;
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
   ADMIN LOGIN
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

  await loadAdminTeamSelects();

  await refreshAdmin();
}


function closeAdmin() {

  $("loginModal")
    ?.classList.add("hidden");
}


function adminLogout() {

  admin = false;

  $("admin")
    ?.classList.add("hidden");

  $("join")
    ?.classList.remove("hidden");
}


/* =========================================================
   MEMBER LOGIN
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
  }
}


/* =========================================================
   SHOW MEMBER
   ========================================================= */

async function showMember() {

  if (!member) return;

  $("join")
    ?.classList.add("hidden");

  $("admin")
    ?.classList.add("hidden");

  $("member")
    ?.classList.remove("hidden");


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


/* =========================================================
   MEMBER CONTENT
   ========================================================= */

async function refreshMember() {

  if (!member) return;


  try {

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
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    const visible =
      (posts || []).filter(post => {

        return (
          post.team_id === null ||
          Number(post.team_id) ===
          Number(member.teamId)
        );

      });


    if ($("posts")) {

      $("posts").innerHTML =
        visible.length

          ? visible
              .map(renderPost)
              .join("")

          : `
              <p>
                لا يوجد منشورات حاليًا.
              </p>
            `;
    }


    await loadRepliesForPosts(
      visible
    );


    await loadRanking();

  } catch (error) {

    console.error(
      "Member error:",
      error
    );

    if ($("posts")) {

      $("posts").innerHTML = `
        <p>
          تعذر تحميل المنشورات.
        </p>
      `;
    }
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
          ></textarea>

          <button
            type="button"
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

        `).join("");

    });

  } catch (error) {

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
      "Reply error:",
      error
    );


    alert(
      "لم يتم إرسال الرد:\n" +
      error.message
    );
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
      .select("*")
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
        (team, index) => `

          <div class="rank">

            <span>
              #${index + 1}
              🪐
              ${esc(team.name)}
            </span>

            <b>
              ${Number(
                team.score || 0
              )}
              نقطة
            </b>

          </div>

        `
      ).join("");

  } catch (error) {

    console.error(error);
  }
}


/* =========================================================
   ADD MEMBER
   ========================================================= */

async function addMember() {

  const name =
    $("newMemberName")
      ?.value.trim();


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

    let code =
      generateCode();


    for (let i = 0; i < 10; i++) {

      const {
        data
      } = await sb
        .from("members")
        .select("id")
        .eq(
          "access_code",
          code
        );


      if (!data?.length) {
        break;
      }

      code =
        generateCode();
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

          code,

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

    console.error(
      "Add member:",
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

  if (!file) {
    return null;
  }


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const path =
    `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;


  const {
    error
  } = await sb
    .storage
    .from("site-images")
    .upload(
      path,
      file,
      {
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
      ?.value.trim();


  const body =
    $("postBody")
      ?.value.trim();


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

        title:

          title,

        body:

          body,

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


    await refreshAdminPosts();

    alert(
      "تم نشر المنشور بنجاح ✅"
    );


  } catch (error) {

    console.error(
      "Publish:",
      error
    );


    alert(
      "لم يتم نشر المنشور:\n" +
      error.message
    );
  }
}


/* =========================================================
   ADMIN
   ========================================================= */

async function refreshAdmin() {

  await loadAdminTeamSelects();

  await loadAdminMembers();

  await loadAdminScores();

  await refreshAdminPosts();
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
      data.map(m => `

        <div class="member">

          <div class="admin-member-left">

            ${
              m.photo_url
                ? `
                  <img
                    class="admin-member-photo"
                    src="${esc(m.photo_url)}"
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
                فريق:
                ${esc(
                  m.teams?.name ||
                  getTeamName(m.team_id)
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

          </div>


          <div class="admin-member-buttons">

            <button
              onclick="showMemberQR('${esc(m.access_code)}')"
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

      `).join("");


  } catch (error) {

    console.error(error);

    box.innerHTML =
      "تعذر تحميل الأعضاء.";
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
      .select("*")
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


  } catch (error) {

    console.error(error);

    box.innerHTML =
      "تعذر تحميل النقاط.";
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
                  class="admin-post-image"
                  src="${esc(post.image_url)}"
                >
              `
              : ""
          }


          <br>


          <button
            class="delete-btn"
            type="button"
            onclick="deletePost(${post.id})"
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


    box.innerHTML = `
      <p>
        تعذر تحميل المنشورات.
      </p>
    `;
  }
}


/* =========================================================
   DELETE POST
   ========================================================= */

async function deletePost(postId) {

  if (
    !confirm(
      "هل تريد حذف المنشور؟"
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
        postId
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


/* =========================================================
   DELETE MEMBER
   ========================================================= */

async function deleteMember(id) {

  if (
    !confirm(
      "هل تريد حذف العضو؟"
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


    await loadAdminMembers();


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
   CHANGE SCORE
   ========================================================= */

async function changeScore(
  id,
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
        id
      )
      .single();


    if (error) {
      throw error;
    }


    const score =
      Number(data.score || 0) +
      Number(amount);


    const {
      error: updateError
    } = await sb
      .from("teams")
      .update({
        score
      })
      .eq(
        "id",
        id
      );


    if (updateError) {
      throw updateError;
    }


    await loadAdminScores();

    await loadRanking();


  } catch (error) {

    console.error(error);

    alert(
      "لم يتم تعديل النقاط:\n" +
      error.message
    );
  }
}


/* =========================================================
   CHANGE MEMBER PHOTO
   ========================================================= */

async function changeMemberPhoto(id) {

  const input =
    document.createElement("input");

  input.type = "file";

  input.accept = "image/*";


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
            photo_url: url
          })
          .eq(
            "id",
            id
          );


        if (error) {
          throw error;
        }


        await loadAdminMembers();

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

  if (!code) return;


  const overlay =
    document.createElement("div");


  overlay.style.cssText = `
    position:fixed;
    inset:0;
    z-index:99999;
    background:rgba(0,0,0,.9);
    display:grid;
    place-items:center;
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
      text: code,
      width: 220,
      height: 220
    }
  );


  overlay.querySelector(
    "#closeQR"
  ).onclick =
    () => overlay.remove();
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

  localStorage.removeItem(
    "memberId"
  );

  member = null;

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
        data.team_id,

      accessCode:
        data.access_code,

      photoUrl:
        data.photo_url || ""
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

      async code => {

        $("accessCode").value =
          code;

        await scanner.stop();

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


/* =========================================================
   EVENTS
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    renderTeams();

    showJoin();


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
            e.key === "Enter"
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
            e.key === "Enter"
          ) {
            loginAdmin();
          }

        }
      );


    await restoreSavedMember();

  }
);


/* =========================================================
   FALLBACK
   ========================================================= */

if (
  document.readyState !==
  "loading"
) {

  renderTeams();

  showJoin();

}
