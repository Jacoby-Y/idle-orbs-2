<script>
	// import { timer, cash, bounce_size, collector_pos, orb_count } from "../stores.js";
	import { 
		cash, shifting,
		auto_bounce, bounce_size, bounce_area_cost, orb_bonus,
		basic_orb, light_orb, homing_orb,
		prestige, timer, bounce_power, starting_cash,
		} from "../stores.js";
	import { sci } from "../functions.js";

	//#region | Buy Bounce Power
	const buy_bounce_power = ()=>{
		if ($cash < $bounce_power.cost) return;
		$cash -= $bounce_power.cost;
		bounce_power.update( v => (
			v.cost = Math.floor(v.cost * 1.5),
			v.value += 2.5, v
		));
		if ($shifting) buy_bounce_power();
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
		$cash = $starting_cash.amount;
		basic_orb.update( v => (v.amount = 1, v.cost = 50, v));
		// light_orb.update( v => (v.amount = 0, v.cost = 1, v));
		// homing_orb.update( v => (v.amount = 0, v.cost = 5, v));
		$bounce_size = 75;
		$bounce_area_cost = 500;
		auto_bounce.update( v => (v.unlocked = false, v));
		bounce_power.update( v => (
			v.cost = 250,
			v.value = 30, v
		));

		prestige.update( v => (v.times++, v.cost = Math.round(v.cost * 1.25), v) );
	}
	//#endregion
	//#region | Post-Prestige Cash
	const buy_starting_cash = ()=>{
		if ($cash < $starting_cash.cost) return;
		$cash -= $starting_cash.cost;
		starting_cash.update( v => (v.amount++, v));
		if ($shifting) buy_starting_cash();
	}
	//#endregion
</script>

<main id="main-shop">
	<h3 id="cash">Cash: {sci($cash)}</h3>
	<hr id="top-hr">
	<!-- <button on:click={buy_basic}>Buy a Basic Orb <b>${sci($basic_orb.cost)}</b></button> -->
	<button on:click={buy_bounce_power}>Increase Bounce Power <b>${sci($bounce_power.cost)}</b></button>
	<button on:click={buy_auto_bounce}>Unlock Auto Bounce <b>{$auto_bounce.unlocked ? "Unlocked!" : `$${sci($auto_bounce.cost)}`}</b></button>
	<button on:click={increase_bounce_area}>Increase Bounce Area <b>${sci($bounce_area_cost)}</b></button>
	<button on:click={buy_starting_cash}>Starting Cash +1 (${sci($starting_cash.amount)}) <b>${sci($starting_cash.cost)}</b></button>
	<div></div>
	<h3 id="orb-info">Orb Value Bonus: +{sci($prestige.times*50)}% {prest_hover ? "(+50%)" : ""}</h3>
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
		grid-template-rows: repeat(6, max-content) 1fr repeat(2, max-content);
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