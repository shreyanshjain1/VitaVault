# Patch 01D — Demo Typecheck Fix

This hotfix restores the shared demo data module used by the public `/demo` route family and removes one unused import from the AI insights demo page.

## Why this patch exists

The demo pages import sample records from `@/lib/demo-data`. When that file is missing, TypeScript cannot resolve the module and the demo pages also lose inferred item types for `.map()` callbacks.

The reported failure showed:

- `Cannot find module '@/lib/demo-data'`
- implicit `any` errors across demo pages
- one lint warning for an unused `ToneBadge` import

## Files changed

- `lib/demo-data.ts`
- `app/demo/ai-insights/page.tsx`

## Expected result

After applying this patch, run:

```bash
npm run typecheck
npm run lint
npm run test:run
```

The missing demo data module errors should be resolved, and the unused import warning in `app/demo/ai-insights/page.tsx` should be gone.
