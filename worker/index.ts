import { handleRegister } from "./auth/register";
import { handleLogin } from "./auth/login";
import { handleLogout } from "./auth/logout";
import { handleMe } from "./auth/me";
import { handleHaloscan } from "./api/haloscan";
import { handleAdminClients } from "./api/admin-clients";
import { handleInvite } from "./api/invite";
import { handleSeed } from "./api/seed";
import { handleAvatar } from "./api/avatar";
import { handleIntegrations } from "./api/integrations";
import { handleProjectTeam } from "./api/project-team";
import { handleTeamManage } from "./api/team-manage";
import { handleOrgDetails } from "./api/org-details";
import { handleOrgLogo } from "./api/org-logo";

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  TURNSTILE_SECRET_KEY?: string;
  HALOSCAN_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API
    if (path.startsWith("/api/")) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
    }

    // Auth routes
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

    // Haloscan keyword research (available to all authenticated users)
    if (path === "/api/haloscan" && (request.method === "GET" || request.method === "POST")) {
      return handleHaloscan(request, env);
    }

    // Admin routes
    if (path === "/api/admin/clients" && (request.method === "GET" || request.method === "POST")) {
      return handleAdminClients(request, env);
    }

    // Invitation routes
    if (path === "/api/invite" && request.method === "POST") {
      return handleInvite(request, env);
    }

    // Avatar upload
    if (path === "/api/avatar" && request.method === "PUT") {
      return handleAvatar(request, env);
    }

    // Integrations (per-org)
    if (path === "/api/integrations" && (request.method === "GET" || request.method === "POST")) {
      return handleIntegrations(request, env);
    }

    // Project team members
    if (path === "/api/project-team" && request.method === "GET") {
      return handleProjectTeam(request, env);
    }

    // Team management (remove members, transfer ownership)
    if (path === "/api/team-manage" && (request.method === "DELETE" || request.method === "PUT")) {
      return handleTeamManage(request, env);
    }

    // Organization details (contacts, notes)
    if (path === "/api/org-details" && (request.method === "GET" || request.method === "PUT")) {
      return handleOrgDetails(request, env);
    }

    // Organization logo upload
    if (path === "/api/org-logo" && request.method === "PUT") {
      return handleOrgLogo(request, env);
    }

    // Seed test data (temporary, remove in production)
    if (path === "/api/seed" && request.method === "POST") {
      return handleSeed(request, env);
    }

    // Static assets are handled by the [assets] binding
    return new Response("Not Found", { status: 404 });
  },
};
