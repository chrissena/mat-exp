# Progress indicators: implementation and validation

## Scope

This independently reviewable slice supplies the complete variant/mode/shape matrix through
`MatExpProgressIndicator`: linear/circular × determinate/indeterminate × standard/wavy.
The existing `MatExpLoadingIndicator` is a different Material component and is preserved.
The implementation reuses the library's options-injection pattern, standalone component styling,
Material system colors, GSAP lifecycle conventions, and docs custom-element registry.

Acceptance: usable exported components, accurate semantic progress, reference default dimensions,
working motion and reduced motion, live mode changes, responsive layout, an interactive demo,
regression checks, and a package-consumer build. No upstream publication is part of this change.

## Sources inspected on 2026-10-16

The official pages were read through Context7 and then rendered in Chromium to inspect the complete
text (the web reader only returned a JavaScript notice):

- [Overview](https://m3.material.io/components/progress-indicators/overview): variant scope and expressive configuration.
- [Specs](https://m3.material.io/components/progress-indicators/specs): flat default, configurable thickness, wave measurements, colors, anatomy.
- [Guidelines](https://m3.material.io/components/progress-indicators/guidelines): known/unknown behavior, placement, stop marker, RTL and responsive sizes.
- [Accessibility](https://m3.material.io/components/progress-indicators/accessibility): labeling and contrast, including indicators inside buttons.

Reference dimensions and choreography were checked in AndroidX at commit
[`a0ac426972c276950ec8beb0a88382cc1300419d`](https://github.com/androidx/androidx/tree/a0ac426972c276950ec8beb0a88382cc1300419d/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3):
`WavyProgressIndicator.kt`, `ProgressIndicator.kt`, and the `LinearProgressIndicatorTokens`,
`CircularProgressIndicatorTokens`, `ProgressIndicatorTokens`, and `MotionTokens` files under `tokens/`.
These provide reference defaults where the web measurements are images; they are not extra web API requirements.

## Requirement mapping

Paths below are relative to `projects/ngm-dev/mat-exp/src/lib/components/loading-and-progress/progress-indicator/`
unless qualified.

| Requirement or reference behavior | Implementation | Validation |
| --- | --- | --- |
| Both geometries, known/unknown modes, optional waves; flat/determinate default | `progress-indicator.ts`, exported progress types | Component matrix test; demo shows all four shapes/geometries and switches mode |
| Accurate known amount; unknown amount has no numeric value | Shared clamped `_value`, host `aria-valuenow` only in determinate mode | Bounds/NaN/infinity and live mode-switch unit tests; browser mode switch |
| Named progressbar, meaningful process/content label | Host role, `ariaLabel`, `ariaLabelledby`, `valueText`; decorative SVG hidden | DOM assertions, no tab stop; consumer naming guidance |
| Rounded active and inactive strokes, visible separation | `progressPaths`, round line caps; gaps account for cap radii | Geometry gap test and browser inspection |
| Visible dot at tiny nonzero progress | Non-empty round-capped path for every positive range | Tiny-progress regression test |
| 4px stop marker only for linear determinate; contrast governs removal | Default `stopSize=4`; thin tracks retain a 4px container; caller can disable | Mode/variant tests, thin-stroke test; docs contrast guidance |
| Default stroke/track/gap 4px; standard circular diameter 40px | Options and geometry defaults | Geometry assertions |
| Wavy linear height 10px, amplitude 3px, wavelength 40px known / 20px unknown | Automatic geometry defaults; configurable inputs | Unit tests and browser bounding boxes |
| Wavy circular diameter 48px, amplitude 1.6px, wavelength 15px | Automatic defaults, proportionally scaled amplitude/wavelength for custom diameter | Defaults and scaling tests; circular seam test |
| Circular diameter 24–240px; linear fills available width with end padding | Diameter bounds; 100%-8px width, 4px margins, ResizeObserver | Bounds and browser resize tests; caller must provide at least a 40px container |
| Primary active/stop, secondary-container track | CSS custom properties backed by `--mat-sys-*` | Light/dark browser inspection; color overrides documented |
| Button treatment: text/icon color, absent track | `showTrack=false`, active color override to `currentColor` | Track-removal unit test; docs integration recipe |
| Mirrored linear in RTL; clockwise circular unchanged | `:dir(rtl)` linear SVG transform; circular path begins at top | Browser RTL test |
| Growing/shrinking unknown progress | Reference two-segment linear timing and circular rotation/coverage in `.animation.ts` | Choreography unit tests; browser animation observation |
| Waves travel one wavelength/second by default | Time-based phase, optional `waveSpeed` | Pure geometry phase test; browser motion test |
| Reference wave flattening at <=10% and >=95%, 500ms interpolation | Amplitude tween and determinate progress tween | Endpoint and geometry tests; interactive demo |
| Unknown can become known | Reactive mode rebuild with determinate interpolation | Unit and browser switch tests |
| Reduced motion, clean teardown (repository requirements) | `gsap.matchMedia` freezes unknown segment and directly updates known values; context revert | Reduced-motion/no-tween, cleanup and SSR unit tests; live browser preference changes |
| Forced-colors support (web implementation requirement) | System colors; hidden track stays hidden | Browser forced-colors test |
| Placement, wait-time choice, grouped processes, completion feedback | Consumer documentation; application owns process timing and busy region | Documentation review; not falsely implemented as component timers |

## Motion reference values

Linear unknown progress repeats every 1750ms. Segment head/tail durations are 1000/1000ms and
850/850ms, delayed by 0/250ms and 650/900ms respectively. Circular unknown progress repeats its
10%–87%–10% coverage over 6000ms, with 1080° background rotation and 90° eased increments every
1500ms (300ms increment duration). The corresponding reference cubic curves are registered in
GSAP; no CSS animation engine or new dependency is introduced.

## Validation results

- Library production build and packaged Sass build: pass.
- Library unit suite: 112 tests, including 28 new progress tests, pass.
- Existing docs unit suite: 5 tests pass.
- Angular lint for library and docs, plus token-file consistency: pass.
- Production docs generation/prerender/Pagefind pipeline: pass, 107 routes.
- Chromium progress integration suite: 4 tests pass (mode/value updates, live reduced motion, resize/RTL, forced colors).
- Manual Chromium inspection: light/dark schemes, default shapes and dimensions.
- Packed library installed into an independent Angular application in `/tmp/progress-package-smoke`:
  strict template compilation of the documented imports/usages and Sass entry: pass.

## Explicit limits and ordered follow-up work

The fork has GitHub Issues disabled, so the ordered follow-up issue scope is recorded here rather than changing repository settings.

This is not a blanket claim of full official compliance. The official variant/configuration matrix
is implemented, but the following validation and rendering limits remain:

1. **Cross-platform visual parity:** SVG waves are sampled sine curves with an integral circular wave
   count, not AndroidX's drawing engine. Token dimensions and choreography are checked; exact wave
   curvature, circular gap appearance at every phase, and the web spec's image measurements have
   not been pixel-diffed against official assets. A follow-up visual-reference test should establish
   goldens before claiming pixel-perfect parity.
2. **Assistive-technology and browser coverage:** semantic DOM and Chromium behavior are tested.
   Manual NVDA/VoiceOver announcements and Firefox/WebKit rendering remain unverified. Add these
   checks before a broad compatibility claim.
3. **Reference mode-handoff choreography:** the mode changes correctly and known values interpolate,
   but it does not preserve the exact moving indeterminate segment's position during the handoff.
   A reference-aligned continuity refinement can be reviewed separately; semantic progress is accurate
   immediately.

The default theme was visually checked; consumer-supplied colors, backgrounds, placement, labels,
and progress values remain the application's responsibility. No buffer/query modes, pause controls,
or automatic completion announcements are inferred from the official two-mode specification.
