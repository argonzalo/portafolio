import { dev } from 'astro'
// Isolated optimizer avoids races with another executor's dev server.
await dev({ server: {host:'127.0.0.1',port:3012}, devToolbar: {enabled:false}, vite: {cacheDir:'node_modules/.vite-a24'} })
