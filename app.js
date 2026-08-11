/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_zF7z4wuwluqfPDfAH0-7qg8_8-tjtrSr";

const sb =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =====================================================
   الفرق والكواكب
   الأسماء زي ما هي
===================================================== */

const T = [

  [
    "jupiter",
    "المشتري",
    "Jupiter",
    "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg"
  ],

  [
    "saturn",
    "زحل",
    "Saturn",
    "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg"
  ],

  [
    "neptune",
    "نبتون",
    "Neptune",
    "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg"
  ],

  [
    "uranus",
    "أورانوس",
    "Uranus",
    "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg"
  ]

];


let member = null;
let admin = false;
let scanner = null;

const ADMIN_PASSWORD = "1234";


/* =====================================================
   اختصار العناصر
===================================================== */

function $(id) {
  return document.getElementById(id);
}


/* =====================================================
   البحث عن الفريق
===================================================== */

function team(id) {

  return T.find(
    x => x[0] === id
  );

}


/* =====================================================
   حماية النص
===================================================== */

function esc(value) {

  return String(value ?? "")
    .replace(
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
   عرض الكواكب في الصفحة الرئيسية
===================================================== */

function renderTeams() {

  const box = $("teams");

  if (!box) return;


  box.innerHTML = T.map(t => {

    return `

      <div
        class="team"
        data-team="${t[0]}"
      >

        <div class="planet-glow"></div>

        <img
          src="${t[3]}"
          alt="${esc(t[2])}"
          loading="lazy"
        >

        <div class="team-name">

          <strong>
            فريق ${esc(t[1])}
          </strong>

          <span>
            ${esc(t[2])}
          </span>

        </div>

      </div>

    `;

  }).join("");


  /* لو ضغط على كوكب */

  document
    .querySelectorAll(".team")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".team")
            .forEach(x =>
              x.classList.remove("sel")
            );

          card.classList.add("sel");

        }
      );

    });

}


/* =====================================================
   إنشاء كود
===================================================== */

function generateCode() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "INF-";

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


/* =====================================================
   رفع صورة
===================================================== */

async function uploadImage(file, folder) {

  if (!file) return null;

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

  const fileName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}
      .${extension}`.replace(/\s/g, "");

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
   صفحة الدخول
===================================================== */

function showJoin() {

  $("member")
    ?.classList
    .add("hidden");

  $("admin")
    ?.classList
    .add("hidden");

  $("join")
    ?.classList
    .remove("hidden");

}


/* =====================================================
   تسجيل الدخول بالكود
===================================================== */

async function loginWithCode() {

  const input =
    $("accessCode");

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


    if (
      error ||
      !data
    ) {

      $("msg").textContent =
        "كود الدخول غير صحيح.";

      return;

    }


    const foundTeam =
      T.find(
        t =>
          t[1] ===
          data.teams?.name
      );


    if (!foundTeam) {

      $("msg").textContent =
        "فريق العضو غير موجود.";

      return;

    }


    member = {

      id: data.id,

      name: data.name,

      team:
        foundTeam[0],

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
   عرض العضو
===================================================== */

async function showMember() {

  if (!member) return;


  $("join")
    .classList
    .add("hidden");

  $("admin")
    .classList
    .add("hidden");

  $("member")
    .classList
    .remove("hidden");


  const t =
    team(member.team);


  if (t) {

    $("memberName").textContent =
      member.name;


    $("memberTeam").textContent =
      `فريق ${t[1]} • ${t[2]}`;


    const photo =
      $("memberPhoto");


    photo.src =
      member.photoUrl ||
      t[3];

  }


  await refreshMember();

}


/* =====================================================
   بيانات العضو
===================================================== */

async function refreshMember() {

  if (!member) return;


  try {

    const {
      data: teams,
      error: teamsError
    } = await sb
      .from("teams")
      .select("*");


    if (teamsError)
      throw teamsError;


    const currentTeam =
      team(member.team);


    const dbTeam =
      teams.find(
        t =>
          t.name ===
          currentTeam?.[1]
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


    if (postsError)
      throw postsError;


    const visiblePosts =
      (posts || [])
        .filter(post => {

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

        });


    $("posts").innerHTML =
      visiblePosts.length
        ? visiblePosts
            .map(renderMemberPost)
            .join("")
        : "<p>لا يوجد محتوى حاليًا.</p>";


    await loadRepliesForPosts(
      visiblePosts
    );


    const ranking =
      [...(teams || [])]
        .sort(
          (a, b) =>
            Number(b.score || 0) -
            Number(a.score || 0)
        );


    $("ranking").innerHTML =
      ranking
        .map(
          (t, i) => `

            <div class="rank">

              <span>
                #${i + 1}
                ${esc(t.name)}
              </span>

              <b>
                ${Number(
                  t.score || 0
                )}
                نقطة
              </b>

            </div>

          `
        )
        .join("");


  } catch (error) {

    console.error(
      "Member error:",
      error
    );

  }

}


/* =====================================================
   منشور العضو
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
        ).toLocaleDateString(
          "ar-EG"
        )}
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
              src="${esc(
                post.image_url
              )}"
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
   الردود
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
      );


    if (error)
      throw error;


    posts.forEach(post => {

      const box =
        $(
          `replies-${post.id}`
        );


      if (!box) return;


      const replies =
        (data || [])
          .filter(
            r =>
              Number(r.post_id) ===
              Number(post.id)
          );


      if (!replies.length) {

        box.innerHTML =
          "<small>لا توجد ردود حتى الآن.</small>";

        return;

      }


      box.innerHTML =
        replies
          .map(
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
          )
          .join("");

    });


  } catch (error) {

    console.error(
      "Replies error:",
      error
    );

  }

}


/* =====================================================
   إرسال رد
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


    if (error)
      throw error;


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
   لوحة الإدارة
===================================================== */

async function refreshAdmin() {

  try {

    const {
      data: teams,
      error: teamsError
    } = await sb
      .from("teams")
      .select("*")
      .order("id");


    if (teamsError)
      throw teamsError;


    /*
      اختيار فريق المنشور
    */

    const postTeam =
      $("postTeam");


    if (postTeam) {

      postTeam.innerHTML = `

        <option value="all">
          كل الفرق
        </option>

        ${
          (teams || [])
            .map(
              t => `

                <option
                  value="${t.id}"
                >
                  ${esc(t.name)}
                </option>

              `
            )
            .join("")
        }

      `;

    }


    /*
      اختيار فريق العضو
    */

    const memberTeam =
      $("newMemberTeam");


    if (memberTeam) {

      if (!teams?.length) {

        memberTeam.innerHTML = `

          <option value="">
            لا توجد فرق في قاعدة البيانات
          </option>

        `;

      } else {

        memberTeam.innerHTML = `

          <option value="">
            اختر الفريق
          </option>

          ${
            teams
              .map(
                t => `

                  <option
                    value="${t.id}"
                  >
                    ${esc(t.name)}
                  </option>

                `
              )
              .join("")
          }

        `;

      }

    }


    /*
      الأعضاء
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


    if (membersError)
      throw membersError;


    $("members").innerHTML =
      (members || [])
        .map(
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

          `
        )
        .join("") ||
      "لا يوجد أعضاء";


    /*
      النقاط
    */

    $("scores").innerHTML =
      (teams || [])
        .map(
          t => `

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

          `
        )
        .join("");


    await refreshAdminPosts();


  } catch (error) {

    console.error(error);

    alert(
      "خطأ في لوحة التحكم: " +
      error.message
    );

  }

}


/* =====================================================
   إضافة عضو
===================================================== */

async function addMember() {

  const name =
    $("newMemberName")
      .value
      .trim();


  const teamId =
    $("newMemberTeam")
      .value;


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
      "اختار الفريق أولًا."
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

        score: 0,

        photo_url:
          photoUrl

      })
      .select()
      .single();


    if (error)
      throw error;


    $("newMemberName").value =
      "";


    $("newMemberTeam").value =
      "";


    if ($("newMemberPhoto")) {

      $("newMemberPhoto").value =
        "";

    }


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


    await refreshAdmin();


  } catch (error) {

    console.error(error);

    alert(
      "لم يتم إضافة العضو: " +
      error.message
    );

  }

}


/* =====================================================
   QR
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
      text: code,
      width: 180,
      height: 180
    }
  );

}


/* =====================================================
   تغيير النقاط
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


    if (error)
      throw error;


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


    if (updateError)
      throw updateError;


    await refreshAdmin();


  } catch (error) {

    console.error(error);

    alert(
      "لم يتم تعديل النقاط: " +
      error.message
    );

  }

}


/* =====================================================
   حذف عضو
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
      error
    } = await sb
      .from("members")
      .delete()
      .eq(
        "id",
        id
      );


    if (error)
      throw error;


    await refreshAdmin();


    alert(
      "تم حذف العضو ✅"
    );


  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف العضو: " +
      error.message
    );

  }

}


/* =====================================================
   إدارة الدخول
===================================================== */

function openAdmin() {

  $("loginModal")
    .classList
    .remove("hidden");

}


function closeAdmin() {

  $("loginModal")
    .classList
    .add("hidden");

}


async function loginAdmin() {

  const password =
    $("adminPass").value;


  if (
    password !==
    ADMIN_PASSWORD
  ) {

    $("loginMsg").textContent =
      "كلمة المرور غير صحيحة.";

    return;

  }


  admin = true;


  closeAdmin();


  $("join")
    .classList
    .add("hidden");

  $("member")
    .classList
    .add("hidden");

  $("admin")
    .classList
    .remove("hidden");


  await refreshAdmin();

}


/* =====================================================
   خروج
===================================================== */

function logout() {

  localStorage.removeItem(
    "memberId"
  );

  member = null;

  $("accessCode").value = "";

  $("msg").textContent = "";

  showJoin();

}


function adminLogout() {

  admin = false;

  $("admin")
    .classList
    .add("hidden");

  $("join")
    .classList
    .remove("hidden");

}


/* =====================================================
   الأزرار
===================================================== */

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


$("adminLogout")
  ?.addEventListener(
    "click",
    adminLogout
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


/* =====================================================
   البداية
===================================================== */

renderTeams();

showJoin();


/* =====================================================
   استرجاع العضو
===================================================== */

const savedMemberId =
  localStorage.getItem(
    "memberId"
  );


if (savedMemberId) {

  sb
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
    .single()
    .then(
      ({
        data,
        error
      }) => {

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
          T.find(
            t =>
              t[1] ===
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
            foundTeam[0],

          accessCode:
            data.access_code,

          photoUrl:
            data.photo_url || ""

        };


        showMember();

      }
    );

}
