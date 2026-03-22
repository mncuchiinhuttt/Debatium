<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let error = $state('');

	async function handleRegister() {
		if (!name || !email || !password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		loading = true;
		error = '';

		const result = await authClient.signUp.email({ email, password, name });

		if (result.error) {
			error = result.error.message || 'Registration failed';
			loading = false;
		} else {
			goto('/app');
		}
	}
</script>

<svelte:head>
	<title>Register — Debatium</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-surface-950 px-4">
	<div class="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/5 blur-[100px]"></div>

	<div class="relative z-10 w-full max-w-md">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<a href="/" class="font-display text-3xl font-bold">
				<span class="gradient-text">Debatium</span>
			</a>
			<p class="mt-2 text-sm text-surface-400">Join the debate community</p>
		</div>

		<!-- Register Card -->
		<div class="rounded-2xl border border-surface-800 bg-surface-900/80 p-8 shadow-2xl backdrop-blur-sm">
			<h2 class="mb-6 font-display text-2xl font-semibold text-surface-50">Create account</h2>

			{#if error}
				<div class="mb-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
					{error}
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleRegister(); }} class="space-y-5">
				<!-- Name -->
				<div>
					<label for="name" class="mb-1.5 block text-sm font-medium text-surface-300">Full name</label>
					<div class="relative">
						<User size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
						<input
							id="name"
							type="text"
							bind:value={name}
							placeholder="Your display name"
							class="w-full rounded-xl border border-surface-700 bg-surface-800 py-3 pl-11 pr-4 text-sm text-surface-100 placeholder-surface-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
						/>
					</div>
				</div>

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
							placeholder="Min. 8 characters"
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

				<!-- Confirm Password -->
				<div>
					<label for="confirm-password" class="mb-1.5 block text-sm font-medium text-surface-300">Confirm password</label>
					<div class="relative">
						<Lock size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
						<input
							id="confirm-password"
							type={showPassword ? 'text' : 'password'}
							bind:value={confirmPassword}
							placeholder="Repeat your password"
							class="w-full rounded-xl border border-surface-700 bg-surface-800 py-3 pl-11 pr-4 text-sm text-surface-100 placeholder-surface-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
						/>
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
						<span>Create account</span>
						<ArrowRight size={18} />
					{/if}
				</button>
			</form>

			<!-- Tier badge -->
			<div class="mt-4 flex items-center justify-center gap-2 text-xs text-surface-500">
				<span class="rounded-full bg-accent-400/10 px-2 py-0.5 font-medium text-accent-400">FREE</span>
				<span>All features included</span>
			</div>

			<p class="mt-4 text-center text-sm text-surface-400">
				Already have an account?
				<a href="/login" class="font-medium text-primary-400 hover:text-primary-300">Sign in</a>
			</p>
		</div>
	</div>
</div>
