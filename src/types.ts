import type BackboneType from 'backbone';

import type ModelRef from './ModelRef.ts';

export type ModelId = string | number | null | undefined;
export type LoadingEvent = 'loaded' | 'unloaded';
export type LoadedModel<M extends BackboneType.Model = BackboneType.Model> = M | null | undefined;
export type LoadingStateCallback<M extends BackboneType.Model = BackboneType.Model> = (this: unknown, model: LoadedModel<M>) => void;
export type UnloadingStateCallback<M extends BackboneType.Model = BackboneType.Model> = (this: unknown, model: M) => void;
export type PresentLoadingStateCallback<M extends BackboneType.Model = BackboneType.Model> = (this: unknown, model: M) => void;
export type ModelRefEventCallback<M extends BackboneType.Model = BackboneType.Model, E extends LoadingEvent = LoadingEvent, C = ModelRef<M>> = (this: C, model: E extends 'loaded' ? LoadedModel<M> : M) => void;
export type ModelRefEventCallbackFor<M extends BackboneType.Model, E extends string, C = ModelRef<M>> = E extends LoadingEvent ? ModelRefEventCallback<M, E, C> : BackboneType.EventHandler;
export type ModelRefEventMap<M extends BackboneType.Model = BackboneType.Model, C = ModelRef<M>> = BackboneType.EventMap &
  Partial<{
    loaded: ModelRefEventCallback<M, 'loaded', C>;
    unloaded: ModelRefEventCallback<M, 'unloaded', C>;
  }>;

export interface LoadingStates<M extends BackboneType.Model = BackboneType.Model> {
  loaded?: LoadingStateCallback<M>;
  unloaded?: UnloadingStateCallback<M>;
}

export type LoadingStateParameters<M extends BackboneType.Model = BackboneType.Model> = LoadingStateCallback<M> | LoadingStates<M>;
export type PresentLoadingStateParameters<M extends BackboneType.Model = BackboneType.Model> =
  | PresentLoadingStateCallback<M>
  | {
      loaded?: PresentLoadingStateCallback<M>;
      unloaded?: PresentLoadingStateCallback<M>;
    };
export type ModelRefValue<M extends BackboneType.Model = BackboneType.Model> = M | ModelRef<M> | null;

declare module 'backbone' {
  interface Model {
    model(): this;
    isLoaded(): boolean;
    bindLoadingStates(params: PresentLoadingStateParameters<this>): this;
    unbindLoadingStates(params: PresentLoadingStateParameters<this>): this;
  }
}

declare global {
  namespace Backbone {
    var ModelRef: typeof import('./ModelRef.ts').default;
  }
}
