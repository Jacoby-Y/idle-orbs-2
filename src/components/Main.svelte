<script>
	import Shop from "./Shop.svelte";
	import Lab from "./Lab.svelte";
</script>

<main>
	<Shop/>
	<Lab/>
	<img id="settings" src="./assets/settings.svg" alt="Settings">
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