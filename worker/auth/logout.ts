export async function handleLogout(request: Request): Promise<Response> {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "databoard_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    },
  });
}
