import Backbone from 'backbone';

import type { LoadingStateParameters, LoadingStates, ModelId, ModelRefEventCallbackFor, ModelRefEventMap, ModelRefValue } from './types.ts';

export type * from './types.ts';

interface ModelRefEvents<M extends Backbone.Model> {
  on: {
    <E extends string>(eventName: E, callback: ModelRefEventCallbackFor<M, NoInfer<E>>): ModelRef<M>;
    <E extends string, C>(eventName: E, callback: ModelRefEventCallbackFor<M, NoInfer<E>, NoInfer<C>>, context: C): ModelRef<M>;
    (eventMap: ModelRefEventMap<M>): ModelRef<M>;
    <C>(eventMap: ModelRefEventMap<M, NoInfer<C>>, context: C): ModelRef<M>;
  };
  off: {
    (eventName?: string | null, callback?: Backbone.EventHandler | null, context?: unknown): ModelRef<M>;
    (eventMap: Backbone.EventMap, context?: unknown): ModelRef<M>;
  };
  trigger(eventName: string, ...args: unknown[]): ModelRef<M>;
  bind: {
    <E extends string>(eventName: E, callback: ModelRefEventCallbackFor<M, NoInfer<E>>): ModelRef<M>;
    <E extends string, C>(eventName: E, callback: ModelRefEventCallbackFor<M, NoInfer<E>, NoInfer<C>>, context: C): ModelRef<M>;
    (eventMap: ModelRefEventMap<M>): ModelRef<M>;
    <C>(eventMap: ModelRefEventMap<M, NoInfer<C>>, context: C): ModelRef<M>;
  };
  unbind(eventName?: string | null, callback?: Backbone.EventHandler | null, context?: unknown): ModelRef<M>;
  once: {
    <E extends string>(eventName: E, callback: ModelRefEventCallbackFor<M, NoInfer<E>>): ModelRef<M>;
    <E extends string, C>(eventName: E, callback: ModelRefEventCallbackFor<M, NoInfer<E>, NoInfer<C>>, context: C): ModelRef<M>;
    (eventMap: ModelRefEventMap<M>): ModelRef<M>;
    <C>(eventMap: ModelRefEventMap<M, NoInfer<C>>, context: C): ModelRef<M>;
  };
  listenTo(object: unknown, events: string, callback: Backbone.EventHandler): ModelRef<M>;
  listenToOnce(object: unknown, events: string, callback: Backbone.EventHandler): ModelRef<M>;
  stopListening(object?: unknown, events?: string, callback?: Backbone.EventHandler): ModelRef<M>;
}

class ModelRef<M extends Backbone.Model = Backbone.Model> {
  static VERSION = '0.1.5';
  static MODEL_EVENTS_WHEN_LOADED = ['reset', 'remove'];
  static MODEL_EVENTS_WHEN_UNLOADED = ['reset', 'add'];

  collection: Backbone.Collection<M> | null;
  id: ModelId;
  cached_model: M | null | undefined;
  ref_count: number;
  private _transitionRevision = 0;
  private _removedModel: M | undefined;
  declare on: ModelRefEvents<M>['on'];
  declare off: ModelRefEvents<M>['off'];
  declare trigger: ModelRefEvents<M>['trigger'];
  declare bind: ModelRefEvents<M>['bind'];
  declare unbind: ModelRefEvents<M>['unbind'];
  declare once: ModelRefEvents<M>['once'];
  declare listenTo: ModelRefEvents<M>['listenTo'];
  declare listenToOnce: ModelRefEvents<M>['listenToOnce'];
  declare stopListening: ModelRefEvents<M>['stopListening'];

  constructor(collection: Backbone.Collection<M>, id: ModelId, cached_model: M | null = null) {
    if (!collection) throw new Error('Backbone.ModelRef: collection is missing');
    this.collection = collection;
    this.id = id;
    this.cached_model = cached_model;
    this.ref_count = 1;
    this._checkForLoad = this._checkForLoad.bind(this);
    this._checkForUnload = this._checkForUnload.bind(this);
    this._checkForReset = this._checkForReset.bind(this);

    if (this.cached_model) this.id = this.cached_model.id;
    if (!this.cached_model && this.id != null) this.cached_model = this.collection.get(this.id);

    this.collection.on('add', this._checkForLoad);
    this.collection.on('remove', this._checkForUnload);
    this.collection.on('reset', this._checkForReset);
  }

  retain(): this {
    this.ref_count++;
    return this;
  }

  release(): this | undefined {
    if (this.ref_count <= 0) throw new Error('Backbone.ModelRef.release(): ref count is corrupt');

    this.ref_count--;
    if (this.ref_count > 0) return undefined;

    this._transitionRevision++;
    this._unbindCollection();
    this.collection = null;
    this.unbind(null);
    return this;
  }

  getModel(): M | null | undefined {
    if (this.cached_model && !this.cached_model.isNew()) this.id = this.cached_model.id;
    if (this.cached_model) return this.cached_model;
    if (this.id != null && this.collection) this.cached_model = this._lookupModel();
    return this.cached_model;
  }

  get(attribute_name: 'id'): ModelId;
  get(attribute_name: string): ModelId {
    if (attribute_name !== 'id') throw new Error('Backbone.ModelRef.get(): only id is permitted');
    if (this.cached_model && !this.cached_model.isNew()) this.id = this.cached_model.id;
    return this.id;
  }

  model(): M | null | undefined;
  model(model: ModelRefValue<M>): this | undefined;
  model(...args: [] | [ModelRefValue<M>]): M | null | undefined | this {
    if (args.length === 0) return this.getModel();

    const model = args[0];
    if (model && model.collection !== this.collection) {
      throw new Error("Backbone.ModelRef.model(): collections don't match");
    }

    const changed = this.id != null ? !model || this.id !== model.get('id') : Boolean(model);
    if (!changed) return undefined;

    const revision = ++this._transitionRevision;
    if (this.cached_model) {
      const previousModel = this.cached_model;
      this.id = null;
      this.cached_model = null;
      this.trigger('unloaded', previousModel);
      if (!this.collection || revision !== this._transitionRevision) return undefined;
    }

    if (!model) return undefined;
    this.id = model.get('id');
    this.cached_model = model.model();
    this.trigger('loaded', this.cached_model);
    return this;
  }

  isLoaded(): boolean {
    const model = this.getModel();
    if (!model) return false;
    return model.isLoaded ? model.isLoaded() : true;
  }

  bindLoadingStates(params: LoadingStateParameters<M>): M | null {
    const states: LoadingStates<M> = typeof params === 'function' ? { loaded: params } : params;
    if (states.loaded) this.bind('loaded', states.loaded);
    if (states.unloaded) this.bind('unloaded', states.unloaded);
    const model = this.model();
    if (!model) return null;
    return model.bindLoadingStates(states);
  }

  unbindLoadingStates(params: LoadingStateParameters<M>): M | null | undefined {
    const states: LoadingStates<M> = typeof params === 'function' ? { loaded: params } : params;
    if (states.loaded) this.unbind('loaded', states.loaded);
    if (states.unloaded) this.unbind('unloaded', states.unloaded);
    return this.model();
  }

  private _checkForLoad(model: M): void {
    if (!this.collection || this.cached_model || this.id == null) return;
    const loadedModel = this.collection.get(this.id);
    if (loadedModel !== model) return;
    this._removedModel = undefined;
    this._transitionTo(loadedModel);
  }

  private _checkForUnload(model: M): void {
    if (!this.collection || !this.cached_model || this.id == null || model !== this.cached_model) return;
    this._removedModel = model;
    this._transitionTo(undefined);
  }

  private _checkForReset(): void {
    if (!this.collection || this.id == null) return;
    this._removedModel = undefined;
    this._transitionTo(this.collection.get(this.id));
  }

  private _transitionTo(model: M | undefined): void {
    const previousModel = this.cached_model || undefined;
    if (previousModel === model) return;
    const revision = ++this._transitionRevision;

    if (previousModel) {
      this.cached_model = undefined;
      this.trigger('unloaded', previousModel);
      if (!this.collection || revision !== this._transitionRevision) return;
      model = this._lookupModel();
    }

    if (!model) return;
    const currentModel = this._lookupModel();
    if (!currentModel) return;
    model = currentModel;
    this.cached_model = model;
    this.trigger('loaded', model);
  }

  private _lookupModel(): M | undefined {
    if (!this.collection || this.id == null) return undefined;
    const model = this.collection.get(this.id);
    return model === this._removedModel ? undefined : model;
  }

  private _unbindCollection(): void {
    if (!this.collection) return;
    this.collection.off('add', this._checkForLoad);
    this.collection.off('remove', this._checkForUnload);
    this.collection.off('reset', this._checkForReset);
  }
}

Object.assign(ModelRef.prototype, Backbone.Events);

export default ModelRef;
