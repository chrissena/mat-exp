# 0008 — Expressive navigation rail composition

## Decision

Provide a standalone navigation layout around Angular Material `MatDrawer`, plus native
button/link destination components and a labeled section component. Use the non-button-family
component-style path with Material system tokens, `ViewEncapsulation.None`, and narrowly scoped
class selectors. Application state determines the active route and responsive mode.

## Rationale

Angular Material has no Expressive rail. Its drawer already supplies a tested backdrop, RTL
placement, and focus trap. The rail's collapsed-to-modal transition changes drawer mode without
reopening it, so the wrapper explicitly handles focus entry/restoration. Content is inert while
modal. Hidden rails remain mounted for coherent width transitions, but are zero-width, inert,
and aria-hidden. Do not remove those accessibility protections merely because content is clipped.

A destination is an Angular component on a native `a` or `button`. A custom element around an
interactive control would complicate RouterLink, native modified clicks, and focus semantics.
The component-selector lint exception is deliberately local to this declaration.

Rail dimensions are known CSS values, so content margins follow those values directly instead
of enabling per-change-detection drawer measurement. GSAP handles spatial/effect motion using
the published web equivalents of Expressive spring tokens, including interruption and cleanup.

## Alternatives

A wholly custom overlay would duplicate Material/CDK focus and backdrop behavior. Wrapping
MatNavList would couple rail indicators and label orientation to list layout internals. A data-only
menu model would constrain routing, icons, and action composition. These were not chosen.

## Consequences

Consumers provide a menu and optional FAB in the header and put page content in the content
slot. Modal scope is the component layout, like MatDrawer; app-level modal navigation requires
wrapping the whole app content. Grouped secondary destinations are supported. Nested trees and
collapsible submenus are not inferred from the specification. See `docs/navigation-rail-specification.md`.
