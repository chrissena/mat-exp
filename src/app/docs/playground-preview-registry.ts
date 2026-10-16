import { Type } from '@angular/core';
import { ButtonPlaygroundComponent } from './components/all-buttons/button/playground/button-playground.component';
import { ButtonGroupPlaygroundComponent } from './components/all-buttons/button-group/playground/button-group-playground.component';
import { FabMenuPlaygroundComponent } from './components/all-buttons/fab-menu/playground/fab-menu-playground.component';
import { IconButtonPlaygroundComponent } from './components/all-buttons/icon-button/playground/icon-button-playground.component';
import { SplitButtonPlaygroundComponent } from './components/all-buttons/split-button/playground/split-button-playground.component';
import { LoadingIndicatorPlaygroundComponent } from './components/loading-and-progress/loading-indicator/playground/loading-indicator-playground.component';
import { ProgressIndicatorPlaygroundComponent } from './components/loading-and-progress/progress-indicator/playground/progress-indicator-playground.component';
// <generator:insert-import>

/**
 * Maps a component's slug (e.g. "button", "icon-button") to the Angular
 * component rendered for its Playground. Slug-keyed rather than path-keyed:
 * the `<playground-preview>` custom element (markdown-authored, see
 * PlaygroundPreviewElementComponent) only knows the slug an author wrote in
 * markdown, not the URL it happens to be embedded on.
 */
export const PLAYGROUND_PREVIEW_REGISTRY: Record<string, Type<unknown>> = {
  button: ButtonPlaygroundComponent,
  'icon-button': IconButtonPlaygroundComponent,
  'button-group': ButtonGroupPlaygroundComponent,
  'split-button': SplitButtonPlaygroundComponent,
  'fab-menu': FabMenuPlaygroundComponent,
  'loading-indicator': LoadingIndicatorPlaygroundComponent,
  'progress-indicator': ProgressIndicatorPlaygroundComponent,
  // <generator:insert-entry>
};
