pixiv Bookmarks Visualizer
===

Performing complex search with your pixiv bookmarks.

![](./img/screenshot.jpg)

How to use?
---

> **Caution!** This project is only built for running locally, please do not deploy to public internet otherwise it might not working properly, or all of your private bookmarks will be public

First, you have to get your account refresh token in any mean nessesary. I recommend [this script](https://github.com/eggplants/get-pixivpy-token) to obtain refresh token.

Then, make your own `.env` file based on `.env.example` by providing refresh token and your user ID into the file.

```
cp .env.example .env
```

After that, install dependencies reqired for this project and run a script to obtain all of your bookmarks. Script will take a while to scrape data, depending on how much bookmarks in your account.

```
pnpm i
pnpm build:data
```

With that done, run development server.

```
pnpm next
```

Notes for うごイラ illusts
---

By default this web app will not try to display image as gifs since it take a lot of time to response back. If you want *うごイラ* illusts to be animated run following command to generated (somewhat) highly optimized animated WebP.

```
node -r @swc-node/register ./tools/ugoria.ts
```

Also, [`img2webp`](https://developers.google.com/speed/webp/docs/img2webp) is required. Install on your macOS by running `brew install webp`

Script expected to fail multiple times since there's a rate limit on Pixiv API. Wait for about 3-5 minutes for rate limit quota to refill and run the script again until scripts finished without any errors.
