import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = 'https://tjqbssbilioanqndsuyo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcWJzc2JpbGlvYW5xbmRzdXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODc2NjYsImV4cCI6MjA4ODg2MzY2Nn0.MFCLd5F15EzKx2b2wUKlCIcS5nyd8k81uAulIZl3_yo';
const supabase = createClient(supabaseUrl, supabaseKey);
const JWT_SECRET = 'your-secret-key-123';

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { data, error } = await supabase
            .from('leads_dashboard_users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !data) return res.status(401).json({ error: 'User not found' });
        
        const valid = await bcrypt.compare(password, data.password);
        if (!valid) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: data.id, username: data.username }, JWT_SECRET);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Auth failed' });
    }
});

// Records Routes
app.get('/api/records', async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;
    try {
        let query = supabase.from('leads_dashboard_records').select('*', { count: 'exact' });
        
        if (search) query = query.ilike('name', `%${search}%`);
        
        const { data, error, count } = await query
            .order('date', { ascending: false })
            .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);

        if (error) throw error;
        res.json({ records: data, total: count, totalPages: Math.ceil((count || 0) / Number(limit)) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch records' });
    }
});

app.post('/api/records', async (req, res) => {
    try {
        const { data, error } = await supabase.from('leads_dashboard_records').insert([req.body]).select();
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add record' });
    }
});

app.put('/api/records/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('leads_dashboard_records').update(req.body).eq('id', req.params.id).select();
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update record' });
    }
});

app.delete('/api/records/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('leads_dashboard_records').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

// Settings Routes
app.get('/api/settings', async (req, res) => {
    try {
        const { data, error } = await supabase.from('leads_dashboard_settings').select('*');
        if (error) throw error;
        const settings: any = {};
        data.forEach(s => settings[s.key] = s.value);
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const { project_title, total_enquiries_override } = req.body;
        const updates = [
            { key: 'project_title', value: project_title?.toString() },
            { key: 'total_enquiries_override', value: total_enquiries_override?.toString() }
        ];
        
        for (const item of updates) {
            await supabase.from('leads_dashboard_settings').upsert(item);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Enquiries Routes
app.get('/api/enquiries/latest', async (req, res) => {
    try {
        const { data, error } = await supabase.from('leads_dashboard_enquiries').select('*').order('date', { ascending: false }).limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || { value: 0, date: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch latest enquiry' });
    }
});

app.get('/api/enquiries', async (req, res) => {
    try {
        const { data, error } = await supabase.from('leads_dashboard_enquiries').select('*').order('date', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch enquiries' });
    }
});

export default app;
