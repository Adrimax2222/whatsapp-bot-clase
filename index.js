require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ical = require('node-ical');

// ─── Config ────────────────────────────────────────────────────────────────
const ICAL_URL = process.env.ICAL_URL;
const MENTION_TRIGGER = '@dynamicclass';

if (!ICAL_URL) {
  console.error('❌  Falta la variable de entorno ICAL_URL');
  process.exit(1);
}

// ─── WhatsApp client ────────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
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

// ─── Message handler ────────────────────────────────────────────────────────
client.on('message', async (msg) => {
  // Solo mensajes de grupo
  if (!msg.from.endsWith('@g.us')) return;

  const body = msg.body || '';

  // Solo cuando se menciona @dynamicclass (case-insensitive)
  if (!body.toLowerCase().includes(MENTION_TRIGGER.toLowerCase())) return;

  console.log(`📨  Mención recibida en grupo ${msg.from}`);

  try {
    const reply = await buildEventReply();
    await msg.reply(reply);
  } catch (err) {
    console.error('❌  Error al obtener eventos:', err.message);
    await msg.reply('⚠️ No pude obtener los eventos en este momento. Inténtalo más tarde.');
  }
});

// ─── iCal logic ─────────────────────────────────────────────────────────────

/**
 * Descarga el calendario, filtra los eventos de los próximos 7 días
 * y devuelve el texto formateado para responder.
 */
async function buildEventReply() {
  const events = await fetchUpcomingEvents();

  if (events.length === 0) {
    return '📅 Parece que no hay nada para esta semana, ¡disfrutad!';
  }

  const lines = ['📅 *Tareas y exámenes — próximos 7 días:*\n'];

  for (const ev of events) {
    const dateStr = formatDate(ev.start);
    const emoji = getEmoji(ev.summary);
    lines.push(`${emoji} *${dateStr}* — ${ev.summary}`);
    if (ev.description) {
      // Limpia saltos de línea y HTML básico de la descripción
      const desc = ev.description
        .replace(/<[^>]+>/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .slice(0, 120);
      if (desc) lines.push(`   _${desc}_`);
    }
  }

  return lines.join('\n');
}

/**
 * Descarga los eventos iCal y devuelve los de los próximos 7 días,
 * ordenados por fecha de inicio.
 */
async function fetchUpcomingEvents() {
  const rawEvents = await ical.async.fromURL(ICAL_URL);

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcoming = [];

  for (const key of Object.keys(rawEvents)) {
    const ev = rawEvents[key];

    // Solo entradas de tipo VEVENT con fecha de inicio
    if (ev.type !== 'VEVENT' || !ev.start) continue;

    const start = new Date(ev.start);

    if (start >= now && start <= in7Days) {
      upcoming.push({
        summary: (ev.summary || 'Sin título').trim(),
        description: ev.description || '',
        start,
      });
    }
  }

  // Ordenar por fecha ascendente
  upcoming.sort((a, b) => a.start - b.start);

  return upcoming;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Formatea una fecha como "Lun 12 Jun, 09:00" (hora local del servidor).
 */
function formatDate(date) {
  return date.toLocaleString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Asigna un emoji según palabras clave del título del evento.
 */
function getEmoji(summary = '') {
  const s = summary.toLowerCase();
  if (s.includes('examen') || s.includes('exam') || s.includes('test')) return '📝';
  if (s.includes('entrega') || s.includes('tarea') || s.includes('homework')) return '📚';
  if (s.includes('práctica') || s.includes('lab')) return '🔬';
  if (s.includes('proyecto') || s.includes('project')) return '🗂️';
  return '📌';
}

// ─── Start ──────────────────────────────────────────────────────────────────
client.initialize();
