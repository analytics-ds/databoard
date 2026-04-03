import type { Env } from "../index";
import { verifyJWT, parseCookies, jsonResponse } from "../utils";

export async function handleHaloscan(request: Request, env: Env): Promise<Response> {
  // Verify auth
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies["databoard_session"];

  if (!token) return jsonResponse({ error: "Non authentifié" }, 401);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return jsonResponse({ error: "Session invalide" }, 401);

  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword");
  if (!keyword) return jsonResponse({ error: "Paramètre keyword requis" }, 400);

  const apiKey = env.HALOSCAN_API_KEY;
  if (!apiKey) {
    // Return demo data if API key not configured
    return jsonResponse({
      results: [
        { keyword: `${keyword} recette`, volume: 12100, cpc: 0.45, competition: 0.3 },
        { keyword: `${keyword} facile`, volume: 8100, cpc: 0.35, competition: 0.2 },
        { keyword: `${keyword} rapide`, volume: 6600, cpc: 0.40, competition: 0.25 },
        { keyword: `meilleur ${keyword}`, volume: 4400, cpc: 0.55, competition: 0.4 },
        { keyword: `${keyword} maison`, volume: 3600, cpc: 0.30, competition: 0.15 },
        { keyword: `${keyword} pas cher`, volume: 2900, cpc: 0.60, competition: 0.5 },
        { keyword: `${keyword} avis`, volume: 1900, cpc: 0.25, competition: 0.2 },
      ],
    });
  }

  try {
    const res = await fetch(
      `https://api.haloscan.com/v1/keyword-suggestions?keyword=${encodeURIComponent(keyword)}&country=FR&language=fr`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      return jsonResponse({ error: `Haloscan erreur: ${res.status}` }, res.status);
    }

    const data = await res.json();
    return jsonResponse(data);
  } catch {
    return jsonResponse({ error: "Erreur Haloscan" }, 500);
  }
}
