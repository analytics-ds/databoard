import { handleRegister } from "./auth/register";
import { handleLogin } from "./auth/login";
import { handleLogout } from "./auth/logout";
import { handleMe } from "./auth/me";

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  TURNSTILE_SECRET_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // API routes
    if (path === "/api/auth/register" && request.method === "POST") {
      return handleRegister(request, env);
    }
    if (path === "/api/auth/login" && request.method === "POST") {
      return handleLogin(request, env);
    }
    if (path === "/api/auth/logout" && request.method === "POST") {
      return handleLogout(request);
    }
    if (path === "/api/auth/me" && request.method === "GET") {
      return handleMe(request, env);
    }

    // Everything else is handled by the [assets] binding (static files)
    return new Response("Not Found", { status: 404 });
  },
};
