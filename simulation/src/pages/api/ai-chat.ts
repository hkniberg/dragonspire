import type { NextApiRequest, NextApiResponse } from 'next';
import { Claude } from '../../lib/llm';

type Data = {
    response?: string;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { systemPrompt, userMessage } = req.body;

        if (!userMessage) {
            return res.status(400).json({ error: 'userMessage is required' });
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'ANTHROPIC_API_KEY environment variable is not set' });
        }

        const claude = new Claude(apiKey);
        const response = await claude.simpleChat(systemPrompt || null, userMessage);

        res.status(200).json({ response });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
} 