const SUPABASE_URL = (process.env.SUPABASE_URL || "https://lzthytpezdadtobbampc.supabase.co").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_3Tgx9iGhPKp0U2ivkBDiyA_QOKqe8cp";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ ok: true }) };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ ok: false, error: "Method not allowed" }) };
  }

  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "{}";
    const data = JSON.parse(rawBody);

    const parent = String(data.parent || "").trim();
    const child = String(data.child || "").trim();
    const phone = String(data.phone || "").trim();
    const grade = String(data.grade || "").trim();
    const time = String(data.time || "").trim();

    if (!parent || !child || !phone || !grade) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ ok: false, error: "Barcha maydonlar to'ldirilishi shart" }),
      };
    }

    const upstream = await fetch(`${SUPABASE_URL}/functions/v1/submit-application`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify({ parent, child, phone, grade, time }),
    });

    const result = await upstream.json().catch(() => ({ ok: upstream.ok }));
    return {
      statusCode: upstream.status,
      headers: JSON_HEADERS,
      body: JSON.stringify(result),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "Server xatoligi yuz berdi" }),
    };
  }
};
