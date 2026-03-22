<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-svelte';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let error = $state('');

	async function handleLogin() {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}
		loading = true;
		error = '';

		const result = await authClient.signIn.email({ email, password });

		if (result.error) {
			error = result.error.message || 'Invalid credentials';
			loading = false;
		} else {
			goto('/app');
		}
	}
</script>

<svelte:head>
	<title>Login — Debatium</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-surface-950 px-4">
	<!-- Background decoration -->
	<div class="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/5 blur-[100px]"></div>

	<div class="relative z-10 w-full max-w-md">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<a href="/" class="font-display text-3xl font-bold">
				<span class="gradient-text">Debatium</span>
			</a>
			<p class="mt-2 text-sm text-surface-400">Welcome back, debater</p>
		</div>

		<!-- Login Card -->
		<div class="rounded-2xl border border-surface-800 bg-surface-900/80 p-8 shadow-2xl backdrop-blur-sm">
			<h2 class="mb-6 font-display text-2xl font-semibold text-surface-50">Sign in</h2>

			{#if error}
				<div class="mb-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
					{error}
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-5">
				<!-- Email -->
				<div>
					<label for="email" class="mb-1.5 block text-sm font-medium text-surface-300">Email</label>
					<div class="relative">
						<Mail size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="you@example.com"
							class="w-full rounded-xl border border-surface-700 bg-surface-800 py-3 pl-11 pr-4 text-sm text-surface-100 placeholder-surface-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
						/>
					</div>
				</div>

				<!-- Password -->
				<div>
					<label for="password" class="mb-1.5 block text-sm font-medium text-surface-300">Password</label>
					<div class="relative">
						<Lock size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="Enter your password"
							class="w-full rounded-xl border border-surface-700 bg-surface-800 py-3 pl-11 pr-11 text-sm text-surface-100 placeholder-surface-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
						>
							{#if showPassword}
								<EyeOff size={18} />
							{:else}
								<Eye size={18} />
							{/if}
						</button>
					</div>
				</div>

				<!-- Submit -->
				<button
					type="submit"
					disabled={loading}
					class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if loading}
						<div class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
					{:else}
						<span>Sign in</span>
						<ArrowRight size={18} />
					{/if}
				</button>
			</form>

			<p class="mt-6 text-center text-sm text-surface-400">
				Don't have an account?
				<a href="/register" class="font-medium text-primary-400 hover:text-primary-300">Create one</a>
			</p>
		</div>
	</div>
</div>
