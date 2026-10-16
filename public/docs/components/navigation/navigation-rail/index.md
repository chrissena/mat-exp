---
title: Navigation rail
order: 1
description: Collapsed and expanded navigation, with standard and modal layouts.
primarySymbol: MatExpNavigationRail
designUrl: https://m3.material.io/components/navigation-rail/overview
---

The Expressive navigation rail shows primary destinations along the leading edge of an app.
It supports the configurations in the [Material specification](https://m3.material.io/components/navigation-rail/specs):

| Presentation          | Behavior                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Collapsed             | A persistent 96px rail with vertical icons and labels.                                                               |
| Standard expanded     | A 220px rail beside content; content resizes to fit.                                                                 |
| Modal expanded        | Overlays content with a scrim, traps focus, and dismisses on Escape, scrim click, or destination activation.         |
| Hidden when collapsed | `hideOnCollapse` removes the closed rail. An external menu button opens it. Works with standard and modal expansion. |

The baseline 80px rail is no longer recommended by Material and is not included. The expanded
rail replaces the navigation drawer. Use a navigation bar for compact layouts; a hidden modal
rail can provide additional destinations. Breakpoint selection remains the application's choice.
Do not show a navigation bar and a persistent rail together.

## Playground

Use the menu to expand/collapse. Switch to Modal to test the scrim and keyboard focus trap.
Enable Hide when collapsed to use the menu in the content area. Archive is a secondary destination.

<playground-preview preview="navigation-rail"></playground-preview>

## Usage

Import the standalone components; their styles ship automatically. Configure an Angular Material
theme so `--mat-sys-*` colors and typography are available. No rail Sass mixin is required.
Give the layout a height (for example `height: 100dvh`) so the page and rail scroll independently.

```angular-ts name="app.ts"
import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatExpNavigationRail, MatExpNavigationRailItem } from '@ngm-dev/mat-exp';

@Component({
  selector: 'app-root',
  imports: [MatButtonModule, MatIcon, MatExpNavigationRail, MatExpNavigationRailItem],
  styles: `
    mat-exp-navigation-rail {
      height: 100dvh;
    }
  `,
  template: `
    <mat-exp-navigation-rail #rail [(expanded)]="expanded" mode="modal" hideOnCollapse>
      <div matExpNavigationRailHeader>
        <button matIconButton aria-label="Close navigation" (click)="rail.close()">
          <mat-icon>menu_open</mat-icon>
        </button>
      </div>
      @for (page of pages; track page) {
        <button
          matExpNavigationRailItem
          [selected]="current() === page"
          (click)="current.set(page)"
        >
          <mat-icon matExpNavigationRailIcon>folder</mat-icon>{{ page }}
        </button>
      }
      <main matExpNavigationRailContent>
        <button
          matIconButton
          aria-label="Open navigation"
          [attr.aria-expanded]="expanded()"
          (click)="rail.open()"
        >
          <mat-icon>menu</mat-icon>
        </button>
        <h1>{{ current() }}</h1>
      </main>
    </mat-exp-navigation-rail>
  `,
})
export class App {
  readonly expanded = signal(false);
  readonly current = signal('Inbox');
  readonly pages = ['Inbox', 'Sent', 'Drafts'];
}
```

For routing, use `a[matExpNavigationRailItem]` with `routerLink`, `routerLinkActive`, and
`[selected]="active.isActive"` where `#active="routerLinkActive"`. Selection is application-owned:
clicking a destination does not automatically mark it selected. Bind one destination to the current
route. Modified link clicks preserve browser new-tab behavior and leave the rail open.

## Accessibility and composition

- Label the navigation with `ariaLabel`. Destination text supplies each item's accessible name;
  set `aria-label` when more context is needed.
- Tab visits every destination. Up/Down arrows wrap between available destinations; Home/End
  select the first/last focus target without navigating. Enter or Space activates the focused item.
- Modal expansion focuses the first interactive element, traps Tab within the rail, and makes
  the page content inert. Closing restores focus to the opener. Wrap the full application content
  in this layout when using a modal rail; the backdrop is scoped to the layout, like `MatDrawer`.
- Keep the menu and optional FAB in `matExpNavigationRailHeader`. The application supplies the
  menu icon/label and changes them on expansion; a nested FAB should use level-zero elevation
  and may show an extended label when expanded.
- Use 3–7 primary destinations in the collapsed rail. `expandedOnly` reveals secondary destinations when expanded.
  Icons belong in `matExpNavigationRailIcon`; use filled icons when selected. Material Symbols
  variable fonts receive `FILL: 1` automatically; swap SVG icons yourself if needed.
- `badge=""` shows a dot; `badge="3"` shows text. Add the badge's meaning to the destination's
  `aria-label`, since the visual badge is hidden from screen readers.
- RTL uses the leading edge automatically. Labels wrap instead of truncating and grow with text.
- Expansion uses the Expressive default spatial curve (500ms), or fast spatial (350ms) for modal expansion, with effect motion for label fades. The active indicator grows from its center on selection. Reduced motion skips these transitions and Material ripple feedback follows the same preference. Native Android
  predictive-back gestures are not part of this web component.

### Scrolling and grouped destinations

The guidelines keep the rail fixed while page content scrolls. They do not explicitly specify
whether an overflowing destination list should scroll. This implementation retains Material
drawer overflow scrolling so destinations remain reachable on short viewports or with large text;
that is an accessibility fallback, not a claim that the design spec prescribes a scrollable rail.

The official expanded example groups Schedule, Stats, and Sleep sounds under a “Sleep well”
heading. Use `MatExpNavigationRailSection` (`mat-exp-navigation-rail-section`) with a required
`label` to create this structure. Its `expandedOnly` input defaults to true. It exposes an accessible
named group and renders the heading with 12px top, 36px leading, and 8px bottom spacing.
It does not implement a collapsible submenu or a navigation tree; neither interaction is defined
by the rail guidance.

## API

### `MatExpNavigationRail`

Selector: `mat-exp-navigation-rail`; export: `matExpNavigationRail`.

| Input            | Default                | Description                                       |
| ---------------- | ---------------------- | ------------------------------------------------- |
| `expanded`       | `false`                | Two-way model, emits `expandedChange`.            |
| `mode`           | `'standard'`           | `'standard'` or `'modal'`; applies when expanded. |
| `hideOnCollapse` | `false`                | Hide the closed rail; provide an external menu.   |
| `alignment`      | `'top'`                | `'top'` or `'center'` destination placement.      |
| `ariaLabel`      | `'Primary navigation'` | Accessible name.                                  |

Methods: `open()`, `close()`, `toggle()`.

`provideMatExpNavigationRailOptions({...})` overrides these defaults at an injector level.
`MAT_EXP_NAVIGATION_RAIL_OPTIONS` is the corresponding injection token.

### `MatExpNavigationRailItem`

Selectors: `button[matExpNavigationRailItem]`, `a[matExpNavigationRailItem]`.

| Input          | Default | Description                                                        |
| -------------- | ------- | ------------------------------------------------------------------ |
| `selected`     | `false` | Current destination; exposes `aria-current="page"`.                |
| `disabled`     | `false` | Disables activation and removes the item from keyboard navigation. |
| `expandedOnly` | `false` | Only visible in the expanded rail.                                 |
| `badge`        | `null`  | Text, an empty string for a dot, or null for none.                 |

## Styling

Styles are scoped by `.mat-exp-navigation-rail` and `.mat-exp-navigation-rail-item`.

| CSS custom property                         | Default                            | Purpose                                       |
| ------------------------------------------- | ---------------------------------- | --------------------------------------------- |
| `--mat-exp-navigation-rail-collapsed-width` | `6rem` (96px)                      | Collapsed rail width.                         |
| `--mat-exp-navigation-rail-expanded-width`  | `13.75rem` (220px)                 | Expanded width; use 220–360px per Material.   |
| `--mat-exp-navigation-rail-container-color` | `var(--mat-sys-surface-container)` | Rail surface; `transparent` removes the fill. |

Color and typography follow Material system tokens in light and dark themes. The expanded active
indicator hugs its content, while the native link/button target spans the rail's entire width.
For a taller app surface, keep content scrolling inside the layout so destinations stay visible.
