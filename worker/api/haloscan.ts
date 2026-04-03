import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

/**
 * Generic Haloscan API proxy.
 * POST /api/haloscan  body: { endpoint: "keywords/overview", params: { keyword: "...", ... } }
 * GET  /api/haloscan?keyword=...  (legacy — maps to keywords/match)
 */
export async function handleHaloscan(request: Request, env: Env): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];

  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: "Session invalide" }, 401);

  const apiKey = env.HALOSCAN_API_KEY;

  if (request.method === "POST") {
    const body = await request.json() as { endpoint: string; params: Record<string, any> };
    const { endpoint, params } = body;

    if (!endpoint) return jsonResponse({ error: "endpoint requis" }, 400);

    // Whitelist allowed endpoints
    const allowed = [
      "keywords/overview", "keywords/match", "keywords/similar", "keywords/questions",
      "keywords/related", "keywords/highlights", "keywords/synonyms", "keywords/find",
      "keywords/bulk", "keywords/serp/compare", "keywords/serp/availableDates",
      "domains/overview", "domains/positions", "domains/topPages",
      "domains/history", "domains/bulk", "domains/siteCompetitors",
      "domains/history/visibilityTrends",
      "user/credit",
    ];

    if (!allowed.includes(endpoint)) {
      return jsonResponse({ error: `Endpoint non autorisé: ${endpoint}` }, 403);
    }

    if (!apiKey) {
      return getDemoData(endpoint, params);
    }

    try {
      const res = await fetch(`https://api.haloscan.com/api/${endpoint}`, {
        method: "POST",
        headers: {
          "haloscan-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        return jsonResponse({ error: `Haloscan: ${res.status}`, details: data }, res.status);
      }
      return jsonResponse(data);
    } catch (e: any) {
      return jsonResponse({ error: "Erreur Haloscan", details: e.message }, 500);
    }
  }

  // Legacy GET support
  if (request.method === "GET") {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword");
    if (!keyword) return jsonResponse({ error: "Paramètre keyword requis" }, 400);

    if (!apiKey) {
      return getDemoData("keywords/match", { keyword });
    }

    try {
      const res = await fetch(`https://api.haloscan.com/api/keywords/match`, {
        method: "POST",
        headers: {
          "haloscan-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword, lineCount: 50 }),
      });
      const data = await res.json();
      return jsonResponse(data);
    } catch {
      return jsonResponse({ error: "Erreur Haloscan" }, 500);
    }
  }

  return jsonResponse({ error: "Méthode non autorisée" }, 405);
}

function getDemoData(endpoint: string, params: Record<string, any>): Response {
  const kw = params.keyword || params.input || "exemple";

  if (endpoint === "keywords/overview") {
    return jsonResponse({
      data: {
        metrics: { volume: 14800, cpc: 0.52, competition: 0.35 },
        volume_history: [
          { date: "2025-06", volume: 12100 }, { date: "2025-07", volume: 13200 },
          { date: "2025-08", volume: 14800 }, { date: "2025-09", volume: 13500 },
          { date: "2025-10", volume: 15200 }, { date: "2025-11", volume: 14100 },
          { date: "2025-12", volume: 16500 }, { date: "2026-01", volume: 14800 },
          { date: "2026-02", volume: 15900 }, { date: "2026-03", volume: 14200 },
        ],
        serp: Array.from({ length: 10 }, (_, i) => ({
          position: i + 1, url: `https://example${i + 1}.com/${kw}`, title: `${kw} - Résultat ${i + 1}`,
          domain: `example${i + 1}.com`,
        })),
        keyword_match: [
          { keyword: `${kw} gratuit`, volume: 5400, cpc: 0.3, competition: 0.2 },
          { keyword: `${kw} en ligne`, volume: 3200, cpc: 0.45, competition: 0.35 },
          { keyword: `meilleur ${kw}`, volume: 2800, cpc: 0.6, competition: 0.4 },
        ],
        related_question: [
          { keyword: `qu'est-ce que ${kw}`, volume: 1200, cpc: 0.1, competition: 0.1 },
          { keyword: `comment utiliser ${kw}`, volume: 880, cpc: 0.15, competition: 0.12 },
          { keyword: `pourquoi ${kw}`, volume: 650, cpc: 0.08, competition: 0.08 },
        ],
        similar_serp: [
          { keyword: `${kw} alternative`, volume: 1900, cpc: 0.5, competition: 0.3, similarity: 0.85 },
          { keyword: `${kw} comparatif`, volume: 1400, cpc: 0.55, competition: 0.35, similarity: 0.78 },
        ],
      },
      meta: { total: 1, processing_ms: 42 },
    });
  }

  if (endpoint.startsWith("keywords/")) {
    const words = ["gratuit", "en ligne", "pas cher", "avis", "comparatif", "meilleur", "guide", "tuto", "2026", "facile", "rapide", "pro", "débutant", "astuce", "conseil"];
    return jsonResponse({
      data: words.slice(0, 15).map((w, i) => ({
        keyword: `${kw} ${w}`, volume: Math.floor(Math.random() * 10000) + 100,
        cpc: +(Math.random() * 2).toFixed(2), competition: +(Math.random()).toFixed(2),
        ...(endpoint.includes("similar") ? { similarity: +(0.5 + Math.random() * 0.5).toFixed(2) } : {}),
        ...(endpoint.includes("questions") ? { question_type: ["how", "what", "why"][i % 3] } : {}),
      })),
      meta: { total: 15, has_next: false, processing_ms: 38 },
    });
  }

  if (endpoint === "domains/overview") {
    return jsonResponse({
      data: {
        metrics: {
          unique_keywords: 12450, total_traffic: 45200, total_traffic_value: 23500,
          indexed_pages: 890, total_top_3: 45, total_top_10: 210, total_top_50: 1250, total_top_100: 3400,
        },
        best_keywords: Array.from({ length: 10 }, (_, i) => ({
          keyword: `mot clé ${i + 1}`, volume: Math.floor(Math.random() * 5000) + 500,
          position: Math.floor(Math.random() * 50) + 1, traffic: Math.floor(Math.random() * 1000),
          url: `https://${kw}/page-${i + 1}`,
        })),
        best_pages: Array.from({ length: 5 }, (_, i) => ({
          url: `https://${kw}/page-${i + 1}`, unique_keywords: Math.floor(Math.random() * 200) + 10,
          total_traffic: Math.floor(Math.random() * 5000) + 100,
        })),
        visibility_index_history: Array.from({ length: 12 }, (_, i) => ({
          date: `2025-${String(i + 1).padStart(2, "0")}`,
          index: +(Math.random() * 100).toFixed(1),
        })),
        positions_breakdown_history: Array.from({ length: 12 }, (_, i) => ({
          date: `2025-${String(i + 1).padStart(2, "0")}`,
          top_3: Math.floor(Math.random() * 50), top_10: Math.floor(Math.random() * 200),
          top_50: Math.floor(Math.random() * 1000), top_100: Math.floor(Math.random() * 3000),
        })),
      },
      meta: { total: 1, processing_ms: 55 },
    });
  }

  if (endpoint === "domains/positions") {
    return jsonResponse({
      data: Array.from({ length: 20 }, (_, i) => ({
        keyword: `mot clé domaine ${i + 1}`, volume: Math.floor(Math.random() * 8000) + 100,
        position: Math.floor(Math.random() * 100) + 1, traffic: Math.floor(Math.random() * 2000),
        url: `https://${kw}/page-${Math.floor(Math.random() * 10)}`,
        cpc: +(Math.random() * 2).toFixed(2), competition: +(Math.random()).toFixed(2),
      })),
      meta: { total: 20, has_next: false, processing_ms: 45 },
    });
  }

  return jsonResponse({ data: [], meta: { total: 0 } });
}
