# FastSEO

FastSEO is a lightweight Arabic/RTL website analyzer for SEO, performance, accessibility and best practices.

## Architecture

- Static front end: `index.html`
- Crawlable pages: `services.html`, `contact.html`, `privacy.html`, `terms.html`
- Custom error page: `404.html`
- Sitemap and robots: `sitemap.xml`, `robots.txt`
- Social preview: `og-image.svg`
- Secure PageSpeed proxy: `functions/api/pagespeed.js`

## Important: PageSpeed API key

The browser no longer contains a Google PageSpeed API key. The API key is read server-side from the `PAGESPEED_API_KEY` environment variable.

For the secure analyzer endpoint, deploy this repository with **Cloudflare Pages** (Pages Functions are supported by the `functions/` directory), then add a project environment variable/secret named:

`PAGESPEED_API_KEY`

Do not commit the key to GitHub or place it inside `index.html`.

## GitHub Pages

The static pages can still be published with GitHub Pages, but the `/api/pagespeed` function will not execute there. In that case the analyzer requires a separate server-side API endpoint and the front end can be pointed to it with `window.FASTSEO_API_ENDPOINT`.

## Custom domain

The repository keeps `CNAME` configured for `fastseo.site`.
