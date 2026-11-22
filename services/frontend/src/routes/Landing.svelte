<script lang="ts">
     import { createTRPCClient, httpBatchLink } from '@trpc/client';
     import type { AppRouter } from "../../../backend/router";

     import Query from '../utils/Query.svelte'

     const trpc = createTRPCClient<AppRouter>({
          links: [
               httpBatchLink({
                    url: 'http://localhost:3000',
               }),
          ],
     });

</script>

<Query query={() => trpc.status.query()}>
     {#snippet children(data)}<span>{data.status}</span>{/snippet}
</Query>