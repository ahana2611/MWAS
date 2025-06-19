import express from 'express';
import { createTherapist, getTherapists } from '../controllers/therapistController';

const router = express.Router();

router.post('/', createTherapist);
router.get('/', getTherapists);

export default router; 