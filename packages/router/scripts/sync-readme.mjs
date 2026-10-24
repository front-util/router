import { copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// The repository root README is the single source of the public API
// documentation (see AGENTS.md): the npm package page must show it verbatim.
// here = packages/router/scripts → repo root is three levels up
copyFileSync(resolve(here, '../../../README.md'), resolve(here, '../README.md'));
