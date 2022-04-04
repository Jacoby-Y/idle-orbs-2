<script>

</script>

<main>
	<h3>Coming soon!</h3>
</main>

<style>
	main {
		background-color: #7d6e5a;
		position: absolute;
		width: 100%;
		height: 33%;
		bottom: 0;
		left: 0;
		transition-duration: .3s;
		/* clip-path: polygon(0% 100%, 0% 100%, 80% 100%, 100% 70%, 100% 100%, 80% 100%); */
		clip-path: polygon(0 100%, 0 100%, 100% 100%, 100% 70%, 80% 100%);
	}
	main:hover {
		clip-path: polygon(0 0, 0 100%, 100% 100%, 100% 0, 100% 0);
	}
	h3 {
		position: absolute;
		left: 50%; top: 50%;
		transform: translate(-50%, -50%);
		color: white;
		width: max-content;
	}
</style>