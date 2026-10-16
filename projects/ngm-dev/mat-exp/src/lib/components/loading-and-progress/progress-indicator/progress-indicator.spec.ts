import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { MatExpProgressIndicator } from './progress-indicator';
import { provideMatExpProgressIndicatorOptions } from './progress-indicator.options';

function reducedMotion() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes(': reduce)'),
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe('MatExpProgressIndicator', () => {
  beforeEach(reducedMotion);
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  function setup(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(MatExpProgressIndicator);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    return fixture;
  }
  it('renders a labeled non-interactive progressbar with accurate values', () => {
    const f = setup({ value: 45, ariaLabel: 'Uploading photos' });
    const host: HTMLElement = f.nativeElement;
    expect(host.getAttribute('role')).toBe('progressbar');
    expect(host.getAttribute('aria-label')).toBe('Uploading photos');
    expect(host.getAttribute('aria-valuenow')).toBe('45');
    expect(host.getAttribute('aria-valuemin')).toBe('0');
    expect(host.getAttribute('aria-valuemax')).toBe('100');
    expect(host.hasAttribute('tabindex')).toBe(false);
    expect(host.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
  it.each([-1, 101, NaN, Infinity])('normalizes %s for both rendering and semantics', (value) => {
    const f = setup({ value });
    const expected = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
    expect(f.nativeElement.getAttribute('aria-valuenow')).toBe(String(expected));
    expect(f.nativeElement.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it('removes unknown numeric progress and transitions back without recreating the host', () => {
    const f = setup({ mode: 'indeterminate', value: 70 });
    const host = f.nativeElement;
    expect(host.hasAttribute('aria-valuenow')).toBe(false);
    expect(host.querySelector('circle')).toBeNull();
    f.componentRef.setInput('mode', 'determinate');
    f.detectChanges();
    expect(host.getAttribute('aria-valuenow')).toBe('70');
    expect(host.querySelector('circle')).not.toBeNull();
    f.componentRef.setInput('mode', 'indeterminate');
    f.detectChanges();
    expect(host.hasAttribute('aria-valuenow')).toBe(false);
  });
  it.each(['linear', 'circular'])('renders both shapes and modes of %s', (variant) => {
    const f = setup({ variant, value: 45 });
    for (const shape of ['standard', 'wavy'])
      for (const mode of ['determinate', 'indeterminate']) {
        f.componentRef.setInput('shape', shape);
        f.componentRef.setInput('mode', mode);
        f.detectChanges();
        const host: HTMLElement = f.nativeElement;
        expect(host.getAttribute('data-variant')).toBe(variant);
        expect(host.getAttribute('data-shape')).toBe(shape);
        expect(host.getAttribute('data-mode')).toBe(mode);
        expect(host.querySelector('.mat-exp-progress-active')?.getAttribute('d')).toMatch(/^M/);
        expect(host.querySelector('.mat-exp-progress-track')?.getAttribute('d')).toMatch(/^M/);
        expect(!!host.querySelector('circle')).toBe(variant === 'linear' && mode === 'determinate');
      }
  });
  it('supports labels and human-readable values', () => {
    const f = setup({ ariaLabelledby: 'upload-heading', valueText: '3 of 5 files' });
    expect(f.nativeElement.getAttribute('aria-labelledby')).toBe('upload-heading');
    expect(f.nativeElement.getAttribute('aria-valuetext')).toBe('3 of 5 files');
  });
  it('allows injector-level defaults and per-instance overrides', () => {
    TestBed.configureTestingModule({
      providers: [
        provideMatExpProgressIndicatorOptions({
          variant: 'circular',
          thickness: 6,
          ariaLabel: 'Refreshing articles',
        }),
      ],
    });
    const f = setup({ thickness: 3 });
    expect(f.componentInstance.variant()).toBe('circular');
    expect(f.componentInstance.thickness()).toBe(3);
    expect(f.nativeElement.getAttribute('aria-label')).toBe('Refreshing articles');
  });
  it('uses reference dimensions and honors geometry customization', () => {
    const f = setup({ shape: 'wavy' });
    expect(f.componentInstance._geometry()).toMatchObject({
      height: 10,
      thickness: 4,
      amplitude: 3,
      wavelength: 40,
      gap: 4,
    });
    f.componentRef.setInput('mode', 'indeterminate');
    f.detectChanges();
    expect(f.componentInstance._geometry().wavelength).toBe(20);
    f.componentRef.setInput('variant', 'circular');
    f.detectChanges();
    expect(f.componentInstance._geometry()).toMatchObject({
      width: 48,
      height: 48,
      amplitude: expect.closeTo(1.6),
      wavelength: 15,
    });
    f.componentRef.setInput('shape', 'standard');
    f.detectChanges();
    expect(f.componentInstance._geometry()).toMatchObject({ width: 40, height: 40, amplitude: 0 });
    f.componentRef.setInput('diameter', 80);
    f.componentRef.setInput('gap', 8);
    f.detectChanges();
    expect(f.componentInstance._geometry()).toMatchObject({ width: 80, gap: 8 });
  });
  it('scales circular waves with diameter and bounds the supported size', () => {
    const f = setup({ variant: 'circular', shape: 'wavy', diameter: 96 });
    expect(f.componentInstance._geometry()).toMatchObject({
      amplitude: expect.closeTo(3.2),
      wavelength: 30,
    });
    f.componentRef.setInput('diameter', 1000);
    f.detectChanges();
    expect(f.componentInstance._geometry().width).toBe(240);
    f.componentRef.setInput('diameter', 1);
    f.detectChanges();
    expect(f.componentInstance._geometry().width).toBe(24);
  });
  it('retains a four-pixel stop marker with a thin active track', () => {
    const f = setup({ thickness: 2, trackThickness: 2 });
    expect(f.componentInstance._geometry().height).toBe(4);
    expect(f.componentInstance._stop()).toBe(4);
  });
  it('keeps invalid geometry finite and bounded', () => {
    const f = setup({
      amplitude: Infinity,
      wavelength: 0,
      thickness: -4,
      trackThickness: NaN,
      gap: -1,
      diameter: NaN,
    });
    expect(f.nativeElement.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(f.componentInstance._geometry().thickness).toBeGreaterThan(0);
    expect(f.componentInstance._geometry().wavelength).toBeGreaterThan(0);
  });
  it('renders empty/full endpoints without residual active/track paths', () => {
    const f = setup({ value: 0 });
    expect(f.componentInstance._initial().active).toBe('');
    f.componentRef.setInput('value', 100);
    f.detectChanges();
    expect(f.componentInstance._initial().track).toBe('');
  });
  it('does not start tweens with reduced motion', () => {
    const tween = vi.spyOn(gsap, 'to');
    setup({ mode: 'indeterminate' });
    expect(tween).not.toHaveBeenCalled();
  });
  it('can remove the track for use inside a button, including forced colors', () => {
    const f = setup({ variant: 'circular', showTrack: false });
    expect(f.nativeElement.querySelector('.mat-exp-progress-track').getAttribute('display')).toBe(
      'none',
    );
  });
  it('is SSR safe without browser animation APIs', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const media = vi.spyOn(gsap, 'matchMedia');
    const f = setup({ value: 40 });
    expect(media).not.toHaveBeenCalled();
    expect(f.nativeElement.querySelector('.mat-exp-progress-active').getAttribute('d')).toMatch(
      /^M/,
    );
  });
  it('reverts animation contexts on input changes and destroy', () => {
    const revert = vi.fn();
    vi.spyOn(gsap, 'matchMedia').mockReturnValue({
      add: vi.fn(),
      revert,
    } as unknown as gsap.MatchMedia);
    const f = setup();
    f.componentRef.setInput('value', 60);
    f.detectChanges();
    expect(revert).toHaveBeenCalled();
    const count = revert.mock.calls.length;
    f.destroy();
    expect(revert.mock.calls.length).toBeGreaterThan(count);
  });
});
