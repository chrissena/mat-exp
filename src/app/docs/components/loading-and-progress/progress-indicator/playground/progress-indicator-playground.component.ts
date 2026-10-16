import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatExpProgressIndicator } from '@ngm-dev/mat-exp';

@Component({
  selector: 'app-progress-indicator-playground',
  imports: [MatExpProgressIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-label="Progress indicator examples">
      <label
        >Completed work: {{ value() }}%
        <input
          type="range"
          min="0"
          max="100"
          [value]="value()"
          (input)="value.set(+$any($event.target).value)"
        />
      </label>
      <label
        ><input type="checkbox" [checked]="unknown()" (change)="unknown.set(!unknown())" /> Unknown
        progress</label
      >
      <label
        >Stroke width
        <input
          type="range"
          min="2"
          max="8"
          [value]="thickness()"
          (input)="thickness.set(+$any($event.target).value)"
        />
      </label>
      <div class="examples">
        @for (shape of shapes; track shape) {
          <div>
            <h3>{{ shape === 'wavy' ? 'Expressive waves' : 'Standard tracks' }}</h3>
            <mat-exp-progress-indicator
              [shape]="shape"
              [mode]="unknown() ? 'indeterminate' : 'determinate'"
              [value]="value()"
              [thickness]="thickness()"
              ariaLabel="Uploading photos"
            />
            <mat-exp-progress-indicator
              variant="circular"
              [shape]="shape"
              [mode]="unknown() ? 'indeterminate' : 'determinate'"
              [value]="value()"
              [thickness]="thickness()"
              ariaLabel="Uploading photos"
            />
          </div>
        }
      </div>
      <p>
        Try changing from unknown to known progress. Your system's reduced-motion setting stops
        motion while preserving progress information.
      </p>
    </section>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }
    label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-block: 0.75rem;
    }
    input {
      accent-color: var(--mat-sys-primary);
    }
    .examples {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
    }
    .examples > div {
      width: 248px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    h3 {
      margin: 0;
    }
    p {
      margin-block-start: 1.5rem;
    }
  `,
})
export class ProgressIndicatorPlaygroundComponent {
  readonly value = signal(45);
  readonly thickness = signal(4);
  readonly unknown = signal(false);
  readonly shapes = ['wavy', 'standard'] as const;
}
