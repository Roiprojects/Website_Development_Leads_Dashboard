export default async function(req, res) {
  try {
    const module = await import('../backend/src/index.ts');
    const app = module.default || module;
    return app(req, res);
  } catch (error) {
    console.error('Initialization Error:', error);
    res.status(500).json({ error: 'Initialization Error', details: error.toString(), stack: error.stack });
  }
}
