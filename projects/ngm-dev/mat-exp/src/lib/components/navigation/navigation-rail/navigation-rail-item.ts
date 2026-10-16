import { animateNavigationRailSelection } from './navigation-rail.animation';
import {
  afterRenderEffect,
  viewChild,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  Renderer2,
  DestroyRef,
  inject,
  input,
} from '@angular/core';
import { MatRipple } from '@angular/material/core';
import { MatExpNavigationRail } from './navigation-rail';

/** A native link or button destination. Selection remains owned by the application's route. */
@Component({
  // Native hosts preserve browser link/button behavior (the same pattern as Material buttons).
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'a[matExpNavigationRailItem], button[matExpNavigationRailItem]',
  exportAs: 'matExpNavigationRailItem',
  imports: [MatRipple],
  template: `
    <span class="mat-exp-navigation-rail-item-container">
      <span
        class="mat-exp-navigation-rail-item-ripple"
        matRipple
        [matRippleTrigger]="_element"
        [matRippleDisabled]="disabled()"
        aria-hidden="true"
      ></span>
      <span #indicator class="mat-exp-navigation-rail-item-indicator" aria-hidden="true"></span>
      <span class="mat-exp-navigation-rail-item-icon"
        ><ng-content select="[matExpNavigationRailIcon]"
      /></span>
      <span class="mat-exp-navigation-rail-item-label"><ng-content /></span>
      @if (badge() !== null) {
        <span
          class="mat-exp-navigation-rail-item-badge"
          [class.mat-exp-navigation-rail-item-dot]="badge() === ''"
          aria-hidden="true"
          >{{ badge() }}</span
        >
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-exp-navigation-rail-item',
    '[attr.aria-current]': 'selected() ? "page" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.disabled]': 'disabled() && _isButton ? "" : null',
    '[attr.tabindex]': 'disabled() ? -1 : null',
    '[attr.type]': '_isButton ? "button" : null',
    '[attr.data-selected]': 'selected()',
    '[hidden]': '_hidden()',
    '(click)': '_onClick($event)',
    '(keydown.space)': '_onSpace($event)',
  },
})
export class MatExpNavigationRailItem {
  private readonly _rail = inject(MatExpNavigationRail);
  /** @internal */
  readonly _element = inject(ElementRef<HTMLElement>).nativeElement;
  /** @internal */
  readonly _isButton = this._element.tagName === 'BUTTON';
  /** Mark the current destination, usually from RouterLinkActive. @default false */
  readonly selected = input(false, { transform: booleanAttribute });
  /** Skip a temporarily unavailable destination. @default false */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Reveal a secondary destination only in the expanded rail. @default false */
  readonly expandedOnly = input(false, { transform: booleanAttribute });
  /** Badge text; empty string displays a dot, null hides it. Describe its meaning in aria-label. @default null */
  readonly badge = input<string | null>(null);
  /** @internal */
  readonly _hidden = computed(() => this.expandedOnly() && !this._rail.expanded());

  constructor() {
    // Capture prevents consumer click handlers and RouterLink from activating disabled anchors.
    const stopDisabledClick = inject(Renderer2).listen(
      this._element,
      'click',
      (event: MouseEvent) => {
        if (this.disabled()) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
    inject(DestroyRef).onDestroy(stopDisabledClick);
    let initialized = false;
    afterRenderEffect((onCleanup) => {
      const selected = this.selected();
      const element = this._indicator().nativeElement;
      if (!initialized) {
        element.style.transform = selected ? 'scaleX(1)' : 'scaleX(0)';
        element.style.opacity = selected ? '1' : '0';
        initialized = true;
      } else {
        onCleanup(animateNavigationRailSelection(element, selected));
      }
    });
  }
  private readonly _indicator = viewChild.required<ElementRef<HTMLElement>>('indicator');

  /** @internal */
  _onClick(event: Event): void {
    const mouse = event as MouseEvent;
    if (this.disabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    } else if (!mouse.ctrlKey && !mouse.metaKey && !mouse.shiftKey && !mouse.altKey) {
      this._rail._dismiss();
    }
  }
  /** @internal */
  _onSpace(event: Event): void {
    if (!this._isButton) {
      event.preventDefault();
      if (!this.disabled()) this._element.click();
    }
  }
}
