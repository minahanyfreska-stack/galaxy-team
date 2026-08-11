/* =====================================================
   INFINITY
   Supabase
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
   الفرق
===================================================== */

const T = [
  {
    id: "jupiter",
    ar: "المشتري",
    en: "Jupiter",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg"
  },

  {
    id: "saturn",
    ar: "زحل",
    en: "Saturn",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg"
  },

  {
    id: "neptune",
    ar: "نبتون",
    en: "Neptune",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg"
  },

  {
    id: "uranus",
    ar: "أورانوس",
    en: "Uranus",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg"
  }
];


let member = null;

let admin = false;

let qrScanner = null;


const ADMIN_PASSWORD = "1234";

const STORAGE_BUCKET =
  "infinity-media";


const $ = id =>
  document.getElementById(id);


/* =====================================================
   أدوات
===================================================== */

function team(id) {
  return T.find(t => t.id === id);
}


function esc(s) {

  return String(s ?? "")
    .replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c]));

}


/* =====================================================
   كود الدخول
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
   رفع الصور
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
    `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${extension}`;


  const {
    error
  } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(
      fileName,
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
  } = sb.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);


  return data.publicUrl;
}


/* =====================================================
   عرض بيانات الفرق
===================================================== */

function teamsHTML() {

  const box =
    $("adminTeams");

  if (!box) {
    return;
  }


  box.innerHTML = T.map(t => `

    <div class="admin-team">

      <img
        class="admin-team-planet"
        src="${t.image}"
        alt="${esc(t.ar)}"
      >

      <div>

        <b>
          ${esc(t.ar)}
        </b>

        <small>
          ${esc(t.en)}
        </small>

      </div>

    </div>

  `).join("");
}


/* =====================================================
   تسجيل الدخول بالكود
===================================================== */

async function loginWithCode(codeOverride = null) {

  const input =
    $("accessCode");


  const code =
    (
      codeOverride ||
      input.value
    )
    .trim()
    .toUpperCase();


  if (!code) {

    $("msg").textContent =
      "اكتب أو امسح كود الدخول.";

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
        avatar_url,
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
      T.find(
        t =>
          t.ar ===
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

      team: foundTeam.id,

      accessCode:
        data.access_code,

      avatar:
        data.avatar_url || null

    };


    localStorage.setItem(
      "memberId",
      String(data.id)
    );


    $("msg").textContent = "";

    await stopQRScanner();

    closeQRScanner();

    await showMember();


  } catch (error) {

    console.error(error);

    $("msg").textContent =
      "حدث خطأ أثناء تسجيل الدخول.";

  }

}


/* =====================================================
   صفحة العضو
===================================================== */

async function showMember() {

  if (!member) {
    return;
  }


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

    $("memberName")
      .textContent =
      member.name;


    $("memberTeam")
      .textContent =
      `فريق ${t.ar} • ${t.en}`;


    const avatar =
      $("memberAvatar");

    const fallback =
      $("memberAvatarFallback");


    if (member.avatar) {

      avatar.src =
        member.avatar;

      avatar.classList
        .remove("hidden");

      fallback.classList
        .add("hidden");

    } else {

      avatar.classList
        .add("hidden");

      fallback.classList
        .remove("hidden");

      fallback.textContent =
        member.name
          .substring(0, 2)
          .toUpperCase();

    }

  }


  await refreshMember();

}


/* =====================================================
   بيانات العضو
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
      team(member.team);


    const dbTeam =
      teams.find(
        t =>
          t.name ===
          currentTeam?.ar
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

      visiblePosts
        .map(post => `

          <article class="post">

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
              ${esc(post.body || "")
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

          </article>

        `)
        .join("") ||

      "<p>لا يوجد محتوى حاليًا.</p>";


    const ranking =
      [...(teams || [])]
        .sort(
          (a, b) =>
            Number(b.score || 0) -
            Number(a.score || 0)
        );


    $("ranking").innerHTML =

      ranking
        .map((t, i) => `

          <div class="rank">

            <span>
              #${i + 1}
              ${esc(t.name)}
            </span>

            <b>
              ${Number(t.score || 0)} نقطة
            </b>

          </div>

        `)
        .join("");


  } catch (error) {

    console.error(
      "Member error:",
      error
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


    if (teamsError) {
      throw teamsError;
    }


    if ($("postTeam")) {

      $("postTeam").innerHTML = `

        <option value="all">
          كل الفرق
        </option>

      ` +

      (teams || [])
        .map(t => `

          <option value="${t.id}">
            ${esc(t.name)}
          </option>

        `)
        .join("");

    }


    if ($("newMemberTeam")) {

      $("newMemberTeam").innerHTML = `

        <option value="">
          اختر الفريق
        </option>

      ` +

      (teams || [])
        .map(t => `

          <option value="${t.id}">
            ${esc(t.name)}
          </option>

        `)
        .join("");

    }


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
        avatar_url,
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


    $("members").innerHTML =

      (members || [])
        .map(m => `

          <div class="member">

            <div class="member-left">

              ${
                m.avatar_url
                  ? `
                    <img
                      class="admin-avatar"
                      src="${esc(
                        m.avatar_url
                      )}"
                    >
                  `
                  : `
                    <div class="admin-avatar">
                    </div>
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


            <div class="member-actions">

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
                الصورة
              </button>

              <button
                onclick="deleteMember(${m.id})"
              >
                حذف
              </button>

            </div>

          </div>

        `)
        .join("") ||

      "لا يوجد أعضاء";


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
              onclick="changeScore(${t.id}, 5)"
            >
              +5
            </button>

            <button
              onclick="changeScore(${t.id}, 10)"
            >
              +10
            </button>

            <button
              onclick="changeScore(${t.id}, -5)"
            >
              -5
            </button>

            <button
              onclick="changeScore(${t.id}, -10)"
            >
              -10
            </button>

          </div>

        `)
        .join("");


    teamsHTML();


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


  const avatarFile =
    $("newMemberAvatar")
      .files[0];


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


    let avatarUrl = null;


    if (avatarFile) {

      avatarUrl =
        await uploadImage(
          avatarFile,
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

        avatar_url:
          avatarUrl

      })
      .select()
      .single();


    if (error) {
      throw error;
    }


    $("newMemberName")
      .value = "";

    $("newMemberTeam")
      .value = "";

    $("newMemberAvatar")
      .value = "";


    $("newMemberResult")
      .innerHTML = `

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
   تغيير صورة عضو
===================================================== */

async function changeMemberPhoto(id) {

  const input =
    document.createElement("input");

  input.type = "file";

  input.accept = "image/*";


  input.onchange =
    async () => {

      const file =
        input.files[0];


      if (!file) {
        return;
      }


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
            avatar_url: url
          })
          .eq("id", id);


        if (error) {
          throw error;
        }


        alert(
          "تم تغيير صورة العضو."
        );


        await refreshAdmin();


        if (
          member &&
          Number(member.id) ===
          Number(id)
        ) {

          member.avatar = url;

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
   QR Generator
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


function showMemberQR(code) {

  if (!code) {

    alert(
      "العضو ليس لديه كود."
    );

    return;
  }


  const box =
    document.createElement("div");


  box.style.position =
    "fixed";

  box.style.inset =
    "0";

  box.style.background =
    "rgba(0,0,0,.88)";

  box.style.display =
    "grid";

  box.style.placeItems =
    "center";

  box.style.zIndex =
    "9999";


  box.innerHTML = `

    <div
      style="
        background:#10151e;
        padding:30px;
        border-radius:24px;
        text-align:center;
        max-width:90%;
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


  document.body
    .appendChild(box);


  new QRCode(
    box.querySelector(
      "#popupQR"
    ),
    {
      text: code,
      width: 220,
      height: 220
    }
  );


  box.querySelector(
    "#closeQR"
  ).onclick =
    () => box.remove();

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
      .eq("id", id);


    if (error) {
      throw error;
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


/* =====================================================
   النقاط
===================================================== */

async function changeScore(
  teamId,
  amount
) {

  try {

    const {
      data: current,
      error: getError
    } = await sb
      .from("teams")
      .select("score")
      .eq(
        "id",
        teamId
      )
      .single();


    if (getError) {
      throw getError;
    }


    const newScore =
      Number(current.score || 0) +
      Number(amount);


    const {
      error
    } = await sb
      .from("teams")
      .update({
        score: newScore
      })
      .eq(
        "id",
        teamId
      );


    if (error) {
      throw error;
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
   نشر منشور
===================================================== */

async function publishPost() {

  const title =
    $("postTitle")
      .value
      .trim();


  const body =
    $("postBody")
      .value
      .trim();


  const selectedTeam =
    $("postTeam").value;


  const imageFile =
    $("postImage")
      .files[0];


  if (!title || !body) {

    alert(
      "اكتب عنوان وتفاصيل المنشور."
    );

    return;
  }


  try {

    let teamId = null;


    if (
      selectedTeam !== "all"
    ) {

      teamId =
        Number(selectedTeam);

    }


    let imageUrl = null;


    if (imageFile) {

      imageUrl =
        await uploadImage(
          imageFile,
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


    $("postTitle")
      .value = "";

    $("postBody")
      .value = "";

    $("postImage")
      .value = "";


    await refreshAdmin();


    if (member) {
      await refreshMember();
    }


    alert(
      "تم النشر بنجاح."
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
   QR Scanner
===================================================== */

async function openQRScanner() {

  $("qrModal")
    .classList
    .remove("hidden");


  $("qrMessage")
    .textContent =
    "جاري تشغيل الكاميرا...";


  try {

    qrScanner =
      new Html5Qrcode(
        "qr-reader"
      );


    await qrScanner.start(

      {
        facingMode:
          "environment"
      },

      {
        fps: 10,

        qrbox: {
          width: 250,
          height: 250
        },

        aspectRatio: 1

      },

      async decodedText => {

        $("qrMessage")
          .textContent =
          "تم قراءة الكود...";


        await stopQRScanner();


        await loginWithCode(
          decodedText
        );

      },

      () => {}

    );


    $("qrMessage")
      .textContent =
      "وجّه الكاميرا نحو QR.";

  } catch (error) {

    console.error(error);

    $("qrMessage")
      .textContent =
      "لم نتمكن من تشغيل الكاميرا. تأكد من السماح للمتصفح باستخدام الكاميرا.";

  }

}


async function stopQRScanner() {

  if (!qrScanner) {
    return;
  }


  try {

    if (
      qrScanner.isScanning
    ) {

      await qrScanner.stop();

    }

  } catch (error) {

    console.error(error);

  }


  try {

    await qrScanner.clear();

  } catch (error) {

    console.error(error);

  }


  qrScanner = null;

}


function closeQRScanner() {

  $("qrModal")
    .classList
    .add("hidden");

}


/* =====================================================
   خروج العضو
===================================================== */

function logout() {

  localStorage.removeItem(
    "memberId"
  );


  member = null;


  $("member")
    .classList
    .add("hidden");


  $("admin")
    .classList
    .add("hidden");


  $("join")
    .classList
    .remove("hidden");


  $("name").value = "";

  $("accessCode").value = "";

  $("msg").textContent = "";

}


/* =====================================================
   الإدارة
===================================================== */

function openAdmin() {

  $("loginModal")
    .classList
    .remove("hidden");


  $("adminPass")
    .value = "";

  $("loginMsg")
    .textContent = "";

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

    $("loginMsg")
      .textContent =
      "كلمة المرور غير صحيحة.";

    return;
  }


  admin = true;


  $("loginModal")
    .classList
    .add("hidden");


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

if ($("scanQRBtn")) {

  $("scanQRBtn")
    .onclick =
    openQRScanner;

}


if ($("closeQRScanner")) {

  $("closeQRScanner")
    .onclick =
    async () => {

      await stopQRScanner();

      closeQRScanner();

    };

}


if ($("joinBtn")) {

  $("joinBtn")
    .onclick =
    join;

}


if ($("codeLoginBtn")) {

  $("codeLoginBtn")
    .onclick =
    () =>
      loginWithCode();

}


if ($("adminOpen")) {

  $("adminOpen")
    .onclick =
    openAdmin;

}


if ($("closeModal")) {

  $("closeModal")
    .onclick =
    closeAdmin;

}


if ($("loginBtn")) {

  $("loginBtn")
    .onclick =
    loginAdmin;

}


if ($("postBtn")) {

  $("postBtn")
    .onclick =
    publishPost;

}


if ($("addMemberBtn")) {

  $("addMemberBtn")
    .onclick =
    addMember;

}


if ($("logout")) {

  $("logout")
    .onclick =
    logout;

}


if ($("adminLogout")) {

  $("adminLogout")
    .onclick =
    adminLogout;

}


/* =====================================================
   Enter
===================================================== */

if ($("accessCode")) {

  $("accessCode")
    .addEventListener(
      "keydown",
      e => {

        if (
          e.key === "Enter"
        ) {

          loginWithCode();

        }

      }
    );

}


/* =====================================================
   البداية
===================================================== */

async function init() {

  await refreshAdmin();


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
        avatar_url,
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
      T.find(
        t =>
          t.ar ===
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

      avatar:
        data.avatar_url || null

    };


    await showMember();


  } catch (error) {

    console.error(error);

  }

}


/* =====================================================
   توافق مع زر قديم
===================================================== */

async function join() {

  alert(
    "التسجيل الجديد يتم من لوحة الإدارة. استخدم QR أو كود الدخول."
  );

}


init();
