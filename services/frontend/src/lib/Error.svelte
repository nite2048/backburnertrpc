<script lang="ts">
     export let message="";
     export let code="";
</script>

<section class="body">
     <span class="red-squiggle">
          <span class="error"> { code ? code : "Unexpected Error"}:</span>
     </span>

     <span class="red-squiggle">
          <span class="message">{message}</span>
     </span>
</section>

<style>
     *:not(.red-squiggle){
          text-align: center;
          text-decoration: none;
          text-shadow: none;
          color: var(--accent);
     }

     .red-squiggle{
          color: var(--error);
          text-decoration-style: wavy;
     }

     .error{
          font-family: "Space Mono";
          font-size: 1.25rem;
     }

     .message{
          font-family: "Grenze";
          font-size: 3rem;
     }

     .body{
         	position: relative;
         	width: 100%;
         	height: 20%;

          display: flex;
          flex-direction: column;
     	align-items: center;
     	justify-content: center;

          text-overflow: break-word;
     }
</style>