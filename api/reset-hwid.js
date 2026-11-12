export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { key } = req.body || {};
  if (!key || !key.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập Key.' });
  }

  const apiKey = process.env.JUNKIE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'Thiếu biến môi trường JUNKIE_API_KEY trên Vercel.' });
  }

  try {
    const cleanKey = encodeURIComponent(key.trim());
    const response = await fetch(`https://api.jnkie.com/api/v2/keys/${cleanKey}/reset-hwid`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({
      success: response.ok,
      message: data.message || (response.ok ? 'Reset HWID thành công!' : `Lỗi ${response.status}`),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi kết nối máy chủ Junkie.' });
  }
}
