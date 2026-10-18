# backburner 
> ***a hub for all your internet finds* ✨**

## pitch 🎙
**~~why~~ does your watchlist need ai?**          
heck, why stop at watchlists? enshittfy and romanticize internet consumerism culture with backburner for all it's worth, whether it's expensive t-shirts, hour-long video essays or hollywood slop - consuming all of them was never easier.

scared of wasting time *now*? waste it later, one screenshot takes care of it all; enjoy that familiar eternal doomscrolling trance fueled, by an uninterrupted euphoria of content addiction like never before.

 (satire)
 
## coolol features 🎀
- content identification for a large variety of content (music, products, tv etc)
- automatic screenshot cleanup
- recommendation and priority system
- catergorization and search
- i couldnt think of more cool stuff

## stack ⚙
- backend - the [bun runtime](https://bun.sh/), [typescript](https://www.typescriptlang.org/), [trpc](https://trpc.io/) (thanks theo) and [zod](https://zod.dev/)
- database - [drizzle](https://orm.drizzle.team/) with bun driver
- frontend - [svelte](https://svelte.dev/) my guy \*high fives\*
- auth - very vulnerable 😰
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
i. create a `.env` in the root folder and modify these as neccessary
```env
PORT=3000
BASE_URL="http://localhost:${PORT}"
JWT_SECRET="yoursecrethere"
```
```env
OPENROUTER_API_KEY='yourkeyhere'
TMDB_API_KEY='yourkeyhere'
```
ii. apply database migrations and build the schema (a `db.sqlite` file will appear at [db folder](links/db))
```bash 
bun run push
```
iii. then,
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
### • db view (optional)
```bash 
bun run studio
```

## previews 💄
you really do not wanna see my frontend skills.

## project structure 
just ask claude (ㆆ_ㆆ)

## ai usage (˶°ㅁ°) !!
autocomplete and some placeholder code

## contributing 👉👈
contributions are welcome! feel free to open an issue or submit a pull request (˶>⩊<˶)
- [changelog](assets/changelog.md)
- [roadmap](assets/roadmap.md)
- [todos and fixme](assets/todo.md) (pop up, say hi and fix a few bugs) 


## license
backburner is licensed under the [PolyForm Noncommercial License](https://polyformproject.org/licenses/noncommercial/1.0.0).

you are free to use, modify, and redistribute backburner for non-commercial purposes.
commercial use is not permitted.