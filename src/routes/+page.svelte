<script lang="ts">
	import { Mic, Zap, Users, ArrowRight } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Debatium — Online Debate Platform</title>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-950">
	<!-- Animated gradient background -->
	<div class="absolute inset-0 opacity-30">
		<div class="gradient-orb gradient-orb-1"></div>
		<div class="gradient-orb gradient-orb-2"></div>
		<div class="gradient-orb gradient-orb-3"></div>
	</div>

	<!-- Grid overlay -->
	<div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNDgsIDE2MywgMTg0LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>

	<!-- Content -->
	<div class="relative z-10 flex flex-col items-center px-6 text-center">
		<!-- Floating icons -->
		<div class="mb-8 flex items-center gap-4 opacity-60">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400">
				<Mic size={20} />
			</div>
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-400/10 text-accent-400">
				<Zap size={20} />
			</div>
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400">
				<Users size={20} />
			</div>
		</div>

		<!-- Logo/Brand -->
		<h1 class="mb-4 font-display text-6xl font-bold tracking-tight md:text-8xl">
			<span class="gradient-text">Debatium</span>
		</h1>

		<p class="mb-2 max-w-lg text-lg text-surface-400 md:text-xl">
			The premier online debate platform
		</p>
		<p class="mb-12 max-w-md text-sm text-surface-500">
			Sharpen your arguments. Compete with debaters worldwide. Practice with AI opponents.
		</p>

		<!-- Enter CTA -->
		<a
			href="/app"
			class="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-primary-600 px-10 py-4 font-display text-lg font-semibold text-white shadow-lg shadow-primary-600/25 transition-all duration-300 hover:bg-primary-500 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.98]"
		>
			<span>Enter the App</span>
			<ArrowRight
				size={20}
				class="transition-transform duration-300 group-hover:translate-x-1"
			/>
			<div class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
		</a>

		<!-- Subtle badge -->
		<div class="mt-8 flex items-center gap-2 rounded-full bg-surface-800/50 px-4 py-2 text-xs text-surface-500">
			<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-success"></div>
			<span>Free to use — No credit card required</span>
		</div>
	</div>
</div>

<style>
	.gradient-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		animation: float 8s ease-in-out infinite;
	}

	.gradient-orb-1 {
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, var(--color-primary-600), transparent);
		top: 20%;
		left: 20%;
		animation-delay: 0s;
	}

	.gradient-orb-2 {
		width: 350px;
		height: 350px;
		background: radial-gradient(circle, var(--color-accent-500), transparent);
		bottom: 20%;
		right: 25%;
		animation-delay: -3s;
	}

	.gradient-orb-3 {
		width: 300px;
		height: 300px;
		background: radial-gradient(circle, var(--color-primary-400), transparent);
		top: 50%;
		left: 60%;
		animation-delay: -5s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(30px, -30px) scale(1.05);
		}
		66% {
			transform: translate(-20px, 20px) scale(0.95);
		}
	}
</style>
