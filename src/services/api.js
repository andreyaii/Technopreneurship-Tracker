

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.warn(
    "[API] VITE_API_URL is not defined! Set VITE_API_URL in .env.local or Vercel Environment Variables."
  );
}
/**
 * Central fetch helper for the action-based Apps Script API.
 * All requests are POST with Content-Type text/plain;charset=utf-8
 * (required so Google Apps Script can read the body without CORS pre-flight).
 *
 * Returns the parsed JSON response, or throws on network/HTTP error.
 */
export async function postAction(payload) {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL is not configured. Please define VITE_API_URL in your .env.local file or Vercel Environment Variables."
    );
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Legacy export kept for backward compatibility.
 * Internally wraps the new action-based call.
 */
export async function loginStudent(studentNo, pin) {
  return postAction({ action: "loginStudent", studentNo, pin });
}