import app from '../backend/src/index';

export default function(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    return res.status(200).json({ status: 'caught error', message: err.message, stack: err.stack });
  }
}
