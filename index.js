require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ical = require('node-ical');
const moment = require('moment');
const express = require('express');

// ─── Keep-Alive Server (Replit) ─────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot activo'));

app.listen(PORT, () => {
  console.log(`🌐  Servidor keep-alive escuchando en puerto ${PORT}`);
});

// ─── Config ──────────────────────────────────────────────────────────────────
const ICAL_URL = process.env.ICAL_URL;
const TRIGGER   = '@dynamicclass';

if (!ICAL_URL) {
  console.error('❌  Falta la variable de entorno ICAL_URL en Secrets.');
  process.exit(1);
}

// ─── WhatsApp Client ─────────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('\n📱  Escanea el QR con WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅  Bot conectado y listo.');
});

client.on('auth_failure', (msg) => {
  console.error('❌  Fallo de autenticación:', msg);
});

client.on('disconnected', (reason) => {
  console.warn('⚠️  Cliente desconectado:', reason);
});

// ─── Message Handler ─────────────────────────────────────────────────────────
client.on('message', async (msg) => {
  const body = (msg.body || '').toLowerCase();

  // Responde en grupos (@g.us) Y en chats privados (@c.us)
  const isGroup   = msg.from.endsWith('@g.us');
  const isPrivate = msg.from.endsWith('@c.us');

  if (!isGroup && !isPrivate) return;           // ignora broadcasts, etc.
  if (!body.includes(TRIGGER.toLowerCase())) return; // trigger insensible a mayúsculas

  console.log(`📨  Mención recibida — ${isGroup ? 'Grupo' : 'Privado'}: ${msg.from}`);

  try {
    const reply = await buildEventReply();
    await msg.reply(reply);
  } catch (err) {
    console.error('❌  Error al procesar eventos:', err.message);
    await msg.reply(
      '⚠️ No pude obtener el calendario en este momento.\n' +
      'Comprueba que la URL iCal es accesible e inténtalo de nuevo.'
    );
  }
});

// ─── iCal Logic ──────────────────────────────────────────────────────────────

/**
 * Descarga el iCal, filtra los próximos 7 días y devuelve el mensaje formateado.
 */
async function buildEventReply() {
  const events = await fetchUpcomingEvents();

  if (events.length === 0) {
    return (
      '📅 *Calendario — próximos 7 días*\n\n' +
      'Parece que no hay nada para esta semana, ¡disfrutad! 🎉'
    );
  }

  const lines = ['📅 *Tareas y exámenes — próximos 7 días:*\n'];

  for (const ev of events) {
    const dateStr = ev.allDay
      ? ev.start.format('ddd DD MMM')
      : ev.start.format('ddd DD MMM, HH:mm');

    const emoji = getEmoji(ev.summary);
    lines.push(`${emoji} *${dateStr}* — ${ev.summary}`);

    if (ev.description) {
      const desc = sanitize(ev.description, 140);
      if (desc) lines.push(`   _${desc}_`);
    }
  }

  return lines.join('\n');
}

/**
 * Descarga y filtra los eventos VEVENT desde hoy hasta +7 días.
 * Ordena por fecha de inicio ascendente.
 */
async function fetchUpcomingEvents() {
  const rawEvents = await ical.async.fromURL(ICAL_URL);

  const startOfToday = moment().startOf('day');
  const endWindow    = moment().add(7, 'days').endOf('day');

  const upcoming = [];

  for (const key of Object.keys(rawEvents)) {
    const ev = rawEvents[key];
    if (ev.type !== 'VEVENT' || !ev.start) continue;

    const evStart = moment(ev.start);

    // Ventana: desde el inicio de hoy hasta 7 días después (inclusive)
    if (evStart.isBefore(startOfToday) || evStart.isAfter(endWindow)) continue;

    // Detecta si es evento de todo el día (sin hora)
    const allDay = ev.start.dateOnly === true ||
                   (ev.start.getHours() === 0 &&
                    ev.start.getMinutes() === 0 &&
                    ev.start.getSeconds() === 0 &&
                    ev.datetype === 'date');

    upcoming.push({
      summary    : (ev.summary     || 'Sin título').trim(),
      description: (ev.description || '').trim(),
      start      : evStart,
      allDay,
    });
  }

  upcoming.sort((a, b) => a.start.valueOf() - b.start.valueOf());

  return upcoming;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitize(text, maxLen = 140) {
  return text
    .replace(/<[^>]+>/g, '')   // quita HTML básico
    .replace(/\\n/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function getEmoji(summary = '') {
  const s = summary.toLowerCase();
  if (s.includes('examen') || s.includes('exam') || s.includes('test'))      return '📝';
  if (s.includes('entrega') || s.includes('tarea') || s.includes('homework')) return '📚';
  if (s.includes('práctica') || s.includes('lab'))                            return '🔬';
  if (s.includes('proyecto') || s.includes('project'))                        return '🗂️';
  if (s.includes('clase') || s.includes('class'))                             return '🏫';
  return '📌';
}

// ─── Start ───────────────────────────────────────────────────────────────────
client.initialize();
```

---

## Guía rápida para Replit

**Secrets** (pestaña 🔒 en Replit):
```
ICAL_URL = https://tu-calendario.ejemplo.com/cal.ics
