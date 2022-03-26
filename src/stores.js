//#region | Setup
import { writable } from "svelte/store";

const is_nullish = (val)=> ( val === undefined || val === "undefined" || val === null )
const get_or = (k, v)=> is_nullish(localStorage[k]) ? (localStorage[k] = v, v) : JSON.parse(localStorage[k]);

// const w = (k, v)=>{
// 	// console.log(`key: ${k}, get_or: ${get_or(k, v)}`);
// 	to_store[k] = get_or(k, v);
// 	return writable(to_store[k]);
// };
const w = writable;

const to_store = {};
//#endregion

//#region | Timer
export const timer = writable(0);
let ticks = 0; timer.subscribe( v => ticks = v );
const timer_loop = setInterval(() => {
	if (ticks < 29) timer.update( v => v+1 );
	else timer.set(0);
}, 1000/30);
//#endregion
//#region | Cash
let deci = 0;
export const cash = w(0);
cash.subscribe((v)=>{
	if (Math.floor(v) != v) {
		deci += v - Math.floor(v);
		if (deci >= 1) {
			v += Math.floor(deci);
			deci -= Math.floor(deci);
			cash.set(v);
		} else {
			cash.set(Math.floor(v));
		}
	}
});
//#endregion
//#region | Bounce and Collector
export const bounce_size = w(75);
export const bounce_area_cost = w(500);
export const collector_pos = w(250);
//#endregion
//#region | Orbs
export const basic_orb = w({
	amount: 1,
	cost: 50,
	value: 1
});
export const light_orb = w({
	amount: 0,
	cost: 1,
	value: 1
});
export const homing_orb = w({
	amount: 0,
	cost: 5,
	value: 0.5,
});
//#endregion
//#region | Shop Upgrades
// export const more_orbs_cost = w(50);
export const auto_bounce = w({
	cost: 350,
	unlocked: false,
	on: true,
});
export const bounce_power = w({
	cost: 250,
	value: 30,
});
export const starting_cash = w({
	cost: 25,
	amount: 0,
});
//#endregion
//#region | Prestige
export const prestige = w({
	cost: 1e4,
	times: 0,
});
//#endregion

export const orb_bonus = writable(1);

// export const unlocked_lab = w(true); //-! DEBUG
export const unlocked_fighting = w(false);
export const got_mana = w(false);
export const next_tower_lvl = w(1);

export const canvas_toggled = w(true); 
export const fighting = w(false);

export const monster = w(null);
export const total_monster_killed = w(0);

export const mana = w(0);
export const fight_cost = w(1e3);

export const trades = w({
	to_light: 1,
	to_homing: 3,
});

export const rarities = w({
	c: 100,
	u: 0,
	r: 0,
	l: 0
});


export const shifting = w(false);

// const callable = ()=>{

// }