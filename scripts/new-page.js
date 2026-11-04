#!/usr/bin/env node
/**
 * Creates a screen folder with three files (HTML, CSS, and JavaScript).
 *
 * Usage:
 *   npm run new:page -- <group>/<screen-name> [--title "Title"] [--reqs "RF001-RF003"]
 *
 * Example:
 *   npm run new:page -- student/openings --title "Vagas compatíveis"
 *   -> creates src/pages/student/openings/openings.html | openings.css | openings.js
 *
 * Then register the route in src/app/routes.js (the command prints the route snippet).
 */
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---- simple argument parsing ----
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
const option = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

if (!target || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(target)) {
  console.error('Usage: npm run new:page -- <group>/<screen-name> [--title "Title"] [--reqs "RF001"]');
  console.error('Use lowercase letters, numbers, and hyphens. Example: student/openings');
  process.exit(1);
}

const [group, name] = target.split('/');
const title = option('--title') ?? name.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
const requirements = option('--reqs');
const dir = join(root, 'src', 'pages', group, name);

if (existsSync(dir)) {
  console.error(`Screen already exists: src/pages/${group}/${name}`);
  process.exit(1);
}

// ---- three file templates ----
const html = `<!--
  SCREEN: ${title}
${requirements ? `  Requirements: ${requirements}\n` : ''}  Where to edit:
    - Structure (HTML)   -> ${name}.html   (this file)
    - Styles (CSS)      -> ${name}.css
    - Behavior (JS) -> ${name}.js
-->
<section class="${name}-page">
  <h1>${title}</h1>
  <p>Screen not implemented yet. Edit <code>src/pages/${group}/${name}/${name}.html</code>.</p>
</section>
`;

const css = `/* Styles for the screen "${title}".
   Keep everything inside .${name}-page, to prevent styles from leaking into other screens
   (in an SPA, imported CSS remains on the page after navigation).
   Use Design System variables (src/styles/tokens.css): var(--color-primary)... */
.${name}-page {
  /* add styles here. CSS nesting is supported: .x { h1 { ... } } */
}
`;

const js = `import html from './${name}.html?raw';
import './${name}.css';

export default {
  title: '${title.replace(/'/g, "\\'")}',
  html,

  /**
   * Called after the HTML is inserted into the page.
   * @param {HTMLElement} root  element that contains the rendered screen
   * @param {{ params: Record<string, string>, query: URLSearchParams }} ctx
   *        params = route parameters (ex.: /courses/:id -> ctx.params.id)
   * @returns {Function | void} optional cleanup function, called when leaving the screen
   */
  mount(root, ctx) {
    // Example: root.querySelector('form')?.addEventListener('submit', (e) => { ... });

    return () => {
      // remove global listeners here (window/document), timers, and so on.
    };
  },
};
`;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, `${name}.html`), html);
writeFileSync(join(dir, `${name}.css`), css);
writeFileSync(join(dir, `${name}.js`), js);

console.log(`Screen created at src/pages/${group}/${name}/`);
console.log('\nNow register the route in src/app/routes.js:\n');
console.log(`  { path: '/${name}', layout: 'app', roles: [ROLES.STUDENT], load: () => import('../pages/${group}/${name}/${name}.js') },\n`);
