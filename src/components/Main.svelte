<script>
	import Shop from "./Shop.svelte";
	import Lab from "./Lab.svelte";
</script>

<main>
	<Shop/>
	<Lab/>
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
</style>