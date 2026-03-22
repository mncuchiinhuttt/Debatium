<script lang="ts">
	import { Bot, MessageSquare, Mic, Globe2, Plus, ArrowRight, Play, History, Sparkles } from 'lucide-svelte';
	import { strangeTopics } from '$lib/constants/topics';
	import { enhance } from '$app/forms';
	import { Select } from 'bits-ui';

	let { data, form } = $props();
	
	let creating = $state(false);
	
	// Bits UI select states mapping to hidden inputs
	let language = $state('en');
	let mode = $state('chat');
	let topic = $state('');

	function generateRandomTopic() {
		const lang = language as 'en' | 'vi';
		const options = strangeTopics[lang] || strangeTopics.en;
		topic = options[Math.floor(Math.random() * options.length)];
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short', day: 'numeric', year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>AI Sessions | Debatium</title>
</svelte:head>

<div class="mx-auto max-w-5xl py-8">
	<div class="mb-8 flex items-end justify-between gap-4">
		<div>
			<h1 class="font-display text-3xl font-bold tracking-tight text-surface-50 flex items-center gap-3">
				<Sparkles class="text-primary-500" size={28} />
				AI Sessions
			</h1>
			<p class="mt-2 text-surface-400">Practice your arguments against a master AI debater.</p>
		</div>
	</div>

	<div class="grid gap-8 lg:grid-cols-3">
		<!-- New Session Form -->
		<div class="lg:col-span-1">
			<div class="rounded-2xl border border-surface-800 bg-surface-900/50 p-6 shadow-xl backdrop-blur-xl">
				<h2 class="font-display text-xl font-bold text-surface-50 mb-1">New Session</h2>
				<p class="text-sm text-surface-400 mb-6">Configure your AI opponent</p>

				<form method="POST" action="?/create" use:enhance={() => {
					creating = true;
					return async ({ update }) => {
						creating = false;
						update();
					};
				}} class="space-y-5">
					
					{#if form?.error}
						<div class="rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
							{form.error}
						</div>
					{/if}

					<div>
						<div class="mb-2 flex items-center justify-between">
							<label for="topic" class="text-sm font-semibold text-surface-300">Debate Topic</label>
							<button 
								type="button"
								onclick={generateRandomTopic}
								class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-500 hover:text-primary-400 transition bg-primary-500/5 px-2.5 py-1 rounded-full border border-primary-500/20"
							>
								<Sparkles size={12} />
								Generate Topic
							</button>
						</div>
						<textarea
							id="topic"
							name="topic"
							bind:value={topic}
							rows="3"
							placeholder="e.g., Artificial Intelligence will create more jobs than it destroys."
							required
							class="w-full resize-none rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-3 text-sm text-surface-100 placeholder-surface-500 transition focus:border-primary-500 focus:bg-surface-800 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
						></textarea>
					</div>

					<div>
						<label class="mb-2 block text-sm font-semibold text-surface-300">Language</label>
						<input type="hidden" name="language" value={language} />
						<div class="grid grid-cols-2 gap-3">
							<button 
								type="button"
								onclick={() => language = 'en'}
								class="flex flex-col items-center gap-2 rounded-xl border p-3 transition {language === 'en' ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-surface-700 bg-surface-800/50 text-surface-400 hover:border-surface-600 hover:bg-surface-800'}"
							>
								<Globe2 size={24} />
								<span class="text-sm font-semibold">English</span>
							</button>
							<button 
								type="button"
								onclick={() => language = 'vi'}
								class="flex flex-col items-center gap-2 rounded-xl border p-3 transition {language === 'vi' ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-surface-700 bg-surface-800/50 text-surface-400 hover:border-surface-600 hover:bg-surface-800'}"
							>
								<Globe2 size={24} />
								<span class="text-sm font-semibold">Vietnamese</span>
							</button>
						</div>
					</div>

					<div>
						<label class="mb-2 block text-sm font-semibold text-surface-300">Interface Mode</label>
						<input type="hidden" name="mode" value={mode} />
						<div class="grid grid-cols-2 gap-3">
							<button 
								type="button"
								onclick={() => mode = 'chat'}
								class="flex flex-col items-center gap-2 rounded-xl border p-3 transition {mode === 'chat' ? 'border-accent-500 bg-accent-500/10 text-accent-400' : 'border-surface-700 bg-surface-800/50 text-surface-400 hover:border-surface-600 hover:bg-surface-800'}"
							>
								<MessageSquare size={24} />
								<span class="text-sm font-semibold">Text Chat</span>
							</button>
							<button 
								type="button"
								onclick={() => mode = 'voice'}
								class="flex flex-col items-center gap-2 rounded-xl border p-3 transition {mode === 'voice' ? 'border-accent-500 bg-accent-500/10 text-accent-400' : 'border-surface-700 bg-surface-800/50 text-surface-400 hover:border-surface-600 hover:bg-surface-800'}"
							>
								<Mic size={24} />
								<span class="text-sm font-semibold">Voice Mode</span>
							</button>
						</div>
					</div>

					<div class="pt-2">
						<button
							type="submit"
							disabled={creating}
							class="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-primary-500 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
						>
							{#if creating}
								<div class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
								<span>Connecting to AI...</span>
							{:else}
								<span>Start Debating</span>
								<ArrowRight size={18} class="transition-transform group-hover:translate-x-1" />
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>

		<!-- History -->
		<div class="lg:col-span-2">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-display text-xl font-bold flex items-center gap-2 text-surface-100">
					<History size={20} class="text-surface-400" />
					Previous Sessions
				</h2>
			</div>

			{#if data.sessions.length === 0}
				<div class="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-surface-700 bg-surface-800/20 text-center">
					<Bot size={48} class="mb-4 text-surface-600" />
					<p class="text-lg font-medium text-surface-300">No sessions yet</p>
					<p class="text-sm text-surface-500">Configure a session on the left to start sparring.</p>
				</div>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2">
					{#each data.sessions as session}
						<a 
							href="/app/ai-sessions/{session.id}"
							class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-surface-800 bg-surface-900/50 p-5 transition hover:border-primary-500/50 hover:bg-surface-800 hover:shadow-xl hover:shadow-primary-500/5"
						>
							<div>
								<div class="mb-3 flex items-start justify-between gap-3">
									<div class="flex items-center gap-2">
										<span class="inline-flex items-center gap-1.5 rounded-full bg-surface-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-surface-300">
											{#if session.mode === 'chat'}
												<MessageSquare size={12} class="text-accent-400" /> Text
											{:else}
												<Mic size={12} class="text-accent-400" /> Voice
											{/if}
										</span>
										<span class="inline-flex items-center gap-1.5 rounded-full bg-surface-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-surface-300">
											{#if session.language === 'en'}
												<Globe2 size={12} class="text-primary-400" /> EN
											{:else}
												<Globe2 size={12} class="text-primary-400" /> VI
											{/if}
										</span>
									</div>
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-800 transition group-hover:bg-primary-500 group-hover:text-white text-surface-400">
										<Play size={14} class="ml-0.5" />
									</div>
								</div>
								
								<h3 class="line-clamp-3 text-sm font-semibold leading-relaxed text-surface-100 group-hover:text-primary-100">{session.topic}</h3>
							</div>

							<div class="mt-4 flex items-center gap-2 border-t border-surface-800 pt-4 text-xs font-medium text-surface-500">
								<span>{formatDate(session.createdAt as any)}</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
