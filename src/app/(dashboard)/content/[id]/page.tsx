import { redirect } from "next/navigation";

// For V1, redirect to new content editor
// In V2, this will load the actual content by ID
export default function ContentDetailPage() {
  redirect("/content/new");
}
