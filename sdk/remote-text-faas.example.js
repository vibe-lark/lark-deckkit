const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
};

const DEFAULT_DECK_ID = "default";
const memoryStore = globalThis.__LARK_DECKKIT_TEXT_STORE__ ||= new Map();

module.exports = async function (request) {
  const method = (request.method || "GET").toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    if (method === "GET") return getTexts(request);
    if (method === "POST") return saveTexts(request);
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error?.message || error) }, 500);
  }
};

async function getTexts(request) {
  const url = new URL(request.url);
  const deckId = url.searchParams.get("id") || DEFAULT_DECK_ID;
  const record = memoryStore.get(deckId) || {
    deckId,
    texts: {
      "slide-01.hero-title": "云端标题",
      "slide-01.hero-subtitle": { text: "这段文案来自 FaaS JSON。" },
    },
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(record);
}

async function saveTexts(request) {
  const payload = await request.json();
  const deckId = payload.deckId || DEFAULT_DECK_ID;
  const current = memoryStore.get(deckId) || { deckId, texts: {} };
  const next = {
    deckId,
    texts: {
      ...current.texts,
      ...(payload.texts || {}),
    },
    changed: payload.changed || null,
    updatedAt: payload.updatedAt || new Date().toISOString(),
  };
  if (payload.changed?.id) {
    next.texts[payload.changed.id] = {
      text: payload.changed.text || "",
      html: payload.changed.html || "",
      slide: payload.changed.slide || null,
    };
  }
  memoryStore.set(deckId, next);
  return jsonResponse({ ok: true, deckId, updatedAt: next.updatedAt, changed: next.changed });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
