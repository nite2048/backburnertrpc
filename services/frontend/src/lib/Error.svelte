<script lang="ts">
     export let message="";
     export let code="";
</script>

<section class=" error">
     <div>
          <span style="color: var(--error); text-decoration-style: wavy;">error {code} :
          <span style="color: var(--accent); text-decoration: none; font-family: 'Saygon';">{message.toLowerCase()}</span>
          </span>
     </div>
</section>

<style>
     *{
          text-align: center;
     }

     .error{
         	position: relative;
         	width: 110%;
         	height: 20%;

          flex-direction: column;
     	align-items: center;
     	justify-content: center;

     	padding: 1rem;
     	margin: 0 0 5% 0;
     	gap: 0.5rem;

     	border: 0.12rem dashed rgba(255, 255, 255, 0.12);
     	border-radius: 0.75rem;

     	box-shadow: 0px 0px 40px 0px rgba(0, 0, 0, 0.4);
     	backdrop-filter: blur(2px);
     	-webkit-backdrop-filter: blur(2px);

          text-overflow: break-word;
     }

     span{
          text-decoration: underline;
          font-family: "Spock";
          font-size: 1.5rem;
          text-shadow: none;
     }
</style>