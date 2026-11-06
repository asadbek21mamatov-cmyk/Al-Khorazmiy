const SUPABASE_URL = (process.env.SUPABASE_URL || "https://lzthytpezdadtobbampc.supabase.co").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_3Tgx9iGhPKp0U2ivkBDiyA_QOKqe8cp";

async function queryTable(pathAndQuery) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: SUPABASE_KEY },
  });
  if (!resp.ok) return [];
  const data = await resp.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const [certificates, gallery, news] = await Promise.all([
      queryTable("certificates?select=id,category,badge_text,title,image_url,sort_order&is_published=eq.true&order=sort_order.asc,id.desc"),
      queryTable("gallery_items?select=id,badge_text,icon_class,title,image_url,sort_order&is_published=eq.true&order=sort_order.asc,id.desc"),
      queryTable("news_posts?select=id,category,published_date,title,summary,image_url&is_published=eq.true&order=published_date.desc,id.desc"),
    ]);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=10, stale-while-revalidate=60",
      },
      body: JSON.stringify({ certificates, gallery, news }),
    };
  } catch (_) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ certificates: [], gallery: [], news: [] }),
    };
  }
};
