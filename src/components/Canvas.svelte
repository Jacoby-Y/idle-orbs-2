<script>
	import { onMount } from "svelte";
	import { manager as particle_manager, small_explosion, big_explosion } from "../utils/particles.js";
	import { fnum } from "../utils/functions.js";
	import { 
		// Base Utils and Data
			timer,
			cash,
			mana,
			new_game_plus,
			// shifting,
			// ctrling,
			buy_amount,
			prestige,
			clear_storage,
			canvas_toggled as toggled,
			on_mobile,
			set_to_default,
		// Orb Objects
			basic_orb,
			light_orb,
			homing_orb,
			spore_orb,
			titan_orb,
		// Orb Utils and Extras
			orb_mult,
			collector_pos,
			bounce,
			get_orb_bonus,
		// Fighting
			fighting,
			rarities,
			auto_fight,
			afford_fight,
			fight_cost,
			next_tower_lvl,
		// Settings
			offline_time,
			max_render,
			render_mode,
			render_mod,
	} from "../stores.js";
 
	// const get_orb_bonus = base => base*((1+$orb_mult/100) + 0.5*$prestige.times);

	//#region | Orb Stuff
	/** Clears orb structure and re-adds orbs. | (Rarely ever done, I don't think it will cause much for lag) */
	const reset_orbs = ()=>{
		orbs.free_all();
		for (let i = 0; i < $basic_orb.amount; i++) {
			if (i >= $max_render) {
				orbs.over.basic = $basic_orb.amount - $max_render;
				break;
			}
			orbs.new.basic(Math.round(Math.random()*1000), 580, 0, 0);
		}
		for (let i = 0; i < $light_orb.amount; i++) {
			if (i >= $max_render) {
				orbs.over.light = $light_orb.amount - $max_render;
				break;
			}
			orbs.new.light(Math.round(Math.random()*1000), 580, 0, 0);
		}
		for (let i = 0; i < $homing_orb.amount; i++) {
			if (i >= $max_render) {
				orbs.over.homing = $homing_orb.amount - $max_render;
				break;
			}
			orbs.new.homing(Math.round(Math.random()*1000), 580, 0, 0);
		}
		for (let i = 0; i < $spore_orb.amount; i++) {
			if (i >= $max_render) {
				orbs.over.spore = $spore_orb.amount - $max_render;
				break;
			}
			orbs.new.spore(Math.round(Math.random()*1000), 580, 0, 0);
		}
		for (let i = 0; i < $titan_orb.amount; i++) {
			if (i >= $max_render) {
				orbs.over.titan = $titan_orb.amount - $max_render;
				break;
			}
			orbs.new.titan(Math.round(Math.random()*1000), 580, 0, 0);
		}
	}; 
	/** Sets orbs value based on prestige times and the orb multiplier */
	const set_orb_values = ()=>{
		basic_orb.update( v => (
			v.value = 1 * get_orb_bonus() / ($new_game_plus ? 2 : 1),
		v) );
		light_orb.update( v => (
			v.value = 1 * get_orb_bonus() / ($new_game_plus ? 2 : 1),
		v) );
		homing_orb.update( v => (
			v.value = 4 * get_orb_bonus() / ($new_game_plus ? 2 : 1),
		v) );
		spore_orb.update( v => (
			v.value = 6 * get_orb_bonus() / ($new_game_plus ? 2 : 1),
			v.sub_value = 0.5 * get_orb_bonus() / ($new_game_plus ? 2 : 1),
		v) );
		titan_orb.update( v => (
			v.value = 15 * get_orb_bonus() / ($new_game_plus ? 2 : 1),
		v) );
	}

	$: { $basic_orb; $light_orb; $homing_orb; $spore_orb; $titan_orb; $prestige; $orb_mult;
		reset_orbs();
		set_orb_values();
	}

	$: { $prestige; show_earnings = false; }

	//#endregion
	//#region | Canvas
	/** <main> holding all html of the game (not shop) */
	let main;
	/** @type {HTMLCanvasElement}*/
	let canvas;
	/** @type {CanvasRenderingContext2D}*/
	let ctx;
	/** Causes main_loop to not run if true */
	let pause = false;
	/** If paused is true: then it runs main_loop once and goes back to being paused */
	let step = false;
	/** Background color of the canvas */
	const background_color = "#3c5b5f";
	/** Width and height of canvas */
	let w, h; 
	//#endregion
	//#region | Orbs
	
	//#region | Functions for Orbs
	/** Gets distance between two objects with an x and y number property */
	const distance = (pos1, pos2)=>{
		let y = pos2.y - pos1.y;
    let x = pos2.x - pos1.x;
    
    return Math.sqrt(x * x + y * y);
	}
	//#endregion
	
	/** holds all info on updating, drawing, and collecting orbs */
	const orbs = (()=>{
		const basic = {
			l: [],
			max: 100,
			over: 0,
		}
		const light = {
			l: [],
			max: 100,
			over: 0,
		}
		const homing = {
			l: [],
			max: 100,
			over: 0,
		}
		const spore = {
			l: [],
			max: 100,
			over: 0,
		}
		const sub_spore = {
			l: [],
			max: 100,
			over: 0,
			life_span: 100,
		}
		const shadow = {
			l: [],
			max: 100,
			over: 0,
			life_span: 100,
		}
		const titan = {
			l: [],
			max: 100,
			over: 0,
			life_span: 100,
		}
		let cash_hold = 0;
		let coll_num = 0;

		const push_to = (orb, pos1, pos2, mult)=>{
			const ang = Math.atan2((pos1.y-10)-pos2.y, (pos1.x-10)-pos2.x);
			orb.vx += Math.cos(ang) * mult;
			orb.vy += Math.sin(ang) * mult;
		}
		const collide_monster = (orb)=>{
				// c1 = 400, 200 / c2 = 600, 300
				const pt1 = monster_manager.pt1;
				const pt2 = monster_manager.pt2;
				if (orb.y >= pt1.y-20 && orb.y <= pt2.y) {
					// console.log("in horz area");
					if (orb.lx+20 < pt1.x && orb.x+20 >= pt1.x) {
						orb.vx = Math.abs(orb.vx) * -1;
						orb.x = pt1.x-21;
						return true;
					} else if (orb.lx > pt2.x && orb.x <= pt2.x) {
						orb.vx = Math.abs(orb.vx);
						orb.x = pt2.x+1;
						return true;
					}
				}
				if (orb.x >= pt1.x-20 && orb.x <= pt2.x) {
					// console.log("in vert area");
					if (orb.ly+20 < pt1.y && orb.y+20 >= pt1.y) {
						orb.vy = Math.abs(orb.vy) * -1;
						orb.y = pt1.y-21;
						if (Math.abs(orb.vx) < 0.1) orb.vx = 1;
						orb.vx *= 1.5;
						return true;
					} else if (orb.ly > pt2.y && orb.y <= pt2.y) {
						orb.vy = Math.abs(orb.vy);
						orb.y = pt2.y+1;
						return true;
					}
				}
				return false;
			};

		return {
			new: {
				basic(x,y, vx,vy) {
					if (basic.l.length >= basic.max) { basic.over++; return; }
					else basic.over = 0;
					basic.l.push({
						x,y, vx, vy,
						lx: x, ly: y,
						grounded: false,
					});
				},
				light(x,y, vx,vy) {
					if (light.l.length >= light.max) { light.over++; return; }
					else light.over = 0;
					light.l.push({
						x,y, vx, vy,
						lx: x, ly: y,
						grounded: false,
					});
				},
				homing(x,y, vx,vy) {
					if (homing.l.length >= homing.max) { homing.over++; return; }
					else homing.over = 0;
					homing.l.push({
						x,y, vx, vy,
						lx: x, ly: y,
						grounded: false,
						index: homing.l.length,
					});
				},
				spore(x,y, vx,vy) {
					if (spore.l.length >= spore.max) { spore.over++; return; }
					else spore.over = 0;
					spore.l.push({
						x,y, vx, vy,
						lx: x, ly: y,
						grounded: false,
					});
				},
				sub_spore(x,y, vx,vy) {
					if (sub_spore.l.length >= sub_spore.max) { sub_spore.over++; return; }
					else sub_spore.over = 0;
					sub_spore.l.push({
						x,y, vx, vy,
						lx: x, ly: y,
						ticks: sub_spore.life_span+Math.floor(Math.random()*10),
					});
				},
				shadow(x,y, vx,vy) {
					if (shadow.l.length >= shadow.max) { shadow.over++; return; }
					else shadow.over = 0;
					shadow.l.push({
						x,y, vx, vy,
						lx: x, ly: y,
						ticks: shadow.life_span+Math.floor(Math.random()*10),
					});
				},
				titan(x,y, vx,vy) {
					if (titan.l.length >= titan.max) { titan.over++; return; }
					else titan.over = 0;
					titan.l.push({
						x,y, vx, vy,
						lx: x, ly: y,
					});
				},
			},
			free_all() {
				basic.l = [];
				basic.over = 0;
				light.l = [];
				light.over = 0;
				homing.l = [];
				homing.over = 0;
				spore.l = [];
				spore.over = 0;
				sub_spore.l = [];
				sub_spore.over = 0;
				shadow.l = [];
				shadow.over = 0;
				titan.l = [];
				titan.over = 0;
			},
			update(draw=true) {
				if (basic.max != $max_render) {
					basic.max = $max_render;
					light.max = $max_render;
					homing.max = $max_render;
					spore.max = $max_render;
					sub_spore.max = $max_render;
					shadow.max = $max_render;
					reset_orbs();
					return;
				}
				const all = [].concat(basic.l).concat(light.l).concat(homing.l).concat(spore.l).concat(sub_spore.l).concat(shadow.l).concat(titan.l); //...
				for (let i = 0; i < basic.l.length; i++) {
					const orb = basic.l[i];
					ctx.fillStyle = "#e3ffcfdd";
					if (draw) {
						// console.log("rendering orb!");
						switch ($render_mode) {
							case 0:
								ctx.fillRect(orb.x, orb.y, 20, 20);
								break;
							case 1:
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.fill(); 
								break;
							case 2:
								ctx.fillRect(orb.x+9, orb.y+9, 2, 2);
								break;
							case 3:
								let [x, y] = [Math.floor(orb.x/20)*20, Math.floor(orb.y/20)*20];
								ctx.fillRect(x, y, 20, 20);
								break;
							case 4:
								ctx.strokeStyle = "#e3ffcf"
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.stroke(); 
								break;
						}
					}

					if (!no_gravity) {
						orb.vx *= 0.98;
						orb.vy *= 0.98;
					}

					if (!$fighting) {
						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
							cash_hold += this.value.basic; //$basic_orb.value + (($basic_orb.value * basic.over)/basic.l.length);
							coll_num++;
						}
					} else {
						const hit = collide_monster(orb);
						if (hit) monster_manager.hit(this.value.basic);
					}
				}
				for (let i = 0; i < light.l.length; i++) {
					const orb = light.l[i];
					ctx.fillStyle = "#aae8e088"; 
					if (draw) {
						switch ($render_mode) {
							case 0:
								ctx.fillRect(orb.x, orb.y, 20, 20);
								ctx.fillRect(orb.x+2, orb.y+2, 16, 16);
								ctx.fillRect(orb.x+4, orb.y+4, 12, 12);
								ctx.fillRect(orb.x+6, orb.y+6, 8, 8);
								break;
							case 1:
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.fill();
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 8, 0, 2 * Math.PI); ctx.fill();
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 6, 0, 2 * Math.PI); ctx.fill();
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 4, 0, 2 * Math.PI); ctx.fill();
								break;
							case 2:
								ctx.fillRect(orb.x+9, orb.y+9, 2, 2);
								break;
							case 3:
								let [x, y] = [Math.floor(orb.x/20)*20, Math.floor(orb.y/20)*20];
								ctx.fillRect(x, y, 20, 20);
								ctx.fillRect(x+2, y+2, 16, 16);
								break;
							case 4:
								ctx.strokeStyle = "#aae8e0";
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.stroke(); 
								break;
						}
					}

					if (!no_gravity) {
						orb.vx *= 0.99;
						orb.vy *= 0.99;
					}

					if (!$fighting) {
						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
							cash_hold += this.value.light; //$light_orb.value + (($light_orb.value * light.over)/light.l.length);
							coll_num++;
						}
					} else {
						const hit = collide_monster(orb);
						if (hit) monster_manager.hit(this.value.light)
					}
				}
				for (let i = 0; i < homing.l.length; i++) {
					const orb = homing.l[i];
					if (draw) {
						switch ($render_mode) {
							case 0:
								ctx.strokeStyle = "#c7fda533";
								ctx.strokeRect(orb.x, orb.y, 20, 20);
								ctx.fillStyle = "#73bd4599";
								ctx.fillRect(orb.x+7.5, orb.y+5, 5 , 10); 
								ctx.fillRect(orb.x+5, orb.y+7.5, 10, 5 ); 
								break;
							case 1:
								ctx.strokeStyle = "#c7fda533";
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.stroke();
								ctx.fillStyle = "#73bd4599";
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 5, 0, 2 * Math.PI); ctx.fill();
								break;
							case 2:
								ctx.strokeStyle = "#c7fda533";
								ctx.strokeRect(orb.x+9, orb.y+9, 2, 2);
								break;
							case 3:
								let [x, y] = [Math.floor(orb.x/20)*20, Math.floor(orb.y/20)*20];
								ctx.strokeStyle = "#c7fda533";
								ctx.strokeRect(x, y, 20, 20);
								ctx.fillStyle = "#73bd4599";
								ctx.fillRect(x+7.5, y+5, 5 , 10); 
								ctx.fillRect(x+5, y+7.5, 10, 5 ); 
								break;
							case 4:
								ctx.strokeStyle = "#c7fda5";
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.stroke();
								ctx.strokeStyle = "#73bd45";
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 3, 0, 2 * Math.PI); ctx.stroke();
								break;
						}
					}

					orb.vx *= 0.9;
					orb.vy *= 0.9;

					if (mouse.hovering || mouse.db_click != null) {
						const to_pos = { x: undefined, y: undefined };
						const offset = mouse.db_click != null ? mouse.db_click : mouse;
						if (orb.index % 2 == 0) {
							to_pos.x = Math.cos((6.242)/homing.l.length * orb.index + (6.282*($timer/29)))*100 + offset.x, 
							to_pos.y = Math.cos((6.242)/homing.l.length * orb.index + (6.282*($timer/29)))*100 + offset.y  
						} else {
							to_pos.x = Math.cos((6.282/homing.l.length * orb.index + (6.282*($timer/29)))%6.282)*50 + offset.x, 
							to_pos.y = Math.sin((6.282/homing.l.length * orb.index + (6.282*($timer/29)))%6.282)*50 + offset.y  
						}
						push_to(orb, to_pos, orb, distance(orb, to_pos) < 200 ? 1.2 : 2);
					}

					if (!$fighting) {
						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
							cash_hold += this.value.homing; 
							coll_num++;
						}
					} else {
						const hit = collide_monster(orb);
						if (hit) monster_manager.hit(this.value.homing)
					}
				}
				for (let i = 0; i < spore.l.length; i++) {
					const orb = spore.l[i];
					ctx.fillStyle = "#dfac33dd"; 
					if (draw) {
						switch ($render_mode) {
							case 0:
								ctx.fillRect(orb.x+2, orb.y, 20-4 , 20);
								ctx.fillRect(orb.x, orb.y+2, 20, 20-4 );
								break;
							case 1:
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.fill();
								ctx.fillStyle = "#dfac33"; 
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 5, 0, 2 * Math.PI); ctx.fill();
								break;
							case 2:
								ctx.fillRect(orb.x+9, orb.y+9, 2, 2);
								break;
							case 3:
								let [x, y] = [Math.floor(orb.x/20)*20, Math.floor(orb.y/20)*20];
								ctx.fillRect(x, y, 20, 20);
								ctx.fillRect(x+2, y+2, 16, 16);
								break;
							case 4:
								ctx.strokeStyle = "#dfac33";
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.stroke(); 
								break;
						}
					}

					if (!no_gravity) {
						orb.vx *= 0.98;
						orb.vy *= 0.98;
					}

					if (!$fighting) {
						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
							cash_hold += this.value.spore; //$spore_orb.value + (($spore_orb.value * spore.over)/spore.l.length);
							coll_num++;
						}
					} else {
						const hit = collide_monster(orb);
						if (hit) monster_manager.hit(this.value.spore)
					}
				}
				for (let i = 0; i < sub_spore.l.length; i++) {
					const orb = sub_spore.l[i];
					if (orb == undefined) continue;
					ctx.fillStyle = "#dfac33dd"; 
					if (draw) {
						switch ($render_mode) {
							case 0:
								ctx.fillRect(orb.x, orb.y, 10 , 10);
								break;
							case 1:
								ctx.beginPath(); ctx.arc(orb.x+5, orb.y+5, 5, 0, 2 * Math.PI); ctx.fill();
								break;
							case 2:
								ctx.fillRect(orb.x+4, orb.y+4, 2, 2);
								break;
							case 3:
								let [x, y] = [Math.floor(orb.x/20)*20, Math.floor(orb.y/20)*20];
								ctx.fillRect(x+5, y+5, 10, 10);
								break;
							case 4:
								ctx.strokeStyle = "#dfac33"; 
								ctx.beginPath(); ctx.arc(orb.x+5, orb.y+5, 5, 0, 2 * Math.PI); ctx.stroke(); 
								break;
						}
					}

					if (!no_gravity) {
						orb.vx *= 0.98;
						orb.vy *= 0.98;
					}

					if (!$fighting) {
						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
							cash_hold += this.value.sub_spore; //$spore_orb.sub_value + (($spore_orb.sub_value * sub_spore.over)/sub_spore.l.length);
							coll_num++;
						}
					} else {
						const hit = collide_monster(orb);
						if (hit) monster_manager.hit(this.value.sub_spore)
					}

					orb.ticks--;
					if (orb.ticks <= 0) { 
						sub_spore.l.splice(i, 1);
						i--;
					}
				}
				for (let i = 0; i < shadow.l.length; i++) {
					const orb = shadow.l[i];
					if (orb == undefined) continue;
					ctx.fillStyle = "#00004455";
					if (draw) {
						switch ($render_mode) {
							case 0:
								ctx.fillRect(orb.x, orb.y, 20, 20);
								break;
							case 1:
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.fill(); 
								break;
							case 2:
								ctx.fillRect(orb.x+9, orb.y+9, 2, 2);
								break;
							case 3:
								let [x, y] = [Math.floor(orb.x/20)*20, Math.floor(orb.y/20)*20];
								ctx.fillRect(x, y, 20, 20);
								break;
							case 4:
								ctx.strokeStyle = "#000044";
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.stroke(); 
								break;
						}
					}

					orb.vy--;

					if (!$fighting) {
						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
							cash_hold += total_value/2;//($basic_orb.value*10) + ((($basic_orb.value*10) * basic.over)/basic.l.length);
							coll_num++;
						}
					}

					orb.ticks--;
					if (orb.ticks <= 0) { 
						shadow.l.splice(i, 1);
						i--;
					}
				}
				for (let i = 0; i < titan.l.length; i++) {
					const orb = titan.l[i];
					ctx.fillStyle = "#dd54d2dd";
					ctx.strokeStyle = "#700368dd";
					if (draw) {
						// console.log("rendering orb!");
						switch ($render_mode) {
							case 0:
								ctx.fillRect(orb.x, orb.y, 20, 20);
								ctx.strokeRect(orb.x, orb.y, 20, 20);
								break;
							case 1:
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.fill(); 
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.stroke(); 
								break;
							case 2:
								ctx.fillRect(orb.x+9, orb.y+9, 2, 2);
								break;
							case 3:
								let [x, y] = [Math.floor(orb.x/20)*20, Math.floor(orb.y/20)*20];
								ctx.fillRect(x, y, 20, 20);
								ctx.strokeRect(x, y, 20, 20);
								break;
							case 4:
								ctx.strokeStyle = "#700368";
								ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.stroke(); 
								break;
						}
					}

					if (!no_gravity) {
						orb.vx *= 0.96;
						orb.vy *= 0.96;
					}

					if (!$fighting) {
						if (orb.ly <= $collector_pos && orb.y > $collector_pos || orb.ly >= $collector_pos && orb.y < $collector_pos) {
							cash_hold += this.value.titan;
							coll_num++;
						}
					} else {
						const hit = collide_monster(orb);
						if (hit) monster_manager.hit(this.value.titan*1.5);
					}
				}

				for (let i = 0; i < all.length; i++) {
					const orb = all[i];
					const is_homing = homing.l.includes(orb);
					const is_spore = spore.l.includes(orb);
					const is_sub_spore = sub_spore.l.includes(orb);

					orb.lx = orb.x; orb.ly = orb.y;

					orb.x += orb.vx*1.5;
					orb.y += orb.vy*1.5;
					
					if (!orb.grounded || is_homing) {
						if (!is_homing && !no_gravity) orb.vy++;
						const offset = is_sub_spore ? 10 : 20;
						let collided = false;
						if (orb.x < 0) {
							collided = true;
							orb.vx = Math.abs(orb.vx);
							orb.x = 0;
						} else if (orb.x > canvas.width-offset) {
							collided = true;
							orb.vx = Math.abs(orb.vx) * -1;
							orb.x = canvas.width-offset;
						} if (orb.y < 0) {
							collided = true;
							orb.vy = Math.abs(orb.vy);
							orb.y = 0;
						} else if (orb.y > canvas.height-offset) {
							collided = true;
							orb.vy = Math.abs(orb.vy) * -1;
							orb.y = canvas.height-offset;
							if (!is_homing) {
								orb.vy *= 0.75;
								if (Math.abs(orb.vy) < 10) orb.vy++;
								if (Math.abs(orb.vy) < 2) {
									orb.vy = 0;
									orb.vx = 0;
									orb.y = canvas.height-offset;
									orb.grounded = true;
								}
							}
						}
						if (collided && is_spore && (Math.abs(orb.vx) > 1 || orb.vy > 5 || Math.abs(orb.vy) > 15)) this.new.sub_spore(orb.x, orb.y, orb.vx*2, orb.vy*2);
					} else continue;
				}

				if (cash_hold >= 1) {
					$cash += Math.floor(cash_hold);
					cash_hold -= Math.floor(cash_hold);
				}
			},
			bounce(pos) {
				if (pause) return;
				for (let i = 0; i < basic.l.length; i++) {
					const orb = basic.l[i];
					if (orb.y < 600-$bounce.size-30) continue;

					orb.vx += Math.random()-0.5;
					orb.vy -= ($bounce.power+(Math.random()*-5));
					if (pos != null) orb.vx += ((pos.x-10-orb.x)/100)*(Math.random()*0.5+0.5);
					orb.grounded = false;
				}
				for (let i = 0; i < light.l.length; i++) {
					const orb = light.l[i];
					if (orb.y < 600-$bounce.size-30) continue;

					orb.vx += Math.random()-0.5;
					if (orb.vy > 0) orb.vy = -1*($bounce.power-(Math.random()*-5));
					else orb.vy -= ($bounce.power+(Math.random()*-5));
					if (pos != null) orb.vx += ((pos.x-10-orb.x)/100)*(Math.random()*0.5+0.5);
					orb.grounded = false;
				}
				for (let i = 0; i < spore.l.length; i++) {
					const orb = spore.l[i];
					if (orb.y < 600-$bounce.size-30) continue;

					orb.vx += Math.random()-0.5;
					orb.vy -= ($bounce.power+(Math.random()*-5));
					if (pos != null) orb.vx += ((pos.x-10-orb.x)/100)*(Math.random()*0.5+0.5);
					orb.grounded = false;
				}
				for (let i = 0; i < titan.l.length; i++) {
					const orb = titan.l[i];
					if (orb.y < 600-$bounce.size-30) continue;

					orb.vx += Math.random()-0.5;
					orb.vy -= ($bounce.power+(Math.random()*-4.5));
					if (pos != null) orb.vx += ((pos.x-10-orb.x)/100)*(Math.random()*0.5+0.5);
					orb.grounded = false;
				}
			},
			get basic() { return basic; },
			get light() { return light; },
			get homing() { return homing; },
			get spore() { return spore; },
			get sub_spore() { return sub_spore; },
			get titan() { return titan; },
			total: {
				get basic() { return basic.l.length + basic.over; },
				get light() { return light.l.length + light.over; },
				get homing() { return homing.l.length + homing.over; },
				get spore() { return spore.l.length + spore.over; },
				get sub_spore() { return sub_spore.l.length + sub_spore.over; },
				get titan() { return titan.l.length + titan.over; },
			},
			over: {
				set basic(x) {
					basic.over = x;
				},
				set light(x) {
					light.over = x;
				},
				set homing(x) {
					homing.over = x;
				},
				set spore(x) {
					spore.over = x;
				},
				set titan(x) {
					titan.over = x;
				},
			},
			value: {
				get basic() { return $basic_orb.value + (($basic_orb.value * basic.over)/basic.l.length); },
				get light() { return $light_orb.value + (($light_orb.value * light.over)/light.l.length); },
				get homing() { return $homing_orb.value + (($homing_orb.value * homing.over)/homing.l.length); },
				get spore() { return $spore_orb.value + (($spore_orb.value * spore.over)/spore.l.length); },
				get sub_spore() { return $spore_orb.sub_value + (($spore_orb.sub_value * spore.over)/spore.l.length); },
				get titan() { return $titan_orb.value + (($titan_orb.value * titan.over)/titan.l.length); },
			},
			get coll_num() { return coll_num; },
			set coll_num(x) { coll_num = x; },
		}
	})();

	//#endregion
	//#region | Cash/Sec
	let calc_cps = 0;
	let offline_get = false;
	let offline_gain = 0;
	let show_earnings = true;
	const check_cps = ()=>{
		// console.log(`Check cps! offline: ${calc_cps*$offline_time}`);
		offline_get = true;
		offline_gain = calc_cps*$offline_time;
		$cash += offline_gain;
	}
	$: { // $basic_orb; $light_orb; $spore_orb; $homing_orb;
		calc_cps = 
			((orbs.total.basic * $basic_orb.value +
			orbs.total.light * $light_orb.value +
			orbs.total.spore * $spore_orb.value + 
			orbs.total.sub_spore * $spore_orb.sub_value) * (0.552+(0.0505*(($bounce.power-30)/2.5))))*($bounce.auto_unlocked ? 1 : 0) + 
			(orbs.total.homing * $homing_orb.value * 2);
		calc_cps = Math.round(calc_cps);
		//
		if (!offline_get) check_cps();
	}

	let total_value = 0;
	$: { 
		total_value = 
			orbs.total.basic * $basic_orb.value +
			orbs.total.light * $light_orb.value +
			orbs.total.spore * $spore_orb.value + 
			orbs.total.sub_spore * $spore_orb.sub_value + 
			orbs.total.homing * $homing_orb.value;
	}

	let cps = 0;
	let last_cash = $cash;
	timer.subscribe((v)=>{
		if (v != 0 || pause) return;
		cps = $cash - last_cash;
		last_cash = $cash;
	});
	//#endregion
	//#region | onMount
	let fps = 0;
	let before_frame = Date.now();
	let after_frame = Date.now();
	let fps_list = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	let min_fps = 1000;
	let fps_index = 0;
	let render_tick = 1;
	const main_loop = (v)=>{
		if (pause && !step) return;
		if (step) step = false;
		before_frame = Date.now();

		if (no_gravity) {
			events.gravity.ticks--;
			if (events.gravity.ticks <= 0) {
				no_gravity = false;
			}
		}

		if (!$toggled || render_tick < $render_mod) {
			if ($toggled) render_tick++;
			orbs.update(false);
			particle_manager.update(0, false);
			auto_bounce_loop(v);
			return;
		}
		if (render_tick >= $render_mod) render_tick = 1;

		// Background
		ctx.fillStyle = background_color;
		ctx.fillRect(0, 0, w, h);
		
		// Bounce Area
		ctx.fillStyle = "#33ffcc33";
		ctx.fillRect(0, 600-$bounce.size, 1000, 600-$bounce.size);
		draw_auto_bounce_bar();
		auto_bounce_loop(v);

		// No Gravity Line
		if (no_gravity) {
			const perc = events.gravity.ticks / events.gravity.max_tick;
			ctx.fillStyle = "#000000aa";
			ctx.fillRect(990, 0, 10, 600*perc);
		}

		// Collector Line
		if (!$fighting) {
			ctx.strokeStyle = "lime";
			ctx.beginPath();
			ctx.moveTo(0, 250);
			ctx.lineTo(1000, 250);
			ctx.stroke();
		} 

		// Mouse Locked Position
		if (mouse.db_click != null && $homing_orb.amount > 0) {
			const { x, y } = mouse.db_click;
			ctx.strokeStyle = "red";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(x-7, y-7); ctx.lineTo(x+7, y+7);
			ctx.moveTo(x-7, y+7); ctx.lineTo(x+7, y-7);
			ctx.stroke();
			ctx.lineWidth = 1;
		}

		particle_manager.update($render_mode);
		orbs.update();
		event_manager.update(v);

		if ($fighting) monster_manager.draw();

		after_frame = Date.now();
		const frame_time = Math.round(1000/(after_frame-before_frame));
		fps_list[fps_index] = frame_time;
		min_fps = Math.min(min_fps, frame_time);
		if (fps_index >= fps_list.length-1) fps_index = 0;
		else fps_index++;
		fps = Math.min(1000, Math.round(fps_list.reduce((p, c)=> p+c)/fps_list.length));
		// console.log(fps);
	};
	onMount(()=>{
		ctx = canvas.getContext("2d");
		
		canvas.width = 1000;
		canvas.height = 600;
		w = canvas.width;
		h = canvas.height;

		reset_orbs();
		timer.subscribe(main_loop);

		// key_up({ key: "Escape" });
	});
	//#endregion
	//#region | Events
	//#region | Mouse
	const mouse = {
		x: 0, y: 0,
		hovering: false,
		db_click: null,
	}
	/** @param {MouseEvent} e*/
	const mouse_move = (e)=>{
		const [x, y] = (e.offsetX == 0 ? [e.layerX, e.layerY] : [e.offsetX, e.offsetY]);
		[ mouse.x, mouse.y ] = [x, y];
	};
	const mouse_enter = ()=> mouse.hovering = true;
	const mouse_leave = ()=> mouse.hovering = false;
	const double_click = (e)=>{
		const [x, y] = (e.offsetX == 0 ? [e.layerX, e.layerY] : [e.offsetX, e.offsetY]);
		if (mouse.db_click == null) mouse.db_click = { x, y };
		else mouse.db_click = null;
	}

	let last_click = Date.now();
	const mouse_down = (e)=>{
		// orbs.new([10, 10], [10, Math.random()*15]);
		if (show_earnings) {
			show_earnings = false;
			return;
		}
		const [x, y] = (e.offsetX == 0 ? [e.layerX, e.layerY] : [e.offsetX, e.offsetY]);
		if (event_manager.click({x, y})) return;
		if (Date.now()-last_click < 200) return;
		orbs.bounce({x, y});
		small_explosion(ctx, [x, y]);
		last_click = Date.now();
	}
	//#endregion
	//#region | Keys
	let last_buy_amount = $buy_amount;
	const key_up = (e)=>{
		const k = e.key;
		if (k == "d" && location.hostname == "localhost") debug = !debug;
		else if (k == "e" || k == "E") $toggled = !$toggled;
		else if (k == "Tab" && $bounce.auto_unlocked) bounce.update((v)=>(v.auto_on=!v.auto_on,v));// ($bounce.auto_on = !$bounce.auto_on, $bounce = $bounce);
		else if (k == "o") console.log(orbs.basic);
		else if (k == "r") reset_orbs();
		else if (k == "Shift") $buy_amount = ($buy_amount+1)%5;
		if (!debug) return;
		if (k == "s") step = !step;
		else if (k == " ") pause = !pause;
		// else if (k == "l") console.log(orbs.list.length + orbs.homing.length);
		else if (k == "a") console.log(monster_manager);
		// else if (k == "c") $cash += 10000;
		else if (k == "b") orbs.bounce(null);
		else if (k == "M") $mana += 1e20;
		else if (k == "m") $mana += 100;
		else if (k == "1") basic_orb.update( v => (v.amount++, v));  
		else if (k == "2") light_orb.update( v => (v.amount++, v));  
		else if (k == "3") homing_orb.update( v => (v.amount++, v)); 
		else if (k == "4") spore_orb.update( v => (v.amount++, v));
		else if (k == "5") titan_orb.update( v => (v.amount++, v));
		else if (k == "!") basic_orb.update( v => (v.amount > 0 ? v.amount-- : 0, v)); 
		else if (k == "@") light_orb.update( v => (v.amount > 0 ? v.amount-- : 0, v)); 
		else if (k == "#") homing_orb.update( v => (v.amount > 0 ? v.amount-- : 0, v));
		else if (k == "$") spore_orb.update( v => (v.amount > 0 ? v.amount-- : 0, v));
		else if (k == "0") homing_orb.update( v => (v.amount += 200, v));
		else if (k == ")") homing_orb.update( v => (v.amount += 20000000, v));
		else if (k == "h") monster_manager.hit(1e10);
		else if (k == "R") set_to_default();
		else if (k == "f") min_fps = 1000;
		else if (k == "n") $new_game_plus = true;
		// else if (k == "f") (console.log("Collecting orbs..."), collect_freq());
		else if (k == "S") {
			basic_orb.update( v => (v.amount += 200, v));  
			light_orb.update( v => (v.amount += 200, v));  
			homing_orb.update( v => (v.amount += 200, v)); 
			spore_orb.update( v => (v.amount += 200, v));
		}
	};
	const key_down = (e)=>{
		const k = e.key;
		// if (k == "Shift") $shifting = true;
		// else if (k == "Control") $ctrling = true;
		// if (k == "Shift") (last_buy_amount = $buy_amount, $buy_amount = 3);
		if (!debug) return;
		if (k == "c") $cash += 1e5;
		else if (k == "C") $cash += 1e12;
	};
	//#endregion
	//#region | Blur/Focus
	let blur_time = Date.now();
	let blur_cash = $cash;
	window.onblur = ()=> { 
		// $shifting = $ctrling = false; 
		blur_time = Date.now();
		blur_cash = $cash;
		// $buy_amount = 0;
	}
	window.onfocus = ()=>{
		if ($fighting) return;
		const inactive_time = Math.round((Date.now() - blur_time)/1000);
		const inactive_cash = $cash - blur_cash;
		const calc_inactive = inactive_time*calc_cps;
		// console.log(`Cash: ${$cash}\nInactive cash: ${inactive_cash}\ncalc_cash: ${inactive_time*calc_cps}`);
		if (inactive_cash >= calc_inactive) return;
		if (inactive_cash * 1.2 > calc_inactive) return;
		$cash += calc_inactive;
	}
	//#endregion
	$: { if (canvas != undefined) {
		canvas.onmousedown = mouse_down;
		canvas.onmousemove = mouse_move;
		canvas.onmouseenter = mouse_enter;
		canvas.onmouseleave = mouse_leave;
		canvas.ondblclick = double_click;
		document.body.onkeyup = key_up;
		document.body.onkeydown = key_down;
		// window.addEventListener("keyup", key_up, false);
	}};
	//#endregion
	//#region | Visibility
	let visible = true;
	$: {
		if (main != undefined) {
			main.ontransitionend = ()=> visible = $toggled;
		}
	}
	//#endregion
	//#region | Auto Bounce
	const draw_auto_bounce_bar = ()=>{
		ctx.fillStyle = "#33ffcc11";
		ctx.fillRect(0, 600-($bounce.size*(auto_bounce_perc)), 1000, 600-($bounce.size*(auto_bounce_perc)));
	}
	let auto_bounce_perc = 0;
	$: if (!$bounce.auto_unlocked || !$bounce.auto_on) auto_bounce_perc = 0;
	const auto_bounce_loop = (v)=>{
		if (!$bounce.auto_unlocked || !$bounce.auto_on) return;
		auto_bounce_perc = Math.ceil(v/29*100)/100;
		
		if (v == 29) orbs.bounce(null)
	}
	//#endregion
	//#region | Monster
	const rand_in_list = (list)=> list[Math.floor(Math.random()*list.length)];
	const monsters = {
		common: [ // white
			"Zombie",
			"Boar",
			"Sea Monster",
			"Young Sea Monster"
		],
		uncommon: [ // light green
			"Stone Golem",
			"Young Wyvern",
			"Possessed Sword"
		],
		rare: [ // aqua
			"Young Dragon",
			"Crystal Golem",
			"J Walker",
		],
		legendary: [ // gold
			"Elder Dragon",
			"Block Head",
			"Seagull",
		],
		boss: [
			"Viking Boss",
			"Lich Boss",
			"Big Boss",
			"Baby Boss",
		]
	};
	const monsters_plus = {
		common: [ // white
			"Angler",
			"Fire Wisp",
		],
		uncommon: [ // light green
			"Bugger",
			"Arsonist",
		],
		rare: [ // aqua
			"Brain Suckler",
			"Squatch",
		],
		legendary: [ // gold
			"Gold Axolotl",
			"Typhoid Rat",
		],
		boss: [
			"Chad Viking",
			"Axolotl Boss",
		]
	}
	const get_rand_monster = (rarity)=>{
		if ($new_game_plus) {
			return rand_in_list(monsters[rarity].concat(monsters_plus[rarity])); 
		} else {
			return rand_in_list(monsters[rarity]);
		}
	}
	const spawn_monster = ()=>{
		// Chances for common, uncommon, rare, legendary
		// 70, 20, 8, 2

		const c = $rarities.c;
		const u = $rarities.c + $rarities.u;
		const r = $rarities.c + $rarities.u + $rarities.r;

		const set_monster = (name, hp, worth)=>{
			// cost = 1e3 * Math.max(1.02**($next_tower_lvl-1), 0);
			monster_manager.max_hp = hp*(1.016**($next_tower_lvl-1));
			monster_manager.hp = monster_manager.max_hp;
			monster_manager.name = name;
			monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`;
			monster_manager.worth = worth;
		}

		const rand = Math.round(Math.random()*100);
		if (rand <= c) { // Common
			const name = get_rand_monster("common");
			set_monster(name, 1500, 1);
		} else if (rand <= u) { // Uncommon
			const name = get_rand_monster("uncommon");
			set_monster(name, 4000, 3);
		} else if (rand <= r) { // Rare
			const name = get_rand_monster("rare");
			set_monster(name, 15000, 10);
		} else { // Legendary
			const name = get_rand_monster("legendary");
			set_monster(name, 40000, 25);
		}
		monster_manager = monster_manager;
	}
	const spawn_boss = ()=>{
		const set_monster = (name)=>{
			monster_manager.max_hp = Math.round(Math.max(15000, monster_manager.total_health));
			monster_manager.hp = monster_manager.max_hp;
			monster_manager.name = name;
			monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`;
			monster_manager.worth = 50;
		}
		set_monster(get_rand_monster("boss"));
	}
	let monster_manager = {
		hp: 100,
		max_hp: 300,
		pt1: { x: 300, y: 100 },
		pt2: { x: 700, y: 300 },
		name: "Stone monster",
		src: "./assets/robo_arm.svg",
		tick: 0,
		total_ticks: 600,
		worth: 1,
		kill_index: 0,
		total_health: 0,
		is_boss: false,
		draw() {
			// Base Background
			ctx.fillStyle = "#444";
			ctx.fillRect(this.pt1.x+1, this.pt1.y+1, this.pt2.x-this.pt1.x-2, this.pt2.y-this.pt1.y-2);
			// Health bar background
			ctx.fillStyle = "#333";
			ctx.fillRect(this.pt1.x+10, this.pt2.y-30, this.pt2.x-this.pt1.x-20, 20);
			// Health bar fill
			ctx.fillStyle = "#33aa33";
			ctx.fillRect(this.pt1.x+10, this.pt2.y-30, (this.pt2.x-this.pt1.x-20)*(Math.max(0, this.hp)/this.max_hp), 20);
			// Kill Index bar
			ctx.fillStyle = "#ffffff66";
			const kill_i_perc = (this.pt2.x-this.pt1.x)*(this.is_boss ? 1 : Math.min(1, (this.kill_index+Math.abs(1-this.hp/this.max_hp))/10));
			//  + (this.pt2.x-this.pt1.x)*((this.kill_index)/10)*(1-this.hp/this.max_hp)
			ctx.fillRect(this.pt1.x+1, this.pt1.y+1, kill_i_perc-2, 5);
			// Timer bar
			ctx.fillStyle = "#00ffff66";
			ctx.fillRect(this.pt1.x+1, this.pt1.y+6, (this.pt2.x-this.pt1.x)*(this.tick/this.total_ticks)-2, 5);
			// Border
			ctx.strokeStyle = "red";
			ctx.strokeRect(this.pt1.x, this.pt1.y, this.pt2.x-this.pt1.x, this.pt2.y-this.pt1.y);

			if (this.tick > this.total_ticks) (this.tick = 0, $fighting = false, $auto_fight = false);
			this.tick++;
		},
		hit(dmg) {
			this.hp -= dmg;
			if (this.hp <= 0) {
				this.tick = 0;
				if ($next_tower_lvl % 5 == 0 && $next_tower_lvl > 0) {
					this.total_health += this.max_hp;
					// console.log([this.max_hp, this.total_health]);
				};
				$mana += Math.round(this.worth*(1 + 0.1*$next_tower_lvl));
				this.kill_index++;
				if (this.kill_index >= 10) {
					// console.log(($next_tower_lvl) % 5, ($next_tower_lvl) > 0, this.is_boss == false);
					if (($next_tower_lvl) % 5 == 0 && ($next_tower_lvl) > 0 && this.is_boss == false) {
						this.kill_index--;
						this.is_boss = true;
						spawn_boss();
						return;
					}
					this.is_boss = false;
					this.total_health = 0;
					$next_tower_lvl++;
					this.kill_index = 0;
					big_explosion(ctx, [this.pt1.x+((this.pt2.x-this.pt1.x)/2), this.pt1.y+((this.pt2.y-this.pt1.y)/2)]);

					if (!$auto_fight) {
						$fighting = false;
					} else {	
						const afford = $afford_fight();
						$fighting = afford;
						$auto_fight = afford;
						if (afford) $cash -= $fight_cost;
					}
				} else {
					spawn_monster();
				}
			}
		}
	}
	$: if ($fighting) { spawn_monster(); reset_orbs(); }
	//#endregion
	//#region | Game Events
	let no_gravity = false;
	const events = {
		shadow: {
			draw(v) {
				ctx.fillStyle = "#000044aa";
				ctx.beginPath(); ctx.arc(event_manager.pos.x, event_manager.pos.y, 25, 0, 2 * Math.PI); ctx.fill();
				ctx.strokeStyle = "#ffffffaa";
				ctx.beginPath(); ctx.arc(event_manager.pos.x, event_manager.pos.y, (25*(v/29)), 0, 2 * Math.PI); ctx.stroke();
				ctx.beginPath(); ctx.arc(event_manager.pos.x, event_manager.pos.y, (25), 0, 2 * Math.PI); ctx.stroke();
			},
			activate() {
				for (let i = 0; i < 50; i++) {
					const ang = (3.141/5)*(i/50)+(3.141/5*2);
					orbs.new.shadow(event_manager.pos.x, event_manager.pos.y, Math.cos(ang)*20+(Math.random()*5), Math.sin(ang)*20+(Math.random()*5));
				}
			}
		},
		gravity: {
			draw(v) {
				ctx.fillStyle = "#00000099";
				ctx.beginPath(); ctx.arc(event_manager.pos.x, event_manager.pos.y, 25, 0, 2 * Math.PI); ctx.fill();
				ctx.strokeStyle = "#ffffffaa";
				// ctx.arc(event_manager.pos.x, event_manager.pos.y, (25*(v/29)), 0, 2 * Math.PI); ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(event_manager.pos.x-26*Math.cos(3.141*(((v+15)%30)/29)), (event_manager.pos.y+25)- 50*(v/29));
				ctx.lineTo(event_manager.pos.x+26*Math.cos(3.141*(((v+15)%30)/29)), (event_manager.pos.y+25)- 50*(v/29));

				ctx.moveTo(event_manager.pos.x-26*Math.cos(3.141*(((((v+15)%30)+15)%30)/29)), (event_manager.pos.y+25)- 50*(((v+15)%30)/29));
				ctx.lineTo(event_manager.pos.x+26*Math.cos(3.141*(((((v+15)%30)+15)%30)/29)), (event_manager.pos.y+25)- 50*(((v+15)%30)/29));
				ctx.stroke();
				ctx.beginPath(); ctx.arc(event_manager.pos.x, event_manager.pos.y, (25), 0, 2 * Math.PI); ctx.stroke();
			},
			activate() { no_gravity = true; this.ticks = this.max_tick; },
			ticks: 0,
			max_tick: 300,
		},
	}
	const event_keys = ["shadow"];
	const event_keys_plus = ["gravity"];
	const get_rand_event = ()=>{
		if ($new_game_plus) return rand_in_list(event_keys.concat(event_keys_plus));
		return rand_in_list(event_keys);
	}
	const event_manager = {
		pos: { x: 0, y: 0 },
		tag: null,
		on: false,
		next_ticks: 1800 + Math.floor(Math.random()*1800),
		click(pos) {
			if ($fighting || !this.on) return false;
			if (distance(pos, this.pos) < 25) {
				this.on = false;
				this.next_ticks = 1800 + Math.floor(Math.random()*1800);
				events[this.tag].activate();
				return true;
			}
			return false;
		},
		update(v) {
			if (no_gravity) return;
			if ($fighting) return;
			if (this.on && this.tag != null) {
				if (events[this.tag] != undefined) events[this.tag].draw(v);
				else console.error(`events[${this.tag}] == undefined`);
				return;
			}
			this.next_ticks--;
			if (this.next_ticks <= 0) { 
				// console.log("spawn!");
				this.pos.x = Math.round(Math.random()*(1000-60))+30;
				this.pos.y = Math.round(Math.random()*(100))+30;
				this.on = true;
				this.tag = get_rand_event();
				this.next_ticks = 60;
			}
		}
	}
	//#endregion
	//#region | Debug mode
	let total_orbs = 0;
	$: {
		total_orbs = 
			$basic_orb.amount + 
			$light_orb.amount + 
			$homing_orb.amount + 
			$spore_orb.amount;
	}

	let debug = false;
	
	let coll_total = 0;
	let numbers = [];
	const collect_freq = ()=>{
		orbs.coll_num = 0;
		setTimeout(() => {
			// console.log(`Collected ${orbs.coll_num} Orbs in 10 seconds`);
			numbers.push(orbs.coll_num);
			coll_total++;
			if (coll_total < 10) collect_freq();
			else {
				console.log(`Power: ${$bounce.power}, Times: ${numbers.join(", ")} | ${Math.round(numbers.reduce((p,c)=>p+c)/numbers.length)}`);
				numbers = [];
				coll_total = 0;
				$bounce.power += 2.5;
				collect_freq();
			}
		}, 10000);
	}
	//#endregion

</script>

<main bind:this={main} style="opacity: {$toggled ? "1" : "0"}; pointer-events: {$toggled ? "all" : "none"};">
	<canvas bind:this={canvas}></canvas>
	
	<h3 id="cash" style="{debug ? "background-color: #000000bb;" : ""}">
		Cash: {fnum($cash)} <br> 
		{#if debug} 
			$/sec: {fnum(cps)} <br> 
			Calc $/sec: {fnum(calc_cps)} <br> 
			FPS: {fps} | Min: {min_fps}<br> 
			Total Orbs: {fnum(total_orbs)} <br> {/if}
	</h3>  
	<h3 id="toggle-txt" style="bottom: {$bounce.size}px;" class:no-click={!$toggled} on:click={()=> void($toggled = !$toggled)}>{$on_mobile ? "Tap" : "Press \"E\""} to toggle shop</h3>
	{#if $bounce.auto_unlocked}
		<h3 id="toggle-bounce" style="bottom: {$bounce.size}px;" class:no-click={!$toggled} on:click={()=> void bounce.update((v)=>(v.auto_on=!v.auto_on,v))}>{$on_mobile ? "Tap" : "Press \"Tab\""} to turn {$bounce.auto_on ? "off" : "on"} auto bounce</h3>
		{/if}
	{#if $fighting} 
		<button id="quit" on:click={()=> ($fighting = false, $auto_fight = false)}>Quit</button> 
		<div 
			id="monster-info" 
			style="
				left: {monster_manager.pt1.x}px;
				top: {monster_manager.pt1.y}px;
				width: {monster_manager.pt2.x-monster_manager.pt1.x}px;
				height: {monster_manager.pt2.y-monster_manager.pt1.y}px;">
			<h3 id="lvl">Monster Tower: Level {$next_tower_lvl}</h3>
			<h3 id="name">{monster_manager.name}</h3>
			<img src="{monster_manager.src}" alt="{monster_manager.name}" style="width: {(monster_manager.pt2.y-monster_manager.pt1.y)/2}px; height: {(monster_manager.pt2.y-monster_manager.pt1.y)/2}px;">
		</div>
	{/if}
	{#if show_earnings}
		<div id="offline" on:click={()=> show_earnings = false }>
			<h3>You got ${fnum(offline_gain)} while offline</h3>
		</div>
	{/if}
</main>

<style>
	main {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 100%;
		transition-duration: 0.3s;
		/* background-color: #3c5b5f; */
	}
	canvas {
		/* border: 1px solid red; */
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
	#cash {
		position: absolute;
		left: 0; top: 0;
		padding: 1rem;
		color: #1dddc3;
		/* background-color: #000000bb; */
		width: max-content;
	}
	#toggle-txt, #toggle-bounce {
		position: absolute;
		bottom: 100px;
		padding: 0.5rem 0.6rem;
		color: #ddd;
		font-weight: normal;
		cursor: pointer;
	}
	#toggle-txt:not(.no-click), #toggle-bounce:not(.no-click) { pointer-events: auto; }
	#toggle-txt {
		left: 0;
	}
	#toggle-bounce {
		right: 0;
	}
	h3 {
		pointer-events: none;
	}
	#quit {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background-color: #999;
		border: none;
		padding: 0.5rem 0.7rem;
	}
	#monster-info {
		position: absolute;
		pointer-events: none;
		/* background-color: #00ffff33; */
	}
	#monster-info img {
		position: absolute;
		left: 50%;
		top: 55%;
		transform: translate(-50%, -50%);
	}
	#monster-info #name {
		position: absolute;
		left: 50%;
		top: 0;
		padding: 1rem 0.7rem;
		transform: translate(-50%, 0);
		font-size: 1.5rem;
		color: white;
		width: max-content;
	}
	#monster-info #lvl {
		position: absolute;
		left: 50%;
		bottom: 100%;
		padding: 0.5rem 0.7rem;
		transform: translate(-50%, 0);
		color: white;
		width: max-content;
	}

	#offline {
		position: absolute;
		left: 50%; top: 50%;
		transform: translate(-50%, -50%);
		background-color: #eec897aa;
		padding: 1rem 1.2rem;
	}
</style>