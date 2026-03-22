<script lang="ts">
	import { X, CalendarDays, Users, Tag, ChevronDown } from 'lucide-svelte';
	import { Select } from 'bits-ui';

	let {
		open = $bindable(false),
		onCreated
	}: { open: boolean; onCreated?: () => void } = $props();

	let title = $state('');
	let description = $state('');
	let format = $state('Oxford');
	let level = $state('Intermediate');
	let maxParticipants = $state(6);
	let scheduledAt = $state('');
	let tagsInput = $state('');
	let loading = $state(false);
	let error = $state('');

	const formats = ['Oxford', 'Lincoln-Douglas', 'Parliamentary', 'Cross-Examination'];
	const levels = ['Beginner', 'Intermediate', 'Advanced'];

	function close() {
		open = false;
		resetForm();
	}

	function resetForm() {
		title = '';
		description = '';
		format = 'Oxford';
		level = 'Intermediate';
		maxParticipants = 6;
		scheduledAt = '';
		tagsInput = '';
		error = '';
	}

	async function handleCreate() {
		if (!title.trim()) {
			error = 'Title is required';
			return;
		}
		if (!scheduledAt) {
			error = 'Scheduled time is required';
			return;
		}

		loading = true;
		error = '';

		const tags = tagsInput
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);

		const res = await fetch('/api/spars', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: title.trim(),
				description: description.trim(),
				format,
				level,
				maxParticipants,
				scheduledAt,
				tags
			})
		});

		if (!res.ok) {
			const data = await res.json();
			error = data.error || 'Failed to create spar';
			loading = false;
			return;
		}

		loading = false;
		close();
		onCreated?.();
	}
</script>

{#if open}
	<div class="dialog-overlay" role="dialog" aria-modal="true">
		<button class="absolute inset-0" onclick={close} aria-label="Close"></button>
		<div class="dialog-content p-6">
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<h2 class="font-display text-xl font-bold text-surface-50">Create a Spar</h2>
				<button
					onclick={close}
					class="rounded-lg p-1.5 text-surface-400 transition hover:bg-surface-800 hover:text-surface-200"
				>
					<X size={18} />
				</button>
			</div>

			{#if error}
				<div class="mb-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
					{error}
				</div>
			{/if}

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreate();
				}}
				class="space-y-4"
			>
				<!-- Title -->
				<div>
					<label for="spar-title" class="mb-1.5 block text-sm font-medium text-surface-300">Title</label>
					<input
						id="spar-title"
						type="text"
						bind:value={title}
						placeholder="e.g. AI Ethics in Modern Society"
						class="w-full rounded-xl border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
					/>
				</div>

				<!-- Description -->
				<div>
					<label for="spar-desc" class="mb-1.5 block text-sm font-medium text-surface-300">Description <span class="text-surface-500">(optional)</span></label>
					<textarea
						id="spar-desc"
						bind:value={description}
						rows={3}
						placeholder="Describe the debate topic and any rules..."
						class="w-full resize-none rounded-xl border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
					></textarea>
				</div>

				<!-- Format + Level row -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="spar-format" class="mb-1.5 block text-sm font-medium text-surface-300">Format</label>
						<Select.Root type="single" bind:value={format}>
							<Select.Trigger id="spar-format" class="flex w-full items-center justify-between rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
								{format}
								<ChevronDown size={14} class="text-surface-400" />
							</Select.Trigger>
							<Select.Content class="z-50 w-[--bits-select-anchor-width] rounded-xl border border-surface-700 bg-surface-800 p-1 shadow-lg shadow-black/20 outline-none">
								{#each formats as f}
									<Select.Item value={f} class="relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-3 pr-2 text-sm text-surface-200 outline-none transition hover:bg-surface-700 hover:text-surface-50 data-highlighted:bg-surface-700 data-highlighted:text-surface-50">
										{f}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div>
						<label for="spar-level" class="mb-1.5 block text-sm font-medium text-surface-300">Level</label>
						<Select.Root type="single" bind:value={level}>
							<Select.Trigger id="spar-level" class="flex w-full items-center justify-between rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
								{level}
								<ChevronDown size={14} class="text-surface-400" />
							</Select.Trigger>
							<Select.Content class="z-50 w-[--bits-select-anchor-width] rounded-xl border border-surface-700 bg-surface-800 p-1 shadow-lg shadow-black/20 outline-none">
								{#each levels as l}
									<Select.Item value={l} class="relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-3 pr-2 text-sm text-surface-200 outline-none transition hover:bg-surface-700 hover:text-surface-50 data-highlighted:bg-surface-700 data-highlighted:text-surface-50">
										{l}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<!-- Max participants + Scheduled -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="spar-max" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-surface-300">
							<Users size={14} />
							Max Participants
						</label>
						<input
							id="spar-max"
							type="number"
							min={2}
							max={20}
							bind:value={maxParticipants}
							class="w-full rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500"
						/>
					</div>
					<div>
						<label for="spar-date" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-surface-300">
							<CalendarDays size={14} />
							Date & Time
						</label>
						<input
							id="spar-date"
							type="datetime-local"
							bind:value={scheduledAt}
							class="w-full rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500"
						/>
					</div>
				</div>

				<!-- Tags -->
				<div>
					<label for="spar-tags" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-surface-300">
						<Tag size={14} />
						Tags <span class="text-surface-500">(comma separated)</span>
					</label>
					<input
						id="spar-tags"
						type="text"
						bind:value={tagsInput}
						placeholder="e.g. Technology, Ethics, AI"
						class="w-full rounded-xl border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
					/>
				</div>

				<!-- Submit -->
				<button
					type="submit"
					disabled={loading}
					class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if loading}
						<div class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
					{:else}
						<span>Create Spar</span>
					{/if}
				</button>
			</form>
		</div>
	</div>
{/if}
