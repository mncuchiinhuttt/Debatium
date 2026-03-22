import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { aiSession, aiMessage } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import * as env from '$env/static/private';

// Initialize the generic OpenAI client pointing to OpenAI (as requested for gpt-5-mini)
const client = new OpenAI({
  apiKey: (env as any).OPENAI_API_KEY,
});

async function translateValsea(text: string, source: 'vietnamese' | 'english', target: 'vietnamese' | 'english') {
	const response = await fetch('https://api.valsea.app/v1/translations', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${(env as any).VALSEA_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: 'valsea-translate',
			text: text,
			source: source,
			target: target,
		}),
	});
	if (!response.ok) {
		console.error(`Valsea translation failed: ${await response.text()}`);
		return text; // fallback to original text
	}
	const data = await response.json();
	// Extract translated text
	const translatedText = data.text || data.translated_text || data.translation || data?.data?.translations?.[0]?.translatedText || data?.translations?.[0]?.text;
	return translatedText || text;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const { sessionId, messages } = body;

	if (!sessionId || !messages || !Array.isArray(messages)) {
		return json({ error: 'Session ID and a messages array are required' }, { status: 400 });
	}

	const session = await db.query.aiSession.findFirst({
		where: eq(aiSession.id, sessionId)
	});

	if (!session || session.userId !== locals.user.id) {
		return json({ error: 'Session not found or permission denied' }, { status: 404 });
	}

	// Always append user message to database
	const lastUserMessage = messages[messages.length - 1];
	let userText = lastUserMessage.content;
	
	if (lastUserMessage.role === 'user') {
		await db.insert(aiMessage).values({
			sessionId,
			role: 'user',
			content: userText
		});
	}

	// 1. If Vietnamese, translate User input to English first
	if (session.language === 'vi') {
		userText = await translateValsea(userText, 'vietnamese', 'english');
	}

	// 2. Prepare context for gpt-5-mini
	const historyText = messages.slice(0, -1).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
	const systemPrompt = `You are an expert debater sparring with the user on the topic: "${session.topic}". 
Your goal is to provide logical, persuasive, and directly opposed counter-arguments to everything they say.
Do not be overly polite; focus firmly on deconstructing their argument and establishing yours.
Keep your responses punchy and impactful (1-2 paragraphs).`;

	const constructedInput = `${systemPrompt}\n\nDebate history:\n${historyText}\n\nUSER: ${userText}\nASSISTANT:`;

	try {
		// 3. Call gpt-5-mini
		let aiText = '';
		
		try {
			const response: any = await (client as any).responses.create({
				model: "gpt-5-mini",
				input: constructedInput
			});

			// Extract text based on provided sample structure
			if (response.output_text) {
				aiText = response.output_text;
			} else if (Array.isArray(response) && response[0]?.content?.[0] && response[0].content[0].type === 'output_text') {
				aiText = response[0].content[0].text;
			} else {
				aiText = JSON.stringify(response); // worst case fallback
			}
		} catch (apiErr: any) {
			console.error("GPT-5-mini generation mapping error:", apiErr);
			aiText = 'I am currently offline or experiencing issues processing your debate points.';
		}

		// 4. If Vietnamese, translate AI output back to Vietnamese
		if (session.language === 'vi') {
			aiText = await translateValsea(aiText, 'english', 'vietnamese');
		}

		// Save AI response to database
		await db.insert(aiMessage).values({
			sessionId,
			role: 'assistant',
			content: aiText
		});

		// Return JSON since it's no longer a stream
		return json({ text: aiText });
	} catch (error: any) {
		console.error('AI Chat Error:', error);
		return json({ error: error.message || 'Error communicating with AI service' }, { status: 500 });
	}
};
