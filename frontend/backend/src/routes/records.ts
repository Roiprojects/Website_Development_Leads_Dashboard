import { Router } from 'express';
import { supabase } from '../database';
import { authenticate } from './auth';

const router = Router();

// GET /api/records - Get records (with search, category filter, date filter, pagination)
router.get('/', async (req, res) => {
  try {
    const { search, category, gender, origin, startDate, endDate, page = '1', limit = '20', sort } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const parsedLimit = parseInt(limit as string);

    let query = supabase.from('leads_dashboard_records').select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (gender) {
      query = query.eq('gender', gender);
    }

    if (origin) {
      query = query.eq('origin', origin);
    }
    
    // date filter (ignore if sort=random is requested for global shuffle)
    if (sort !== 'random') {
      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      } else if (startDate) {
        query = query.gte('date', startDate);
      }
    }

    // Sorting and pagination
    if (sort !== 'random') {
       query = query.order('date', { ascending: false }).order('id', { ascending: false });
    }
    
    query = query.range(offset, offset + parsedLimit - 1);

    const { data: records, count, error } = await query;
    if (error) throw error;
    
    let total = count || 0;

    // Fetch total_enquiries_override from settings
    const { data: setting } = await supabase.from('leads_dashboard_settings').select('value').eq('key', 'total_enquiries_override').single();
    if (setting && setting.value) {
      const override = parseInt(setting.value);
      if (!isNaN(override) && override > 0) {
        total = override;
      }
    }

    // Since Supabase doesn't easily support true global random order for large datasets without RPC,
    // we shuffle the fetched page if sort is random, which matches the required UI behavior of changing appearances.
    let finalRecords = records || [];
    if (sort === 'random') {
       finalRecords = finalRecords.sort(() => Math.random() - 0.5);
    }

    res.json({
      records: finalRecords,
      total,
      page: parseInt(page as string),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// GET /api/records/stats - Get record statistics (daily count)
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase.from('leads_dashboard_records').select('*', { count: 'exact', head: true }).eq('date', today);
    if (error) throw error;
    res.json({
      todayCount: count || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch record stats' });
  }
});

// POST /api/records - Create a new record (protected)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, category, date, status } = req.body;
    if (!name || !category || !date || !status) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const { data: result, error } = await supabase.from('leads_dashboard_records').insert({ name, category, date, status }).select().single();
    if (error) throw error;

    res.status(201).json(result);
  } catch (err) {
    console.error('DB ERROR (Create Record):', err);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PUT /api/records/:id - Update a record (protected)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, category, date, status } = req.body;
    
    const { data: record, error } = await supabase.from('leads_dashboard_records').update({ name, category, date, status }).eq('id', req.params.id).select().single();
    
    if (error || !record) {
      if (error && error.code === 'PGRST116') return res.status(404).json({ error: 'Record not found' });
      throw error;
    }
    
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /api/records/:id - Delete a record (protected)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { error, count } = await supabase.from('leads_dashboard_records').delete({ count: 'exact' }).eq('id', req.params.id);
    if (error) throw error;
    if (count === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// POST /api/records/bulk - Create multiple records at once (protected)
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array is required and must not be empty' });
    }

    const payload = records.map(r => ({
      name: r.name,
      category: r.category,
      date: r.date,
      status: r.status
    })).filter(r => r.name && r.category && r.date && r.status);

    const { data: inserted, error } = await supabase.from('leads_dashboard_records').insert(payload).select();
    if (error) throw error;

    res.status(201).json({ inserted: inserted?.length || 0, records: inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create records in bulk' });
  }
});

// DELETE /api/records/bulk - Delete multiple records by IDs (protected)
router.delete('/bulk', authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required and must not be empty' });
    }

    const { error, count } = await supabase.from('leads_dashboard_records').delete({ count: 'exact' }).in('id', ids);
    if (error) throw error;

    res.json({ deleted: count || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete records in bulk' });
  }
});

// GET /api/records/export - Export all records as CSV
router.get('/export', authenticate, async (req, res) => {
  try {
    const { data: records, error } = await supabase.from('leads_dashboard_records').select('id, name, category, date, status').order('id', { ascending: true });
    if (error) throw error;
    
    const csvHeader = 'id,name,category,date,status';
    const csvRows = (records || []).map((r: any) => {
      const escapedName = `"${(r.name || '').replace(/"/g, '""')}"`;
      const escapedCategory = `"${(r.category || '').replace(/"/g, '""')}"`;
      const escapedStatus = `"${(r.status || '').replace(/"/g, '""')}"`;
      return `${r.id},${escapedName},${escapedCategory},${r.date},${escapedStatus}`;
    });
    const csv = [csvHeader, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="records_export.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export records' });
  }
});

// POST /api/records/import - Import records from CSV text (protected)
router.post('/import', authenticate, async (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ error: 'csvData string is required' });
    }

    const lines = csvData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have a header row and at least one data row' });
    }

    // Parse header to find column indices
    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const nameIdx = header.indexOf('name');
    const categoryIdx = header.indexOf('category');
    const dateIdx = header.indexOf('date');
    const statusIdx = header.indexOf('status');

    if (nameIdx === -1) {
      return res.status(400).json({ error: 'CSV must have a "name" column' });
    }

    const payload: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      const name = fields[nameIdx]?.trim();
      const category = categoryIdx >= 0 ? (fields[categoryIdx]?.trim() || 'Other') : 'Other';
      const date = dateIdx >= 0 ? (fields[dateIdx]?.trim() || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
      const status = statusIdx >= 0 ? (fields[statusIdx]?.trim() || 'Interested') : 'Interested';

      if (name) {
        payload.push({ name, category, date, status });
      }
    }
    
    if (payload.length > 0) {
      const { error, data } = await supabase.from('leads_dashboard_records').insert(payload).select();
      if (error) throw error;
      res.status(201).json({ imported: data?.length || 0 });
    } else {
      res.status(201).json({ imported: 0 });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
});

// Helper to parse a CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export default router;
