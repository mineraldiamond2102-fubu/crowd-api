export default async function handler(req, res) {
  // CORSヘッダーの設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const apiKey = process.env.ROBOFLOW_API_KEY;
    const gasUrl = process.env.GAS_WEBAPP_URL;

    if (!apiKey) {
      return res.status(500).json({ error: 'ROBOFLOW_API_KEY is not set' });
    }

    // Base64画像の整形
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // Roboflow API呼び出し (coco/3)
    const roboflowRes = await fetch(`https://detect.roboflow.com/coco/3?api_key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: base64Data
    });

    const roboflowData = await roboflowRes.json();
    const count = roboflowData.predictions ? roboflowData.predictions.length : 0;

    // GAS（Google Apps Script）へデータ送信
    if (gasUrl) {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: count, timestamp: new Date().toISOString() })
      });
    }

    return res.status(200).json({
      success: true,
      count: count,
      predictions: roboflowData.predictions || []
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
