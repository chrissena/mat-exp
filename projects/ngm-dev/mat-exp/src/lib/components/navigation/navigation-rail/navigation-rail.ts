import { createNavigationRailMotion } from './navigation-rail.animation';
import { DOCUMENT } from '@angular/common';
import { InteractivityChecker } from '@angular/cdk/a11y';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { type MatExpNavigationRailAlignment, type MatExpNavigationRailMode } from '../../../types';
import { injectMatExpNavigationRailOptions } from './navigation-rail.options';

/**
 * Expressive navigation layout. Project destinations directly, a menu/FAB in
 * `[matExpNavigationRailHeader]`, and page content in `[matExpNavigationRailContent]`.
 */
@Component({
  selector: 'mat-exp-navigation-rail',
  exportAs: 'matExpNavigationRail',
  imports: [MatDrawer, MatDrawerContainer, MatDrawerContent],
  templateUrl: './navigation-rail.html',
  styleUrl: './navigation-rail.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-exp-navigation-rail',
    '[attr.data-expanded]': 'expanded()',
    '[attr.data-mode]': 'mode()',
    '[attr.data-hide-on-collapse]': 'hideOnCollapse()',
    '[attr.data-hidden]': '!expanded() && hideOnCollapse()',
    '[attr.data-alignment]': 'alignment()',
  },
})
export class MatExpNavigationRail {
  private readonly _options = injectMatExpNavigationRailOptions();
  private readonly _document = inject(DOCUMENT);
  private readonly _checker = inject(InteractivityChecker);
  private readonly _panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly _drawerElement = viewChild.required('drawer', { read: ElementRef });
  private readonly _contentElement = viewChild.required('content', { read: ElementRef });
  private _motion?: ReturnType<typeof createNavigationRailMotion>;
  private _previousFocus: HTMLElement | null = null;
  private _wasExpanded = false;
  private _wasModal = false;

  /** Whether the rail is expanded; supports `[(expanded)]`. @default false */
  readonly expanded = model(this._options.expanded);
  /** How the expanded rail relates to content. @default 'standard' */
  readonly mode = input<MatExpNavigationRailMode>(this._options.mode);
  /** Close to a hidden rail instead of the persistent collapsed rail. @default false */
  readonly hideOnCollapse = input(this._options.hideOnCollapse, { transform: booleanAttribute });
  /** Destination alignment. @default 'top' */
  readonly alignment = input<MatExpNavigationRailAlignment>(this._options.alignment);
  /** Accessible name of the navigation region and modal. @default 'Primary navigation' */
  readonly ariaLabel = input(this._options.ariaLabel);
  /** @internal */
  readonly _modal = computed(() => this.mode() === 'modal' && this.expanded());

  constructor() {
    // Material owns the focus trap. Expansion can change side -> over without
    // opening the drawer again, so focus entry/restoration is managed here.
    afterRenderEffect(() => {
      const expanded = this.expanded();
      const modal = this._modal();
      const hidden = !expanded && this.hideOnCollapse();
      // Refresh motion geometry when destination alignment changes.
      this.alignment();
      const panel = this._panel().nativeElement;
      if (this._motion) this._motion.update(this.mode() === 'modal');
      else
        this._motion = createNavigationRailMotion(
          this._drawerElement().nativeElement,
          this._contentElement().nativeElement,
        );
      if ((expanded && !this._wasExpanded) || (modal && !this._wasModal)) {
        this._previousFocus = this._document.activeElement as HTMLElement | null;
      }
      if (modal && !this._wasModal) {
        const first = Array.from(panel.querySelectorAll<HTMLElement>('button, a, [tabindex]')).find(
          (element) => this._checker.isFocusable(element) && this._checker.isTabbable(element),
        );
        (first ?? panel).focus({ preventScroll: true });
      } else if ((!expanded && this._wasExpanded) || (!modal && this._wasModal)) {
        this._restoreFocus();
      } else if (hidden && panel.contains(this._document.activeElement)) {
        this._restoreFocus();
      }
      this._wasExpanded = expanded;
      this._wasModal = modal;
    });
    inject(DestroyRef).onDestroy(() => {
      if (this._wasModal) this._restoreFocus();
      this._motion?.destroy();
    });
  }

  /** Expand from a menu button. */
  open(): void {
    this.expanded.set(true);
  }
  /** Return to the collapsed or hidden presentation. */
  close(): void {
    this.expanded.set(false);
  }
  /** Toggle expansion from a menu button. */
  toggle(): void {
    this.expanded.update((value) => !value);
  }

  /** @internal */
  _dismiss(): void {
    if (this._modal()) this.close();
  }

  /** @internal */
  _onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this._modal() && !event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = Array.from(
      this._panel().nativeElement.querySelectorAll<HTMLElement>('.mat-exp-navigation-rail-item'),
    ).filter((item) => this._checker.isFocusable(item) && this._checker.isTabbable(item));
    const index = items.findIndex(
      (item) => item === event.target || item.contains(event.target as Node),
    );
    if (index < 0 || !items.length) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  }

  private _restoreFocus(): void {
    const previous = this._previousFocus;
    if (previous?.isConnected && this._checker.isFocusable(previous)) {
      previous.focus({ preventScroll: true });
    }
    this._previousFocus = null;
  }
}
