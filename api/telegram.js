import { kv } from '@vercel/kv';

const BOT_TOKEN = '8557573305:AAG6rWUXad9NPAi0DhuEEDi14oX6gn1U7cw';
const ALLOWED_CHAT_ID = '8664945781';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const update = req.body;
  if (!update.message) {
    return res.status(200).json({ ok: true });
  }

  const msg = update.message;
  const chatId = String(msg.chat.id);
  const text = msg.text || '';
  const cmd = text.split(' ')[0].toLowerCase();

  if (chatId !== ALLOWED_CHAT_ID) {
    await sendMessage(chatId, '<b>Unauthorized</b>\nYou are not allowed to use this bot.');
    return res.status(200).json({ ok: true });
  }

  switch (cmd) {
    case '/addupi': {
      const upiId = text.split(' ')[1];
      if (!upiId) {
        await sendMessage(chatId,
          '<b>Usage:</b>\n' +
          '<code>/addupi vikram2517@ptaxis</code>\n\n' +
          'Example: <code>/addupi vikram2517@ptaxis</code>'
        );
        break;
      }
      if (!upiId.includes('@')) {
        await sendMessage(chatId,
          '<b>Invalid UPI ID</b>\n' +
          'UPI ID must contain @ symbol.\n' +
          'Example: <code>vikram2517@ptaxis</code>'
        );
        break;
      }
      await kv.set('active_upi', upiId);
      await kv.set('active_upi_added_at', new Date().toISOString());
      await kv.set('active_upi_added_by', msg.from?.username || 'unknown');
      await sendMessage(chatId,
        '<b>UPI ID Added Successfully!</b>\n\n' +
        `UPI ID: <code>${upiId}</code>\n` +
        `Status: Active\n\n` +
        'Payment page is now live.'
      );
      break;
    }

    case '/removeupi': {
      const current = await kv.get('active_upi');
      if (!current) {
        await sendMessage(chatId,
          '<b>No Active UPI ID</b>\n\n' +
          'No UPI ID is currently configured.\n' +
          'Payment page will show "Payment methods not available".'
        );
        break;
      }
      await kv.del('active_upi');
      await kv.del('active_upi_added_at');
      await kv.del('active_upi_added_by');
      await sendMessage(chatId,
        '<b>UPI ID Removed!</b>\n\n' +
        `Removed: <code>${current}</code>\n\n` +
        'Payment page will now show "Payment methods not available".'
      );
      break;
    }

    case '/status': {
      const upiId = await kv.get('active_upi');
      const addedAt = await kv.get('active_upi_added_at');
      const addedBy = await kv.get('active_upi_added_by');

      if (upiId) {
        await sendMessage(chatId,
          '<b>UPI Status: Active</b>\n\n' +
          `UPI ID: <code>${upiId}</code>\n` +
          `Added: ${addedAt || 'N/A'}\n` +
          `By: @${addedBy || 'unknown'}\n\n` +
          'Payment page is accepting payments.'
        );
      } else {
        await sendMessage(chatId,
          '<b>UPI Status: Inactive</b>\n\n' +
          'No UPI ID is currently configured.\n\n' +
          'Payment page will show "Payment methods not available".'
        );
      }
      break;
    }

    default:
      if (text.startsWith('/')) {
        await sendMessage(chatId,
          '<b>Payment Gateway Bot</b>\n\n' +
          'Available commands:\n\n' +
          '<code>/addupi &lt;upi-id&gt;</code>\n' +
          'Add a new UPI ID\n\n' +
          '<code>/removeupi</code>\n' +
          'Remove active UPI ID\n\n' +
          '<code>/status</code>\n' +
          'Check active UPI ID'
        );
      }
      break;
  }

  return res.status(200).json({ ok: true });
}

async function sendMessage(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.error('Failed to send Telegram message:', e);
  }
}
