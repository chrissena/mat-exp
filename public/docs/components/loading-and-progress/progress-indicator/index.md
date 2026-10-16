---
title: Progress Indicators
order: 2
description: Linear and circular progress with standard or expressive wavy tracks, known and unknown progress, and accessible values.
primarySymbol: MatExpProgressIndicator
---

## Overview

Use progress indicators for an ongoing process. Use `determinate` with accurate completed work;
use `indeterminate` while the amount is unknown, then switch to determinate when it becomes known.
Keep the same configuration for instances of the same process.

This component adds the [Material 3 progress variants](https://m3.material.io/components/progress-indicators/overview)
alongside the existing morphing **Loading Indicator**, which remains a separate component.
Both linear and circular indicators support standard and wavy active tracks. Waves flatten at
10% and below and 95% and above. Active and inactive tracks have rounded ends with a visible gap.

## Playground

<playground-preview preview="progress-indicator"></playground-preview>

## Usage

```angular-ts name="app.ts"
import { Component } from '@angular/core';
import { MatExpProgressIndicator } from '@ngm-dev/mat-exp';

@Component({
  selector: 'app-root',
  imports: [MatExpProgressIndicator],
  template: `<mat-exp-progress-indicator shape="wavy" [value]="45" ariaLabel="Uploading photos" />
    <mat-exp-progress-indicator variant="circular" shape="standard"
      mode="indeterminate" ariaLabel="Refreshing news articles" />`,
})
export class App {}
```

Component styles are included automatically; no Sass mixin is needed.

## API

| Input | Default | Meaning |
| --- | --- | --- |
| `variant` | `linear` | `linear` or `circular` |
| `showTrack` | `true` | Disable the inactive track inside a button |
| `mode` | `determinate` | `determinate` or `indeterminate` |
| `shape` | `standard` | `wavy` or `standard` |
| `value` | `0` | Completed percentage, clamped to 0–100; NaN/infinity become 0 |
| `ariaLabel` | `Loading` | Process and affected content, e.g. “Uploading photos” |
| `ariaLabelledby` | `null` | Visible label element ID; takes precedence over `ariaLabel` |
| `valueText` | `null` | Optional descriptive value such as “3 of 5 files” |
| `thickness`, `trackThickness` | `4` | Active/inactive stroke widths in CSS pixels |
| `gap` | `4` | Visible empty space between active and inactive strokes |
| `stopSize` | `4` | Linear determinate end marker diameter |
| `amplitude` | `null` | Auto: linear 3px, circular 1.6px; peak displacement |
| `wavelength` | `null` | Auto: linear determinate 40px, indeterminate 20px; circular 15px |
| `waveSpeed` | `null` | Auto: one wavelength/second; 0 freezes wave travel |
| `diameter` | `null` | Auto: circular standard 40px, wavy 48px |

The options provider `provideMatExpProgressIndicatorOptions({...})` configures default variant,
mode, shape, track visibility, label, stroke widths, gap, and stop size at any injector level.
Invalid geometry is normalized to finite, bounded dimensions. Circular diameters are clamped to the recommended 24–240px. Automatic circular amplitude and wavelength scale with diameter. Explicit overrides use absolute pixels. Circular waves use an integer number
of waves to avoid a seam. Linear width fills its container with 4px end margins. Use a container at least 40px wide. You can override the host width and margins. Height follows
the configured amplitude and stroke widths (default standard 4px / wavy 10px).

## Accessibility

The host has `role="progressbar"`, a label, and range 0–100. Only determinate mode exposes
`aria-valuenow`; animations never invent announced progress. Set a meaningful label naming the
process and content. `valueText` is optional and caller-managed: clear it when changing to unknown
progress if it contains a numeric amount. This is not an interactive control and is not a tab stop.

The linear determinate stop marker is on by default. Set `stopSize` to zero only if your track has
at least 3:1 contrast with its background. Ensure the active color also has sufficient contrast.
Forced-colors mode uses system colors. Linear progress follows text direction; circular progress
runs clockwise. Reduced motion disables all tweening and wave travel and shows a static segment
for unknown progress. The label and omitted numeric value still communicate the unknown process.

Mark the region being updated `aria-busy="true"` while work is in progress, and clear that state
when complete. Announce completion in application content as appropriate; a progressbar is not a
live region. Use one meaningful indicator per process to avoid duplicate announcements.

## Styling

Colors inherit the Material system theme, including dark themes:

```scss
mat-exp-progress-indicator {
  --mat-exp-progress-active-color: var(--mat-sys-primary);
  --mat-exp-progress-track-color: var(--mat-sys-secondary-container);
  width: 100%; // for a responsive linear indicator
}
```

Use numeric inputs for geometry rather than overriding SVG stroke widths, so gaps and bounds remain
consistent. Increasing stroke thickness also increases the linear container height as needed.

## Specification coverage

The implementation follows the official overview, guidelines, accessibility guidance and AndroidX
reference tokens. See `docs/progress-indicators.md` in the repository for the requirement mapping,
validation results, and limits. SVG wave geometry is a sampled sine approximation, not a pixel-perfect
port of AndroidX's drawing engine. No blanket claim of full official compliance is made.

### Inside a button

Use the standard circular shape for small buttons. Match the active indicator to the button text
and set `[showTrack]="false"`, as the official accessibility guidance requires:

```scss
button mat-exp-progress-indicator {
  --mat-exp-progress-active-color: currentColor;
}
```

Center circular indicators in the region being loaded; place linear indicators along its edge.
Prefer no indicator for waits under 200ms, the existing Loading Indicator for 200ms–5s, and progress
indicators for longer waits. These are application placement and timing decisions, not automatic timers.
