import express from 'express';
import { sendMessage } from '../controllers/chatController';
import { verifyToken } from '../middleware/auth';
const router = express.Router();

router.post('/', verifyToken, sendMessage);

export default router;
