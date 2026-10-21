

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
export async function postAction(payload, maxRetries = 1, timeoutMs = 20000) {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL is not configured. Please define VITE_API_URL in your .env.local file or Vercel Environment Variables."
    );
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    let rawText;
    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      rawText = await response.text();
    } catch (err) {
      if (controller.signal.aborted) {
        throw new Error(
          `API request timed out after ${timeoutMs}ms for action "${payload?.action || "unknown"}".`
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
    const trimmed = (rawText || "").trim();

    if (!response.ok) {
      throw new Error(`API request failed (HTTP ${response.status}: ${response.statusText}).`);
    }

    // Google Apps Script doGet() returns plain-text "Technopreneurship Tracker API is running."
    // when a POST request is redirected to GET by Google's infrastructure.
    if (trimmed.startsWith("Technopreneurship Tracker API is running")) {
      if (attempt < maxRetries) {
        // Wait briefly for transient redirect to clear before retrying
        await new Promise((resolve) => setTimeout(resolve, 350));
        continue;
      }
      throw new Error(
        "The server returned a plain-text status response instead of JSON. The request may have been redirected as a GET."
      );
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      if (trimmed.startsWith("<")) {
        throw new Error(
          "The Google Apps Script API returned an HTML page instead of JSON. Please check spreadsheet deployment permissions."
        );
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        continue;
      }
      throw new Error(
        `Unexpected non-JSON response received from API for action "${payload?.action || "unknown"}".`
      );
    }
  }
}

/**
 * Legacy export kept for backward compatibility.
 * Internally wraps the new action-based call.
 */
export async function loginStudent(studentNo, pin) {
  return postAction({ action: "loginStudent", studentNo, pin });
}