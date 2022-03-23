<script>
	import Canvas from "./components/Canvas.svelte";
	import Shop from "./components/Shop.svelte";
	import { timer, cash, bounce_size, bounce_area_cost, collector_pos, orb_count, more_orbs_cost, auto_bounce, prestige, orb_bonus } from "./stores.js";
	import {  } from "./functions.js";

	$: $orb_bonus = 1 + ($prestige.times*0.5);

</script>

<main>

	<Shop/>
	<Canvas/>

</main>

<style>
	main {
		border: 1px solid white;
		width: 1000px;
		height: 600px;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		overflow: hidden;
	}
</style>