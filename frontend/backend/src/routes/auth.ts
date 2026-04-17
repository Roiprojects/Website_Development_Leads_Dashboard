import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database';

const router = Router();
export const JWT_SECRET = 'super-secret-dashboard-key';

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user: any) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { username: user.username } });
  });
});

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('AUTH FAILURE: No token provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).user = payload;
    next();
  } catch (error: any) {
    console.log('AUTH FAILURE: Invalid/Expired token -', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.put('/reset-password', authenticate, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as any).user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' }) as any;
  }

  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user: any) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    db.run(`UPDATE users SET password = ? WHERE id = ?`, [hash, userId], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update password' });
      res.json({ message: 'Password updated successfully' });
    });
  });
});

router.post('/recover-password', (req: Request, res: Response) => {
  const { username, recoveryKey, newPassword } = req.body; // recoveryKey will now be the PIN

  if (!username || !recoveryKey || !newPassword) {
    return res.status(400).json({ error: 'Username, recovery PIN, and new password are required' }) as any;
  }

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user: any) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (recoveryKey !== user.recovery_pin) {
      return res.status(401).json({ error: 'Invalid recovery PIN' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    db.run(`UPDATE users SET password = ? WHERE id = ?`, [hash, user.id], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to update password' });
      res.json({ message: 'Password recovered successfully' });
    });
  });
});

// Update Recovery PIN (Protected)
router.put('/update-pin', authenticate, (req: Request, res: Response) => {
  const { newPin } = req.body;
  const userId = (req as any).user.id;

  if (!newPin) {
    return res.status(400).json({ error: 'New PIN is required' });
  }

  db.run(`UPDATE users SET recovery_pin = ? WHERE id = ?`, [newPin, userId], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to update recovery PIN' });
    res.json({ message: 'Recovery PIN updated successfully' });
  });
});

export default router;
