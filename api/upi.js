import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const upiId = await kv.get('active_upi');
    const addedAt = await kv.get('active_upi_added_at');
    const addedBy = await kv.get('active_upi_added_by');

    return res.status(200).json({
      active: !!upiId,
      upiId: upiId,
      addedAt: addedAt,
      addedBy: addedBy
    });
  }

  if (req.method === 'POST') {
    const { action, upiId } = req.body;

    if (action === 'add' && upiId) {
      if (!upiId.includes('@')) {
        return res.status(400).json({ error: 'Invalid UPI ID. Must contain @.' });
      }
      await kv.set('active_upi', upiId);
      await kv.set('active_upi_added_at', new Date().toISOString());
      await kv.set('active_upi_added_by', 'bot');
      return res.status(200).json({
        success: true,
        upiId: upiId,
        message: 'UPI ID added successfully'
      });
    }

    if (action === 'remove') {
      const removed = await kv.get('active_upi');
      await kv.del('active_upi');
      await kv.del('active_upi_added_at');
      await kv.del('active_upi_added_by');
      return res.status(200).json({
        success: true,
        removed: true,
        removedUpiId: removed
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
