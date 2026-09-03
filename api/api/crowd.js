export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64 } = req.body; // カメラから送られたBase64画像

    // 環境変数から取得（VercelのDashboardで設定）
    const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
    const MODEL_ENDPOINT = process.env.ROBOFLOW_MODEL_ENDPOINT; // 例: person-detection-xxxx/1
    const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL;

    // ① Roboflow APIへ画像を送信して解析
    const rfResponse = await fetch(`https://detect.roboflow.com/${MODEL_ENDPOINT}?api_key=${ROBOFLOW_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: imageBase64
    });
    const rfData = await rfResponse.json();

    // ② 「人(person)」の数をカウント
    const personCount = rfData.predictions 
      ? rfData.predictions.filter(p => p.class === 'person').length 
      : 0;

    // ③ カウント結果をGASに転送
    await fetch(GAS_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: personCount })
    });

    return res.status(200).json({ success: true, count: personCount });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
