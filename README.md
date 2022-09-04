pixiv Bookmarks Visualizer
===

Performing complex search with your pixiv bookmarks.

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
