import type { Request, Response } from 'express';
import Chat from '../models/Chat'; // if you created this model

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const userId = (req as any).user?.id; // comes from verifyToken middleware

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fake AI response (for now)
    const aiResponse = `You said: ${message}. Here’s a calming tip: take a deep breath! 🧘‍♀️`;

    const chat = new Chat({
      userId,
      message,
      response: aiResponse,
      timestamp: new Date(),
    });

    await chat.save();

    res.status(201).json(chat);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process message' });
  }
};
