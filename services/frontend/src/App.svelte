<script>
     import page from 'page'
     import Landing from './routes/Landing.svelte'
     import Register from './routes/Register.svelte';

     let current 

     page('/', () => {
          current = Landing;
     });

     page('/register', () => {
          current = Register;
     });

     page.start();

</script>

<svelte:head>
     <link rel="preconnect" href="https://fonts.googleapis.com">
     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
     <link href="https://fonts.googleapis.com/css2?family=Grenze:ital,wght@0,100..900;1,100..900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
</svelte:head>

<main>
     <svelte:component this={current}></svelte:component>
</main>

<style>
       main {
          width: 100svw;
          height: 99.7svh;

          background: repeating-linear-gradient(135deg, transparent 0 5px, var(--pattern) 5px 10px);
          background-size: 200% 200%;
          background-position: 0% 0%;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          user-select: none;
          z-index: -2;
          animation:stripes 120s linear infinite;
       }

     /* Bypass the mask and create a shadow effect on the background */
     main::before {
          content: '';

          position: absolute;
          bottom: 0;
          right: 0;

          width: 100%;
          height: 15%;

          z-index: -1;

          box-shadow: 0px -20px 50px 20px rgba(0, 0, 0, 0.7);
          background: var(--bg);
       }

    	main::after {
          content: '';

          position: absolute;
          bottom: 0;
          right: 0;

          width: 100%;
          bottom: -2px;
          height: 22%;

          z-index: -1;
          background: rgba(241, 231, 53);
          box-shadow: 0px -20px 50px 20px rgba(0, 0, 0, 0.7);
          mask: conic-gradient(from 135deg at top, #0000, #000 1deg 89deg, #0000 90deg) 50% / 50px 100%;
     }

     @keyframes stripes {
          to {
               background-position : 100% 100%;
          }
     }

     @media (max-width: 600px) {

     }
</style>