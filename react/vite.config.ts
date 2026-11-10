import { createHash } from 'node:crypto';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages cannot send HTTP headers, so the Content Security Policy goes in a meta tag.
// It is added at build time only (dev mode injects its own inline scripts), and every inline
// script in the final HTML is allowed by its hash, so editing the theme script never breaks it.
function csp(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
          .map(([, body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`);
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(' ')}`.trim(),
          "style-src 'self' https://fonts.googleapis.com",
          'font-src https://fonts.gstatic.com',
          "img-src 'self' data:",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'none'",
          "form-action 'none'",
        ].join('; ');
        return html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n  <meta http-equiv="Content-Security-Policy" content="${policy}">`);
      },
    },
  };
}

// base './' lets the build work on GitHub Pages under any repo name
export default defineConfig({ base: './', plugins: [react(), csp()] });
