# Navigation rail specification mapping

Reviewed 16 October 2026. The official pages were rendered in Chromium, including the
measurement diagram, the collapsed/expanded illustration, and the “extra destinations” video.
The text was also cross-checked through Context7's `/websites/m3_material_io` source.

## Authoritative sources

- [Overview](https://m3.material.io/components/navigation-rail/overview): Expressive variants and configurations.
- [Specifications](https://m3.material.io/components/navigation-rail/specs): dimensions, anatomy, colors, states, and common layouts.
- [Guidelines](https://m3.material.io/components/navigation-rail/guidelines): usage, placement, adaptation, selection, and scrolling.
- [Accessibility](https://m3.material.io/components/navigation-rail/accessibility): focus, keyboard, labels, and text scaling.
- [Motion specs](https://m3.material.io/styles/motion/overview/specs): official web spring-to-curve conversion.
- [Motion theming](https://m3.material.io/blog/m3-expressive-motion-theming): spatial versus effects motion; expanded rail example.
- [AndroidX rail reference](https://github.com/androidx/androidx/blob/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/WideNavigationRail.kt) and its `NavigationRailCollapsedTokens`, `NavigationRailExpandedTokens`, `NavigationRailVerticalItemTokens`, `NavigationRailHorizontalItemTokens`, `NavigationRailBaselineItemTokens`, and `NavigationRailColorTokens`: implementation reference for values not exposed by the rendered web token table. This reference is not used to infer design rules about scrolling or nested menus.

## Requirement → implementation → validation

| Requirement | Implementation | Validation |
| --- | --- | --- |
| Collapsed / expanded variants | `expanded` two-way model | Unit tests, playground, browser dimensions |
| Standard expansion resizes content | Material side drawer with logical content margin | Browser geometry before/after expansion |
| Modal expansion overlays content | Material over drawer and scrim; content position retained | Browser geometry, Escape/scrim/destination dismissal |
| Hide on collapse | `hideOnCollapse`; closed panel is inert, aria-hidden, and zero-width | Both modes in playground; browser focus/geometry |
| 96px collapsed; 220–360px expanded | 6rem collapsed and 13.75rem expanded defaults; CSS width override | Browser 96/220 measurements; documented 360px override |
| 24px icons; 56×32px vertical indicator; 56px horizontal indicator height | Component styles; horizontal target fills rail while indicator hugs content | Browser measurements and visual inspection |
| Vertical label medium / horizontal label large; 4px / 8px icon-label gaps | Material system typography; rem spacing | Styles cross-checked against reference tokens |
| Collapsed items ≥64px high with 4px gap; expanded items ≥56px with no inter-item gap | Growing native buttons/links | Browser measurements and 200% text test |
| Top-aligned menu/FAB; top or centered destinations | Header projection and `alignment` input | Browser alignment test, playground |
| Leading edge including RTL | Material `position=start` and logical CSS | Browser right-edge assertion |
| Current-page indicator and filled icon | `selected`, `aria-current=page`, variable-font FILL axis; SVG choice consumer-owned | Unit and browser selection assertions |
| Badges move from icon corner to after expanded label | `badge`; separate accessible label contract | Playground visual inspection and axe |
| Secondary destinations / groups in expanded rail | `expandedOnly` and named `MatExpNavigationRailSection` | Playground “Library” section; hidden destinations skipped by keyboard |
| Full-width targets and complete labels at 200% text | Native full-width buttons/links, wrapping labels, growing item heights | Browser target dimensions and text-overflow checks |
| Tab/arrows, Enter/Space, first interactive focus | Native controls; visible-item arrow navigation; CDK focus checks | Browser keyboard sequence, modal trap and restoration |
| Theme integration | Material system color/typography tokens; component styles ship with library | Light/dark axe scans and screenshots |
| Expressive expansion/selection | GSAP spatial curves; icon/indicator position and size changes; label fade; indicator grows from center; Material ripple | Browser rapid-toggle and reduced-motion checks; motion source inspection |
| Reduced motion and lifecycle | Media-query listeners finish active motion; tweens/listeners disposed | Browser reduced-motion check; unit/SSR construction and package build |
| Web package and documentation | Public exports, options provider, single Component Page, playground registration | Library build, docs prerender, packed-package example compilation |

## Scrolling, item counts, and hierarchy: evidence boundaries

**Explicit text:** the 3–7 recommendation appears in collapsed usage. Expanded usage permits
additional secondary destinations and recommends modal presentation for products with many items.
The vertical scrolling guidance keeps destinations fixed while the page scrolls; horizontal scrolling
has its own alternatives. It does not specify internal destination-list scrolling.

**Visual evidence:** the menu example has four primary destinations, then a “Sleep well” heading
and Schedule, Stats, and Sleep sounds in the expanded version. The measurement diagram labels a
section header with 12px above and 8px below; destination content begins 36px from the leading edge.
These are grouped destinations, not a demonstration of nested expandable menus.

**Implementation choice:** Material drawer overflow remains available for short windows and
large text. It prevents inaccessible clipped destinations. This is an accessibility fallback, not a
claim that the design guidelines prescribe scrolling lists. Page scrolling remains independent.

**Unsupported inference:** neither “secondary destinations” nor the Android API's scrolling
capability establishes arbitrary collapsible child menus. This component exposes groups, not a tree.

## Platform adaptations and limits

- The official overview lists Web: Expressive as unavailable. This Angular implementation uses
  Material's published web motion conversions and CDK/Material behavior; it is not an official
  Google web implementation or a claim of pixel-identical native rendering.
- Android predictive-back is platform-specific. Web dismissal uses Escape, the scrim, the menu,
  and destination activation. Browser history belongs to the application router.
- Typography, SVG filled variants, breakpoint selection, route selection, localized menu labels,
  and optional FAB content are application-owned. The playground demonstrates these integration points.
- The modal is scoped to the layout, following `MatDrawer`; consumers wrap the whole app content
  when using it as their app-level modal navigation.
- Exact video frame-by-frame native choreography is not specified as a web algorithm. The web
  implementation uses the published spatial curves (500ms standard; 350ms modal, matching the
  reference rail's FastSpatial use) and 200ms effect curve. Those are documented adaptations.
- No physical screen-reader session has been performed. Automated accessibility checks and
  browser keyboard tests cover the implemented semantics, but do not replace that manual check.

## Validation record

- Library unit suite: 92 passed, including rail state, disabled-link activation, provider defaults,
  and server construction. Docs unit suite: 5 passed.
- Chromium: 12 rail scenarios passed; 31 existing component-page/API scenarios also passed.
  Rail cases include all mode/visibility combinations, keyboard focus, RTL, 200% text, theme
  contrast via axe, interrupted motion, and reduced-motion changes during animation.
- `npm run lint`: token consistency and both Angular projects passed.
- `npm run build:lib`: package built successfully. `npm run build:docs`: 108 routes prerendered,
  Pagefind index, sitemap, and llms output completed. The docs initial bundle reports a 622.16kB
  warning against its 500kB warning threshold (below the 2MB error threshold).
- `npm pack` output installed into a separate `/tmp/m3e-rail-consumer` app; the Component Page's complete Usage
  snippet and the package Sass entry compiled successfully. No source aliases were used.
- Chromium visual inspection: collapsed, standard expanded, and modal expanded; the expanded
  CSS override was measured at 360px. No browser runtime errors occurred during this inspection.
- Remote CI: the fork has no check runs on this PR at the time of validation. The results above
  are local checks on Bramble, not a claim about GitHub Actions.
