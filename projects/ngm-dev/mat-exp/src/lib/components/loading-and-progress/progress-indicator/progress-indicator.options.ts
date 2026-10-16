import { matExpCreateOptions } from '../../../utils/di/create-options';
import {
  type MatExpProgressMode,
  type MatExpProgressShape,
  type MatExpProgressVariant,
} from '../../../types';

/** Application defaults for progress indicators. Geometry inputs are CSS pixels. */
export interface MatExpProgressIndicatorOptions {
  /** @default 'linear' */
  variant: MatExpProgressVariant;
  /** Whether the inactive track is visible. Disable inside buttons. @default true */
  showTrack: boolean;
  /** @default 'determinate' */
  mode: MatExpProgressMode;
  /** @default 'standard' */
  shape: MatExpProgressShape;
  /** Describe the process and affected content. @default 'Loading' */
  ariaLabel: string;
  /** Active stroke width. @default 4 */
  thickness: number;
  /** Inactive stroke width. @default 4 */
  trackThickness: number;
  /** Visible separation between strokes. @default 4 */
  gap: number;
  /** Linear determinate stop diameter. Set to 0 only with sufficient track contrast. @default 4 */
  stopSize: number;
}
/** @internal */
export const MAT_EXP_PROGRESS_INDICATOR_DEFAULT_OPTIONS: MatExpProgressIndicatorOptions = {
  variant: 'linear',
  showTrack: true,
  mode: 'determinate',
  shape: 'standard',
  ariaLabel: 'Loading',
  thickness: 4,
  trackThickness: 4,
  gap: 4,
  stopSize: 4,
};
const _options = matExpCreateOptions(MAT_EXP_PROGRESS_INDICATOR_DEFAULT_OPTIONS);
export const MAT_EXP_PROGRESS_INDICATOR_OPTIONS = _options.token;
export const provideMatExpProgressIndicatorOptions = _options.provide;
export const injectMatExpProgressIndicatorOptions = _options.inject;
