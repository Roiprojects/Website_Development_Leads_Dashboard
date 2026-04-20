import { Router } from 'express';
import { supabase } from '../database';
import { authenticate } from './auth';

const router = Router();

// Get all monthly enquiries
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from('leads_dashboard_monthly_enquiries').select('*').order('year', { ascending: true }).order('id', { ascending: true });
    if (error) throw error;
    res.json(rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching enquiries' });
  }
});

// Update a specific monthly enquiry (Protected)
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { month, year, value } = req.body;

  if (value === undefined || typeof value !== 'number') {
    return res.status(400).json({ error: 'Valid value number is required' });
  }

  try {
    const updates: any = { value };
    if (month) updates.month = month;
    if (year) updates.year = year;

    const { error } = await supabase.from('leads_dashboard_monthly_enquiries').update(updates).eq('id', id);
    if (error) throw error;
    res.json({ message: 'Enquiry updated successfully' });
  } catch (err) {
    console.error('DB ERROR (Monthly Enquiry):', err);
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// Get recent daily enquiries
router.get('/daily', async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from('leads_dashboard_daily_enquiries').select('*').order('date', { ascending: false }).limit(30);
    if (error) throw error;
    res.json(rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching daily enquiries' });
  }
});

// Get the most recent daily enquiry (or the one set by display_date)
router.get('/latest', async (req, res) => {
  try {
    const { data: setting, error } = await supabase.from('leads_dashboard_settings').select('value').eq('key', 'display_date').single();
    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned, which is fine
      console.error(error);
      return res.status(500).json({ error: 'Database error fetching display_date' });
    }

    const displayDate = setting?.value;

    if (displayDate) {
      const { data: dailyRow, error: dailyError } = await supabase.from('leads_dashboard_daily_enquiries').select('*').eq('date', displayDate).single();
      if (!dailyError && dailyRow) {
        return res.json(dailyRow);
      }
    }
    
    // Fallback to actual latest
    const { data: latestRow, error: latestError } = await supabase.from('leads_dashboard_daily_enquiries').select('*').order('date', { ascending: false }).limit(1).single();
    if (latestError && latestError.code !== 'PGRST116') {
      console.error(latestError);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!latestRow) return res.json({ date: new Date().toISOString().split('T')[0], value: 0 });
    res.json(latestRow);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unknown server error' });
  }
});

// Get enquiry value for a specific date
router.get('/date/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const { data: row, error } = await supabase.from('leads_dashboard_daily_enquiries').select('value').eq('date', date).single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ date, value: row ? row.value : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get today's enquiry value
router.get('/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data: row, error } = await supabase.from('leads_dashboard_daily_enquiries').select('value').eq('date', today).single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ date: today, value: row ? row.value : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update a specific daily enquiry (Protected)
router.put('/daily/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { value } = req.body;

  if (value === undefined || typeof value !== 'number') {
    return res.status(400).json({ error: 'Valid value number is required' });
  }

  try {
    const { error } = await supabase.from('leads_dashboard_daily_enquiries').update({ value }).eq('id', id);
    if (error) throw error;
    
    // Update setting
    const { data: row } = await supabase.from('leads_dashboard_daily_enquiries').select('date').eq('id', id).single();
    if (row && row.date) {
      await supabase.from('leads_dashboard_settings').upsert({ key: 'display_date', value: row.date });
    }
    
    res.json({ message: 'Daily enquiry updated successfully' });
  } catch (err) {
    console.error('DB ERROR (Update Daily):', err);
    res.status(500).json({ error: 'Failed to update daily enquiry' });
  }
});

// Create or update today's enquiry
router.post('/daily', authenticate, async (req, res) => {
  const { date, value } = req.body;
  if (!date || value === undefined || typeof value !== 'number') {
    return res.status(400).json({ error: 'Date and valid value number are required' });
  }

  try {
    const { data: existingRow } = await supabase.from('leads_dashboard_daily_enquiries').select('id').eq('date', date).single();
    let idResponse;
    if (existingRow) {
      const { error } = await supabase.from('leads_dashboard_daily_enquiries').update({ value }).eq('date', date);
      if (error) throw error;
      await supabase.from('leads_dashboard_settings').upsert({ key: 'display_date', value: date });
      return res.json({ message: 'Daily enquiry updated successfully' });
    } else {
      const { data: newRow, error } = await supabase.from('leads_dashboard_daily_enquiries').insert({ date, value }).select().single();
      if (error) throw error;
      await supabase.from('leads_dashboard_settings').upsert({ key: 'display_date', value: date });
      return res.json({ message: 'Daily enquiry created successfully', id: newRow?.id });
    }
  } catch (err) {
    console.error('DB ERROR (Daily Enquiry Fallback):', err);
    res.status(500).json({ error: 'Failed to save daily enquiry' });
  }
});

export default router;
