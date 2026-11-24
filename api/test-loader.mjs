// Lets `node --test` run the API's TypeScript sources directly. The sources import
// siblings as `./x.js` (what Vercel's compiled output needs); during tests we map a
// missing `.js` file to its `.ts` source.
import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL) {
      const candidate = new URL(specifier, context.parentURL)
      if (!existsSync(fileURLToPath(candidate))) {
        return nextResolve(specifier.slice(0, -3) + '.ts', context)
      }
    }
    return nextResolve(specifier, context)
  },
})
