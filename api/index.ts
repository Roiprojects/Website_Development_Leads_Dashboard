export default function(req: any, res: any) {
  res.status(200).json({ status: 'ok', message: 'plain response with no imports' });
}
