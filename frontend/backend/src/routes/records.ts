import { Router } from 'express';
import { query, run } from '../database';
import { authenticate } from './auth';

const router = Router();

// GET /api/records - Get records (with search, category filter, date filter, pagination)
router.get('/', async (req, res) => {
  try {
    const { search, category, gender, origin, startDate, endDate, page = '1', limit = '20', sort } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let sql = 'SELECT * FROM records WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM records WHERE 1=1';
    const params: any[] = [];

    if (search) {
      sql += ' AND name LIKE ?';
      countSql += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    if (category) {
      sql += ' AND category = ?';
      countSql += ' AND category = ?';
      params.push(category);
    }

    if (gender) {
      sql += ' AND gender = ?';
      countSql += ' AND gender = ?';
      params.push(gender);
    }

    if (origin) {
      sql += ' AND origin = ?';
      countSql += ' AND origin = ?';
      params.push(origin);
    }
    
    // date filter (ignore if sort=random is requested for global shuffle)
    if (sort !== 'random') {
      if (startDate && endDate) {
        sql += ' AND date >= ? AND date <= ?';
        countSql += ' AND date >= ? AND date <= ?';
        params.push(startDate, endDate);
      } else if (startDate) {
        sql += ' AND date >= ?';
        countSql += ' AND date >= ?';
        params.push(startDate);
      }
    }

    // Sorting and pagination
    if (sort === 'random') {
      sql += ' ORDER BY RANDOM() LIMIT ? OFFSET ?';
    } else {
      sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    }
    const queryParams = [...params, parseInt(limit as string), offset];

    const records = await query(sql, queryParams);
    const totalResult = await query(countSql, params);
    let total = totalResult[0].total;

    // Fetch total_enquiries_override from settings
    const settingsRows = await query('SELECT value FROM settings WHERE key = ?', ['total_enquiries_override']);
    if (settingsRows.length > 0) {
      const override = parseInt(settingsRows[0].value);
      if (!isNaN(override) && override > 0) {
        total = override;
      }
    }

    res.json({
      records,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
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
    const result = await query('SELECT COUNT(*) as todayCount FROM records WHERE date = ?', [today]);
    res.json({
      todayCount: result[0].todayCount
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
    const result = await run(
      'INSERT INTO records (name, category, date, status) VALUES (?, ?, ?, ?)',
      [name, category, date, status]
    );
    res.status(201).json({ id: result.lastID, name, category, date, status });
  } catch (err) {
    console.error('DB ERROR (Create Record):', err);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PUT /api/records/:id - Update a record (protected)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, category, date, status } = req.body;
    const result = await run(
      'UPDATE records SET name = ?, category = ?, date = ?, status = ? WHERE id = ?',
      [name, category, date, status, req.params.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ id: req.params.id, name, category, date, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /api/records/:id - Delete a record (protected)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await run('DELETE FROM records WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
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

    const inserted: any[] = [];
    for (const record of records) {
      const { name, category, date, status } = record;
      if (!name || !category || !date || !status) {
        continue; // skip invalid records
      }
      const result = await run(
        'INSERT INTO records (name, category, date, status) VALUES (?, ?, ?, ?)',
        [name, category, date, status]
      );
      inserted.push({ id: result.lastID, name, category, date, status });
    }

    res.status(201).json({ inserted: inserted.length, records: inserted });
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

    const placeholders = ids.map(() => '?').join(',');
    const result = await run(`DELETE FROM records WHERE id IN (${placeholders})`, ids);

    res.json({ deleted: result.changes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete records in bulk' });
  }
});

// GET /api/records/export - Export all records as CSV
router.get('/export', authenticate, async (req, res) => {
  try {
    const records = await query('SELECT id, name, category, date, status FROM records ORDER BY id');
    
    const csvHeader = 'id,name,category,date,status';
    const csvRows = records.map((r: any) => {
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

    let insertedCount = 0;
    for (let i = 1; i < lines.length; i++) {
      // Simple CSV parse (handles quoted fields)
      const fields = parseCSVLine(lines[i]);
      const name = fields[nameIdx]?.trim();
      const category = categoryIdx >= 0 ? (fields[categoryIdx]?.trim() || 'Other') : 'Other';
      const date = dateIdx >= 0 ? (fields[dateIdx]?.trim() || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
      const status = statusIdx >= 0 ? (fields[statusIdx]?.trim() || 'Interested') : 'Interested';

      if (name) {
        await run(
          'INSERT INTO records (name, category, date, status) VALUES (?, ?, ?, ?)',
          [name, category, date, status]
        );
        insertedCount++;
      }
    }

    res.status(201).json({ imported: insertedCount });
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
