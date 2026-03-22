<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher defaultMode="dark" themeColors={{ dark: '#020617', light: '#ffffff' }} />
<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
