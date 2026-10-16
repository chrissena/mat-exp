import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { MatExpNavigationRail } from './navigation-rail';

/** A labeled group of secondary destinations, as shown in the Expressive rail specification. */
@Component({
  selector: 'mat-exp-navigation-rail-section',
  exportAs: 'matExpNavigationRailSection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="mat-exp-navigation-rail-section-label" aria-hidden="true">
      {{ label() }}
    </div>
    <ng-content />`,
  host: {
    class: 'mat-exp-navigation-rail-section',
    role: 'group',
    '[attr.aria-label]': 'label()',
    '[hidden]': '_hidden()',
  },
})
export class MatExpNavigationRailSection {
  private readonly _rail = inject(MatExpNavigationRail);
  /** Visible section heading and accessible group name. */
  readonly label = input.required<string>();
  /** Hide this group in the collapsed rail. @default true */
  readonly expandedOnly = input(true, { transform: booleanAttribute });
  /** @internal */
  readonly _hidden = computed(() => this.expandedOnly() && !this._rail.expanded());
}
