/* =========================================================
   INFINITY - APP.JS
   نظام الفرق والكواكب + Supabase + لوحة الإدارة
========================================================= */
/* =========================================================
   SUPABASE
========================================================= */
const SUPABASE_URL =
  "https://jbdjhdbbmfowdwmejdtw.supabase.co";
const SUPABASE_KEY =
  "sb_publishable_zF7z4wuwluqfPDfAH0-7qg8_8-tjtrSr";
const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
/* =========================================================
   الفرق والكواكب
========================================================= */
const PLANETS = {
  "المشتري": {
    en: "Jupiter",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg"
  },
  "زحل": {
    en: "Saturn",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg"
  },
  "نبتون": {
    en: "Neptune",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg"
  },
  "أورانوس": {
    en: "Uranus",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg"
  }
};
/* =========================================================
   متغيرات عامة
========================================================= */
let member = null;
let admin = false;
let scanner = null;
const ADMIN_PASSWORD = "1234";
/* =========================================================
   اختصار العناصر
========================================================= */
function $(id) {
  return document.getElementById(id);
}
/* =========================================================
   حماية النص
========================================================= */
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
/* =========================================================
   بيانات الكوكب
========================================================= */
function getPlanet(teamName) {
  return PLANETS[teamName] || {
    en: "Planet",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg"
  };
}
/* =========================================================
   تحميل الفرق من Supabase
========================================================= */
async function loadTeams() {
  try {
    const {
      data,
      error
    } = await sb
      .from("teams")
      .select("*")
      .order("id", {
        ascending: true
      });
    if (error) {
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error(
      "Teams loading error:",
      error
    );
    return [];
  }
}
/* =========================================================
   عرض الكواكب في الصفحة الرئيسية
========================================================= */
async function renderTeams() {
  const box = $("teams");
  if (!box) {
    return;
  }
  box.innerHTML = `
    <div class="team-loading">
      جاري استكشاف المجرة...
    </div>
  `;
  const teams = await loadTeams();
  if (!teams.length) {
    box.innerHTML = `
      <div class="team-loading">
        لا توجد فرق حاليًا.
      </div>
    `;
    return;
  }
  box.innerHTML = teams.map(team => {
    const planet =
      getPlanet(team.name);
    return `
      <div
        class="team"
        data-team-id="${team.id}"
      >
        <div class="planet-glow"></div>
        <img
          src="${esc(planet.image)}"
          alt="${esc(team.name)}"
          loading="lazy"
        >
        <div class="team-info">
          <strong>
            ${esc(team.name)}
          </strong>
          <span>
            ${esc(planet.en)}
          </span>
          <small>
            ${Number(team.score || 0)} نقطة
          </small>
        </div>
      </div>
    `;
  }).join("");
}
/* =========================================================
   تعبئة اختيار الفرق في لوحة الإدارة
========================================================= */
async function fillTeamSelects() {
  const teams = await loadTeams();
  /* -------------------------
     اختيار فريق العضو
  ------------------------- */
  const memberSelect =
    $("newMemberTeam");
  if (memberSelect) {
    if (!teams.length) {
      memberSelect.innerHTML = `
        <option value="">
          لا توجد فرق
        </option>
      `;
    } else {
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
    }
  }
  /* -------------------------
     اختيار فريق المنشور
  ------------------------- */
  const postSelect =
    $("postTeam");
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
   إنشاء كود العضو
========================================================= */
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
/* =========================================================
   رفع صورة
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
   حذف صورة
========================================================= */
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
      "Storage delete:",
      error
    );
  }
}
/* =========================================================
   صفحة الدخول
========================================================= */
function showJoin() {
  $("join")?.classList.remove("hidden");
  $("member")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
}
/* =========================================================
   تسجيل الدخول بالكود
========================================================= */
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
  $("msg").textContent =
    "جاري الدخول إلى المجرة...";
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
      team:
        data.teams?.name || "",
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
   عرض العضو
========================================================= */
async function showMember() {
  if (!member) {
    return;
  }
  $("join")?.classList.add("hidden");
  $("admin")?.classList.add("hidden");
  $("member")?.classList.remove("hidden");
  const planet =
    getPlanet(member.team);
  if ($("memberName")) {
    $("memberName").textContent =
      member.name;
  }
  if ($("memberTeam")) {
    $("memberTeam").textContent =
      `فريق ${member.team} • ${planet.en}`;
  }
  const photo =
    $("memberPhoto");
  if (photo) {
    photo.src =
      member.photoUrl ||
      planet.image;
  }
  await refreshMember();
}
/* =========================================================
   تحديث صفحة العضو
========================================================= */
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
      .select("*")
      .order("id");
    if (teamsError) {
      throw teamsError;
    }
    const currentTeam =
      (teams || []).find(
        t =>
          Number(t.id) ===
          Number(member.teamId)
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
      (posts || []).filter(post => {
        if (
          post.team_id === null ||
          post.team_id === undefined
        ) {
          return true;
        }
        return (
          Number(post.team_id) ===
          Number(member.teamId)
        );
      });
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
    if ($("ranking")) {
      $("ranking").innerHTML =
        (teams || [])
          .sort(
            (a, b) =>
              Number(b.score || 0) -
              Number(a.score || 0)
          )
          .map(
            (team, index) => {
              const planet =
                getPlanet(team.name);
              return `
                <div class="rank">
                  <span>
                    #${index + 1}
                    ${esc(team.name)}
                  </span>
                  <b>
                    ${Number(team.score || 0)}
                    نقطة
                  </b>
                </div>
              `;
            }
          )
          .join("");
    }
  } catch (error) {
    console.error(
      "Member error:",
      error
    );
  }
}
/* =========================================================
   منشور العضو
========================================================= */
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
/* =========================================================
   تحميل الردود
========================================================= */
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
        ).join("");
    });
  } catch (error) {
    console.error(
      "Replies error:",
      error
    );
  }
}
/* =========================================================
   إرسال رد
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
/* =========================================================
   فتح لوحة الإدارة
========================================================= */
function openAdmin() {
  const modal =
    $("loginModal");
  if (!modal) {
    return;
  }
  modal.classList.remove(
    "hidden"
  );
  if ($("adminPass")) {
    $("adminPass").value = "";
  }
  if ($("loginMsg")) {
    $("loginMsg").textContent = "";
  }
}
/* =========================================================
   إغلاق لوحة الإدارة
========================================================= */
function closeAdmin() {
  $("loginModal")
    ?.classList
    .add("hidden");
}
/* =========================================================
   دخول الإدارة
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
/* =========================================================
   لوحة الإدارة
========================================================= */
async function refreshAdmin() {
  try {
    /* أهم خطوة:
       تحميل الفرق قبل كل شيء */
    await fillTeamSelects();
    /* =========================
       الأعضاء
    ========================= */
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
          .map(
            member => {
              const planet =
                getPlanet(
                  member.teams?.name
                );
              return `
                <div class="member">
                  <div class="admin-member-left">
                    ${
                      member.photo_url
                        ? `
                          <img
                            class="admin-member-photo"
                            src="${esc(
                              member.photo_url
                            )}"
                          >
                        `
                        : `
                          <img
                            class="admin-member-photo"
                            src="${esc(
                              planet.image
                            )}"
                          >
                        `
                    }
                    <div>
                      <b>
                        ${esc(
                          member.name
                        )}
                      </b>
                      <br>
                      <small>
                        فريق:
                        ${esc(
                          member.teams?.name ||
                          "بدون فريق"
                        )}
                      </small>
                      <br>
                      <small>
                        🔐
                        ${esc(
                          member.access_code ||
                          ""
                        )}
                      </small>
                    </div>
                  </div>
                  <div class="admin-member-buttons">
                    <button
                      onclick="showMemberQR('${esc(
                        member.access_code || ""
                      )}')"
                    >
                      QR
                    </button>
                    <button
                      onclick="changeMemberPhoto(${member.id})"
                    >
                      صورة
                    </button>
                    <button
                      class="delete-btn"
                      onclick="deleteMember(${member.id})"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              `;
            }
          )
          .join("") ||
        "لا يوجد أعضاء";
    }
    /* =========================
       النقاط
    ========================= */
    const teams =
      await loadTeams();
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
      "Admin error:",
      error
    );
    alert(
      "خطأ في لوحة التحكم: " +
      error.message
    );
  }
}
/* =========================================================
   إضافة عضو
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
    let unique = false;
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
        data.length === 0
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
            ${esc(
              data.access_code
            )}
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
/* =========================================================
   نشر منشور
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
      "تم نشر المنشور بنجاح 🚀"
    );
  } catch (error) {
    console.error(error);
    alert(
      "لم يتم النشر: " +
      error.message
    );
  }
}
/* =========================================================
   منشورات الإدارة
========================================================= */
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
                post.teams?.name ||
                "كل الفرق"
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
/* =========================================================
   حذف عضو
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
   تغيير صورة العضو
========================================================= */
async function changeMemberPhoto(id) {
  const input =
    document.createElement(
      "input"
    );
  input.type = "file";
  input.accept = "image/*";
  input.onchange =
    async () => {
      const file =
        input.files?.[0];
      if (!file) {
        return;
      }
      try {
        const {
          data: oldMember,
          error
        } = await sb
          .from("members")
          .select("photo_url")
          .eq(
            "id",
            id
          )
          .single();
        if (error) {
          throw error;
        }
        const photoUrl =
          await uploadImage(
            file,
            "members"
          );
        const {
          error: updateError
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
        if (updateError) {
          throw updateError;
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
        alert(
          "تم تحديث الصورة ✅"
        );
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
   النقاط
========================================================= */
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
/* =========================================================
   حذف منشور
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
    if (post?.image_url) {
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
/* =========================================================
   QR
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
   عرض QR للعضو
========================================================= */
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
  box.style.position = "fixed";
  box.style.inset = "0";
  box.style.background =
    "rgba(0,0,0,.9)";
  box.style.display = "grid";
  box.style.placeItems = "center";
  box.style.zIndex = "9999";
  box.innerHTML = `
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
/* =========================================================
   QR Scanner
========================================================= */
async function startQRScanner() {
  const box =
    $("qrScanner");
  if (!box) {
    return;
  }
  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {
    $("scanMsg").textContent =
      "ماسح QR غير متاح.";
    return;
  }
  box.classList.remove(
    "hidden"
  );
  $("scanMsg").textContent =
    "وجّه الكاميرا إلى QR Code.";
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
/* =========================================================
   خروج العضو
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
   خروج الإدارة
========================================================= */
function adminLogout() {
  admin = false;
  showJoin();
  renderTeams();
}
/* =========================================================
   ربط الأزرار
========================================================= */
function setupEvents() {
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
      event => {
        if (
          event.key ===
          "Enter"
        ) {
          loginWithCode();
        }
      }
    );
  $("adminPass")
    ?.addEventListener(
      "keydown",
      event => {
        if (
          event.key ===
          "Enter"
        ) {
          loginAdmin();
        }
      }
    );
}
/* =========================================================
   استرجاع العضو
========================================================= */
async function restoreMember() {
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
      team:
        data.teams?.name || "",
      accessCode:
        data.access_code,
      photoUrl:
        data.photo_url || ""
    };
    await showMember();
  } catch (error) {
    console.error(
      "Restore member:",
      error
    );
  }
}
/* =========================================================
   البداية
========================================================= */
async function init() {
  showJoin();
  setupEvents();
  /* عرض الكواكب */
  await renderTeams();
  /* استرجاع العضو */
  await restoreMember();
}
/* =========================================================
   تشغيل الموقع بعد تحميل HTML
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
