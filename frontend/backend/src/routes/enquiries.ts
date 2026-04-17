import { Router } from 'express';
import { db } from '../database';
import { authenticate } from './auth';

const router = Router();

// Get all monthly enquiries
router.get('/', (req, res) => {
  db.all('SELECT * FROM monthly_enquiries ORDER BY year ASC, id ASC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error fetching enquiries' });
    }
    res.json(rows);
  });
});

// Update a specific monthly enquiry (Protected)
router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { month, year, value } = req.body;

  if (value === undefined || typeof value !== 'number') {
    return res.status(400).json({ error: 'Valid value number is required' });
  }

  db.run(
    'UPDATE monthly_enquiries SET month = COALESCE(?, month), year = COALESCE(?, year), value = ? WHERE id = ?',
    [month, year, value, id],
    function (err) {
      if (err) {
        console.error('DB ERROR (Monthly Enquiry):', err);
        return res.status(500).json({ error: 'Failed to update enquiry' });
      }
      res.json({ message: 'Enquiry updated successfully', changes: this.changes });
    }
  );
});

// Get recent daily enquiries
router.get('/daily', (req, res) => {
  db.all('SELECT * FROM daily_enquiries ORDER BY date DESC LIMIT 30', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error fetching daily enquiries' });
    }
    res.json(rows);
  });
});

// Get the most recent daily enquiry (or the one set by display_date)
router.get('/latest', (req, res) => {
  db.get('SELECT value FROM settings WHERE key = ?', ['display_date'], (err, row: any) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error fetching display_date' });
    }

    const displayDate = row?.value;

    if (displayDate) {
      db.get('SELECT * FROM daily_enquiries WHERE date = ?', [displayDate], (err2, row2: any) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ error: 'Database error fetching daily enquiry for display_date' });
        }
        if (row2) {
          return res.json(row2);
        }
        // Fallback to latest if displayDate not found in daily_enquiries
        fetchActualLatest(res);
      });
    } else {
      fetchActualLatest(res);
    }
  });
});

function fetchActualLatest(res: any) {
  db.get('SELECT * FROM daily_enquiries ORDER BY date DESC LIMIT 1', (err, row: any) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) return res.json({ date: new Date().toISOString().split('T')[0], value: 0 });
    res.json(row);
  });
}

// Get enquiry value for a specific date
router.get('/date/:date', (req, res) => {
  const { date } = req.params;
  db.get('SELECT value FROM daily_enquiries WHERE date = ?', [date], (err, row: any) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ date, value: row ? row.value : 0 });
  });
});

// Get today's enquiry value
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.get('SELECT value FROM daily_enquiries WHERE date = ?', [today], (err, row: any) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ date: today, value: row ? row.value : 0 });
  });
});

// Update a specific daily enquiry (Protected)
router.put('/daily/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { value } = req.body;

  if (value === undefined || typeof value !== 'number') {
    return res.status(400).json({ error: 'Valid value number is required' });
  }

  db.run(
    'UPDATE daily_enquiries SET value = ? WHERE id = ?',
    [value, id],
    function (err) {
      if (err) {
        console.error('DB ERROR (Update Daily):', err);
        return res.status(500).json({ error: 'Failed to update daily enquiry' });
      }
      
      // Update display_date setting if we can find the date for this ID
      db.get('SELECT date FROM daily_enquiries WHERE id = ?', [id], (err2, row: any) => {
        if (!err2 && row) {
          db.run('UPDATE settings SET value = ? WHERE key = ?', [row.date, 'display_date']);
        }
      });
      
      res.json({ message: 'Daily enquiry updated successfully', changes: this.changes });
    }
  );
});

// Create or update today's enquiry
router.post('/daily', authenticate, (req, res) => {
  const { date, value } = req.body;
  if (!date || value === undefined || typeof value !== 'number') {
    return res.status(400).json({ error: 'Date and valid value number are required' });
  }

  // Use separate update then insert if not found, for maximum SQLite compatibility
  db.run('UPDATE daily_enquiries SET value = ? WHERE date = ?', [value, date], function(err) {
    if (err) {
      console.error('DB ERROR (Update fallback):', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      db.run('INSERT INTO daily_enquiries (date, value) VALUES (?, ?)', [date, value], function(err2) {
        if (err2) {
          console.error('DB ERROR (Insert fallback):', err2);
          return res.status(500).json({ error: 'Failed to save daily enquiry' });
        }
        // Update display_date setting
        db.run('UPDATE settings SET value = ? WHERE key = ?', [date, 'display_date']);
        res.json({ message: 'Daily enquiry created successfully', id: this.lastID });
      });
    } else {
      // Update display_date setting
      db.run('UPDATE settings SET value = ? WHERE key = ?', [date, 'display_date']);
      res.json({ message: 'Daily enquiry updated successfully' });
    }
  });
});

export default router;
