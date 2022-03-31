<script>
	import Shop from "./Shop.svelte";
	import Lab from "./Lab.svelte";
	import Settings from "./Settings.svelte";

	let settings_open = false;
		/** @type {HTMLElement} */
	let settings;

	const click = (e)=>{
		/** @type {HTMLElement} */
		const t = e.target;
		if (!settings.contains(t)) settings_open = false;
		callback(); callback = ()=>{};
	}
	let callback = ()=>{};
	const toggled_settings = ()=>{
		callback = ()=> settings_open = !settings_open;
	}
</script>

<main on:click={click}>
	<Shop/>
	<Lab/>
	<img on:click={toggled_settings} id="settings" src="./assets/settings.svg" alt="Settings">
	<Settings bind:settings={settings} bind:open={settings_open}/>
</main>

<style>
	main {
		position: absolute;
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
	}
	#settings {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 2rem;
		height: 2rem;
		cursor: pointer;
	}
</style>