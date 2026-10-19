export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let input_text = null;
  let voice = 'coral';

  if (req.method === 'POST') {
    const body = req.body;
    input_text = body?.text || body?.input || null;
    voice = body?.voice || voice;
  } else if (req.method === 'GET') {
    input_text = req.query?.text || req.query?.input || null;
    voice = req.query?.voice || voice;
  }

  if (!input_text) {
    return res.status(400).json({ error: "Input text is required (use 'text' or 'input' parameter)" });
  }

  const cookies = '_ga=GA1.1.2115632665.1759990463; FCOEC=%5B%5B%5B28%2C%22%5Bnull%2C%5Bnull%2C4%2C%5B1759990467%2C650713000%5D%2C0%5D%5D%22%5D%5D%5D; FCNEC=%5B%5B%22AKsRol_MkExNhX_Ak7jY8DVlph7qJCsxQCxAa4zMODOPH4rdJGoKDQlTfcn4NzdzCyUmAUUKTY0uL0x-brf20S04KqqQazvmwDtWioqomcBXLKJ9Xj71mSf9rNnkXQoP24i-OiNeDJUyqRW04npZl1zcDuXuRvlJiA%3D%3D%22%5D%5D; _ga_H0XGBVF70F=GS2.1.s1760147080$o2$g1$t1760147167$j33$l0$h35775898';

  const params = new URLSearchParams({
    msg: input_text,
    instruction: '',
    lang: voice,
    speed: '0.90',
    source: 'ttsmp3',
  });

  try {
    const ttsRes = await fetch('https://ttsmp3.com/makemp3_ai.php', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
        'Content-Type': 'application/x-www-form-urlencoded',
        'DNT': '1',
        'Origin': 'https://ttsmp3.com',
        'Referer': 'https://ttsmp3.com/ai',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'Cookie': cookies,
      },
      body: params.toString(),
    });

    if (!ttsRes.ok) {
      return res.status(502).json({ error: 'TTS API responded with status ' + ttsRes.status });
    }

    const ttsJson = await ttsRes.json();

    if (ttsJson.Error === 0 && ttsJson.URL) {
      const audioRes = await fetch(ttsJson.URL);
      if (!audioRes.ok) {
        return res.status(502).json({ error: 'Failed to download audio from TTS server' });
      }
      const audioBuffer = await audioRes.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');
      return res.status(200).send(Buffer.from(audioBuffer));
    } else {
      const msg = ttsJson.Text || 'Unknown TTS error';
      return res.status(500).json({ error: 'TTS error: ' + msg });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
