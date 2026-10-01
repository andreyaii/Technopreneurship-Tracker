const API_URL =
  "https://script.google.com/macros/s/AKfycbw3-b781_EiXjAvJBsU6Knh5y_S4ABuaiLW2U0nKEolAm-y8YQ2m6qtafm-wHviIDAa/exec";

/**
 * Central fetch helper for the action-based Apps Script API.
 * All requests are POST with Content-Type text/plain;charset=utf-8
 * (required so Google Apps Script can read the body without CORS pre-flight).
 *
 * Returns the parsed JSON response, or throws on network/HTTP error.
 */
export async function postAction(payload) {
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