import type { Request, Response } from 'express';
import Appointment from '../models/Appointment';

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};
