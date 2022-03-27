<script>
	import { onMount } from "svelte";
	import { 
		timer, cash, mana, collector_pos, bounce, render_mode,
		basic_orb, light_orb, homing_orb, auto_fight, afford_fight, orb_double,
		canvas_toggled as toggled, fighting, shifting, rarities, next_tower_lvl, prestige, spore_orb, clear_storage
		} from "../stores.js";
	import { manager, small_explosion, big_explosion } from "../particles.js";
	import { sci, format_num } from "../functions.js";

	//#region | Orb Stuff
	const set_orbs = ()=>{
		orbs.free_all();
		for (let i = 0; i < $basic_orb.amount; i++) {
			orbs.new(Math.round(Math.random()*1000), 580, 0, 0, "basic");
		}
		for (let i = 0; i < $light_orb.amount; i++) {
			orbs.new(Math.round(Math.random()*1000), 580, 0, 0, "light");
		}
		for (let i = 0; i < $spore_orb.amount; i++) {
			orbs.new(Math.round(Math.random()*1000), 580, 0, 0, "spore");
		}
		for (let i = 0; i < Math.min(200, $homing_orb.amount); i++) {
			orbs.new(Math.round(Math.random()*1000), 580, 0, 0, "homing");
		}
		if ($homing_orb.amount > 200) orbs.homing_over = $homing_orb.amount - 200;
		return;
	};

	$: {
		$basic_orb;
		$light_orb;
		$homing_orb;
		$spore_orb;
		set_orbs();
	}
	$: {
		basic_orb.update( v => (
			v.value = (1*(2**$orb_double.value)) + 0.5*$prestige.times,
		v) );
		light_orb.update( v => (
			v.value = (1*(2**$orb_double.value)) + 0.5*$prestige.times,
		v) );
		homing_orb.update( v => (
			v.value = (0.5*(2**$orb_double.value)) + 0.5*$prestige.times,
		v) );
		spore_orb.update( v => (
			v.value = (1*(2**$orb_double.value)) + 1*$prestige.times,
			v.sub_value = (0.2*(2**$orb_double.value)) + 0.2*$prestige.times,
		v) );
	}
	//#endregion
	//#region | Canvas
	let main;
	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {CanvasRenderingContext2D} */
	let ctx;
	let pause = false;
	let step = false;

	// $: console.log(`Fighting: ${$fighting} | Pause: ${pause}`);

	let w, h; 
	//#endregion
	//#region | Orbs
	
	//#region | Functions for Orbs
	const distance = (pos1, pos2)=>{
		let y = pos2.y - pos1.y;
    let x = pos2.x - pos1.x;
    
    return Math.sqrt(x * x + y * y);
	}
	const rand_width = ()=>{
		return Math.round(Math.random()*1000);
	}
	const rand_height = ()=>{
		return Math.round(Math.random()*600);
	}
	const rand_pos = ()=>{
		return { 
			x: Math.round(Math.random()*1000),
			y: Math.round(Math.random()*1000),
		}
	}
	const F_acos = (x) => { return (-0.698 * x * x - 0.872) * x + 1.570; };
	const F_atan2 = (y, x) => { 
		let z = y/x;
		let neg = 1;
		if (z < 0) z *= -1; neg = -1;
		if (z > 1) return 1.571 - F_atan2(1, z);
		return neg*(z * (0.785 - (z - 1)*(0.244 + 0.067 * z))); // 14: 0.244 | 3.83: 0.067
	}
	//#endregion
	const orbs = {
		//#region | Homing
		homing: [],
		homing_over: 0,
		draw_homing(orb) {
			if ($render_mode == 0) {
				ctx.strokeStyle = "#c7fda533";
				ctx.strokeRect(orb.x, orb.y, 20, 20);
				ctx.fillStyle = "#73bd4599";
				ctx.fillRect(orb.x+7.5, orb.y+5, 5 , 10); 
				ctx.fillRect(orb.x+5, orb.y+7.5, 10, 5 ); 
			} else if ($render_mode == 1) {
				ctx.strokeStyle = "#c7fda533";
				ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.stroke();
				ctx.fillStyle = "#73bd4599";
				ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 5, 0, 2 * Math.PI); ctx.fill();
			} else if ($render_mode == 2) {
				ctx.strokeStyle = "#c7fda533";
				ctx.strokeRect(orb.x+9, orb.y+9, 2, 2);
			} else if ($render_mode == 3) {
				let [x, y] = [Math.floor(orb.x/20)*20, Math.floor(orb.y/20)*20];
				ctx.strokeStyle = "#c7fda533";
				ctx.strokeRect(x, y, 20, 20);
				ctx.fillStyle = "#73bd4599";
				ctx.fillRect(x+7.5, y+5, 5 , 10); 
				ctx.fillRect(x+5, y+7.5, 10, 5 ); 
			}
		},
		homing_push_to(orb, pos1, pos2, mult) {
			const ang = Math.atan2((pos1.y-10)-pos2.y, (pos1.x-10)-pos2.x);
			orb.vx += Math.cos(ang) * mult;
			orb.vy += Math.sin(ang) * mult;
		},
		homing_physics(orb) {
			orb.lx = orb.x;
			orb.ly = orb.y;

			orb.x += orb.vx*2;
			orb.y += orb.vy*2;

			orb.vx *= 0.9;
			orb.vy *= 0.9;

			if (mouse.hovering) {
				const to_pos = { x: undefined, y: undefined };
				if (orb.index % 2 == 0) {
					to_pos.x = Math.cos((6.242)/this.homing.length * orb.index + (6.282*($timer/29)))*100 + mouse.x-10, 
					to_pos.y = Math.cos((6.242)/this.homing.length * orb.index + (6.282*($timer/29)))*100 + mouse.y-10  
				} else {
					to_pos.x = Math.cos((6.282/this.homing.length * orb.index + (6.282*($timer/29)))%6.282)*50 + mouse.x, 
					to_pos.y = Math.sin((6.282/this.homing.length * orb.index + (6.282*($timer/29)))%6.282)*50 + mouse.y  
				}

				// const dist_to = distance(orb, to_pos);
				// const mult = 1.2;
				this.homing_push_to(orb, to_pos, orb, distance(orb, to_pos) < 200 ? 1.2 : 2);
			}
			
			if (orb.y+20 >= canvas.height) {
				this.col(orb, 1, -1);
				orb.y = canvas.height - 20;
			} else if (orb.y <= 0) {
				this.col(orb, 1, 1); 
				orb.y = 0;
			}
			if (orb.x+20 >= canvas.width) {
				this.col(orb, 0, -1);
				orb.x = canvas.width - 20;
			} else if (orb.x <= 0) {
				this.col(orb, 0, 1);
				orb.x = 0;
			}

			if ($fighting) { 
				const hit = this.collide_monster(orb);
				if (orb.x > monster_manager.pt1.x-20 && orb.x < monster_manager.pt2.x && orb.y > monster_manager.pt1.y-20 && orb.y < monster_manager.pt2.y) {
					orb.x = orb.lx = monster_manager.pt1.x-50;
					orb.y = orb.ly = monster_manager.pt1.y+(monster_manager.pt2.y-monster_manager.pt1.y)/2;
					return true;
				}
				if (hit) {
					monster_manager.hit($homing_orb.value + ($homing_orb.value*this.homing_over/200));
				}
			}

			if (orb.y < $collector_pos && orb.ly > $collector_pos) this.collect(orb);
			else if (orb.y > $collector_pos && orb.ly < $collector_pos) this.collect(orb); 
		},
		//#endregion
		//#region | Sub Spores
		sub_spore_max: 100,
		sub_spores: Array.from(Array(100)),
		sub_spore_over: 0,
		sub_spore_allocated: 0,
		sub_spore_cash_hold: 0,
		sub_spore_physics(orb) {
			orb.vy += 1;
			orb.lx = orb.x;
			orb.ly = orb.y;

			orb.x += orb.vx*2;
			orb.y += orb.vy*2;

			orb.vx *= 0.99;
			orb.vy *= 0.99;

			if (orb.x+10 >= canvas.width) {
				this.col(orb, 0, -1);
				orb.x = canvas.width - 10;
			}
			else if (orb.x <= 0) {
				this.col(orb, 0, 1);
				orb.x = 0;
			}
			if (orb.y+10 >= canvas.height) {
				this.col(orb, 1, -1);
				orb.vy *= 0.85;
				if (Math.abs(orb.vy) <= 10) orb.vy *= 0.5;
				if (Math.abs(orb.vy) <= 3) orb.vy = 0;
				if (Math.abs(orb.vy) <= 0.5) orb.vx *= 0.9;
				if (Math.abs(orb.vy) == 0 && Math.abs(orb.vx) < 1) (orb.vy = 0, orb.vx = 0, orb.grounded = true);
				orb.y = canvas.height - 10;
			} else if (orb.y <= 0) {
				this.col(orb, 1, 1); 
				orb.y = 0;
			}

			if ($fighting) { 
				const hit = this.collide_monster(orb);
				if (hit) {
					monster_manager.hit($spore_orb.sub_value + ($spore_orb.sub_value * this.sub_spore_over/this.sub_spore_max))
				}
			}

			if (orb.y < $collector_pos && orb.ly > $collector_pos) this.collect(orb);
			else if (orb.y > $collector_pos && orb.ly < $collector_pos) this.collect(orb); 

			orb.ticks--;
			return (orb.ticks > 0);
		},
		//#endregion
		list: [],
		col(orb, xy, mult) { 
			xy = xy == 0 ? "vx" : "vy";
			const val = Math.abs(orb[xy]) * mult;
			orb[xy] = val == 0 ? 1 : val; 
			if (orb.type == "spore") {
				if (xy == "vx" || mult > 0 || Math.abs(orb.vy) > 20) orbs.new(orb.x, orb.y, orb.vx*1.2, orb.vy*1.2, "sub_spore");
			}
		},
		draw(orb) {
			const type = orb.type;
			if ($render_mode == 0) {
				if (type == "basic") {
					ctx.fillStyle = "#e3ffcf"; ctx.fillRect(orb.x, orb.y, 20, 20);
				}
				else if (type == "light") {
					ctx.fillStyle = "#aae8e088"; ctx.fillRect(orb.x, orb.y, 20, 20);
					ctx.fillStyle = "#aae8e088"; ctx.fillRect(orb.x+2, orb.y+2, 16, 16);
					ctx.fillStyle = "#aae8e088"; ctx.fillRect(orb.x+4, orb.y+4, 12, 12);
					ctx.fillStyle = "#aae8e088"; ctx.fillRect(orb.x+6, orb.y+6, 8, 8);
				}
				else if (type == "spore") {
					ctx.fillStyle = "#dfac33dd"; 
					ctx.fillRect(orb.x+2, orb.y, 20-4 , 20);
					ctx.fillRect(orb.x, orb.y+2, 20, 20-4 );
				}
				else if (type == "sub_spore") {
					ctx.fillStyle = "#ff9900aa";
					ctx.fillRect(orb.x, orb.y, 10, 10);
				}
			} else if ($render_mode == 1) {
				if (type == "basic") {
					ctx.fillStyle = "#e3ffcf"; //ctx.fillRect(orb.x, orb.y, 20, 20);
					ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.fill(); 
				}
				else if (type == "light") {
					ctx.fillStyle = "#aae8e088"; //ctx.fillRect(orb.x, orb.y, 20, 20);
					ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.fill();
					ctx.fillStyle = "#aae8e088"; // ctx.fillRect(orb.x+2, orb.y+2, 16, 16);
					ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 8, 0, 2 * Math.PI); ctx.fill();
					ctx.fillStyle = "#aae8e088"; // ctx.fillRect(orb.x+4, orb.y+4, 12, 12);
					ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 6, 0, 2 * Math.PI); ctx.fill();
					ctx.fillStyle = "#aae8e088"; // ctx.fillRect(orb.x+6, orb.y+6, 8, 8);
					ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 4, 0, 2 * Math.PI); ctx.fill();
				}
				else if (type == "spore") {
					ctx.fillStyle = "#dfac33dd"; 
					ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 10, 0, 2 * Math.PI); ctx.fill();
					ctx.fillStyle = "#dfac33"; 
					ctx.beginPath(); ctx.arc(orb.x+10, orb.y+10, 5, 0, 2 * Math.PI); ctx.fill();
				}
				else if (type == "sub_spore") {
					ctx.fillStyle = "#ff9900aa";
					ctx.beginPath(); ctx.arc(orb.x+5, orb.y+5, 5, 0, 2 * Math.PI); ctx.fill();
				}
			} else if ($render_mode == 2) {
				if (type == "basic") {
					ctx.fillStyle = "#e3ffcf"; ctx.fillRect(orb.x+9, orb.y+9, 2, 2);
				}
				else if (type == "light") {
					ctx.fillStyle = "#aae8e088"; ctx.fillRect(orb.x+9, orb.y+9, 2, 2);
				}
				else if (type == "spore") {
					ctx.fillStyle = "#dfac33dd"; ctx.fillRect(orb.x+9, orb.y+9, 2, 2);
				}
				else if (type == "sub_spore") {
					ctx.fillStyle = "#ff9900aa"; ctx.fillRect(orb.x+9, orb.y+9, 2, 2);
				}
			} else if ($render_mode == 3) {
				let [x, y] = [Math.floor(orb.x/20)*20, Math.floor(orb.y/20)*20];
				if (type == "basic") {
					ctx.fillStyle = "#e3ffcf"; ctx.fillRect(x, y, 20, 20);
				}
				else if (type == "light") {
					ctx.fillStyle = "#aae8e088"; ctx.fillRect(x, y, 20, 20);
					ctx.fillStyle = "#aae8e088"; ctx.fillRect(x+2, y+2, 16, 16);
					ctx.fillStyle = "#aae8e088"; ctx.fillRect(x+4, y+4, 12, 12);
					ctx.fillStyle = "#aae8e088"; ctx.fillRect(x+6, y+6, 8, 8);
				}
				else if (type == "spore") {
					ctx.fillStyle = "#dfac33dd"; 
					ctx.fillRect(x+2, y, 20-4 , 20);
					ctx.fillRect(x, y+2, 20, 20-4 );
				}
				else if (type == "sub_spore") {
					ctx.fillStyle = "#ff9900aa";
					ctx.fillRect(x+5, y+5, 10, 10);
				}
			}
			// ctx.fillRect(orb.x, orb.y, 20, 20);
		},
		basic_physics(orb) {
			orb.vy += 1;
			orb.vx *= 0.99;
			orb.vy *= 0.99;

			if (orb.y+20 >= canvas.height) {
				this.col(orb, 1, -1);
				orb.vy *= 0.85;
				// if (Math.abs(orb.vy) < 10) orb.vy *= 0.85;
				// if (Math.abs(orb.vy) < 6) orb.vy *= 0.85;
				// if (Math.abs(orb.vy) < 3) (orb.vx = 0, orb.vy = 0, orb.grounded = true);
				if (Math.abs(orb.vy) <= 10) orb.vy *= 0.5;
				if (Math.abs(orb.vy) <= 3) orb.vy = 0;
				if (Math.abs(orb.vy) <= 0.5) orb.vx *= 0.9;
				if (Math.abs(orb.vy) == 0 && Math.abs(orb.vx) < 1) (orb.vy = 0, orb.vx = 0, orb.grounded = true);
				// console.log(orb.vy);
				orb.y = canvas.height - 20;
			}
		},
		light_physics(orb) {
			orb.vy += 0.8;
			orb.vx *= 0.99;
			orb.vy *= 0.99;

			if (orb.y+20 >= canvas.height) {
				this.col(orb, 1, -1);
				if (Math.abs(orb.vy) >= 15) orb.vy *= 0.98;
				else orb.vy *= 0.85;
				if (Math.abs(orb.vy) < 15) (orb.vy *= 0.7, orb.vx *= 0.7);
				if (Math.abs(orb.vy) < 5) (orb.vy *= 0.7, orb.vx *= 0.7);
				if (Math.abs(orb.vy) < 1) (orb.vy = 0, orb.vx = 0, orb.grounded = true);
				// console.log(orb.vy);
				orb.y = canvas.height - 20;
			}
		},
		spore_physics(orb) {
			orb.vy += 1;
			orb.vx *= 0.99;
			orb.vy *= 0.99;

			if (orb.y+20 >= canvas.height) {
				this.col(orb, 1, -1);
				orb.vy *= 0.85;
				if (Math.abs(orb.vy) <= 10) orb.vy *= 0.5;
				if (Math.abs(orb.vy) <= 3) orb.vy = 0;
				if (Math.abs(orb.vy) <= 0.5) orb.vx *= 0.9;
				if (Math.abs(orb.vy) == 0 && Math.abs(orb.vx) < 1) (orb.vy = 0, orb.vx = 0, orb.grounded = true);
				orb.y = canvas.height - 20;
			}
		},
		collide_monster(orb) {
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
		},
		physics(orb) {
			if (orb.grounded) return;

			orb.lx = orb.x;
			orb.ly = orb.y;

			orb.x += orb.vx;
			orb.y += orb.vy;
			
			if (orb.type == "basic") this.basic_physics(orb);
			else if (orb.type == "light") this.light_physics(orb);
			else if (orb.type == "spore") this.spore_physics(orb);

			if (orb.x+20 >= canvas.width) {
				this.col(orb, 0, -1);
				orb.x = canvas.width - 20;
			}
			else if (orb.x <= 0) {
				this.col(orb, 0, 1);
				orb.x = 0;
			}
			if (orb.y <= 0) {
				this.col(orb, 1, 1); 
				orb.y = 0;
			}

			if ($fighting) { 
				const hit = this.collide_monster(orb);
				if (hit) {
					if (orb.type == "basic") monster_manager.hit($basic_orb.value);
					else if (orb.type == "light") monster_manager.hit($light_orb.value);
					else if (orb.type == "spore") monster_manager.hit($spore_orb.value);
				}
			}

			if (orb.y < $collector_pos && orb.ly > $collector_pos) this.collect(orb);
			else if (orb.y > $collector_pos && orb.ly < $collector_pos) this.collect(orb); 
		},
		collect(orb) {
			if ($fighting) return;
			if (orb.type == "basic") $cash += $basic_orb.value;
			else if (orb.type == "light") $cash += $light_orb.value;
			else if (orb.type == "homing") $cash += $homing_orb.value + ($homing_orb.value*this.homing_over/200);
			else if (orb.type == "spore") $cash += $spore_orb.value;
			else if (orb.type == "sub_spore") { 
				this.sub_spore_cash_hold += $spore_orb.sub_value + ($spore_orb.sub_value * this.sub_spore_over/this.sub_spore_max);
				if (this.sub_spore_cash_hold > 1) {
					this.sub_spore_cash_hold--;
					$cash++;
				}
			}
		},
		update() {
			for (let i = 0; i < this.list.length; i++) {
				const orb = this.list[i];
				this.draw(orb);
				this.physics(orb);
			}
			for (let i = 0; i < this.homing.length; i++) {
				const orb = this.homing[i];
				this.draw_homing(orb);
				this.homing_physics(orb);
			}
			for (let i = 0; i < this.sub_spores.length; i++) {
				const orb = this.sub_spores[i];
				if (orb == undefined) continue;
				this.draw(orb);
				if (this.sub_spore_physics(orb) == false) (this.sub_spores[i] = undefined, this.sub_spore_allocated--);
			}
		},
		new(x,y, vx, vy, type) {
			if (type == "homing") {
				if (this.homing.length >= 200) { this.homing_over++; return; }
				else this.homing_over = 0;
				this.homing.push({
					x,y, vx,vy, type,
					grounded: false,
					lx: x, ly: y,
					index: this.homing.length,
				});
			} 
			else if (type == "sub_spore") {
				if (this.sub_spore_allocated >= this.sub_spore_max) {
					this.sub_spore_over++;
					return;
				}
				this.sub_spore_over = 0;
				this.sub_spore_allocated++;
				const index = this.sub_spores.indexOf(undefined);
				if (index < 0) {
					console.warn(`Sub spore index undefined!`);
					return
				}
				this.sub_spores[index] = {
					x,y, vx,vy, type,
					grounded: false,
					lx: x, ly: y,
					ticks: 100,
				};
				// console.log("sub spores, went up!");
			}
			else {
				this.list.push({
					x,y, vx,vy, type,
					grounded: false,
					lx: x, ly: y,
				});
			}
		},
		bounce(pos) {
			for (let i = 0; i < this.list.length; i++) {
				const orb = this.list[i];
				if (orb.y < 600-$bounce.size-21) continue;
				if (pos != null) orb.vx += (pos.x - orb.x)/100;
				if (orb.type == "light" && orb.vy > 0) orb.vy = -1*($bounce.power + (Math.random()*6-3));
				else orb.vy -= $bounce.power + (Math.random()*6-3);
				orb.grounded = false;
			}
		},
		free_all() {
			this.list = [];
			this.homing = [];
			this.homing_over = 0;
			this.sub_spore_over = 0;
			for (let i = 0; i < this.sub_spores.length; i++) {
				const orb = this.sub_spores[i];
				if (orb != undefined) {
					this.sub_spores[i] = undefined;
				}
			}
			this.sub_spore_allocated = 0;
		}
	};
	//#endregion
	//#region | Cash/Sec
	let calc_cps = 0;
	$: { 
		calc_cps = 
			(($basic_orb.amount*$basic_orb.value) + 
			($light_orb.amount*$light_orb.value) + 
			($spore_orb.amount*$spore_orb.value) + 
			((orbs.sub_spore_allocated + orbs.sub_spore_over)*$spore_orb.sub_value)) * (($bounce.power-29)/35) * ($bounce.auto_unlocked ? 1 : 0) +
			((orbs.homing.length + orbs.homing_over)*$homing_orb.value*2);
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
	let fps_list = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	let fps_index = 0;
	const main_loop = (v)=>{
		if (pause && !step) return;
		if (step) step = false;

		before_frame = Date.now();

		if (!visible && !$toggled) {
			orbs.update();
			manager.update(false);
			auto_bounce_loop(v);
			return;
		}

		// Background
		ctx.fillStyle = "#395b56";
		ctx.fillRect(0, 0, w, h);
		
		// Bounce Area
		ctx.fillStyle = "#33ffcc33";
		ctx.fillRect(0, 600-$bounce.size, 1000, 600-$bounce.size);
		draw_auto_bounce_bar();
		auto_bounce_loop(v);

		// Collector Line
		if (!$fighting) {
			ctx.strokeStyle = "lime";
			ctx.beginPath();
			ctx.moveTo(0, 250);
			ctx.lineTo(1000, 250);
			ctx.stroke();
		} else {
			monster_manager.draw();
		}

		manager.update($render_mode);
		orbs.update();

		after_frame = Date.now();

		fps_list[fps_index] = Math.round(1000/(after_frame-before_frame));
		if (fps_index >= fps_list.length-1) fps_index = 0;
		else fps_index++;
		fps = Math.min(1000, Math.round(fps_list.reduce((p, c)=> p+c)/fps_list.length));
	};
	onMount(()=>{
		ctx = canvas.getContext("2d");
		
		canvas.width = 1000;
		canvas.height = 600;
		w = canvas.width;
		h = canvas.height;

		set_orbs();
		timer.subscribe(main_loop);

		// key_up({ key: "Escape" });
	});
	//#endregion
	//#region | Events
	const mouse = {
		x: 0, y: 0,
		hovering: false,
	}
	/** @param {MouseEvent} e*/
	const mouse_move = (e)=>{
		[ mouse.x, mouse.y ] = [ e.layerX, e.layerY ];
	};
	const mouse_enter = ()=> mouse.hovering = true;
	const mouse_leave = ()=> mouse.hovering = false;
	const mouse_down = (e)=>{
		// orbs.new([10, 10], [10, Math.random()*15]);
		const [x, y] = [e.layerX, e.layerY];
		orbs.bounce({x, y});
		small_explosion(ctx, [x, y]);
	}
	const key_up = (e)=>{
		const k = e.key;
		if (k == "d") debug = !debug;
		else if (k == "Escape") $toggled = !$toggled;
		else if (k == "Tab" && $bounce.auto_unlocked) ($bounce.auto_on = !$bounce.auto_on, $bounce = $bounce);
		else if (k == "o") console.log(orbs);
		else if (k == "r") set_orbs();
		if (!debug) return;
		if (k == "s") step = !step;
		else if (k == " ") pause = !pause;
		else if (k == "l") console.log(orbs.list.length + orbs.homing.length);
		else if (k == "a") console.log(monster_manager);
		else if (k == "c") $cash += 10000;
		else if (k == "b") orbs.bounce(null);
		else if (k == "M") console.log(mouse);
		else if (k == "m") $mana += 100;
		else if (k == "1") basic_orb.update( v => (v.amount++, v));  
		else if (k == "2") light_orb.update( v => (v.amount++, v));  
		else if (k == "3") homing_orb.update( v => (v.amount++, v)); 
		else if (k == "4") spore_orb.update( v => (v.amount++, v));
		else if (k == "!") basic_orb.update( v => (v.amount > 0 ? v.amount-- : 0, v)); 
		else if (k == "@") light_orb.update( v => (v.amount > 0 ? v.amount-- : 0, v)); 
		else if (k == "#") homing_orb.update( v => (v.amount > 0 ? v.amount-- : 0, v));
		else if (k == "$") spore_orb.update( v => (v.amount > 0 ? v.amount-- : 0, v));
		else if (k == "0") homing_orb.update( v => (v.amount += 200, v));
		else if (k == ")") homing_orb.update( v => (v.amount += 20000000, v));
		else if (k == "Shift") $shifting = false;
		else if (k == "h") monster_manager.hit(1e10);
		else if (k == "R") clear_storage();
		else if (k == "S") {
			basic_orb.update( v => (v.amount += 200, v));  
			light_orb.update( v => (v.amount += 200, v));  
			homing_orb.update( v => (v.amount += 200, v)); 
			spore_orb.update( v => (v.amount += 200, v));
		}
	};
	const key_down = (e)=>{
		const k = e.key;
		if (k == "Shift") $shifting = true;
		if (!debug) return;
		if (k == "c") $cash += 1e5;
	};
	window.onblur = ()=> $shifting = false;
	
	// $: if ($toggled && canvas != undefined) canvas.onmousedown({ layerX: 0, layerY: 0 });

	$: { if (canvas != undefined) {
		canvas.onmousedown = mouse_down;
		canvas.onmousemove = mouse_move;
		canvas.onmouseenter = mouse_enter;
		canvas.onmouseleave = mouse_leave;
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
		// hp: 100, worth: 1
		common: [ // white
			"Zombie",
			"Boar",
			"Sea Monster",
			"Young Sea Monster"
		],
		// hp: 250, worth: 3
		uncommon: [ // light green
			"Stone Golem",
			"Young Wyvern",
			"Possessed Sword"
		],
		// hp: 500, worth: 10
		rare: [ // aqua
			"Young Dragon",
			"Crystal Golem",
			"J Walker",
		],
		// hp: 1000, worth: 25
		legendary: [ // gold
			"Elder Dragon",
			"Block Head",
			"Seagull",
		]
	}
	const spawn_monster = ()=>{
		// Chances for common, uncommon, rare, legendary
		// 70, 20, 8, 2

		const c = $rarities.c;
		const u = $rarities.c + $rarities.u;
		const r = $rarities.c + $rarities.u + $rarities.r;

		const rand = Math.round(Math.random()*100);
		if (rand <= c) { 
			// Common
			const name = rand_in_list(monsters.common);
			// console.log(`Spawning a ${name}`);
			monster_manager.max_hp = 100*(1 + 0.2*($next_tower_lvl-1));
			monster_manager.hp = monster_manager.max_hp;
			monster_manager.name = name;
			monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`;
			monster_manager.worth = 1;
		} else if (rand <= u) {
			// Uncommon
			const name = rand_in_list(monsters.uncommon);
			// console.log(`Spawning a ${name}`);
			monster_manager.max_hp = 250*(1 + 0.2*($next_tower_lvl-1));
			monster_manager.hp = monster_manager.max_hp;
			monster_manager.name = name;
			monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`;
			monster_manager.worth = 3;
		} else if (rand <= r) {
			// Rare
			const name = rand_in_list(monsters.rare);
			// console.log(`Spawning a ${name}`);
			monster_manager.max_hp = 500*(1 + 0.2*($next_tower_lvl-1));
			monster_manager.hp = monster_manager.max_hp;
			monster_manager.name = name;
			monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`;
			monster_manager.worth = 10;
		} else {
			// Legendary
			const name = rand_in_list(monsters.legendary);
			// console.log(`Spawning a ${name}`);
			monster_manager.max_hp = 1000*(1 + 0.2*($next_tower_lvl-1));
			monster_manager.hp = monster_manager.max_hp;
			monster_manager.name = name;
			monster_manager.src = `./assets/${name.toLowerCase().replaceAll(" ", "_")}.svg`;
			monster_manager.worth = 25;
		}
		monster_manager = monster_manager;
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
		draw() {
			// Base Background
			ctx.fillStyle = "#444";
			ctx.fillRect(this.pt1.x+2, this.pt1.y+2, this.pt2.x-this.pt1.x-4, this.pt2.y-this.pt1.y-4);
			// Health bar background
			ctx.fillStyle = "#333";
			ctx.fillRect(this.pt1.x+10, this.pt2.y-30, this.pt2.x-this.pt1.x-20, 20);
			// Health bar fill color
			ctx.fillStyle = "#33aa33";
			ctx.fillRect(this.pt1.x+10, this.pt2.y-30, (this.pt2.x-this.pt1.x-20)*(this.hp/this.max_hp), 20);
			// Kill Index bar
			ctx.fillStyle = "#ffffff66";
			ctx.fillRect(this.pt1.x+1, this.pt1.y+1, (this.pt2.x-this.pt1.x)*((this.kill_index+1)/10)-2, 5);
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
				// console.log("Mana increasing by: " + this.worth);
				$mana += Math.round(this.worth*(1 + 0.1*($next_tower_lvl-1)));
				spawn_monster();
				this.kill_index++;
				if (this.kill_index >= 10) {
					$next_tower_lvl++;
					this.kill_index = 0;
					big_explosion(ctx, [this.pt1.x+((this.pt2.x-this.pt1.x)/2), this.pt1.y+((this.pt2.y-this.pt1.y)/2)]);

					// console.log(`1: Fighting: ${$fighting}, Auto: ${$auto_fight}`);
					if (!$auto_fight) {
						// console.log("not auto");
						$fighting = false;
					} else {	
						const afford = $afford_fight();
						$fighting = afford;
						$auto_fight = afford;
						// console.log(`Can Afford: ${afford}`);
					}
					// console.log(`2: Fighting: ${$fighting}, Auto: ${$auto_fight}`);
					// console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
				}
			}
		}
	}
	$: if ($fighting) spawn_monster();
	//#endregion
	//#region | Debug mode
	let total_orbs = 0;
	$: {
		total_orbs = 
			$basic_orb.amount + 
			$light_orb.amount + 
			$homing_orb.amount + 
			$spore_orb.amount + 
			orbs.sub_spore_allocated + orbs.sub_spore_over;
	}
	let calc_orbs = 0;
	$: {
		calc_orbs = 
			$basic_orb.amount + 
			$light_orb.amount + 
			orbs.homing.length + 
			$spore_orb.amount + 
			orbs.sub_spore_allocated;
	}

	let debug = false;
	//#endregion
</script>

<main bind:this={main} style="opacity: {$toggled ? "1" : "0"}; pointer-events: {$toggled ? "all" : "none"};">
	<canvas bind:this={canvas}></canvas>
	
	<h3 id="cash" style="{debug ? "background-color: #000000bb;" : ""}">
		Cash: {sci($cash)} <br> 
		{#if debug} 
			$/sec: {format_num(cps)} <br> 
			Calc $/sec: {format_num(calc_cps)} <br> 
			FPS: {fps} <br> 
			Total Orbs: {format_num(total_orbs)} <br>
			Calculated Orbs: {format_num(calc_orbs)} {/if}
	</h3>  
	<h3 id="toggle-txt" style="bottom: {$bounce.size}px;">Press "Esc" to toggle shop</h3>
	{#if $bounce.auto_unlocked}
		<h3 id="toggle-bounce" style="bottom: {$bounce.size}px;">Press "Tab" to turn {$bounce.auto_on ? "off" : "on"} auto bounce</h3>
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
			<img src="{monster_manager.src}" alt="monster Icon" style="width: {(monster_manager.pt2.y-monster_manager.pt1.y)/2}px; height: {(monster_manager.pt2.y-monster_manager.pt1.y)/2}px;">
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
		color: #999;
		font-weight: normal;
	}
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
</style>