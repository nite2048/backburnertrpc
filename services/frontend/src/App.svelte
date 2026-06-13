<script lang="ts">
     import { createTRPCClient, httpBatchLink } from '@trpc/client';
     import type { AppRouter } from "../../backend/router";

     const trpc = createTRPCClient<AppRouter>({
          links: [
               httpBatchLink({
                    url: 'http://localhost:3000',
               }),
          ],
     });

     const result = await trpc.hello.query();
     console.log(result);

</script>

<p>{result}</p>
