import { redirect } from "next/navigation";

// Clients are now managed via the study selector in the sidebar.
// This page redirects to dashboard.
export default function ClientsPage() {
  redirect("/dashboard");
}
