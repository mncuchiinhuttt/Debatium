import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import * as env from '$env/static/private';
import { db } from '$lib/server/db';
import { aiSession } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Initialize the OpenAI client pointing to Valsea
const client = new OpenAI({
  apiKey: (env as any).VALSEA_API_KEY,
  baseURL: 'https://api.valsea.app/v1',
});

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const formData = await request.formData();
	const audioFile = formData.get('audio') as File;
	const sessionId = formData.get('sessionId') as string;

	if (!audioFile || !sessionId) {
		return json({ error: 'Audio file and session ID are required' }, { status: 400 });
	}

	// Double check session belongs to user
	const session = await db.query.aiSession.findFirst({
		where: eq(aiSession.id, sessionId)
	});

	if (!session || session.userId !== locals.user.id) {
		return json({ error: 'Session not found or permission denied' }, { status: 404 });
	}

	try {
		const transcription = await client.audio.transcriptions.create({
			file: audioFile,
			model: 'valsea-transcribe',
			language: session.language === 'vi' ? 'vietnamese' : 'english',
			// @ts-expect-error -- extra body params supported by the API
			enable_correction: true,
			enable_tags: true,
			response_format: 'json',
		});

		return json({ text: transcription.text });
	} catch (error: any) {
		console.error('Transcription Error:', error);
		return json({ error: error.message || 'Failed to transcribe audio' }, { status: 500 });
	}
};
