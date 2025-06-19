import express from 'express';
import { createAppointment, getAppointments } from '../controllers/appointmentController.ts';

const router = express.Router();

router.post('/', createAppointment);     // Book an appointment
router.get('/', getAppointments);        // View all appointments

export default router;
