require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────
app.use(express.json({ limit: '25mb' }));   // base64 이미지 허용
app.use(express.static(path.join(__dirname, 'public')));

// ── Health check ───────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── OpenAI proxy ───────────────────────────────────────────────
// 클라이언트는 /api/chat 으로 요청 → 서버가 API 키 붙여서 OpenAI에 전달
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error('[/api/chat]', err.message);
    res.status(500).json({ error: 'OpenAI 요청 실패: ' + err.message });
  }
});

// ── SPA fallback ───────────────────────────────────────────────
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Ailly's English Vocabook 서버 실행 중: http://localhost:${PORT}`);
});
