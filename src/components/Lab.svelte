<script>
	import { sci } from "../functions.js";
	import { 
		unlocked_lab, canvas_toggled, fighting, mana, cash, fight_cost, total_monster_killed as tmk,
		basic_orb, light_orb, homing_orb, trades, prestige
	} from "../stores.js";

	//#region | Fight Button
	/** @type {HTMLElement} */
	let fight_btn;
	let hover_fight = false;
	$: {
		$fight_cost = 1e3 * (1 + 0.2 * $tmk);
	}
	$: { if (fight_btn != undefined){
		fight_btn.onclick = ()=> {
			if ($cash < $fight_cost) return;
			$canvas_toggled = true;
			$fighting = true;
		}
		fight_btn.onmouseenter = ()=> hover_fight = true;
		fight_btn.onmouseleave = ()=> hover_fight = false;
	}}
	//#endregion
	//#region | Upgrades
	const trade_to_light = ()=>{
		if ($mana < $trades.to_light && $basic_orb.amount < 1) return;
		$mana -= $trades.to_light;
		basic_orb.update( v => (v.amount--, v) );
	}
	const trade_to_homing = ()=>{
		if ($mana < $trades.to_homing && $light_orb.amount < 1) return;
		$mana -= $trades.to_homing;
		basic_orb.update( v => (v.amount--, v) );
	}
	//#endregion
</script>

<main>
	{#if $unlocked_lab || $prestige.times >= 5}
		<h3 id="mana">Mana: {$mana}</h3>
		<div id="hold-btn">
			<button bind:this={fight_btn} id="fight-btn">
				Fight A Monster | <b>${sci($fight_cost)}</b>
				{#if hover_fight} <h3 id="rarities">
					<span style="color: #ddd;">Common: 70%</span> | 
					<span style="color: #B8E986;">Uncommon: 20%</span><br>
					<span style="color: #48BAFF;">Rare: 8%</span> | 
					<span style="color: #F8E71C;">Legendary: 2%</span>
				</h3> {/if}
			</button>
		</div>
		<button class="trade-btn" on:click={trade_to_light}><span>{$trades.to_light} Mana + 1 Basic Orb</span> <span/> <b>=></b> <span/> <span>1 Light Orb</span></button>
		<button class="trade-btn" on:click={trade_to_homing}><span>{$trades.to_homing} Mana + 1 Light Orb</span> <span/> <b>=></b> <span/> <span>1 Homing Orb</span></button>
		<h3 id="orb-stats">
			<span style="color: #ccc;">Basic Orbs: {$basic_orb.amount} <br> Dmg/Value: {$basic_orb.value}</span><br>
			<span style="color: #00cccc;">Light Orbs: {$light_orb.amount} <br> Dmg/Value: {$light_orb.value}</span><br>
			<span style="color: #cccc00;">Homing Orbs: {$homing_orb.amount} <br> Dmg/Value: {$homing_orb.value}</span>
		</h3>
	{:else}
		<img id="img" src="./assets/robo_arm.svg" alt="Robot Arm">
		<h3 id="info">Unlock <em>Orb Lab</em> After {5-$prestige.times} Prestiges</h3>
	{/if}
</main>

<style>
	/* #f97171 */
	main {
		position: relative;
		background-color: #3c3c3c;
		display: grid;
		grid-template-rows: max-content 30% repeat(2, max-content);
		padding: 1rem;
	}
	#img {
		position: absolute;
		left: 50%;
		bottom: 51%;
		transform: translate(-50%, 0);
		width: 5rem;
		height: 5rem;
		border: 1px solid white;
	}
	#info {
		position: absolute;
		left: 50%;
		top: 51%;
		transform: translate(-50%, 0);
		color: white;
		width: max-content;
	}

	#mana {
		color: white;
	}
	#hold-btn {
		position: relative;
		display: grid;
		justify-items: center;
		align-items: center;
	}
	#rarities {
		position: absolute;
		left: 50%;
		top: 100%;
		padding: 0.5rem 0.7rem;
		transform: translate(-50%, 0);
		color: white;
		font-weight: normal;
		width: max-content;
		pointer-events: none;
	}
	#fight-btn {
		position: relative;
	}
	button {
		background-color: #686f79;
		border: none;
		color: white;
		padding: 0.5rem 0.7rem;
		margin: 0;
	}

	#orb-stats {
		position: absolute;
		bottom: 0;
		left: 0;
		padding: 0.5rem 0.7rem;
		font-weight: normal;
	}

	.trade-btn {
		text-align: left;
		display: grid;
		grid-template-columns: max-content 1fr max-content 1fr max-content;
		margin-bottom: 0.5rem;
	}
</style>