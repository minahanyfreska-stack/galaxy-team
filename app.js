const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_zF7z4wuwluqfPDfAH0-7qg8-tjtrSr";

const sb = window.supabase.createClient(
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

const ADMIN_PASSWORD = "1234";


/* =========================
   اختصار
========================= */

const $ = id =>
  document.getElementById(id);


/* =========================
   الفريق
========================= */

function team(id) {

  return T.find(
    x => x[0] === id
  );
}


/* =========================
   حماية النص
========================= */

function esc(value) {

  return String(value ?? "")
    .replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c]));

}


/* =========================
   كود الدخول
========================= */

function generateCode() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "INF-";

  for (let i = 0; i < 6; i++) {

    code += chars[
      Math.floor(
        Math.random() * chars.length
      )
    ];

  }

  return code;
}


/* =========================
   رفع صورة
========================= */

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
      .substring(2)}.${extension}`;

  const path =
    `${folder}/${fileName}`;

  const { error } =
    await sb
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

  const { data } =
    sb
      .storage
      .from("site-images")
      .getPublicUrl(path);

  return data.publicUrl;
}


/* =========================
   استخراج مسار الصورة
   من رابط Supabase
========================= */

function getStoragePath(url) {

  if (!url) return null;

  try {

    const marker =
      "/storage/v1/object/public/site-images/";

    const index =
      url.indexOf(marker);

    if (index === -1)
      return null;

    return decodeURIComponent(
      url.substring(
        index + marker.length
      )
    );

  } catch {

    return null;

  }

}


/* =========================
   حذف صورة من Storage
========================= */

async function deleteStorageImage(url) {

  const path =
    getStoragePath(url);

  if (!path)
    return;

  const { error } =
    await sb
      .storage
      .from("site-images")
      .remove([path]);

  if (error) {

    console.error(
      "Storage delete error:",
      error
    );

  }

}


/* =========================
   صفحة الدخول
========================= */

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


/* =========================
   الدخول بالكود
========================= */

async function loginWithCode() {

  const code =
    $("accessCode")
      ?.value
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

      id: data.id,

      name: data.name,

      team: foundTeam[0],

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

    alert(
      "مكتبة الكاميرا غير موجودة."
    );

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
        fps: 10,

        qrbox: {
          width: 250,
          height: 250
        }

      },

      async decodedText => {

        $("accessCode").value =
          decodedText.trim();

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

        loginWithCode();

      },

      () => {}

    );

  } catch (error) {

    console.error(error);

    if ($("scanMsg")) {

      $("scanMsg").textContent =
        "تعذر تشغيل الكاميرا. تأكد من السماح باستخدام الكاميرا.";

    }

  }

}


/* =========================
   صفحة العضو
========================= */

async function showMember() {

  if (!member)
    return;

  $("join")
    ?.classList
    .add("hidden");

  $("admin")
    ?.classList
    .add("hidden");

  $("member")
    ?.classList
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

    if (photo) {

      photo.src =
        member.photoUrl ||
        t[3];

    }

  }

  await refreshMember();

}


/* =========================
   تحديث صفحة العضو
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
          )
            return true;

          return (
            dbTeam &&
            Number(post.team_id) ===
            Number(dbTeam.id)
          );

        });


    let html = "";

    for (
      const post of visiblePosts
    ) {

      const {
        data: replies
      } = await sb
        .from("post_replies")
        .select(`
          id,
          body,
          created_at,
          member_id,
          members (
            name,
            photo_url
          )
        `)
        .eq(
          "post_id",
          post.id
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


      html += `

        <article
          class="post"
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
                  alt="صورة المنشور"
                >
              `
              : ""
          }

          <div
            class="replies"
          >

            <h4>
              الردود
            </h4>

            ${
              (replies || [])
                .map(reply => `

                  <div
                    class="reply"
                  >

                    <div>

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

                    </div>

                    <p>
                      ${esc(
                        reply.body
                      ).replace(
                        /\n/g,
                        "<br>"
                      )}
                    </p>

                  </div>

                `)
                .join("")
              ||
              `
                <p class="muted">
                  لا توجد ردود حتى الآن.
                </p>
              `
            }

            <div
              class="reply-box"
            >

              <textarea
                id="reply-${post.id}"
                placeholder="اكتب ردك على المنشور..."
              ></textarea>

              <button
                class="primary"
                onclick="sendReply(${post.id})"
              >
                إرسال الرد
              </button>

            </div>

          </div>

        </article>

      `;

    }


    $("posts").innerHTML =
      html ||
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
        .map(
          (t, i) => `

            <div
              class="rank"
            >

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
   إرسال رد
========================= */

async function sendReply(postId) {

  if (!member) {

    alert(
      "يجب تسجيل الدخول أولاً."
    );

    return;
  }

  const input =
    $(`reply-${postId}`);

  if (!input)
    return;

  const body =
    input.value.trim();

  if (!body) {

    alert(
      "اكتب الرسالة أولاً."
    );

    return;
  }

  try {

    const {
      error
    } = await sb
      .from("post_replies")
      .insert({

        post_id:
          postId,

        member_id:
          member.id,

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


/* =========================
   لوحة الإدارة
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


    if ($("postTeam")) {

      $("postTeam").innerHTML = `

        <option value="all">
          كل الفرق
        </option>

      ` +
      (teams || [])
        .map(t => `

          <option
            value="${t.id}"
          >
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

          <option
            value="${t.id}"
          >
            ${esc(t.name)}
          </option>

        `)
        .join("");

    }


    /* =====================
       الأعضاء
    ===================== */

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
        .map(m => `

          <div
            class="member"
          >

            <div
              class="admin-member-left"
            >

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

              ${
                m.photo_url
                  ? `
                    <button
                      onclick="deleteMemberPhoto(${m.id}, '${esc(
                        m.photo_url
                      )}')"
                    >
                      حذف الصورة
                    </button>
                  `
                  : ""
              }

              <button
                onclick="deleteMember(${m.id})"
              >
                حذف العضو
              </button>

            </div>

          </div>

        `)
        .join("") ||

      "لا يوجد أعضاء";


    /* =====================
       النقاط
    ===================== */

    $("scores").innerHTML =

      (teams || [])
        .map(t => `

          <div
            class="score"
          >

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


    /* =====================
       المنشورات
    ===================== */

    await loadAdminPosts();

  } catch (error) {

    console.error(error);

    alert(
      "خطأ في لوحة التحكم: " +
      error.message
    );

  }

}


/* =========================
   عرض منشورات الأدمن
========================= */

async function loadAdminPosts() {

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

    if (error)
      throw error;


    let html = "";


    for (
      const post of posts || []
    ) {

      const {
        data: replies
      } = await sb
        .from("post_replies")
        .select(`
          id,
          body,
          created_at,
          member_id,
          members (
            name
          )
        `)
        .eq(
          "post_id",
          post.id
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


      html += `

        <div
          class="admin-post"
        >

          <div>

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

            <p>
              الفريق:
              <b>
                ${
                  post.team_id === null
                    ? "كل الفرق"
                    : esc(
                        post.teams?.name ||
                        "غير معروف"
                      )
                }
              </b>
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

          </div>


          <div
            class="admin-post-actions"
          >

            <button
              onclick="deletePost(${post.id}, '${esc(
                post.image_url || ""
              )}')"
            >
              🗑 حذف المنشور
            </button>

          </div>


          <div
            class="admin-replies"
          >

            <h4>
              ردود الأعضاء
            </h4>

            ${
              (replies || [])
                .map(reply => `

                  <div
                    class="admin-reply"
                  >

                    <div>

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

                    </div>

                    <p>
                      ${esc(
                        reply.body
                      ).replace(
                        /\n/g,
                        "<br>"
                      )}
                    </p>

                    <button
                      onclick="deleteReply(${reply.id})"
                    >
                      حذف الرد
                    </button>

                  </div>

                `)
                .join("")
              ||
              `
                <p class="muted">
                  لا توجد ردود.
                </p>
              `
            }

          </div>

        </div>

      `;

    }


    box.innerHTML =
      html ||
      "<p>لا توجد منشورات.</p>";

  } catch (error) {

    console.error(error);

    box.innerHTML =
      "<p>تعذر تحميل المنشورات.</p>";

  }

}


/* =========================
   إضافة عضو
========================= */

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

        score: 0,

        photo_url:
          photoUrl

      })
      .select()
      .single();


    if (error)
      throw error;


    $("newMemberName").value = "";

    $("newMemberTeam").value = "";

    if ($("newMemberPhoto"))
      $("newMemberPhoto").value = "";


    $("newMemberResult").innerHTML = `

      <div
        class="login-result"
      >

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

        <div
          id="adminQR"
        ></div>

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
        input.files?.[0];

      if (!file)
        return;


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
   حذف صورة عضو
========================= */

async function deleteMemberPhoto(
  id,
  photoUrl
) {

  if (
    !confirm(
      "هل تريد حذف صورة العضو؟"
    )
  )
    return;


  try {

    const {
      error
    } = await sb
      .from("members")
      .update({
        photo_url: null
      })
      .eq(
        "id",
        id
      );

    if (error)
      throw error;


    if (photoUrl) {

      await deleteStorageImage(
        photoUrl
      );

    }


    if (
      member &&
      Number(member.id) ===
      Number(id)
    ) {

      member.photoUrl = "";

    }


    await refreshAdmin();

    alert(
      "تم حذف الصورة ✅"
    );

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف الصورة: " +
      error.message
    );

  }

}


/* =========================
   QR
========================= */

function createAdminQR(code) {

  const box =
    $("adminQR");

  if (
    !box ||
    typeof QRCode ===
    "undefined"
  )
    return;

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
    document.createElement(
      "div"
    );


  box.style.position =
    "fixed";

  box.style.inset =
    "0";

  box.style.background =
    "rgba(0,0,0,.85)";

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

      <div
        id="popupQR"
      ></div>

      <p>
        ${esc(code)}
      </p>

      <button
        id="closeQR"
      >
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
  ).onclick =
    () => box.remove();

}


/* =========================
   حذف عضو
========================= */

async function deleteMember(id) {

  if (
    !confirm(
      "هل أنت متأكد من حذف العضو؟"
    )
  )
    return;


  try {

    const {
      data,
      error
    } = await sb
      .from("members")
      .select("photo_url")
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

  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف العضو: " +
      error.message
    );

  }

}


/* =========================
   النقاط
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


  if (!title) {

    alert(
      "اكتب عنوان المنشور."
    );

    return;
  }


  if (!body) {

    alert(
      "اكتب تفاصيل المنشور."
    );

    return;
  }


  try {

    let teamId = null;


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


    if (error)
      throw error;


    $("postTitle").value = "";

    $("postBody").value = "";

    if ($("postImage"))
      $("postImage").value = "";


    await refreshAdmin();

    if (member)
      await refreshMember();


    alert(
      "تم نشر المنشور بنجاح ✅"
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
   حذف منشور + الصورة
========================= */

async function deletePost(
  postId,
  imageUrl
) {

  if (
    !confirm(
      "هل أنت متأكد من حذف المنشور؟ سيتم حذف الصورة أيضًا."
    )
  )
    return;


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
        postId
      )
      .single();

    if (getError)
      throw getError;


    const finalImageUrl =
      post?.image_url ||
      imageUrl ||
      null;


    const {
      error
    } = await sb
      .from("posts")
      .delete()
      .eq(
        "id",
        postId
      );

    if (error)
      throw error;


    if (finalImageUrl) {

      await deleteStorageImage(
        finalImageUrl
      );

    }


    await loadAdminPosts();

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
   حذف رد
========================= */

async function deleteReply(
  replyId
) {

  if (
    !confirm(
      "هل تريد حذف الرد؟"
    )
  )
    return;


  try {

    const {
      error
    } = await sb
      .from("post_replies")
      .delete()
      .eq(
        "id",
        replyId
      );

    if (error)
      throw error;


    await loadAdminPosts();

    if (member)
      await refreshMember();


  } catch (error) {

    console.error(error);

    alert(
      "لم يتم حذف الرد: " +
      error.message
    );

  }

}


/* =========================
   خروج العضو
========================= */

function logout() {

  localStorage.removeItem(
    "memberId"
  );

  member = null;

  if ($("accessCode"))
    $("accessCode").value = "";

  if ($("msg"))
    $("msg").textContent = "";

  if ($("scanMsg"))
    $("scanMsg").textContent = "";

  showJoin();

}


/* =========================
   خروج الإدارة
========================= */

function adminLogout() {

  admin = false;

  $("admin")
    ?.classList
    .add("hidden");

  $("join")
    ?.classList
    .remove("hidden");

}


/* =========================
   فتح الإدارة
========================= */

function openAdmin() {

  $("loginModal")
    ?.classList
    .remove("hidden");

  if ($("adminPass"))
    $("adminPass").value = "";

  if ($("loginMsg"))
    $("loginMsg").textContent = "";

}


/* =========================
   إغلاق الإدارة
========================= */

function closeAdmin() {

  $("loginModal")
    ?.classList
    .add("hidden");

}


/* =========================
   دخول الإدارة
========================= */

async function loginAdmin() {

  const password =
    $("adminPass")
      ?.value;


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


/* =========================
   الأزرار
========================= */

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


/* =========================
   البداية
========================= */

showJoin();


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

          teamId:
            data.team_id,

          accessCode:
            data.access_code,

          photoUrl:
            data.photo_url || ""

        };


        showMember();

      }
    );

}
