const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from current directory
const ROOT = path.resolve(__dirname);
app.use(express.static(ROOT, { extensions: ['html'] }));
app.use(express.json({ limit: '1mb' }));

// CORS: permitir Live Server y localhost
const ALLOWED_ORIGINS = new Set([
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:3000',
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const RESP_FILE = path.join(ROOT, 'Respuestas.json');

async function ensureFile() {
  try {
    await fs.access(RESP_FILE);
  } catch (_) {
    await fs.writeFile(RESP_FILE, '[]', 'utf8');
  }
}

app.post('/api/rsvp', async (req, res) => {
  try {
    await ensureFile();

    const payload = req.body;
    if (!payload || !Array.isArray(payload.invitados)) {
      return res.status(400).json({ ok: false, error: 'Formato inválido' });
    }

    const text = await fs.readFile(RESP_FILE, 'utf8');
    let data = [];
    try { data = JSON.parse(text); } catch (_) { data = []; }

    data.push(payload);
    await fs.writeFile(RESP_FILE, JSON.stringify(data, null, 2), 'utf8');

    res.json({ ok: true });
  } catch (err) {
    console.error('Error guardando RSVP:', err);
    res.status(500).json({ ok: false, error: 'Error en el servidor' });
  }
});

app.get('/api/rsvp', async (_req, res) => {
  try {
    await ensureFile();
    const text = await fs.readFile(RESP_FILE, 'utf8');
    res.type('application/json').send(text);
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Error leyendo archivo' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
