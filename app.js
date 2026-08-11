const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_zF7z4wuwluqfPDfAH0-7qg_8-tjtrSr";


const sb =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================
   الفرق والكواكب
========================= */

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


const $ = id =>
  document.getElementById(id);


const ADMIN_PASSWORD =
  "1234";


/* =========================
   أدوات
========================= */

function team(id) {

  return T.find(
    x =>
      x[0] === id
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


/* =========================
   إنشاء كود
========================= */

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


/* =========================
   رفع الصور
========================= */

async function uploadImage(
  file,
  folder
) {

  if (!file)
    return null;


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


  if (error)
    throw error;


  const {
    data
  } =
    sb
      .storage
      .from("site-images")
      .getPublicUrl(path);


  return data.publicUrl;
}


/* =========================
   حذف صورة من Storage
========================= */

async function deleteStorageImage(
  url
) {

  if (!url)
    return;


  try {

    const marker =
      "/storage/v1/object/public/site-images/";


    const index =
      url.indexOf(marker);


    if (index === -1)
      return;


    const path =
      decodeURIComponent(
        url.substring(
          index + marker.length
        )
      );


    if (!path)
      return;


    const {
      error
    } =
      await sb
        .storage
        .from("site-images")
        .remove([
          path
        ]);


    if (error) {

      console.warn(
        "Storage delete:",
        error
      );
    }

  } catch (error) {

    console.warn(
      "Storage image delete error:",
      error
    );
  }
}


/* =========================
   صفحة الدخول
========================= */

function showJoin() {

  $("member")
    .classList
    .add("hidden");


  $("admin")
    .classList
    .add("hidden");


  $("join")
    .classList
    .remove("hidden");
}


/* =========================
   عرض الفرق
========================= */

function renderTeams() {

  const box =
    $("teams");


  if (!box)
    return;


  box.innerHTML =
    T.map(t => `

      <div
        class="team"
        data-team="${t[0]}"
      >

        <img
          src="${t[3]}"
          alt="${esc(t[1])}"
          loading="lazy"
        >

        <strong>
          ${esc(t[1])}
        </strong>

        <span>
          ${esc(t[2])}
        </span>

      </div>

    `).join("");


  box
    .querySelectorAll(".team")
    .forEach(card => {

      card.onclick =
        () => {

          box
            .querySelectorAll(".team")
            .forEach(x =>
              x.classList.remove("sel")
            );


          card.classList.add("sel");


          box.dataset.selected =
            card.dataset.team;

        };

    });
}


/* =========================
   تسجيل عضو جديد
========================= */

async function registerMember() {

  const name =
    $("name")
      .value
      .trim();


  const selected =
    $("teams")
      .dataset
      .selected;


  if (!name) {

    $("msg").textContent =
      "اكتب اسمك أولاً.";

    return;
  }


  if (!selected) {

    $("msg").textContent =
      "اختار الفريق.";

    return;
  }


  const selectedTeam =
    team(selected);


  if (!selectedTeam) {

    $("msg").textContent =
      "الفريق غير موجود.";

    return;
  }


  try {

    const {
      data: dbTeams,
      error
    } = await sb
      .from("teams")
      .select("*");


    if (error)
      throw error;


    const dbTeam =
      dbTeams.find(
        t =>
          t.name ===
          selectedTeam[1]
      );


    if (!dbTeam) {

      $("msg").textContent =
        "الفريق غير موجود في قاعدة البيانات.";

      return;
    }


    let accessCode =
      generateCode();


    let unique =
      false;


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
      error: insertError
    } = await sb
      .from("members")
      .insert({

        name,

        team_id:
          dbTeam.id,

        access_code:
          accessCode,

        score: 0,

        photo_url:
          null

      })
      .select()
      .single();


    if (insertError)
      throw insertError;


    member = {

      id:
        data.id,

      name:
        data.name,

      team:
        selectedTeam[0],

      accessCode:
        data.access_code,

      photoUrl:
        ""

    };


    localStorage.setItem(
      "memberId",
      String(data.id)
    );


    $("msg").textContent =
      "";


    showMember();


  } catch (error) {

    console.error(error);

    $("msg").textContent =
      "حدث خطأ أثناء التسجيل: " +
      error.message;
  }
}


/* =========================
   الدخول بالكود
========================= */

async function loginWithCode() {

  const code =
    $("accessCode")
      .value
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
        data.access_code,

      photoUrl:
        data.photo_url || ""

    };


    localStorage.setItem(
      "memberId",
      String(data.id)
    );


    $("msg").textContent =
      "";


    showMember();


  } catch (error) {

    console.error(error);

    $("msg").textContent =
      "حدث خطأ أثناء تسجيل الدخول.";
  }
}


/* =========================
   QR Scanner
========================= */

async function startQRScanner() {

  const box =
    $("qrScanner");


  if (!box)
    return;


  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    $("scanMsg").textContent =
      "لم يتم تحميل قارئ QR.";

    return;
  }


  box.classList.remove(
    "hidden"
  );


  $("scanMsg").textContent =
    "وجّه الكاميرا إلى QR Code.";


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

        fps:
          10,

        qrbox: {
          width: 250,
          height: 250
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
      "لم نتمكن من تشغيل الكاميرا. تأكد من السماح باستخدام الكاميرا.";
  }
}


/* =========================
   صفحة العضو
========================= */

async function showMember() {

  if (!member)
    return;


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


    const photo =
      $("memberPhoto");


    if (member.photoUrl) {

      photo.src =
        member.photoUrl;

    } else {

      photo.src =
        t[3];
    }
  }


  await refreshMember();
}


/* =========================
   بيانات العضو
========================= */

async function refreshMember() {

  if (!member)
    return;


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
          ascending:
            false
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

            ${
              post.image_url
                ? `

                  <img
                    class="post-image"
                    src="${esc(
                      post.image_url
                    )}"
                    alt="صورة المنشور"
                    loading="lazy"
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
          (a,b) =>
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
          (t,i) => `

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


/* =========================
   لوحة التحكم
========================= */

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


    /* الفرق في نشر المحتوى */

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


    /* الفرق في إضافة عضو */

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
        photo_url,
        teams (
          name
        )
      `)
      .order(
        "id",
        {
          ascending:
            false
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
                        alt=""
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
        )
        .join("") ||

      "لا يوجد أعضاء";


    /* النقاط */

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


/* =========================
   إضافة عضو من الإدارة
========================= */

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


    let unique =
      false;


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


    if (error)
      throw error;


    $("newMemberName")
      .value = "";


    $("newMemberTeam")
      .value = "";


    $("newMemberPhoto")
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


/* =========================
   تغيير صورة عضو
========================= */

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
        input.files[0];


      if (!file)
        return;


      try {

        /* الحصول على الصورة القديمة */

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


        if (oldError)
          throw oldError;


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


        if (error)
          throw error;


        /* حذف الصورة القديمة */

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

          showMember();
        }


        alert(
          "تم تحديث صورة العضو ✅"
        );


      } catch (error) {

        console.error(error);

        alert(
          "لم يتم رفع الصورة: " +
          error.message
        );
      }
    };


  input.click();
}


/* =========================
   QR الإدارة
========================= */

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
    () =>
      box.remove();
}


/* =========================
   حذف عضو
========================= */

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
      error
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


    if (error)
      throw error;


    const {
      error: deleteError
    } = await sb
      .from("members")
      .delete()
      .eq(
        "id",
        id
      );


    if (deleteError)
      throw deleteError;


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


/* =========================
   نقاط الفرق
========================= */

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


    if (getError)
      throw getError;


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


    if (error)
      throw error;


    await refreshAdmin();


    if (member)
      await refreshMember();


  } catch (error) {

    console.error(error);

    alert(
      "لم يتم تعديل النقاط: " +
      error.message
    );
  }
}


/* =========================
   نشر منشور
========================= */

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


  const file =
    $("postImage")
      .files[0];


  if (
    !title &&
    !body &&
    !file
  ) {

    alert(
      "أضف محتوى أو صورة."
    );

    return;
  }


  try {

    let teamId =
      null;


    if (
      selectedTeam !==
      "all"
    ) {

      teamId =
        Number(
          selectedTeam
        );
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
          title || "منشور",

        body:
          body || "",

        team_id:
          teamId,

        image_url:
          imageUrl

      });


    if (error)
      throw error;


    $("postTitle")
      .value = "";


    $("postBody")
      .value = "";


    $("postImage")
      .value = "";


    await refreshAdmin();


    if (member)
      await refreshMember();


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


/* =========================
   إدارة المنشورات
========================= */

async function refreshAdminPosts() {

  const box =
    $("adminPosts");


  if (!box)
    return;


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
        created_at,
        team_id,
        teams (
          name
        )
      `)
      .order(
        "created_at",
        {
          ascending:
            false
        }
      );


    if (error)
      throw error;


    if (
      !posts ||
      posts.length === 0
    ) {

      box.innerHTML =
        "لا توجد منشورات.";

      return;
    }


    box.innerHTML =

      posts
        .map(
          post => `

            <div class="admin-post">

              <small>
                ${new Date(
                  post.created_at
                ).toLocaleString(
                  "ar-EG"
                )}
              </small>


              <h4>
                ${esc(
                  post.title
                )}
              </h4>


              ${
                post.teams?.name
                  ? `

                    <small>
                      الفريق:
                      ${esc(
                        post.teams.name
                      )}
                    </small>

                  `
                  : `

                    <small>
                      📢 كل الفرق
                    </small>

                  `
              }


              ${
                post.image_url
                  ? `

                    <img
                      class="admin-post-image"
                      src="${esc(
                        post.image_url
                      )}"
                      alt=""
                    >

                  `
                  : ""
              }


              <button
                class="delete-btn"
                onclick="deletePost(${post.id})"
              >
                🗑️ حذف المنشور
              </button>

            </div>

          `
        )
        .join("");


  } catch (error) {

    console.error(
      "Admin posts:",
      error
    );

    box.innerHTML =
      "حدث خطأ في تحميل المنشورات.";
  }
}


/* =========================
   حذف منشور وصورته
========================= */

async function deletePost(id) {

  if (
    !confirm(
      "هل أنت متأكد من حذف هذا المنشور؟ سيتم حذف صورته أيضًا."
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


    if (getError)
      throw getError;


    const {
      error
    } = await sb
      .from("posts")
      .delete()
      .eq(
        "id",
        id
      );


    if (error)
      throw error;


    if (post?.image_url) {

      await deleteStorageImage(
        post.image_url
      );
    }


    await refreshAdminPosts();


    if (member)
      await refreshMember();


    alert(
      "تم حذف المنشور والصورة ✅"
    );


  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف المنشور: " +
      error.message
    );
  }
}


/* =========================
   خروج العضو
========================= */

async function logout() {

  if (scanner) {

    try {

      await scanner.stop();

    } catch {}
  }


  localStorage.removeItem(
    "memberId"
  );


  member =
    null;


  $("accessCode")
    .value = "";


  $("msg")
    .textContent = "";


  $("scanMsg")
    .textContent = "";


  $("qrScanner")
    .classList
    .add("hidden");


  showJoin();
}


/* =========================
   خروج الإدارة
========================= */

function adminLogout() {

  admin =
    false;


  $("admin")
    .classList
    .add("hidden");


  $("join")
    .classList
    .remove("hidden");
}


/* =========================
   فتح الإدارة
========================= */

function openAdmin() {

  $("loginModal")
    .classList
    .remove("hidden");


  $("adminPass")
    .value = "";


  $("loginMsg")
    .textContent = "";
}


/* =========================
   إغلاق الإدارة
========================= */

function closeAdmin() {

  $("loginModal")
    .classList
    .add("hidden");
}


/* =========================
   دخول الإدارة
========================= */

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


  admin =
    true;


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


/* =========================
   الأزرار
========================= */

if ($("codeLoginBtn")) {

  $("codeLoginBtn")
    .onclick =
    loginWithCode;
}


if ($("scanQRBtn")) {

  $("scanQRBtn")
    .onclick =
    startQRScanner;
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


if ($("joinBtn")) {

  $("joinBtn")
    .onclick =
    registerMember;
}


/* =========================
   Enter
========================= */

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


/* =========================
   البداية
========================= */

showJoin();

renderTeams();


/* =========================
   استرجاع العضو
========================= */

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
