<script>
	import { onMount } from "svelte";
	import { timer, cash } from "../stores.js";
	
	/** @type {HTMLCanvasElement} */
	let canvas;
	/** @type {CanvasRenderingContext2D} */
	let ctx;
	let pause = false;

	const orb_count = 5;

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

			if (pos[1] < 250 && pos[1] + vect[1] > 250) this.collect(i);
			else if (pos[1] > 250 && pos[1] + vect[1] < 250) this.collect(i);

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
			$cash++;
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
		bounce() {
			for (let i = 0; i < this.pos.length; i++) {
				if (this.pos[i][1] < 500) continue;
				this.vect[i][1] -= 30 - Math.random()*3;
				this.vect[i][0] += Math.random()*6-3;
				this.grounded[i] = false;
			}
		}
	};
	
	onMount(()=>{
		ctx = canvas.getContext("2d");
		
		canvas.width = 1000;
		canvas.height = 600;
		const w = canvas.width;
		const h = canvas.height;

		for (let i = 0; i < orb_count; i++) {
			orbs.new([1000/orb_count*i+(1000/orb_count/2), 580], [0, 0]);
		}
		
		timer.subscribe((v)=>{
			if (pause) return;
			ctx.fillStyle = "#333";
			ctx.fillRect(0, 0, w, h);
			
			ctx.fillStyle = "#33ffcc33";
			ctx.fillRect(0, 500, 1000, 500);

			ctx.strokeStyle = "lime";
			ctx.beginPath();
			ctx.moveTo(0, 250);
			ctx.lineTo(1000, 250);
			ctx.stroke();

			orbs.update();
		});
	});

	document.body.onmousedown = (e)=>{
		// orbs.new([10, 10], [10, Math.random()*15]);
		orbs.bounce();
	}
	document.body.onkeyup = (e)=>{
		const k = e.key;
		if (k == " ") pause = !pause;
		else if (k == "d") console.log(orbs);
	}

</script>

<main>
	<canvas bind:this={canvas}></canvas>
	<h3 id="cash">Cash: {$cash}</h3>
</main>

<style>
	main {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 100%;
	}
	canvas {
		border: 1px solid red;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
	#cash {
		position: absolute;
		left: 0; top: 0;
		padding: 0.5rem 0.7rem;
		color: #84f384;
	}
</style>