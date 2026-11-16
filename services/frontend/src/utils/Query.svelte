<script lang="ts">
import { createQuery } from "./query.svelte.ts";
import Error from "../lib/Error.svelte";

let { query } : {query : Promise<unknown>}= $props();
let result = $state(createQuery({}, query));

</script>

<main>
     {#if result.error}
          <Error>Internal server error, can't reach server at the moment</Error>
     {:else if result.isLoading}
          <div class="loader"></div>
     {:else if result.data}
          <span>{result.data}</span>
     {/if}
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