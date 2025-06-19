import Therapist from '../models/Therapist';
import type { Request, Response } from 'express';

export const createTherapist = async (req: Request, res: Response) => {
  try {
    const therapist = new Therapist(req.body);
    await therapist.save();
    res.status(201).json(therapist);
  } catch (err: any) {
    console.error("Therapist creation error:", err);
res.status(500).json({ error: err.message });

  }
};

export const getTherapists = async (req: Request, res: Response) => {
  try {
    const therapists = await Therapist.find().populate('userId');
    res.status(200).json(therapists);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
};
