<script lang="ts">
	import { User, Award, MessageSquare, Tag, Save, Check, Plus, Trash2, X, ChevronDown, Gavel } from 'lucide-svelte';
	import type { Honor } from '$lib/server/db/schema';
	import { Select } from 'bits-ui';

	let { data } = $props();

	let bio = $state(data.profile?.bio || '');
	let experienceLevel = $state(data.profile?.experienceLevel || 'Beginner');
	let preferredFormats = $state<string[]>(data.profile?.preferredFormats || []);
	let interests = $state(data.profile?.interests?.join(', ') || '');
	let honors = $state<Honor[]>(data.profile?.honors || []);
	
	let showHonorForm = $state(false);
	let newHonor = $state<Partial<Honor>>({
		id: crypto.randomUUID(),
		role: 'debater',
		scale: 'Local',
		format: 'Oxford',
		year: new Date().getFullYear()
	});

	let saving = $state(false);
	let saved = $state(false);

	const allFormats = ['Oxford', 'Lincoln-Douglas', 'Parliamentary', 'Cross-Examination'];
	const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

	function toggleFormat(f: string) {
		if (preferredFormats.includes(f)) {
			preferredFormats = preferredFormats.filter((x) => x !== f);
		} else {
			preferredFormats = [...preferredFormats, f];
		}
	}

	function handleAddHonor() {
		if (!newHonor.tournamentName) return;
		honors.push({ ...newHonor, id: crypto.randomUUID() } as Honor);
		showHonorForm = false;
		newHonor = {
			id: crypto.randomUUID(),
			role: 'debater',
			scale: 'Local',
			format: 'Oxford',
			year: new Date().getFullYear()
		};
	}

	function removeHonor(id: string) {
		honors = honors.filter((h) => h.id !== id);
	}

	async function handleSave() {
		saving = true;
		saved = false;

		const interestsArr = interests
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);

		await fetch('/api/profile', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				bio,
				experienceLevel,
				preferredFormats,
				interests: interestsArr,
				honors
			})
		});

		saving = false;
		saved = true;
		setTimeout(() => (saved = false), 3000);
	}
</script>

<div class="mx-auto max-w-3xl space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="font-display text-2xl font-bold text-surface-50">Debating Profile</h1>
			<p class="text-sm text-surface-400">Set up your debating identity and preferences</p>
		</div>
	</div>

	<!-- Avatar + Basic info -->
	<section class="rounded-2xl border border-surface-800 bg-surface-900 p-6">
		<div class="flex items-center gap-4 mb-6">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
				{data.user.name?.charAt(0)?.toUpperCase() || '?'}
			</div>
			<div>
				<h2 class="font-display text-lg font-semibold text-surface-100">{data.user.name}</h2>
				<p class="text-sm text-surface-500">{data.user.email}</p>
			</div>
		</div>

		<!-- Bio -->
		<div class="mb-5">
			<label for="bio" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-surface-300">
				<MessageSquare size={14} />
				Bio
			</label>
			<textarea
				id="bio"
				bind:value={bio}
				rows={3}
				placeholder="Tell others about your debating style and experience..."
				class="w-full resize-none rounded-xl border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
			></textarea>
		</div>

		<!-- Experience Level -->
		<div class="mb-5">
			<label class="mb-2 flex items-center gap-1.5 text-sm font-medium text-surface-300">
				<Award size={14} />
				Experience Level
			</label>
			<div class="flex flex-wrap gap-2">
				{#each levels as lvl}
					<button
						onclick={() => (experienceLevel = lvl)}
						class="rounded-xl border px-4 py-2 text-sm font-medium transition
						{experienceLevel === lvl
							? 'border-primary-500 bg-primary-600/15 text-primary-400'
							: 'border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600 hover:text-surface-200'}"
					>
						{lvl}
					</button>
				{/each}
			</div>
		</div>

		<!-- Preferred Formats -->
		<div class="mb-5">
			<label class="mb-2 flex items-center gap-1.5 text-sm font-medium text-surface-300">
				<User size={14} />
				Preferred Debate Formats
			</label>
			<div class="flex flex-wrap gap-2">
				{#each allFormats as fmt}
					<button
						onclick={() => toggleFormat(fmt)}
						class="rounded-xl border px-4 py-2 text-sm font-medium transition
						{preferredFormats.includes(fmt)
							? 'border-primary-500 bg-primary-600/15 text-primary-400'
							: 'border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600 hover:text-surface-200'}"
					>
						{fmt}
					</button>
				{/each}
			</div>
		</div>

		<!-- Interests -->
		<div class="mb-5">
			<label for="interests" class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-surface-300">
				<Tag size={14} />
				Debate Interests
				<span class="text-surface-500">(comma separated)</span>
			</label>
			<input
				id="interests"
				type="text"
				bind:value={interests}
				placeholder="e.g. Technology, Ethics, Politics, Education"
				class="w-full rounded-xl border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
			/>
		</div>

		<!-- Honors -->
		<div class="mb-6">
			<label class="mb-2 flex items-center justify-between text-sm font-medium text-surface-300">
				<div class="flex items-center gap-1.5">
					<Award size={14} />
					Debating Honors & Achievements
				</div>
				{#if !showHonorForm}
					<button
						onclick={() => (showHonorForm = true)}
						class="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
					>
						<Plus size={14} /> Add Honor
					</button>
				{/if}
			</label>

			<div class="space-y-3">
				{#each honors as honor}
					<div class="flex items-start justify-between rounded-xl border border-surface-700 bg-surface-800/50 p-3">
						<div>
							<div class="flex items-center gap-2">
								<h4 class="font-medium text-surface-100">{honor.tournamentName} ({honor.year})</h4>
								<span class="rounded bg-surface-700 px-1.5 py-0.5 text-[10px] uppercase text-surface-400">{honor.role}</span>
							</div>
							<p class="mt-0.5 text-xs text-surface-400">
								{honor.scale} Level • {honor.format}
							</p>
							{#if honor.role === 'debater' && (honor.breakingRank || honor.achievements)}
								<p class="mt-1 text-xs text-primary-300/80">
									{honor.breakingRank || ''} {honor.achievements ? `• ${honor.achievements}` : ''}
								</p>
							{:else if honor.role === 'judge' && (honor.judgeType || honor.highestRank)}
								<p class="mt-1 text-xs text-accent-400/80">
									{honor.judgeType || ''} {honor.highestRank ? `• Highest Rank: ${honor.highestRank}` : ''}
								</p>
							{/if}
						</div>
						<button
							onclick={() => removeHonor(honor.id)}
							class="rounded-lg p-1.5 text-surface-500 hover:bg-danger/10 hover:text-danger"
						>
							<Trash2 size={16} />
						</button>
					</div>
				{/each}

				{#if honors.length === 0 && !showHonorForm}
					<div class="rounded-xl border border-dashed border-surface-700 p-6 text-center">
						<p class="text-sm text-surface-500">No honors added yet.</p>
					</div>
				{/if}

				{#if showHonorForm}
					<div class="rounded-xl border border-primary-500/30 bg-primary-900/10 p-4">
						<div class="mb-4 flex items-center justify-between">
							<h4 class="text-sm font-medium text-surface-200">New Honor/Achievement</h4>
							<button onclick={() => (showHonorForm = false)} class="text-surface-500 hover:text-surface-300">
								<X size={16} />
							</button>
						</div>

						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div class="sm:col-span-2">
								<label class="mb-1 block text-xs text-surface-400">Tournament Name *</label>
								<input
									type="text"
									bind:value={newHonor.tournamentName}
									class="w-full rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
									placeholder="e.g. World Universities Debating Championship"
								/>
							</div>

							<div>
								<label class="mb-1 block text-xs text-surface-400">Year</label>
								<input
									type="number"
									bind:value={newHonor.year}
									class="w-full rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
								/>
							</div>

							<div>
								<label class="mb-1 block text-xs text-surface-400">Scale</label>
								<Select.Root type="single" bind:value={newHonor.scale}>
									<Select.Trigger class="flex w-full items-center justify-between rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
										<span class="capitalize">{newHonor.scale}</span>
										<ChevronDown size={14} class="text-surface-400" />
									</Select.Trigger>
									<Select.Content class="z-50 w-[--bits-select-anchor-width] rounded-xl border border-surface-700 bg-surface-800 p-1 shadow-lg shadow-black/20 outline-none">
										{#each ['Local', 'National', 'International'] as scale}
											<Select.Item value={scale} class="relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-surface-200 outline-none transition hover:bg-surface-700 hover:text-surface-50 data-highlighted:bg-surface-700 data-highlighted:text-surface-50">
												{scale}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>

							<div>
								<label class="mb-1 block text-xs text-surface-400">Format</label>
								<Select.Root type="single" bind:value={newHonor.format}>
									<Select.Trigger class="flex w-full items-center justify-between rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
										<span>{newHonor.format}</span>
										<ChevronDown size={14} class="text-surface-400" />
									</Select.Trigger>
									<Select.Content class="z-50 max-h-48 w-[--bits-select-anchor-width] overflow-y-auto rounded-xl border border-surface-700 bg-surface-800 p-1 shadow-lg shadow-black/20 outline-none">
										{#each [...allFormats, 'Asian Parliamentary', 'British Parliamentary', 'WSDC'] as fmt}
											<Select.Item value={fmt} class="relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-surface-200 outline-none transition hover:bg-surface-700 hover:text-surface-50 data-highlighted:bg-surface-700 data-highlighted:text-surface-50">
												{fmt}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>

							<div>
								<label class="mb-1 block text-xs text-surface-400">Role</label>
								<Select.Root type="single" bind:value={newHonor.role}>
									<Select.Trigger class="flex w-full items-center justify-between rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
										<div class="flex items-center gap-2">
											{#if newHonor.role === 'debater'}
												<MessageSquare size={14} class="text-primary-400" />
											{:else}
												<Gavel size={14} class="text-accent-400" />
											{/if}
											<span class="capitalize">{newHonor.role}</span>
										</div>
										<ChevronDown size={14} class="text-surface-400" />
									</Select.Trigger>
									<Select.Content class="z-50 w-[--bits-select-anchor-width] rounded-xl border border-surface-700 bg-surface-800 p-1 shadow-lg shadow-black/20 outline-none">
										<Select.Item value="debater" class="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-200 outline-none transition hover:bg-surface-700 hover:text-surface-50 data-highlighted:bg-surface-700 data-highlighted:text-surface-50">
											<MessageSquare size={14} class="text-primary-400 opacity-80" />
											Debater
										</Select.Item>
										<Select.Item value="judge" class="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-200 outline-none transition hover:bg-surface-700 hover:text-surface-50 data-highlighted:bg-surface-700 data-highlighted:text-surface-50">
											<Gavel size={14} class="text-accent-400 opacity-80" />
											Judge
										</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>

							{#if newHonor.role === 'debater'}
								<div>
									<label class="mb-1 block text-xs text-surface-400">Breaking Rank</label>
									<input
										type="text"
										bind:value={newHonor.breakingRank}
										class="w-full rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
										placeholder="e.g. Octofinalist, Champion"
									/>
								</div>
								<div>
									<label class="mb-1 block text-xs text-surface-400">Achievements</label>
									<input
										type="text"
										bind:value={newHonor.achievements}
										class="w-full rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
										placeholder="e.g. 2nd Best Speaker"
									/>
								</div>
							{:else}
								<div>
									<label class="mb-1 block text-xs text-surface-400">Judge Type</label>
									<Select.Root type="single" bind:value={newHonor.judgeType}>
										<Select.Trigger class="flex w-full items-center justify-between rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
											<span class={!newHonor.judgeType ? 'text-surface-500' : ''}>{newHonor.judgeType || 'Select Type'}</span>
											<ChevronDown size={14} class="text-surface-400" />
										</Select.Trigger>
										<Select.Content class="z-50 w-[--bits-select-anchor-width] rounded-xl border border-surface-700 bg-surface-800 p-1 shadow-lg shadow-black/20 outline-none">
											{#each ['Independent Adjudicator', 'Subsidized Adjudicator', 'Invited Adjudicator'] as type}
												<Select.Item value={type} class="relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-surface-200 outline-none transition hover:bg-surface-700 hover:text-surface-50 data-highlighted:bg-surface-700 data-highlighted:text-surface-50">{type}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
								<div>
									<label class="mb-1 block text-xs text-surface-400">Highest Rank</label>
									<Select.Root type="single" bind:value={newHonor.highestRank}>
										<Select.Trigger class="flex w-full items-center justify-between rounded-xl border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
											<span class={!newHonor.highestRank ? 'text-surface-500' : ''}>{newHonor.highestRank || 'Select Rank'}</span>
											<ChevronDown size={14} class="text-surface-400" />
										</Select.Trigger>
										<Select.Content class="z-50 w-[--bits-select-anchor-width] rounded-xl border border-surface-700 bg-surface-800 p-1 shadow-lg shadow-black/20 outline-none">
											{#each ['Trainee', 'Panel', 'Chair'] as rank}
												<Select.Item value={rank} class="relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-surface-200 outline-none transition hover:bg-surface-700 hover:text-surface-50 data-highlighted:bg-surface-700 data-highlighted:text-surface-50">{rank}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
							{/if}
						</div>
						<div class="mt-4 flex justify-end">
							<button
								onclick={handleAddHonor}
								disabled={!newHonor.tournamentName}
								class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500 disabled:opacity-50"
							>
								Add to Profile
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Save -->
		<button
			onclick={handleSave}
			disabled={saving}
			class="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{#if saving}
				<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
				<span>Saving...</span>
			{:else if saved}
				<Check size={16} />
				<span>Saved!</span>
			{:else}
				<Save size={16} />
				<span>Save Profile</span>
			{/if}
		</button>
	</section>
</div>
