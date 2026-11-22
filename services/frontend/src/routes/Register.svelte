<section class="w-full h-full flex items-center justify-center">
	<div class="p-12! hero-container shadow" >
		<span class="!mb-[max(7rem,58%)]">login.</span>
		<button class="btn-striped-shadow github" on:click={() => {window.location.href = 'http://localhost:3000/auth/github';}}>with github</button>
		<button class="btn-striped-shadow google" on:click={() => {window.location.href = 'http://localhost:3000/auth/google';}}>with google</button>
		<p class="hidden">cant login?</p>
	</div>
</section>

<style>
     .hidden{
     	color: var(--hidden);
     	font-size: 0.8rem;
          font-family: "Boska";
     	text-decoration: underline;
     	cursor: pointer;
     }


	.btn-striped-shadow {
		--btn-color: #333;

		background-color: var(--btn-color);
		color: var(--accent);

		width: 100%;
		height: 48px;

		transition: opacity 0.3s, z-index 0.3s step-end, transform 0.3s;
	}

	.github {
		--btn-color: darkgreen;
	}

	.google {
		--btn-color: #353ff1;
		margin-bottom: auto;
	}

	@media (max-width: 600px) {
		.shadow {
			box-shadow: 0px 0px 40px 0px rgba(0, 0, 0, 0.35);
		}
	}
</style>