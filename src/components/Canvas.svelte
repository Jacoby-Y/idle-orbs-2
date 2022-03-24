<script>
	import { onMount } from "svelte";
	import { timer, cash, bounce_size, collector_pos, orb_count, auto_bounce, orb_bonus } from "../stores.js";
	import { manager, small_explosion } from "../particles.js";
	import { sci } from "../functions.js";

	const set_orbs = ()=>{
		console.log(`Orb count: ${$orb_count}`);
		orbs.free_all();
		for (let i = 0; i < $orb_count; i++) {
			orbs.new([1000/$orb_count*i+(1000/$orb_count/2)-10, 580], [0, 0]);
		}
	}
	
	//#region | Canvas
	let main;
	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {CanvasRenderingContext2D} */
	let ctx;
	let pause = false;

	let w, h; 
	//#endregion
	//#region | Orbs
	const orbs = {
		pos: [],
		vect: [],
		grounded: [],
		col(i, xy, mult) { 
			this.vect[i][xy] = Math.abs(this.vect[i][xy]) * mult; 
		},
		draw(i) {
			ctx.fillStyle = "aqua";
			ctx.fillRect(this.pos[i][0], this.pos[i][1], 20, 20);
		},
		physics(i) {
			if (this.grounded[i]) return;

			const pos = this.pos[i];
			const vect = this.vect[i];

			pos[0] += vect[0];
			pos[1] += vect[1];

			vect[1] += 1;
			vect[0] *= 0.99;
			vect[1] *= 0.99;

			if (pos[1] < $collector_pos && pos[1] + vect[1] > $collector_pos) this.collect(i);
			else if (pos[1] > $collector_pos && pos[1] + vect[1] < $collector_pos) this.collect(i);

			if (pos[0]+20 >= canvas.width) {
				this.col(i, 0, -1);
				pos[0] = canvas.width - 20;
			}
			else if (pos[0] <= 0) {
				this.col(i, 0, 1);
				pos[0] = 0;
			}
			if (pos[1]+20 >= canvas.height) {
				this.col(i, 1, -1);
				vect[1] *= 0.85;
				if (Math.abs(vect[1]) < 10) vect[1] *= 0.85;
				if (Math.abs(vect[1]) < 6) vect[1] *= 0.85;
				if (Math.abs(vect[1]) < 3) (vect[0] = 0, vect[1] = 0, this.grounded[i] = true);
				// console.log(vect[1]);
				pos[1] = canvas.height - 20;
			}
			else if (pos[1] <= 0) {
				this.col(i, 1, 1); 
				pos[1] = 0;
			}
		},
		collect(i) {
			$cash += $orb_bonus;
		},
		update() {
			for (let i = 0; i < this.pos.length; i++) {
				this.draw(i);
				this.physics(i);
			}
		},
		new([x, y], [vx, vy]) {
			this.pos.push([x, y]);
			this.vect.push([vx, vy]);
			this.grounded.push(false);
		},
		bounce(pos) {
			for (let i = 0; i < this.pos.length; i++) {
				if (this.pos[i][1] < 600-$bounce_size-21) continue;
				if (pos != null) this.vect[i][0] += (pos[0] - this.pos[i][0])/100;
				this.vect[i][1] -= 30 - Math.random()*3;
				this.grounded[i] = false;
			}
		},
		free(i) {
			this.pos.splice(i, 1);
			this.vect.splice(i, 1);
			this.grounded.splice(i, 1);
		},
		free_all() {
			this.pos = [];
			this.vect = [];
			this.grounded = [];
		}
	};
	//#endregion
	//#region | onMount
	const main_loop = (v)=>{
		if (pause) return;
		if (!visible && !toggled) {
			orbs.update();
			manager.update(false);
			return;
		}

		ctx.fillStyle = "#333636";
		ctx.fillRect(0, 0, w, h);
		
		ctx.fillStyle = "#33ffcc33";
		ctx.fillRect(0, 600-$bounce_size, 1000, 600-$bounce_size);
		draw_auto_bounce_bar();

		ctx.strokeStyle = "lime";
		ctx.beginPath();
		ctx.moveTo(0, 250);
		ctx.lineTo(1000, 250);
		ctx.stroke();

		manager.update();

		orbs.update();
	};
	onMount(()=>{
		ctx = canvas.getContext("2d");
		
		canvas.width = 1000;
		canvas.height = 600;
		w = canvas.width;
		h = canvas.height;

		set_orbs();
		orb_count.subscribe(set_orbs);
		timer.subscribe(main_loop);
		timer.subscribe(auto_bounce_loop);

		// key_up({ key: "Escape" });
	});
	//#endregion
	//#region | Events
	let toggled = true;
	/** @param {MouseEvent} e*/
	const mouse_down = (e)=>{
		// orbs.new([10, 10], [10, Math.random()*15]);
		const [x, y] = [e.layerX, e.layerY];
		orbs.bounce([x, y]);
		small_explosion(ctx, [x, y]);
	}
	const key_up = (e)=>{
		const k = e.key;
		if (k == " ") pause = !pause;
		else if (k == "o") console.log(orbs);
		else if (k == "Escape") toggled = !toggled;
		else if (k == "c") $cash += 1000;
		else if (k == "d") $cash += 0.3;
		else if (k == "b") $bounce_size += 10;
		else if (k == "r") orb_count.set(Math.ceil(Math.random()*10));
		// console.log(e);
	};
	
	$: { if (canvas != undefined) {
		canvas.onmousedown = mouse_down;
		document.body.onkeyup = key_up;
	}};
	//#endregion
	//#region | Visibility
	let visible = true;
	$: {
		if (main != undefined) {
			main.ontransitionend = ()=> visible = toggled;
		}
	}
	//#endregion
	//#region | Auto Bounce
	const draw_auto_bounce_bar = ()=>{
		ctx.fillStyle = "#33ffcc11";
		ctx.fillRect(0, 600-($bounce_size*(auto_bounce_perc)), 1000, 600-($bounce_size*(auto_bounce_perc)));
	}
	let auto_bounce_perc = 0;
	$: if (!$auto_bounce.unlocked) auto_bounce_perc = 0;
	const auto_bounce_loop = (v)=>{
		if (!$auto_bounce.unlocked) return;
		auto_bounce_perc = Math.ceil(v/29*100)/100;

		if (v == 29) orbs.bounce(null);
	}
	//#endregion
</script>

<main bind:this={main} style="opacity: {toggled ? "1" : "0"}; pointer-events: {toggled ? "all" : "none"};">
	<canvas bind:this={canvas}></canvas>
	<h3 id="cash">Cash: {sci($cash)}</h3>
	<h3 id="toggle-txt" style="bottom: {$bounce_size}px;">Press "Esc" to toggle</h3>
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
	}
	#toggle-txt {
		position: absolute;
		left: 0;
		bottom: 100px;
		padding: 0.5rem 0.6rem;
		color: #999;
	}
	h3 {
		pointer-events: none;
	}
</style>