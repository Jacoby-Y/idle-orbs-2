<script>
	import Canvas from "./components/Canvas.svelte";
	import Main from "./components/Main.svelte";
	import {  } from "./functions.js";

</script>

<main>

	<Main/>
	<Canvas/>

</main>

<style>
	main {
		border: 1px dashed white;
		width: 1000px;
		height: 600px;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		overflow: hidden;
	}
</style>