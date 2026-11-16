export function createQuery<T>(dependencies: unknown, queryFn: Promise<T>) {
     let data = $state<T | undefined>();
     let error = $state<Error | null>(null);
     let isLoading = $state(true);

     async function refetch() {
          isLoading = true;
          error = null;

          try {
               data = await (async () => {
                   await queryFn
               })()
          } catch (err) {
               error = err instanceof Error ? err : new Error(String(err));
          } finally {
               isLoading = false;
          }
     }

     $effect(() => {
          (() => {
              dependencies
          })()
          refetch();
     });

     return {
          get data() { return data; },
          get error() { return error; },
          get isLoading() { return isLoading; },
          refetch
     };
}