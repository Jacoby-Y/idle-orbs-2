<script>
	// import { timer, cash, bounce_size, collector_pos, orb_count } from "../stores.js";
	import { 
		cash, shifting,
		more_orbs_cost, auto_bounce, bounce_size, bounce_area_cost, orb_bonus,
		basic_orb, light_orb, homing_orb,
		prestige, timer,
		} from "../stores.js";
	import { sci } from "../functions.js";

	//#region | Buy Basic Orb
	const buy_basic = ()=>{
		if ($cash < $basic_orb.cost) return;
		$cash -= $basic_orb.cost;
		$basic_orb.cost = Math.round($basic_orb.cost * 1.2);
		$basic_orb.amount++;
		$basic_orb = $basic_orb;
		if ($shifting) buy_basic();
	}
	//#endregion
	//#region | Auto Bounce
	const buy_auto_bounce = ()=>{
		if ($cash < $auto_bounce.cost || $auto_bounce.unlocked) return;
		$cash -= $auto_bounce.cost;
		auto_bounce.update( v => (v.unlocked = true, v) );
	};
	//#endregion
	//#region | Bounce Area
	const increase_bounce_area = ()=>{
		if ($cash < $bounce_area_cost) return;
		$cash -= $bounce_area_cost;
		$bounce_area_cost *= 2;
		$bounce_size += 25;
		if ($shifting) increase_bounce_area();
	}
	//#endregion
	//#region | Prestige
	/** @type {HTMLElement} */
	let prest_btn;
	let prest_hover = false;
	$: { // Prestige Button
		if (prest_btn != undefined) {
			prest_btn.onmouseenter = ()=> prest_hover = true;
			prest_btn.onmouseleave = ()=> prest_hover = false;
		}
		}
	$: { $orb_bonus;
		basic_orb.update( v => (v.value = 1 + 0.5*$prestige.times, v) );
		light_orb.update( v => (v.value = 1 + 0.5*$prestige.times, v) );
		homing_orb.update( v => (v.value = 0.5 + 0.5*$prestige.times, v) );
		}
	const do_prestige = (bypass=false)=>{
		if ($cash < $prestige.cost && bypass !== true) return;
		$cash = 0;
		basic_orb.update( v => (v.amount = 1, v));
		light_orb.update( v => (v.amount = 0, v));
		homing_orb.update( v => (v.amount = 0, v));
		$bounce_size = 75;
		auto_bounce.update( v => (v.unlocked = false, v));


		prestige.update( v => (v.times++, v.cost = Math.round(v.cost * 1.25), v) );
	}
	//#endregion

</script>

<main id="main-shop">
	<h3 id="cash">Cash: {sci($cash)}</h3>
	<hr id="top-hr">
	<button on:click={buy_basic}>Buy a Basic Orb <b>${sci($basic_orb.cost)}</b></button>
	<button on:click={buy_auto_bounce}>Unlock Auto Bounce <b>{$auto_bounce.unlocked ? "Unlocked!" : `$${sci($auto_bounce.cost)}`}</b></button>
	<button on:click={increase_bounce_area}>Increase Bounce Area <b>${sci($bounce_area_cost)}</b></button>
	<div></div>
	<h3 id="orb-info">Orb Prestige Bonus: +{sci($prestige.times*50)}% {prest_hover ? "(+50%)" : ""}</h3>
	<button bind:this={prest_btn} on:click={do_prestige}>Prestige <b>${sci($prestige.cost)}</b></button>
</main>

<style>
	button {
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.7rem;
		margin: 0;
	}
	button b {
		float: right;
	}
	#main-shop {
		background: #00443b;
		padding: 1rem;
		display: grid;
		gap: 0.5rem;
		grid-auto-rows: max-content;
		grid-template-rows: repeat(5, max-content) 1fr repeat(2, max-content);
		border-right: 1px solid white;
	}
	#main-shop button {
		background-color: #007a6a;
		border: none;
		color: white;
	}
	#cash {
		padding: 0;
		color: #1dddc3;
	}
	#top-hr {
		border: 1px solid #4d8b4d;
		margin-bottom: 0.15rem;
	}
	#orb-info {
		font-weight: normal;
		color: #1dddc3;
		font-size: 1rem;
	}
</style>