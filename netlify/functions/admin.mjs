const SUPABASE_URL = (process.env.SUPABASE_URL || "https://lzthytpezdadtobbampc.supabase.co").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_3Tgx9iGhPKp0U2ivkBDiyA_QOKqe8cp";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const LIST_ORDER = {
  applications: "order=created_at.desc",
  certificates: "order=sort_order.asc,id.desc",
  gallery_items: "order=sort_order.asc,id.desc",
  news_posts: "order=published_date.desc,id.desc",
  bot_users: "order=registered_at.desc",
};

const WRITE_TABLES = new Set(["applications", "certificates", "gallery_items", "news_posts"]);
const INSERT_TABLES = new Set(["certificates", "gallery_items", "news_posts"]);
const UPLOAD_FOLDERS = new Set(["certificates", "gallery", "news"]);

function reply(statusCode, obj) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(obj) };
}

async function verifyAdminToken(token) {
  if (!token) return null;
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) return null;
  const user = await resp.json().catch(() => null);
  if (!user || user?.app_metadata?.role !== "admin") return null;
  return user;
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return reply(200, { ok: true });
  if (event.httpMethod !== "POST") return reply(405, { error: "Method not allowed" });

  let body;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "{}";
    body = JSON.parse(raw);
  } catch (_) {
    return reply(400, { error: "Noto'g'ri so'rov formati" });
  }

  const action = String(body.action || "");

  // 1. Login (unauthenticated -> issues admin session)
  if (action === "login") {
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    if (!email || !password) return reply(400, { error: "Email va parolni kiriting." });

    const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.access_token) {
      return reply(401, { error: "Email yoki parol noto'g'ri! Qaytadan tekshiring." });
    }
    if (data.user?.app_metadata?.role !== "admin") {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${data.access_token}` },
      }).catch(() => {});
      return reply(403, { error: "Ushbu hisobda Administrator huquqi mavjud emas." });
    }

    return reply(200, {
      ok: true,
      access_token: data.access_token,
      user: { email: data.user.email },
    });
  }

  // All subsequent actions require verified admin Bearer token
  const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const adminUser = await verifyAdminToken(token);
  if (!adminUser) {
    return reply(401, { error: "Avtorizatsiya muddati tugagan. Qaytadan tizimga kiring." });
  }

  const sbHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (action === "session") {
    return reply(200, { ok: true, user: { email: adminUser.email } });
  }

  if (action === "logout") {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: sbHeaders,
    }).catch(() => {});
    return reply(200, { ok: true });
  }

  if (action === "password") {
    const password = String(body.password || "");
    if (password.length < 8) return reply(400, { error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak." });
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PUT",
      headers: sbHeaders,
      body: JSON.stringify({ password }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return reply(400, { error: err.msg || err.message || "Parolni yangilab bo'lmadi" });
    }
    return reply(200, { ok: true });
  }

  if (action === "list") {
    const resource = String(body.resource || "");
    if (!LIST_ORDER[resource]) return reply(400, { error: "Noto'g'ri jadval" });
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${resource}?select=*&${LIST_ORDER[resource]}`, {
      headers: sbHeaders,
    });
    if (!resp.ok) return reply(resp.status, { error: "Ma'lumotlarni yuklashda xatolik" });
    const data = await resp.json().catch(() => []);
    return reply(200, { ok: true, data });
  }

  if (action === "insert") {
    const resource = String(body.resource || "");
    if (!INSERT_TABLES.has(resource) || !body.record || typeof body.record !== "object") {
      return reply(400, { error: "Noto'g'ri ma'lumot" });
    }
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${resource}`, {
      method: "POST",
      headers: { ...sbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify(body.record),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return reply(resp.status, { error: err.message || "Qo'shishda xatolik" });
    }
    return reply(200, { ok: true });
  }

  if (action === "update") {
    const resource = String(body.resource || "");
    const id = Number(body.id);
    if (!WRITE_TABLES.has(resource) || !Number.isFinite(id) || !body.patch || typeof body.patch !== "object") {
      return reply(400, { error: "Noto'g'ri so'rov" });
    }
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${resource}?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...sbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify(body.patch),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return reply(resp.status, { error: err.message || "Yangilashda xatolik" });
    }
    return reply(200, { ok: true });
  }

  if (action === "delete") {
    const resource = String(body.resource || "");
    const id = Number(body.id);
    if (!WRITE_TABLES.has(resource) || !Number.isFinite(id)) {
      return reply(400, { error: "Noto'g'ri so'rov" });
    }
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${resource}?id=eq.${id}`, {
      method: "DELETE",
      headers: sbHeaders,
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return reply(resp.status, { error: err.message || "O'chirishda xatolik" });
    }
    const imgUrl = String(body.imageUrl || "");
    const marker = "/storage/v1/object/public/school-media/";
    if (imgUrl.includes(marker)) {
      const relPath = imgUrl.split(marker)[1];
      if (relPath) {
        await fetch(`${SUPABASE_URL}/storage/v1/object/school-media/${relPath}`, {
          method: "DELETE",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }
    return reply(200, { ok: true });
  }

  if (action === "upload") {
    const folder = String(body.folder || "");
    const fileName = String(body.fileName || "image.jpg");
    const contentType = String(body.contentType || "application/octet-stream");
    const base64Data = String(body.base64Data || "");
    if (!UPLOAD_FOLDERS.has(folder) || !base64Data) {
      return reply(400, { error: "Fayl ma'lumotlari to'liq emas" });
    }
    const ext = (fileName.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const safeBase = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "media";
    const filePath = `${folder}/${Date.now()}_${safeBase}.${ext}`;
    const binary = Buffer.from(base64Data, "base64");

    const upResp = await fetch(`${SUPABASE_URL}/storage/v1/object/school-media/${filePath}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType,
        "cache-control": "31536000",
        "x-upsert": "false",
      },
      body: binary,
    });
    if (!upResp.ok) {
      const err = await upResp.json().catch(() => ({}));
      return reply(upResp.status, { error: err.message || "Fayl yuklashda xatolik" });
    }
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/school-media/${filePath}`;
    return reply(200, { ok: true, publicUrl });
  }

  return reply(400, { error: "Noma'lum amal" });
};
