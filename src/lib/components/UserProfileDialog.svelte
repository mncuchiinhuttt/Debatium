<script lang="ts">
	import { X, Award, Target, Hash, Info } from 'lucide-svelte';

	let {
		open = $bindable(false),
		userId = ''
	}: { open: boolean; userId: string } = $props();

	let profileData = $state<any>(null);
	let loading = $state(false);
	let error = $state('');

	$effect(() => {
		if (open && userId) {
			loadProfile();
		}
	});

	async function loadProfile() {
		loading = true;
		error = '';
		
		try {
			const res = await fetch(`/api/users/${userId}`);
			if (!res.ok) {
				error = 'Failed to load user profile';
				loading = false;
				return;
			}
			profileData = await res.json();
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}

	function close() {
		open = false;
		profileData = null;
		error = '';
	}
</script>

{#if open}
	<div class="dialog-overlay" role="dialog" aria-modal="true">
		<button class="absolute inset-0" onclick={close} aria-label="Close"></button>
		<div class="dialog-content p-6 max-w-md w-full">
			{#if loading}
				<div class="flex items-center justify-center py-16">
					<div class="h-8 w-8 animate-spin rounded-full border-2 border-primary-500/30 border-t-primary-500"></div>
				</div>
			{:else if error}
				<div class="text-center py-8">
					<p class="text-danger mb-4">{error}</p>
					<button onclick={close} class="rounded-lg bg-surface-800 px-4 py-2 text-sm text-surface-200 transition hover:bg-surface-700">Close</button>
				</div>
			{:else if profileData}
				<!-- Header -->
				<div class="mb-6 flex items-start justify-between gap-4">
					<div class="flex items-center gap-4">
						<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-600 shadow-xl shadow-primary-500/20 text-2xl font-bold text-white">
							{profileData.name?.charAt(0)?.toUpperCase() || '?'}
						</div>
						<div>
							<h2 class="font-display text-xl font-bold text-surface-50">{profileData.name}</h2>
							<p class="text-sm text-surface-400">{profileData.email}</p>
							{#if profileData.profile?.experienceLevel}
								<span class="mt-1 inline-block rounded-full bg-surface-800 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-surface-300">
									{profileData.profile.experienceLevel}
								</span>
							{/if}
						</div>
					</div>
					<button onclick={close} class="rounded-lg p-1.5 text-surface-400 transition hover:bg-surface-800 hover:text-surface-200">
						<X size={18} />
					</button>
				</div>

				<!-- Bio -->
				{#if profileData.profile?.bio}
					<div class="mb-5 rounded-xl border border-surface-700 bg-surface-800/30 p-4">
						<div class="mb-2 flex items-center gap-1.5 text-xs text-surface-500">
							<Info size={14} />
							<span class="font-medium uppercase tracking-wider">About</span>
						</div>
						<p class="text-sm leading-relaxed text-surface-200">{profileData.profile.bio}</p>
					</div>
				{/if}

				<div class="space-y-4">
					<!-- Honors -->
					{#if profileData.profile?.honors && profileData.profile.honors.length > 0}
						<div>
							<div class="mb-3 flex items-center gap-1.5 text-xs text-surface-500">
								<Award size={14} class="text-accent-400" />
								<span class="font-medium uppercase tracking-wider">Honors & Accolades</span>
							</div>
							<div class="space-y-3">
								{#each profileData.profile.honors as honor}
									<div class="rounded-xl border border-surface-700 bg-surface-800/30 p-3">
										<div class="mb-1 flex items-start justify-between">
											<div>
												<h4 class="font-semibold text-surface-100">{honor.tournamentName} ({honor.year})</h4>
												<p class="text-[11px] font-medium text-surface-400 uppercase tracking-wider mt-0.5">
													{honor.scale} • {honor.format}
												</p>
											</div>
											<span class="rounded-md bg-surface-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-surface-300">
												{honor.role}
											</span>
										</div>
										
										{#if honor.role === 'debater' && (honor.breakingRank || honor.achievements)}
											<div class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-medium text-primary-300">
												<Award size={12} />
												{honor.breakingRank || ''}{honor.breakingRank && honor.achievements ? ' • ' : ''}{honor.achievements || ''}
											</div>
										{:else if honor.role === 'judge' && (honor.judgeType || honor.highestRank)}
											<div class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent-500/10 px-2.5 py-1 text-xs font-medium text-accent-300">
												<Target size={12} />
												{honor.judgeType || ''}{honor.judgeType && honor.highestRank ? ' • Rank: ' : ''}{honor.highestRank || ''}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Preferred Formats -->
					{#if profileData.profile?.preferredFormats && profileData.profile.preferredFormats.length > 0}
						<div>
							<div class="mb-2 flex items-center gap-1.5 text-xs text-surface-500">
								<Target size={14} class="text-primary-400" />
								<span class="font-medium uppercase tracking-wider">Preferred Formats</span>
							</div>
							<div class="flex flex-wrap gap-2">
								{#each profileData.profile.preferredFormats as format}
									<span class="rounded-lg bg-surface-800 px-3 py-1 text-xs font-medium text-surface-200">
										{format}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Interests -->
					{#if profileData.profile?.interests && profileData.profile.interests.length > 0}
						<div>
							<div class="mb-2 flex items-center gap-1.5 text-xs text-surface-500">
								<Hash size={14} />
								<span class="font-medium uppercase tracking-wider">Topic Interests</span>
							</div>
							<div class="flex flex-wrap gap-2">
								{#each profileData.profile.interests as interest}
									<span class="rounded-lg bg-surface-800/50 px-3 py-1 text-xs font-medium text-surface-300">
										#{interest}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
