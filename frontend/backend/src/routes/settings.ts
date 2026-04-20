import { Router } from 'express';
import { supabase } from '../database';
import { authenticate } from './auth';

const router = Router();

// GET /api/settings - Get all settings
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from('leads_dashboard_settings').select('key, value');
    if (error) throw error;
    
    const settings: Record<string, string> = {};
    if (rows) {
      rows.forEach((row: any) => {
        settings[row.key] = row.value;
      });
    }
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
    
    // Supabase upsert requires primary key conflict handling.
    if (project_title !== undefined) {
      const { error } = await supabase.from('leads_dashboard_settings').upsert({ key: 'project_title', value: project_title });
      if (error) throw error;
    }
    if (total_enquiries_override !== undefined) {
       const { error } = await supabase.from('leads_dashboard_settings').upsert({ key: 'total_enquiries_override', value: total_enquiries_override.toString() });
       if (error) throw error;
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
