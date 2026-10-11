import type Backbone from 'backbone';

type ModelRef<M extends Backbone.Model = Backbone.Model> = import('../dist/esm/ModelRef.js', { with: { 'resolution-mode': 'import' }}).default<M>;

declare const ModelRef: typeof import('../dist/esm/ModelRef.js', { with: { 'resolution-mode': 'import' }}).default;

declare namespace ModelRef {
  type ModelId = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).ModelId;
  type LoadingEvent = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).LoadingEvent;
  type LoadedModel<M extends Backbone.Model = Backbone.Model> = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).LoadedModel<M>;
  type LoadingStateCallback<M extends Backbone.Model = Backbone.Model> = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).LoadingStateCallback<M>;
  type UnloadingStateCallback<M extends Backbone.Model = Backbone.Model> = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).UnloadingStateCallback<M>;
  type PresentLoadingStateCallback<M extends Backbone.Model = Backbone.Model> = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).PresentLoadingStateCallback<M>;
  type ModelRefEventCallback<M extends Backbone.Model = Backbone.Model, E extends LoadingEvent = LoadingEvent, C = ModelRef<M>> = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).ModelRefEventCallback<M, E, C>;
  type ModelRefEventCallbackFor<M extends Backbone.Model, E extends string, C = ModelRef<M>> = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).ModelRefEventCallbackFor<M, E, C>;
  type ModelRefEventMap<M extends Backbone.Model = Backbone.Model, C = ModelRef<M>> = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).ModelRefEventMap<M, C>;
  type LoadingStates<M extends Backbone.Model = Backbone.Model> = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).LoadingStates<M>;
  type LoadingStateParameters<M extends Backbone.Model = Backbone.Model> = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).LoadingStateParameters<M>;
  type PresentLoadingStateParameters<M extends Backbone.Model = Backbone.Model> = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).PresentLoadingStateParameters<M>;
  type ModelRefValue<M extends Backbone.Model = Backbone.Model> = import('../dist/esm/types.js', { with: { 'resolution-mode': 'import' }}).ModelRefValue<M>;
}

export = ModelRef;
