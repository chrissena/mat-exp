import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

// Web equivalents of the reference rail's DefaultSpatial / FastSpatial schemes.
// https://m3.material.io/styles/motion/overview/specs
const SPATIAL = { duration: 0.5, ease: 'mat-exp-rail-spatial' };
const EFFECTS = { duration: 0.2, ease: 'mat-exp-rail-effects' };
const FAST_SPATIAL = { duration: 0.35, ease: 'mat-exp-rail-fast-spatial' };
let registered = false;
function registerEases(): void {
  if (registered) return;
  gsap.registerPlugin(CustomEase);
  CustomEase.create(SPATIAL.ease, '0.38, 1.21, 0.22, 1');
  CustomEase.create(FAST_SPATIAL.ease, '0.42, 1.67, 0.21, 0.9');
  CustomEase.create(EFFECTS.ease, '0.34, 0.80, 0.34, 1');
  registered = true;
}

/** @internal Browser-only controller; constructed from afterRenderEffect. */
export function createNavigationRailMotion(panel: HTMLElement, content: HTMLElement) {
  registerEases();
  const media = panel.ownerDocument.defaultView!.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = () =>
    Array.from(
      panel.querySelectorAll<HTMLElement>(
        '.mat-exp-navigation-rail-item-icon, .mat-exp-navigation-rail-item-label, [data-selected="true"] .mat-exp-navigation-rail-item-indicator',
      ),
    );
  const capture = () => {
    const origin = panel.getBoundingClientRect();
    return {
      width: origin.width,
      margin: parseFloat(getComputedStyle(content).marginInlineStart),
      // Coordinates are local to the rail: page scrolling must not become motion.
      positions: new Map(
        targets().map((element) => {
          const rect = element.getBoundingClientRect();
          return [
            element,
            { x: rect.x - origin.x, y: rect.y - origin.y, width: rect.width, height: rect.height },
          ];
        }),
      ),
    };
  };
  let previous = capture();
  let timeline: gsap.core.Timeline | undefined;
  const finish = () => {
    timeline?.progress(1);
  };
  media.addEventListener('change', finish);

  return {
    update(modal: boolean): void {
      timeline?.kill();
      const elements = targets();
      gsap.set(elements, { clearProps: 'transform,opacity,width,height' });
      gsap.set(panel, { clearProps: 'inlineSize' });
      // The stylesheet's logical margin is !important to override Material's physical margins.
      content.style.removeProperty('--_mat-exp-rail-animated-margin');
      const next = capture();
      if (
        media.matches ||
        (previous.width === next.width &&
          previous.margin === next.margin &&
          [...next.positions].every(([element, rect]) => {
            const old = previous.positions.get(element);
            return old?.x === rect.x && old?.y === rect.y;
          }))
      ) {
        previous = next;
        return;
      }
      const from = previous;
      timeline = gsap.timeline({
        defaults: modal ? FAST_SPATIAL : SPATIAL,
        onUpdate: () => {
          previous = capture();
        },
        onComplete: () => {
          gsap.set(panel, { clearProps: 'inlineSize' });
          gsap.set(elements, { clearProps: 'transform,opacity,width,height' });
          content.style.removeProperty('--_mat-exp-rail-animated-margin');
          previous = capture();
        },
      });
      timeline.fromTo(panel, { inlineSize: from.width }, { inlineSize: next.width }, 0);
      timeline.fromTo(
        content,
        { '--_mat-exp-rail-animated-margin': `${from.margin}px` },
        { '--_mat-exp-rail-animated-margin': `${next.margin}px` },
        0,
      );
      for (const element of elements) {
        const old = from.positions.get(element);
        const current = next.positions.get(element)!;
        if (!old || !current.width || !old.width) continue;
        timeline.fromTo(element, { x: old.x - current.x, y: old.y - current.y }, { x: 0, y: 0 }, 0);
        if (element.classList.contains('mat-exp-navigation-rail-item-indicator')) {
          timeline.fromTo(
            element,
            { width: old.width, height: old.height },
            { width: current.width, height: current.height },
            0,
          );
        }
        if (element.classList.contains('mat-exp-navigation-rail-item-label')) {
          // The native reference fades the label out at the orientation midpoint.
          timeline.to(element, { opacity: 0, duration: 0.1, ease: EFFECTS.ease }, 0);
          timeline.to(element, { opacity: 1, ...EFFECTS }, 0.1);
        }
      }
    },
    destroy(): void {
      timeline?.kill();
      media.removeEventListener('change', finish);
    },
  };
}

/** @internal Animate the active indicator from its center without scaling the icon or label. */
export function animateNavigationRailSelection(
  indicator: HTMLElement,
  selected: boolean,
): () => void {
  registerEases();
  const media = indicator.ownerDocument.defaultView!.matchMedia('(prefers-reduced-motion: reduce)');
  const tween = gsap.timeline();
  tween.to(
    indicator,
    {
      scaleX: selected ? 1 : 0,
      ...SPATIAL,
      duration: media.matches ? 0 : SPATIAL.duration,
      overwrite: 'auto',
    },
    0,
  );
  tween.to(
    indicator,
    { opacity: selected ? 1 : 0, ...EFFECTS, duration: media.matches ? 0 : EFFECTS.duration },
    0,
  );
  const finish = () => {
    tween.progress(1);
  };
  media.addEventListener('change', finish);
  return () => {
    tween.kill();
    media.removeEventListener('change', finish);
  };
}
