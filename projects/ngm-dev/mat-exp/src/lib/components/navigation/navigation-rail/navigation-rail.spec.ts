import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatExpNavigationRail } from './navigation-rail';
import { MatExpNavigationRailItem } from './navigation-rail-item';
import { provideMatExpNavigationRailOptions } from './navigation-rail.options';
import { type MatExpNavigationRailMode } from '../../../types';

@Component({
  imports: [MatExpNavigationRail, MatExpNavigationRailItem],
  template: `
    <mat-exp-navigation-rail
      #rail
      [(expanded)]="expanded"
      [mode]="mode()"
      [hideOnCollapse]="hidden()"
    >
      <div matExpNavigationRailHeader><button (click)="rail.toggle()">Menu</button></div>
      <button matExpNavigationRailItem [selected]="true">Inbox</button>
      <a
        matExpNavigationRailItem
        href="#sent"
        [disabled]="disabled()"
        (click)="activations = activations + 1"
        >Sent</a
      >
      <button matExpNavigationRailItem expandedOnly>Archive</button>
      <main matExpNavigationRailContent><button (click)="rail.open()">Open</button></main>
    </mat-exp-navigation-rail>
  `,
})
class Host {
  readonly expanded = signal(false);
  readonly mode = signal<MatExpNavigationRailMode>('standard');
  readonly hidden = signal(false);
  readonly disabled = signal(false);
  activations = 0;
}

@Component({ imports: [MatExpNavigationRail], template: `<mat-exp-navigation-rail />` })
class DefaultsHost {}

describe('MatExpNavigationRail', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());
  it('constructs the expanded rail during server rendering without browser motion', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        provideMatExpNavigationRailOptions({ expanded: true }),
      ],
    });
    const fixture = TestBed.createComponent(DefaultsHost);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('mat-exp-navigation-rail').getAttribute('data-expanded'),
    ).toBe('true');
  });

  it('defaults to a collapsed standard rail and permits scoped options', () => {
    TestBed.configureTestingModule({
      providers: [
        provideMatExpNavigationRailOptions({ alignment: 'center', ariaLabel: 'Workspace' }),
      ],
    });
    const fixture = TestBed.createComponent(DefaultsHost);
    fixture.detectChanges();
    const rail = fixture.debugElement.query(By.directive(MatExpNavigationRail))
      .componentInstance as MatExpNavigationRail;
    expect(rail.expanded()).toBe(false);
    expect(rail.mode()).toBe('standard');
    expect(rail.hideOnCollapse()).toBe(false);
    expect(rail.alignment()).toBe('center');
    expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe('Workspace');
  });

  it('keeps the primary navigation visible and reveals secondary destinations on expansion', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll(
      '.mat-exp-navigation-rail-item',
    ) as NodeListOf<HTMLElement>;
    expect(items[0].getAttribute('aria-current')).toBe('page');
    expect(items[1].hasAttribute('aria-current')).toBe(false);
    expect(items[2].hidden).toBe(true);
    fixture.componentInstance.expanded.set(true);
    fixture.detectChanges();
    expect(items[2].hidden).toBe(false);
    expect(
      fixture.nativeElement.querySelector('mat-drawer').classList.contains('mat-drawer-side'),
    ).toBe(true);
  });

  it('switches modal semantics and background interaction with expansion', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mode.set('modal');
    fixture.componentInstance.expanded.set(true);
    fixture.detectChanges();
    const drawer = fixture.nativeElement.querySelector('mat-drawer');
    const content = fixture.nativeElement.querySelector('mat-drawer-content');
    expect(drawer.getAttribute('role')).toBe('dialog');
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    expect(content.hasAttribute('inert')).toBe(true);
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    fixture.nativeElement.querySelector('nav').dispatchEvent(escape);
    fixture.detectChanges();
    expect(fixture.componentInstance.expanded()).toBe(false);
    expect(content.hasAttribute('inert')).toBe(false);
    expect(drawer.hasAttribute('aria-modal')).toBe(false);
  });

  it('does not dismiss standard rails on Escape or destination activation', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.expanded.set(true);
    fixture.detectChanges();
    fixture.nativeElement
      .querySelector('nav')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.nativeElement.querySelector('.mat-exp-navigation-rail-item').click();
    expect(fixture.componentInstance.expanded()).toBe(true);
  });

  it('closes modal destinations but preserves modified link activation', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mode.set('modal');
    fixture.componentInstance.expanded.set(true);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    link.dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true }));
    expect(fixture.componentInstance.expanded()).toBe(true);
    link.click();
    expect(fixture.componentInstance.expanded()).toBe(false);
  });

  it('blocks disabled links and removes them from Tab order', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.activations).toBe(0);
    expect(link.tabIndex).toBe(-1);
    expect(link.getAttribute('aria-disabled')).toBe('true');
  });

  it('exposes the hidden-on-collapse state and emits two-way changes from menu methods', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();
    const rail = fixture.debugElement.query(By.directive(MatExpNavigationRail))
      .componentInstance as MatExpNavigationRail;
    expect(
      fixture.nativeElement.querySelector('mat-exp-navigation-rail').getAttribute('data-hidden'),
    ).toBe('true');
    rail.open();
    expect(fixture.componentInstance.expanded()).toBe(true);
    rail.toggle();
    expect(fixture.componentInstance.expanded()).toBe(false);
  });
});
