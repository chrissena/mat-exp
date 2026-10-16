# Expressive navigation rail

MVP: a standalone layout component and native button/link destination components, backed by Angular Material drawer and CDK focus utilities. Cover collapsed, standard expanded, modal expanded, and hidden-on-collapse presentations, without changing existing components.

Acceptance: standard expansion resizes content; modal expansion overlays it with a scrim and traps/restores focus; Escape/backdrop dismiss modal; closed hidden rails are not focusable; destinations support Tab, arrows, Enter/Space and `aria-current`; RTL uses the leading edge; labels wrap at 200% text scaling; theme colors use Material system tokens. Include all modes in the docs playground, unit and browser tests, and verify the packed library.

Sources reviewed on 2026-10-16:
- https://m3.material.io/components/navigation-rail/overview
- https://m3.material.io/components/navigation-rail/specs
- https://m3.material.io/components/navigation-rail/guidelines
- https://m3.material.io/components/navigation-rail/accessibility

The Expressive collapsed rail replaces the baseline rail; baseline is explicitly no longer recommended. Expanded rails may be standard or modal, and may return to a collapsed rail or hide. Native Android predictive-back is platform-specific; the web dismissal contract is Escape, scrim, and menu.

Critical path: library primitives → integrated playground/documentation → unit, browser/accessibility and package validation. Optional follow-up: custom GSAP layout morphs; breakpoint policy helpers (applications choose when to switch to a navigation bar); screenshot baselines beyond this component. No publishing or upstream PR is part of this task.
