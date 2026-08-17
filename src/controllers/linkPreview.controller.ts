import { Request, Response } from 'express';
import { getPreviewImage } from '../services/linkPreview.service';

// GET /api/link-preview?url=...  ->  { image: string | null }
export const getLinkPreview = async (req: Request, res: Response): Promise<void> => {
  const url = typeof req.query.url === 'string' ? req.query.url : '';
  if (!url) {
    res.status(400).json({ image: null, error: 'Missing url query param' });
    return;
  }
  try {
    const image = await getPreviewImage(url);
    res.json({ image });
  } catch (error: any) {
    res.status(500).json({ image: null, error: error.message });
  }
};
