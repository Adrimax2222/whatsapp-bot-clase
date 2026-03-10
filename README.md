# 📅 WhatsApp iCal Bot 🤖

Un bot de WhatsApp en Node.js que lee tu calendario (Google Calendar, Apple Calendar, etc.) a través de una URL `.ics` y responde en tus chats con las tareas y exámenes de los próximos 7 días.

¡Ideal para grupos de clase, universidad o equipos de trabajo!

## ✨ Características

- 📱 Responde a menciones en grupos (`@dynamicclass` o la palabra que configures).
- 📅 Filtra automáticamente los eventos de los próximos 7 días.
- 🎨 Formatea la respuesta con emojis según el tipo de evento (Examen, Tarea, Práctica...).
- 🌐 Incluye un servidor web (Express) para mantener el bot activo 24/7 usando servicios como UptimeRobot.
- 🛠️ Preparado para funcionar en Replit.

## 🚀 Requisitos previos

- **Node.js** v18 o superior.
- Una cuenta de **WhatsApp** (recomendable usar un número secundario).
- Un enlace público de tu calendario en formato **iCal (.ics)**.

## 🛠️ Instalación y Configuración

1. **Clona el repositorio:**
   ```bash
   git clone [https://github.com/Adrimax2222/whatsapp-ical-bot.git](https://github.com/TU-USUARIO/whatsapp-ical-bot.git)
   cd whatsapp-ical-bot
Instala las dependencias:

Bash
npm install
Configura las variables de entorno:
Copia el archivo de ejemplo y añade la URL de tu calendario.

Bash
cp .env.example .env
Abre el archivo .env y edita la variable ICAL_URL.

Inicia el bot:

Bash
npm start
Vincula WhatsApp:
Aparecerá un código QR en la consola. Escanéalo desde la aplicación de WhatsApp de tu móvil en la sección "Dispositivos vinculados".

☁️ Despliegue en Replit
Este proyecto está optimizado para ejecutarse en Replit:

Importa este repositorio en Replit.

El archivo replit.nix instalará las dependencias necesarias de Chromium automáticamente.

Añade la variable ICAL_URL en la herramienta Secrets de Replit.

(Opcional) Si Chromium no se encuentra, añade un Secret llamado CHROME_BIN con la ruta devuelta por el comando which chromium en la Shell de Replit.

Usa UptimeRobot apuntando a la URL web de tu Replit para que el bot no se apague nunca.

📝 Personalización
Puedes cambiar la palabra que activa el bot modificando la constante TRIGGER en el archivo index.js:

JavaScript
const TRIGGER = '@dynamicclass'; // Cámbialo por lo que quieras
🤝 Contribuciones
Las contribuciones son bienvenidas. Si tienes alguna mejora, abre una Issue o envía un Pull Request.
