import { isPlatformBrowser } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { gsap } from 'gsap';
import {
  type MatExpProgressMode,
  type MatExpProgressShape,
  type MatExpProgressVariant,
} from '../../../types';
import { injectMatExpProgressIndicatorOptions } from './progress-indicator.options';
import { bounded, progressPaths } from './progress-indicator.geometry';
import {
  indeterminateRanges,
  PROGRESS_MOTION,
  registerProgressEases,
} from './progress-indicator.animation';

/** Material 3 linear and circular progress, with optional expressive waves. */
@Component({
  selector: 'mat-exp-progress-indicator',
  exportAs: 'matExpProgressIndicator',
  templateUrl: './progress-indicator.html',
  styleUrl: './progress-indicator.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mat-exp-progress-indicator',
    role: 'progressbar',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledby()',
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'mode() === "determinate" ? _value() : null',
    '[attr.data-variant]': 'variant()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-mode]': 'mode()',
    '[style.height.px]': '_geometry().height',
    '[style.--mat-exp-progress-circular-size]': '_size() + "px"',
  },
})
export class MatExpProgressIndicator {
  private readonly _options = injectMatExpProgressIndicatorOptions();
  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _width = signal(240);
  private _displayed = 0;
  private _amplitude = 0;
  private _initialized = false;
  /** Geometry. @default 'linear' */
  readonly variant = input<MatExpProgressVariant>(this._options.variant);
  /** Show the inactive track; disable inside buttons. @default true */
  readonly showTrack = input(this._options.showTrack);
  /** Known or unknown progress. @default 'determinate' */
  readonly mode = input<MatExpProgressMode>(this._options.mode);
  /** Active track shape. @default 'standard' */
  readonly shape = input<MatExpProgressShape>(this._options.shape);
  /** Completed work as a percentage, clamped to 0–100; non-finite values become 0. @default 0 */
  readonly value = input(0);
  /** Process and content description. @default 'Loading' */
  readonly ariaLabel = input(this._options.ariaLabel);
  /** ID of a visible label, taking precedence over ariaLabel. @default null */
  readonly ariaLabelledby = input<string | null>(null);
  /** Optional human-readable progress, e.g. "3 of 5 files". @default null */
  readonly valueText = input<string | null>(null);
  /** Active stroke width in pixels. @default 4 */
  readonly thickness = input(this._options.thickness);
  /** Inactive stroke width in pixels. @default 4 */
  readonly trackThickness = input(this._options.trackThickness);
  /** Visible track separation in pixels. @default 4 */
  readonly gap = input(this._options.gap);
  /** Linear determinate end dot diameter; 0 requires sufficient track contrast. @default 4 */
  readonly stopSize = input(this._options.stopSize);
  /** Peak wave displacement in pixels; null selects linear 3 or circular 1.6. @default null */
  readonly amplitude = input<number | null>(null);
  /** Wave length in pixels; null selects linear 40/20 or circular 15. @default null */
  readonly wavelength = input<number | null>(null);
  /** Wave travel in pixels/second; null travels one wavelength/second. Zero stops wave travel. @default null */
  readonly waveSpeed = input<number | null>(null);
  /** Circular outer diameter in pixels; null selects standard 40 or wavy 48. @default null */
  readonly diameter = input<number | null>(null);
  /** @internal */
  readonly _value = computed(() => bounded(this.value(), 0, 0, 100));
  /** @internal */
  readonly _size = computed(() =>
    bounded(this.diameter() ?? (this.shape() === 'wavy' ? 48 : 40), 48, 24, 240),
  );
  /** @internal */
  readonly _geometry = computed(() => {
    const circular = this.variant() === 'circular';
    const thickness = bounded(this.thickness(), 4, 1, circular ? this._size() / 4 : 100);
    const trackThickness = bounded(this.trackThickness(), 4, 1, circular ? this._size() / 4 : 100);
    const amplitude =
      this.shape() === 'standard'
        ? 0
        : bounded(
            this.amplitude() ?? (circular ? (1.6 * this._size()) / 48 : 3),
            0,
            0,
            circular ? this._size() / 8 : 100,
          );
    return {
      circular,
      width: circular ? this._size() : this._width(),
      height: circular
        ? this._size()
        : Math.max(
            thickness + 2 * amplitude,
            trackThickness,
            this.mode() === 'determinate' ? bounded(this.stopSize(), 4, 0, 100) : 0,
          ),
      thickness,
      trackThickness,
      amplitude,
      wavelength: bounded(
        this.wavelength() ??
          (circular ? (15 * this._size()) / 48 : this.mode() === 'determinate' ? 40 : 20),
        40,
        2,
        1000,
      ),
      gap: bounded(this.gap(), 4, 0, 100),
    };
  });
  /** @internal */
  readonly _stop = computed(() =>
    bounded(this.stopSize(), 4, 0, Math.min(this._geometry().height, this._geometry().width)),
  );
  /** @internal SSR and first-paint geometry; animation writes only path data afterward. */
  readonly _initial = computed(() => {
    const progress = this._value() / 100;
    const g = this._geometry();
    const amplitude =
      this.mode() === 'indeterminate' || (progress > 0.1 && progress < 0.95) ? g.amplitude : 0;
    return progressPaths(
      { ...g, amplitude },
      this.mode() === 'determinate' ? [[0, progress]] : [[0, 0.25]],
    );
  });
  constructor() {
    if (!this._browser) return;
    afterRenderEffect((cleanup) => {
      const host = this._host.nativeElement;
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => {
        if (entry.contentRect.width > 0) this._width.set(entry.contentRect.width);
      });
      observer.observe(host);
      cleanup(() => observer.disconnect());
    });
    afterRenderEffect((cleanup) => {
      const g = this._geometry();
      const determinate = this.mode() === 'determinate';
      const value = this._value() / 100;
      const waveSpeed = bounded(this.waveSpeed() ?? g.wavelength, g.wavelength, -1000, 1000);
      const host = this._host.nativeElement;
      const active = host.querySelector('.mat-exp-progress-active');
      const track = host.querySelector('.mat-exp-progress-track');
      if (!active || !track) return;
      registerProgressEases();
      const amplitude = determinate && (value <= 0.1 || value >= 0.95) ? 0 : g.amplitude;
      if (!this._initialized) {
        this._displayed = value;
        this._amplitude = amplitude;
        this._initialized = true;
      }
      const media = gsap.matchMedia();
      media.add(
        {
          reduce: '(prefers-reduced-motion: reduce)',
          motion: '(prefers-reduced-motion: no-preference)',
        },
        (context) => {
          const reduce = !!context.conditions?.['reduce'];
          const state = {
            progress: reduce ? value : this._displayed,
            amplitude: reduce ? amplitude : Math.min(this._amplitude, g.amplitude),
            time: 0,
          };
          const draw = () => {
            this._displayed = state.progress;
            this._amplitude = state.amplitude;
            const frame = progressPaths(
              { ...g, amplitude: state.amplitude },
              determinate
                ? [[0, state.progress]]
                : reduce
                  ? [[0, 0.25]]
                  : indeterminateRanges(g.circular, state.time),
              reduce ? 0 : (state.time * waveSpeed) / g.wavelength,
            );
            active.setAttribute('d', frame.active);
            track.setAttribute('d', frame.track);
          };
          draw();
          if (reduce) return;
          gsap.to(state, {
            progress: value,
            duration: PROGRESS_MOTION.transition,
            ease: 'none',
            onUpdate: draw,
          });
          gsap.to(state, {
            amplitude,
            duration: PROGRESS_MOTION.transition,
            ease:
              amplitude > state.amplitude
                ? 'mat-exp-progress-standard'
                : 'mat-exp-progress-accelerate',
            onUpdate: draw,
          });
          if (!determinate || (g.amplitude > 0 && waveSpeed !== 0 && amplitude > 0)) {
            // A linear clock avoids frame-count-dependent speed and keeps every tween in this context.
            gsap.to(state, {
              time: 86400,
              duration: 86400,
              ease: 'none',
              repeat: -1,
              onUpdate: draw,
            });
          }
        },
      );
      cleanup(() => media.revert());
    });
  }
}
