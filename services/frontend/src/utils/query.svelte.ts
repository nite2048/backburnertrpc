import { untrack } from "svelte";

type Query<T> = {
     readonly result: T | Error;
     readonly isLoading: boolean;
     readonly refetch: () => Promise<void>;
};

export function createQuery<T>(query: () => Promise<T>, options: {refetch?: boolean; deps?: () => unknown} = {}) : Query<T>{
     const { refetch: canRefetch = true, deps } = options;

     let result = $state.raw<T | Error>(new Error("Promise not yet resolved"))
     let isLoading = $state(true);
     let requestId = 0;

     async function run() {
          const id = ++requestId;
          isLoading = true;

          try {
               const queryResult = await query();
               if (id === requestId) result = (queryResult == undefined) ? new Error("Query returned nothing") : queryResult;
          } catch (err) {
               if (id === requestId) {
                    if (err instanceof Error) {
                         result = err
                    }else {
                         result = new Error(`Uncaught exception ${err}`)
                    }
               }
          } finally {
               if (id === requestId) isLoading = false;
          }
     }

     $effect(() => {
          if (!canRefetch) {
               untrack(run);
               return;
          }

          deps?.();
          run();
     });

     return {
          get result() { return result; },
          get isLoading() { return isLoading; },
          refetch: run
     };
}