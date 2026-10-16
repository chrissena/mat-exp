import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MatExpNavigationRail,
  MatExpNavigationRailItem,
  MatExpNavigationRailSection,
  type MatExpNavigationRailMode,
} from '@ngm-dev/mat-exp';

@Component({
  selector: 'app-navigation-rail-playground',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIcon,
    MatExpNavigationRail,
    MatExpNavigationRailItem,
    MatExpNavigationRailSection,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navigation-rail-playground.component.html',
  styles: `
    :host {
      display: block;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      margin-block-end: 1rem;
    }
    .controls label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    select {
      padding: 0.5rem;
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface);
      border-radius: 0.5rem;
    }
    .example {
      height: 36rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 1rem;
      overflow: hidden;
    }
    .page {
      padding: 1.5rem;
    }
    h3 {
      font: var(--mat-sys-headline-medium);
      margin-block: 1rem;
    }
    .message {
      padding: 1rem;
      margin-block: 0.75rem;
      border-radius: 1rem;
      background: var(--mat-sys-surface-container-low);
    }
    .fab {
      box-shadow: none;
    }
    .fab-label {
      margin-inline-start: 0.5rem;
    }
  `,
})
export class NavigationRailPlaygroundComponent {
  readonly expanded = signal(false);
  readonly mode = signal<MatExpNavigationRailMode>('standard');
  readonly hideOnCollapse = signal(false);
  readonly centered = signal(false);
  readonly rtl = signal(false);
  readonly selected = signal('Inbox');
  readonly destinations = [
    { label: 'Inbox', icon: 'inbox' },
    { label: 'Sent', icon: 'send' },
    { label: 'Drafts', icon: 'drafts' },
  ];
}
