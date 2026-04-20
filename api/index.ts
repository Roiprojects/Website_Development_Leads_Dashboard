export default function(req: any, res: any) {
  try {
    const backendApp = require('../backend/src/index').default || require('../backend/src/index');
    return backendApp(req, res);
  } catch (error: any) {
    res.status(200).json({ error: 'Global Vercel Error', message: error.message, stack: error.stack });
  }
}

