import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://lqckmlexslwrdfotsbxx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxY2ttbGV4c2x3cmRmb3RzYnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NDI5ODIsImV4cCI6MjA4ODAxODk4Mn0.wsrqknhCHjmp_GpXalAIDy9q18fA-c8MWz3QRnyk3_g';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const db = new Database('database.sqlite');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS recurring_invoices (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  INSERT OR IGNORE INTO settings (key, value) VALUES ('last_invoice_number', '0');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Clients
  app.get('/api/clients', async (req, res) => {
    if (supabase) {
      const { data, error } = await supabase.from('clients').select('data');
      if (error) return res.status(500).json({ error: error.message });
      res.json(data.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data));
    } else {
      const rows = db.prepare('SELECT data FROM clients').all() as { data: string }[];
      res.json(rows.map(r => JSON.parse(r.data)));
    }
  });

  app.post('/api/clients', async (req, res) => {
    const client = req.body;
    if (supabase) {
      const { error } = await supabase.from('clients').upsert({ id: client.id, data: client });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } else {
      db.prepare('INSERT OR REPLACE INTO clients (id, data) VALUES (?, ?)').run(client.id, JSON.stringify(client));
      res.json({ success: true });
    }
  });

  app.delete('/api/clients/:id', async (req, res) => {
    if (supabase) {
      const { error } = await supabase.from('clients').delete().eq('id', req.params.id);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } else {
      db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    }
  });

  // Recurring Invoices
  app.get('/api/recurring', async (req, res) => {
    if (supabase) {
      const { data, error } = await supabase.from('recurring_invoices').select('data');
      if (error) return res.status(500).json({ error: error.message });
      res.json(data.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data));
    } else {
      const rows = db.prepare('SELECT data FROM recurring_invoices').all() as { data: string }[];
      res.json(rows.map(r => JSON.parse(r.data)));
    }
  });

  app.post('/api/recurring', async (req, res) => {
    const profile = req.body;
    if (supabase) {
      const { error } = await supabase.from('recurring_invoices').upsert({ id: profile.id, data: profile });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } else {
      db.prepare('INSERT OR REPLACE INTO recurring_invoices (id, data) VALUES (?, ?)').run(profile.id, JSON.stringify(profile));
      res.json({ success: true });
    }
  });

  app.delete('/api/recurring/:id', async (req, res) => {
    if (supabase) {
      const { error } = await supabase.from('recurring_invoices').delete().eq('id', req.params.id);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } else {
      db.prepare('DELETE FROM recurring_invoices WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    }
  });

  // Settings / Invoice Number
  app.get('/api/settings/invoice-number', async (req, res) => {
    if (supabase) {
      const { data, error } = await supabase.from('settings').select('value').eq('key', 'last_invoice_number').single();
      if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
      res.json({ value: data?.value || '0' });
    } else {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('last_invoice_number') as { value: string };
      res.json({ value: row?.value || '0' });
    }
  });

  app.post('/api/settings/invoice-number', async (req, res) => {
    const { value } = req.body;
    if (supabase) {
      const { error } = await supabase.from('settings').upsert({ key: 'last_invoice_number', value: value.toString() });
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true });
    } else {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_invoice_number', value.toString());
      res.json({ success: true });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
