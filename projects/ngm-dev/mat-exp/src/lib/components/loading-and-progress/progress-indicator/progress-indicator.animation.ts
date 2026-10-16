import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

/** Timing from AndroidX Material3 ProgressIndicator.kt; see docs/progress-indicators.md. @internal */
export const PROGRESS_MOTION = { linear: 1.75, circular: 6, transition: 0.5 } as const;
let registered = false;
/** @internal */
export function registerProgressEases(): void {
  if (registered) return;
  gsap.registerPlugin(CustomEase);
  CustomEase.create('mat-exp-progress-accelerate', '0.3,0,0.8,0.15');
  CustomEase.create('mat-exp-progress-standard', '0.2,0,0,1');
  CustomEase.create('mat-exp-progress-decelerate', '0.05,0.7,0.1,1');
  registered = true;
}
/** Pure choreography, also used for the reduced-motion static frame. @internal */
export function indeterminateRanges(circular: boolean, seconds: number): [number, number][] {
  if (circular) {
    const cycle = (seconds % 6) / 3;
    const ease = gsap.parseEase('mat-exp-progress-standard');
    const amount = cycle < 1 ? ease(cycle) : 1 - ease(cycle - 1);
    const step = Math.floor(seconds / 1.5);
    const kick = gsap.parseEase('mat-exp-progress-decelerate')(Math.min(1, (seconds % 1.5) / 0.3));
    const start = seconds / 2 + (step + kick) / 4;
    return [[start, start + 0.1 + 0.77 * amount]];
  }
  const ms = (seconds * 1000) % 1750;
  const ease = gsap.parseEase('mat-exp-progress-accelerate');
  const at = (delay: number, duration: number) =>
    ease(Math.min(1, Math.max(0, (ms - delay) / duration)));
  return [
    [at(250, 1000), at(0, 1000)],
    [at(900, 850), at(650, 850)],
  ];
}
