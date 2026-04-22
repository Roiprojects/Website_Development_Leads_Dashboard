import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjqbssbilioanqndsuyo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcWJzc2JpbGlvYW5xbmRzdXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODc2NjYsImV4cCI6MjA4ODg2MzY2Nn0.MFCLd5F15EzKx2b2wUKlCIcS5nyd8k81uAulIZl3_yo';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
    try {
        if (req.url.includes('/api/records')) {
            const { data, error } = await supabase
                .from('leads_dashboard_records')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.url.includes('/api/settings')) {
            const { data, error } = await supabase
                .from('leads_dashboard_settings')
                .select('*');

            if (error) throw error;
            const settings: any = {};
            data.forEach((s: any) => settings[s.key] = s.value);
            return res.status(200).json(settings);
        }

        return res.status(200).json({ status: 'API Online', message: 'Endpoint matched but route not specific' });
    } catch (err: any) {
        return res.status(200).json({ error: 'Serverless Runtime Error', message: err.message });
    }
}
