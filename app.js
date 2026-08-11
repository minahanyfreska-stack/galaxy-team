/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_zF7z4wuwluqfPDfAH0-7qg_8-tjtrSr";

const sb =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =====================================================
   الفرق
===================================================== */

const T = [

  ["jupiter", "المشتري", "Jupiter"],

  ["saturn", "زحل", "Saturn"],

  ["neptune", "نبتون", "Neptune"],

  ["uranus", "أورانوس", "Uranus"]

];


let member = null;

let admin = false;

let qrScanner = null;

let scanning = false;


const $ = id =>
  document.getElementById(id);


const ADMIN_PASSWORD = "1234";


/* =====================================================
   أدوات
===================================================== */

function team(id) {

  return T.find(
    x => x[0] === id
  );

}


function esc(s) {

  return String(s ?? "")
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
          Math.random() *
          chars.length
        )
      ];

  }

  return code;
}


/* =====================================================
   عرض الفرق
   لا يوجد اختيار للفريق هنا
===================================================== */

function teamsHTML() {

  const box = $("teams");

  if (!box) return;


  box.innerHTML =
    T.map(t => `

      <div class="team">

        <div
          class="planet ${t[0]}"
        ></div>

        <div class="team-info">

          <b>
            ${esc(t[1])}
          </b>

          <small>
            ${esc(t[2])}
          </small>

        </div>

      </div>

    `).join("");

}


/* =====================================================
   تسجيل عضو جديد
=====================================================

   ملاحظة:
   التسجيل العام لم يعد ينشئ عضوًا.

   الإدارة هي التي تنشئ العضو
   وتعطيه الكود.

===================================================== */


/* =====================================================
   QR GENERATOR
===================================================== */

function createQR(code) {

  const box =
    $("memberQR");

  if (
    !box ||
    typeof QRCode === "undefined"
  ) {
    return;
  }


  box.innerHTML = "";


  new QRCode(box, {

    text: code,

    width: 180,

    height: 180

  });

}


/* =====================================================
   الدخول بالكود
===================================================== */

async function loginWithCode(
  suppliedCode = null
) {

  const input =
    $("accessCode");


  const code =
    String(
      suppliedCode ??
      input.value
    )
      .trim()
      .toUpperCase();


  if (!code) {

    $("msg").textContent =
      "اكتب كود الدخول أو امسح QR.";

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

      id:
        data.id,

      name:
        data.name,

      team:
        foundTeam[0],

      accessCode:
        data.access_code

    };


    localStorage.setItem(
      "memberId",
      String(data.id)
    );


    $("msg").textContent = "";

    await stopQRScanner();

    showMember();


  } catch (error) {

    console.error(error);

    $("msg").textContent =
      "حدث خطأ أثناء تسجيل الدخول.";

  }

}


/* =====================================================
   QR CAMERA
===================================================== */

async function startQRScanner() {

  if (scanning) {
    return;
  }


  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    $("msg").textContent =
      "لم يتم تحميل قارئ QR.";

    return;

  }


  const reader =
    $("reader");

  const stopButton =
    $("stopScanBtn");


  reader.classList.remove(
    "hidden"
  );

  stopButton.classList.remove(
    "hidden"
  );


  $("msg").textContent =
    "اسمح للمتصفح باستخدام الكاميرا ثم وجّهها إلى QR.";


  qrScanner =
    new Html5Qrcode(
      "reader"
    );


  scanning = true;


  try {

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

        if (!decodedText) {
          return;
        }


        await stopQRScanner();


        await loginWithCode(
          decodedText
        );

      },

      errorMessage => {

        /*

          أخطاء القراءة العادية
          لا نعرضها للمستخدم.

        */

      }

    );

  } catch (error) {

    console.error(
      "QR camera error:",
      error
    );


    scanning = false;


    reader.classList.add(
      "hidden"
    );

    stopButton.classList.add(
      "hidden"
    );


    $("msg").textContent =
      "لم نتمكن من فتح الكاميرا. تأكد من السماح باستخدام الكاميرا.";

  }

}


/* =====================================================
   إيقاف الكاميرا
===================================================== */

async function stopQRScanner() {

  if (!qrScanner) {

    scanning = false;

    $("reader")
      ?.classList
      .add("hidden");

    $("stopScanBtn")
      ?.classList
      .add("hidden");

    return;

  }


  try {

    if (scanning) {

      await qrScanner.stop();

    }

  } catch (error) {

    console.log(
      "QR stop:",
      error
    );

  }


  try {

    qrScanner.clear();

  } catch (error) {

    console.log(
      "QR clear:",
      error
    );

  }


  qrScanner = null;

  scanning = false;


  $("reader")
    ?.classList
    .add("hidden");


  $("stopScanBtn")
    ?.classList
    .add("hidden");

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
      `فريق ${t[1]} • ${t[2]}`;


    $("memberIcon")
      .className =
      `big planet-mini ${t[0]}`;

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


    if (postsError) {
      throw postsError;
    }


    const visiblePosts =
      (posts || [])
        .filter(post => {

          if (
            post.team_id ===
            null
          ) {

            return true;

          }


          return (
            dbTeam &&
            Number(
              post.team_id
            ) ===
            Number(
              dbTeam.id
            )
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
              ${esc(post.body)
                .replace(
                  /\n/g,
                  "<br>"
                )}
            </p>

          </article>

        `)
        .join("") ||

      "<p>لا يوجد محتوى حاليًا.</p>";


    const ranking =
      [...(teams || [])]
        .sort(
          (a, b) =>
            Number(
              b.score || 0
            ) -
            Number(
              a.score || 0
            )
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
                ⭐
                ${Number(
                  t.score || 0
                )}
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


    /* اختيار فريق المنشور */

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


    /* اختيار فريق العضو */

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


    /* عرض الفرق */

    if ($("adminTeams")) {

      $("adminTeams").innerHTML =

        (teams || [])
          .map(t => {

            const planet =
              T.find(
                p =>
                  p[1] ===
                  t.name
              );

            return `

              <div class="admin-team">

                <div
                  class="planet ${
                    planet
                      ? planet[0]
                      : ""
                  }"
                ></div>

                <div>

                  <b>
                    ${esc(t.name)}
                  </b>

                  <br>

                  <small>
                    ${Number(
                      t.score || 0
                    )} نقطة
                  </small>

                </div>

              </div>

            `;

          })
          .join("");

    }


    /* الأعضاء */

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


            <div>

              <button
                onclick="showMemberQR('${esc(
                  m.access_code || ""
                )}')"
              >
                QR
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


    /* النقاط */

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


  } catch (error) {

    console.error(error);

    alert(
      "خطأ في لوحة التحكم: " +
      error.message
    );

  }

}


/* =====================================================
   إضافة عضو من الإدارة
===================================================== */

async function addMember() {

  const name =
    $("newMemberName")
      .value
      .trim();


  const teamId =
    $("newMemberTeam")
      .value;


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
          0

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
   QR الإدارة
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


  new QRCode(box, {

    text:
      code,

    width:
      180,

    height:
      180

  });

}


/* =====================================================
   عرض QR للعضو
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
        background:#0b111a;
        padding:30px;
        border-radius:25px;
        text-align:center;
        border:1px solid rgba(255,255,255,.12);
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
      text: code,
      width: 220,
      height: 220
    }
  );


  box.querySelector(
    "#closeQR"
  ).onclick = () =>
    box.remove();

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
   تعديل النقاط
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
      Number(
        current.score || 0
      ) +
      Number(amount);


    const {
      error
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
    $("postTeam")
      .value;


  if (
    !title ||
    !body
  ) {

    alert(
      "اكتب عنوان وتفاصيل المنشور."
    );

    return;

  }


  try {

    let teamId = null;


    if (
      selectedTeam !==
      "all"
    ) {

      teamId =
        Number(
          selectedTeam
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
          teamId

      });


    if (error) {
      throw error;
    }


    $("postTitle")
      .value = "";


    $("postBody")
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
   خروج العضو
===================================================== */

function logout() {

  stopQRScanner();


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


  $("accessCode")
    .value = "";


  $("msg")
    .textContent = "";

}


/* =====================================================
   خروج الإدارة
===================================================== */

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
   فتح الإدارة
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


/* =====================================================
   إغلاق الإدارة
===================================================== */

function closeAdmin() {

  $("loginModal")
    .classList
    .add("hidden");

}


/* =====================================================
   تسجيل الإدارة
===================================================== */

async function loginAdmin() {

  const password =
    $("adminPass")
      .value;


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


/* =====================================================
   الأزرار
===================================================== */

if ($("codeLoginBtn")) {

  $("codeLoginBtn")
    .onclick =
    () => loginWithCode();

}


if ($("scanQRBtn")) {

  $("scanQRBtn")
    .onclick =
    startQRScanner;

}


if ($("stopScanBtn")) {

  $("stopScanBtn")
    .onclick =
    stopQRScanner;

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
   Enter للكود
===================================================== */

if ($("accessCode")) {

  $("accessCode")
    .addEventListener(
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

}


/* =====================================================
   البداية
===================================================== */

teamsHTML();


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
      ({ data, error }) => {

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
            data.access_code

        };


        showMember();

      }
    );

}
