# backburner 
> ***a hub for all your internet finds* ✨**

## pitch 🎙
**~~why~~ does your watchlist need ai?**          
heck, why stop at watchlists? enshittfy and romanticize internet consumerism culture with backburner for all it's worth, whether it's expensive t-shirts, hour-long video essays or hollywood slop - consuming all of them was never easier.

scared of wasting time *now*? waste it later, one screenshot takes care of it all; enjoy that uninterrupted never-ending euphoria of content addiction like never before.

 (satire)
 
## coolol features 🎀
- content identification for a large variety of content (music, products, tv etc)
- automatic screenshot cleanup
- recommendation and priority system
- catergorization and search
- i couldnt think of more cool stuff

## stack ⚙
- backend - the [bun runtime](https://bun.sh/), [typescript](https://www.typescriptlang.org/), [trpc](https://trpc.io/) (thanks theo) and [zod](https://zod.dev/)
- database - under contemplation (ᵕ•_•)
- frontend - [svelte](https://svelte.dev/) my guy \*high fives\*
- auth - github and google + custom oauth
- apis - [tmdb](https://developer.themoviedb.org/) and [anilist](https://anilist.gitbook.io/anilist-apiv2-docs/) 🙇‍♀️
- free ai inference - [openrouter](https://openrouter.ai/) 🙇‍♀️🙇‍♀️🙇‍♀️

## running ts 👩‍🔧
### • prerequisites
- a lot of patience\*
- bun
- api keys for [tmdb](https://developer.themoviedb.org/) and [openrouter](https://openrouter.ai/)

### • quickstart
```bash 
git clone https://github.com/nite2048/backburnertrpc.git
```
```bash 
cd backburnertrpc
```
```bash 
bun install
```
create a `.env` in the root folder
```env
PORT=3000
OPENROUTER_API_KEY='yourkeyhere'
TMDB_API_KEY='yourkeyhere'
```
```bash 
bun run server
```
```bash 
bun run client
```

### • code report (optional)
```bash 
bun run todos
```

## previews 💄
you really do not wanna see my frontend skills.

## project structure 
just ask claude (ㆆ_ㆆ)

## ai usage (˶°ㅁ°) !!
autocomplete and some placeholder code

## contributing 👉👈
contributions are welcome! feel free to open an issue or submit a pull request (˶>⩊<˶)
- [changelog](assets/roadmap.md)
- [roadmap](assets/roadmap.md)
- [todos and fixme](assets/todo.md) (pop up, say hi and fix a few bugs) 


## license
backburner is licensed under the [PolyForm Noncommercial License](https://polyformproject.org/licenses/noncommercial/1.0.0).

you are free to use, modify, and redistribute backburner for non-commercial purposes.
commercial use is not permitted.
