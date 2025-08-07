// This function is safe to use in client components
const BASEURL =
  process.env.NEXT_PUBLIC_API_BASE_URL_MAIN || "http://localhost:3000";
export async function getCurrentUser() {
  try {
    const res = await fetch(`${BASEURL}/api/users/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.user;
  } catch (err) {
    console.error("Error fetching current user:", err);
    return null;
  }
}
