import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import * as env from '$env/static/private';

// Initialize OpenAI for TTS. We use the standard OpenAI client here.
const openai = new OpenAI({
	apiKey: (env as any).OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { text, voice = 'coral' } = await request.json().catch(() => ({}));

	if (!text) {
		return json({ error: 'Text is required for TTS' }, { status: 400 });
	}

	try {
		const mp3 = await openai.audio.speech.create({
			model: "gpt-4o-mini-tts" as any, 
			voice: voice as any,
			input: text,
			// @ts-ignore
			instructions: "Speak in a cheerful and positive tone."
		});

		const buffer = Buffer.from(await mp3.arrayBuffer());

		return new Response(buffer, {
			headers: {
				'Content-Type': 'audio/mpeg'
			}
		});
	} catch (error: any) {
		console.error('TTS Error:', error);
		return json({ error: error.message || 'Failed to synthesize speech' }, { status: 500 });
	}
};
