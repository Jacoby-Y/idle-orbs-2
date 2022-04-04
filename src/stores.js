//#region | Setup
import { get, writable } from "svelte/store";

const is_nullish = (val)=> ( val === undefined || val === "undefined" || val === null );

const loaded = is_nullish(localStorage.IdleOrbs2) ? {} : JSON.parse(localStorage.IdleOrbs2);

const get_or = (k, v)=> is_nullish(loaded[k]) ? v : loaded[k];

let w_index = 0;
const w = (v)=>{
	let k = `_${w_index}`;
	default_vals[k] = (typeof v == "object" ? {...v} : v);
	// store_keys.push(k);
	writables[k] = writable(get_or(k, v));
	w_index++;
	return writables[k];
};
// const w = writable;

// const store_keys = [];
const writables = {};
const default_vals = {};
// window.writables = {};
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
//#region | Shop
export const collector_pos = writable(250);
export const bounce = w({
	power: 30,
	power_cost: 250,
	size: 75,
	size_cost: 500,
	auto_cost: 350,
	auto_unlocked: false,
	auto_on: true,
});
export const starting_cash = w({
	cost: 25,
	amount: 0,
});
// export const orb_double = w({
// 	cost: 50,
// 	value: 0,
// });
export const orb_mult = w(0);
export const orb_mult_cost = 5;
//#endregion
//#region | Orbs
export const basic_orb = w({
	amount: 1,
	cost: 50,
	value: 1
});
export const light_orb = w({
	amount: 0,
	cost: 100,
	value: 1
});
export const homing_orb = w({
	amount: 0,
	cost: 7,
	value: 2.5,
});
export const spore_orb = w({
	amount: 0,
	cost: 10,
	value: 3,
	sub_value: 0.5,
});
export const titan_orb = w({
	amount: 0,
	cost: 10,
	value: 15,
});
//#endregion
//#region | Prestige
export const prestige = w({
	cost: 1e5,
	times: 0,
});
//#endregion
//#region | Fighting
export const next_tower_lvl = w(1);
export const fight_cost = w(1e3);
export const unlocked_fighting = writable(false);
export const fighting = writable(false);
export const afford_fight = writable(()=> false );
export const auto_fight = writable(false);
export const rarities = writable({
	c: 100, u: 0, r: 0, l: 0
});
//#endregion
//#region | Mana
export const got_mana = w(false);
export const mana = w(0);
//#endregion

export const canvas_toggled = writable(true);
// export const shifting = writable(false);
// export const ctrling = writable(false);
/** Buy... 0: 1 | 1: 10 | 2: 100 | 3: Max */
export const buy_amount = writable(0);

export const render_mode = w(1);
export const max_render = w(100);
export const render_mod = w(1);

export const new_game_plus = w(false);

export const on_mobile = writable((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)));

export const get_orb_bonus = ()=>{
	const pt = get(prestige).times;
	const mult = get(orb_mult);
	const prest = (((pt-1)/2*pt)* 0.5) + (pt > 0 ? 0.5 : 0);
	return 1 + prest + (mult/100)
}


export const clear_storage = ()=>{
	window.onbeforeunload = null;
	localStorage.clear();
	location.reload();
};
window.clear_storage = clear_storage;

export const set_to_default = ()=>{
	// load_data(`0Zb9q.Z8"cZ:mtlbdZ80ZnmudpZ8{"cZnmudpabmqrZ81}"cZqgxdZ8(}cZqgxdabmqrZ8}""cZ9trmabmqrZ8{}"cZ9trmatljmbid_Z8,9jqdcZ9trmamlZ8rptd2cZqr9prglfab9q.Z80ZbmqrZ81}cZ9kmtlrZ8"2cZmp:aktjrZ8"cZ:9qgbamp:Z80Z9kmtlrZ8'cZbmqrZ8}"cZy9jtdZ8'2cZjgf.ramp:Z80Z9kmtlrZ8"cZbmqrZ8'""cZy9jtdZ8'2cZ.mkglfamp:Z80Z9kmtlrZ8"cZbmqrZ8(cZy9jtdZ832cZqnmpdamp:Z80Z9kmtlrZ8"cZbmqrZ8'"cZy9jtdZ85cZqt:ay9jtdZ8"e}2cZnpdqrgfdZ80ZbmqrZ8'"""""cZrgkdqZ8"2cZldvrarmudpajyjZ8'cZ,gf.rabmqrZ8'"""cZfmrak9l9Z8,9jqdcZk9l9Z8"cZpdl_dpakm_dZ8'cZk9vapdl_dpZ8'""cZpdl_dpakm_Z8'cZtljm9_argkdZ8'537)}7"))2`);
	for (const k in default_vals) {
		if (!Object.hasOwnProperty.call(default_vals, k)) continue;
		const v = default_vals[k];
		writables[k].set(v);
	}
};
export const set_new_game_plus = ()=>{
	set_to_default();
	new_game_plus.set(true);
	fighting.set(false);
}

export const reset_orbs = writable(()=>{});

//#region | Offline
export const unload_time = w(Math.floor(Date.now()/1000));
export const load_time = writable(Math.floor(Date.now()/1000));
export const offline_time = writable(get(load_time) - get(unload_time));
//#endregion
//#region | Saving/Loading Data
const chars = ` "'0_1{23}45(67)89:abcd,ef.ghijklmnopqrstyuvwxyzACBDEFGHIJKLMNOPQRSTYUVWXYZ`;
export const get_data = ()=>{
	const str = JSON.stringify(get_store_obj()).split("");
	let build = "";
	for (let i = 0; i < str.length; i++) {
		const ch = str[i];
		if (!chars.includes(ch)) { 
			console.error(`Character list doesn't have: "${ch}"`);
			return "Error";
		}
		const index = chars.indexOf(ch);
		build += chars.at(index-2);
	}
	return build;
}
export const load_data = (load)=>{
	const str = load.split("");
	let build = "";
	for (let i = 0; i < str.length; i++) {
		const ch = str[i];
		const index = chars.indexOf(ch);
		build += chars.at((index+2)%chars.length);
	}
	try {
		const built = JSON.parse(build);
		for (const k in built) {
			if (Object.hasOwnProperty.call(built, k)) {
				const v = built[k];
				writables[k].set(v);
			}
		}
		// get(reset_orbs)();
	} catch (err) {
		console.error(`Couldn't Load Data!\n${err}`);
	}
}

const get_store_obj = ()=>{
	let store_obj = {};
	for (let i = 0; i < w_index; i++) {
		store_obj[`_${i}`] = get(writables[`_${i}`])
	}
	// store_keys.forEach((k)=> store_obj[k] = get(writables[k]) );
	return store_obj;
}
// console.log(get_store_obj());
export const store_to_local = ()=>{
	unload_time.set(Math.floor(Date.now()/1000));
	localStorage.IdleOrbs2 = JSON.stringify(get_store_obj());
}

window.onbeforeunload = store_to_local;
//#endregion