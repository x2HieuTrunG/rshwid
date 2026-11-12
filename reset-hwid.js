// Vercel Node.js Function: POST /api/reset-hwid
// Required environment variable: JUNKIE_API_TOKEN
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      success: false,
      message: "Method not allowed."
    });
  }

  const token = process.env.JUNKIE_API_TOKEN;
  if (!token) {
    return res.status(500).json({
      success: false,
      message: "Server is not configured. Please contact the administrator."
    });
  }

  let key = req.body?.key;
  if (typeof key !== "string") {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid license key."
    });
  }

  key = key.trim();
  if (!key || key.length > 255) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid license key."
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const endpoint =
      "https://api.jnkie.com/api/v2/keys/" +
      encodeURIComponent(key) +
      "/reset-hwid";

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      },
      signal: controller.signal
    });

    const raw = await upstream.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {};
    }

    if (!upstream.ok) {
      // Avoid exposing provider internals or credentials to the browser.
      const message = upstream.status === 401 || upstream.status === 403
        ? "Junkie API rejected the server token. Check its scope and value."
        : upstream.status === 404
          ? "Key not found. Check that the license key is correct."
          : upstream.status === 429
            ? "Junkie API rate limit reached. Please try again later."
            : "Junkie could not reset this key. Please try again or contact the administrator.";

      const status = upstream.status >= 500 ? 502 : upstream.status;
      return res.status(status).json({ success: false, message });
    }

    return res.status(200).json({
      success: true,
      message: data.message || "HWID reset successfully."
    });
  } catch (error) {
    const message = error.name === "AbortError"
      ? "Junkie API request timed out. Please try again."
      : "Could not connect to Junkie API. Please try again later.";

    return res.status(502).json({ success: false, message });
  } finally {
    clearTimeout(timeout);
  }
}
