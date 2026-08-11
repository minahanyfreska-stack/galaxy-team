/* =====================================================
   INFINITY - GALAXY TEAMS
   APP.JS
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
   الفرق والكواكب
===================================================== */

const T = [
  {
    id: 1,
    key: "jupiter",
    ar: "المشتري",
    en: "Jupiter",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg"
  },

  {
    id: 2,
    key: "saturn",
    ar: "زحل",
    en: "Saturn",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg"
  },

  {
    id: 3,
    key: "neptune",
    ar: "نبتون",
    en: "Neptune",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg"
  },

  {
    id: 4,
    key: "uranus",
    ar: "أورانوس",
    en: "Uranus",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg"
  }
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
   حماية النص
===================================================== */

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


/* =====================================================
   البحث عن فريق
===================================================== */

function team(key) {
  return T.find(t => t.key === key);
}


/* =====================================================
   رسم الفرق على الصفحة
===================================================== */

function renderTeams() {

  const container = $("teams");

  if (!container) {
    console.error("Element #teams not found");
    return;
  }

  container.innerHTML = T.map(t => `
    
    <div
      class="team infinity-team"
      data-team="${t.id}"
      data-key="${t.key}"
      onclick="selectTeam('${t.key}')"
    >

      <div class="planet-glow"></div>

      <div class="planet-orbit"></div>

      <img
        src="${t.image}"
        alt="${esc(t.ar)}"
        loading="eager"
        onerror="this.style.display='none'"
      >

      <div class="team-info">

        <strong>
          ${esc(t.ar)}
        </strong>

        <span>
          ${esc(t.en)}
        </span>

      </div>

    </div>

  `).join("");

}


/* =====================================================
   اختيار فريق من الواجهة
===================================================== */

function selectTeam(key) {

  const selected = team(key);

  if (!selected) return;

  document
    .querySelectorAll(".team")
    .forEach(el => {
      el.classList.remove("sel");
    });

  const card = document.querySelector(
    `.team[data-key="${key}"]`
  );

  if (card) {
    card.classList.add("sel");
  }

}


/* =====================================================
   تحميل الفرق من Supabase
===================================================== */

async function loadTeams() {

  try {

    const {
      data,
      error
    } = await sb
      .from("teams")
      .select("id,name,score")
      .order("id", {
        ascending: true
      });

    if (error) {
      console.error(
        "Supabase teams error:",
        error
      );

      // نستخدم الفرق الأساسية الموجودة في الموقع
      fillTeamSelects(T);

      return T;
    }

    if (!data || !data.length) {

      console.warn(
        "Supabase returned no teams"
      );

      fillTeamSelects(T);

      return T;
    }

    console.log(
      "Teams loaded:",
      data
    );

    fillTeamSelects(data);

    return data;

  } catch (error) {

    console.error(
      "loadTeams error:",
      error
    );

    fillTeamSelects(T);

    return T;
  }

}


/* =====================================================
   ملء قوائم اختيار الفريق
===================================================== */

function fillTeamSelects(databaseTeams) {

  const memberSelect =
    $("newMemberTeam");

  const postSelect =
    $("postTeam");


  /*
     اختيار فريق العضو
  */

  if (memberSelect) {

    memberSelect.innerHTML =
      `<option value="">
        اختر الفريق
      </option>` +
      databaseTeams.map(t => {

        const id =
          t.id;

        const name =
          t.name ||
          T.find(
            x =>
              Number(x.id) ===
              Number(id)
          )?.ar ||
          "فريق";

        return `
          <option value="${id}">
            ${esc(name)}
          </option>
        `;

      }).join("");

  }


  /*
     اختيار فريق المنشور
  */

  if (postSelect) {

    postSelect.innerHTML =
      `<option value="all">
        كل الفرق
      </option>` +
      databaseTeams.map(t => {

        const id =
          t.id;

        const name =
          t.name ||
          T.find(
            x =>
              Number(x.id) ===
              Number(id)
          )?.ar ||
          "فريق";

        return `
          <option value="${id}">
            ${esc(name)}
          </option>
        `;

      }).join("");

  }

}


/* =====================================================
   صفحة الدخول
===================================================== */

function showJoin() {

  $("member")?.classList.add(
    "hidden"
  );

  $("admin")?.classList.add(
    "hidden"
  );

  $("join")?.classList.remove(
    "hidden"
  );

}


/* =====================================================
   توليد كود العضو
===================================================== */

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


/* =====================================================
   رفع الصور
===================================================== */

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
        cacheControl:
          "3600",
        upsert:
          false
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
   دخول العضو بالكود
===================================================== */

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
      .single();


    if (
      error ||
      !data
    ) {

      $("msg").textContent =
        "كود الدخول غير صحيح.";

      return;
    }


    const databaseTeam =
      data.teams;


    const found =
      T.find(
        t =>
          Number(t.id) ===
          Number(
            databaseTeam?.id ||
            data.team_id
          )
      );


    if (!found) {

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
        found.key,

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


/* =====================================================
   عرض العضو
===================================================== */

async function showMember() {

  if (!member) {
    return;
  }

  $("join")?.classList.add(
    "hidden"
  );

  $("admin")?.classList.add(
    "hidden"
  );

  $("member")?.classList.remove(
    "hidden"
  );


  const t =
    team(member.team);


  if (t) {

    $("memberName").textContent =
      member.name;

    $("memberTeam").textContent =
      `فريق ${t.ar} • ${t.en}`;


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
   تحديث بيانات العضو
===================================================== */

async function refreshMember() {

  if (!member) return;

  try {

    const {
      data: teams
    } = await sb
      .from("teams")
      .select("*")
      .order("id");


    const current =
      team(member.team);


    const dbTeam =
      (teams || []).find(
        t =>
          Number(t.id) ===
          Number(current?.id)
      );


    const {
      data: posts
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


    const visible =
      (posts || []).filter(
        post => {

          if (
            post.team_id ===
            null
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
        visible.length
          ? visible
              .map(
                renderMemberPost
              )
              .join("")
          : "<p>لا يوجد محتوى حاليًا.</p>";

    }


    if ($("ranking")) {

      $("ranking").innerHTML =
        (teams || [])
          .sort(
            (a,b) =>
              Number(
                b.score || 0
              ) -
              Number(
                a.score || 0
              )
          )
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

    }

  } catch (error) {

    console.error(
      "Member refresh:",
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
        ).toLocaleString(
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
              alt=""
            >
          `
          : ""
      }

    </article>

  `;

}


/* =====================================================
   لوحة الإدارة
===================================================== */

async function refreshAdmin() {

  try {

    /*
       مهم:
       تحميل الفرق أولًا
    */

    const teams =
      await loadTeams();


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
          ascending:
            false
        }
      );


    if (
      membersError
    ) {
      throw membersError;
    }


    if ($("members")) {

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
                      كود:
                      ${esc(
                        m.access_code
                      )}
                    </small>

                  </div>

                </div>

                <div class="admin-member-buttons">

                  <button
                    onclick="deleteMember(${m.id})"
                  >
                    حذف
                  </button>

                </div>

              </div>

            `
          )
          .join("") ||
        "لا يوجد أعضاء.";

    }


    /*
       النقاط
    */

    if ($("scores")) {

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

    }


    await refreshAdminPosts();


  } catch (error) {

    console.error(
      "Admin error:",
      error
    );

    alert(
      "حدث خطأ في لوحة التحكم: " +
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
      ?.value
      .trim();

  const teamId =
    $("newMemberTeam")
      ?.value;


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
        data
      } = await sb
        .from("members")
        .select("id")
        .eq(
          "access_code",
          accessCode
        )
        .limit(1);


      if (
        !data ||
        !data.length
      ) {

        unique = true;

      } else {

        accessCode =
          generateCode();

      }

    }


    let photoUrl =
      null;


    const file =
      $("newMemberPhoto")
        ?.files?.[0];


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


    $("newMemberName").value =
      "";

    $("newMemberTeam").value =
      "";


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

      createAdminQR(
        data.access_code
      );

    }


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
   نشر منشور
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

    let teamId =
      null;


    if (
      selectedTeam &&
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


    $("postTitle").value =
      "";

    $("postBody").value =
      "";


    if ($("postImage")) {
      $("postImage").value =
        "";
    }


    alert(
      "تم النشر بنجاح 🚀"
    );


    await refreshAdmin();


  } catch (error) {

    console.error(error);

    alert(
      "لم يتم النشر: " +
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
   تغيير نقاط الفريق
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
      error:
        updateError
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


  } catch (error) {

    console.error(error);

    alert(
      "لم يتم تعديل النقاط: " +
      error.message
    );

  }

}


/* =====================================================
   منشورات الإدارة
===================================================== */

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
        *,
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


    if (error) {
      throw error;
    }


    box.innerHTML =
      data?.length
        ? data.map(
            post => `

              <div class="admin-post">

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
                      >
                    `
                    : ""
                }

                <br>

                <button
                  onclick="deletePost(${post.id})"
                >
                  حذف المنشور
                </button>

              </div>

            `
          ).join("")
        : "لا يوجد منشورات.";

  } catch (error) {

    console.error(error);

    box.innerHTML =
      "تعذر تحميل المنشورات.";

  }

}


/* =====================================================
   حذف منشور
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


    await refreshAdmin();


  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف المنشور: " +
      error.message
    );

  }

}


/* =====================================================
   QR
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
   دخول الإدارة
===================================================== */

function openAdmin() {

  $("loginModal")
    ?.classList
    .remove("hidden");

}


function closeAdmin() {

  $("loginModal")
    ?.classList
    .add("hidden");

}


async function loginAdmin() {

  const password =
    $("adminPass")
      ?.value;


  if (
    password !==
    ADMIN_PASSWORD
  ) {

    $("loginMsg").textContent =
      "كلمة المرور غير صحيحة.";

    return;
  }


  admin =
    true;


  $("loginModal")
    ?.classList
    .add("hidden");


  $("join")
    ?.classList
    .add("hidden");

  $("member")
    ?.classList
    .add("hidden");

  $("admin")
    ?.classList
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

  member =
    null;

  showJoin();

}


function adminLogout() {

  admin =
    false;

  showJoin();

}


/* =====================================================
   تشغيل الأزرار
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /*
       أول شيء:
       رسم الكواكب
    */

    renderTeams();


    /*
       تحميل الفرق
    */

    await loadTeams();


    /*
       إظهار صفحة الدخول
    */

    showJoin();


    /*
       الأزرار
    */

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


    /*
       استرجاع العضو
    */

    const saved =
      localStorage.getItem(
        "memberId"
      );


    if (saved) {

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
          "id",
          saved
        )
        .single();


      if (
        !error &&
        data
      ) {

        const found =
          T.find(
            t =>
              Number(t.id) ===
              Number(
                data.team_id
              )
          );


        if (found) {

          member = {

            id:
              data.id,

            name:
              data.name,

            team:
              found.key,

            accessCode:
              data.access_code,

            photoUrl:
              data.photo_url ||
              ""

          };


          await showMember();

        }

      }

    }

  }
);
