import { Router } from 'express';
import { query, run } from '../database';
import { authenticate } from './auth';

const router = Router();

// GET /api/settings - Get all settings
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update settings (protected)
router.put('/', authenticate, async (req, res) => {
  try {
    const { project_title, total_enquiries_override } = req.body;
    if (project_title !== undefined) {
      await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['project_title', project_title]);
    }
    if (total_enquiries_override !== undefined) {
      await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['total_enquiries_override', total_enquiries_override.toString()]);
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
