import { matExpCreateOptions } from '../../../utils/di/create-options';
import { type MatExpNavigationRailAlignment, type MatExpNavigationRailMode } from '../../../types';

export interface MatExpNavigationRailOptions {
  /** Expanded presentation. @default 'standard' */
  readonly mode: MatExpNavigationRailMode;
  /** Initial expansion state. @default false */
  readonly expanded: boolean;
  /** Hide the expanded rail entirely when closed. @default false */
  readonly hideOnCollapse: boolean;
  /** Destination alignment. @default 'top' */
  readonly alignment: MatExpNavigationRailAlignment;
  /** Accessible navigation label. @default 'Primary navigation' */
  readonly ariaLabel: string;
}

/** @internal */
export const MAT_EXP_NAVIGATION_RAIL_DEFAULT_OPTIONS: MatExpNavigationRailOptions = {
  mode: 'standard',
  expanded: false,
  hideOnCollapse: false,
  alignment: 'top',
  ariaLabel: 'Primary navigation',
};
const options = matExpCreateOptions(MAT_EXP_NAVIGATION_RAIL_DEFAULT_OPTIONS);
export const MAT_EXP_NAVIGATION_RAIL_OPTIONS = options.token;
export const provideMatExpNavigationRailOptions = options.provide;
/** @internal */
export const injectMatExpNavigationRailOptions = options.inject;
