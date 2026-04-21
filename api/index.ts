import app from '../backend/src/index';

export default function(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    return res.status(200).json({ 
      error: 'Caught during execution', 
      message: err.message, 
      stack: err.stack 
    });
  }
}
