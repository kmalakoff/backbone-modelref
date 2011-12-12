/*
  backbone-modelref.js 0.1.0
  (c) 2011 Kevin Malakoff.
  Backbone-ModelRef.js is freely distributable under the MIT license.
  See the following for full license details:
    https://github.com/kmalakoff/backbone-modelref/blob/master/LICENSE
  Dependencies: Backbone.js and Underscore.js.
*/
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
};
if (!this.Backbone || !this.Backbone.Model) {
  throw new Error('Backbone.ModelRef: Dependency alert! Backbone.js must be included before this file');
}
Backbone.ModelRef = (function() {
  function ModelRef(collection, model_id, cached_model) {
    var event, _i, _j, _len, _len2, _ref, _ref2;
    this.collection = collection;
    this.model_id = model_id;
    this.cached_model = cached_model != null ? cached_model : null;
    _.bindAll(this, '_checkForLoad', '_checkForUnload');
    if (!this.collection) {
      throw new Error("Backbone.ModelRef: collection is missing");
    }
    this.ref_count = 1;
    if (this.collection.retain) {
      this.collection.retain();
    }
    if (this.cached_model) {
      this.model_id = this.cached_model.id;
    }
    if (!this.cached_model && this.model_id) {
      this.cached_model = this.collection.get(this.model_id);
    }
    if (this.cached_model) {
      _ref = Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        this.collection.bind(event, this._checkForUnload);
      }
    } else {
      _ref2 = Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        event = _ref2[_j];
        this.collection.bind(event, this._checkForLoad);
      }
    }
  }
  ModelRef.prototype.retain = function() {
    this.ref_count++;
    return this;
  };
  ModelRef.prototype.release = function() {
    var event, _i, _j, _len, _len2, _ref, _ref2;
    if (this.ref_count <= 0) {
      throw new Error("Backbone.ModelRef.release(): ref count is corrupt");
    }
    this.ref_count--;
    if (this.ref_count > 0) {
      return;
    }
    if (this.cached_model) {
      _ref = Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        this.collection.unbind(event, this._checkForUnload);
      }
    } else {
      _ref2 = Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        event = _ref2[_j];
        this.collection.unbind(event, this._checkForLoad);
      }
    }
    if (this.collection.release) {
      this.collection.release();
    }
    this.collection = null;
    return this;
  };
  ModelRef.prototype.getModel = function() {
    if (this.cached_model && !this.cached_model.isNew()) {
      this.model_id = this.cached_model.id;
    }
    if (this.cached_model) {
      return this.cached_model;
    }
    if (this.model_id) {
      this.cached_model = this.collection.get(this.model_id);
    }
    return this.cached_model;
  };
  ModelRef.prototype._checkForLoad = function() {
    var event, model, _i, _j, _len, _len2, _ref, _ref2;
    if (this.cached_model || !this.model_id) {
      return;
    }
    model = this.collection.get(this.model_id);
    if (!model) {
      return;
    }
    _ref = Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      this.collection.unbind(event, this._checkForLoad);
    }
    _ref2 = Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED;
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      event = _ref2[_j];
      this.collection.bind(event, this._checkForUnload);
    }
    this.cached_model = model;
    return this.trigger('loaded', this.cached_model);
  };
  ModelRef.prototype._checkForUnload = function() {
    var event, model, _i, _j, _len, _len2, _ref, _ref2;
    if (!this.cached_model || !this.model_id) {
      return;
    }
    model = this.collection.get(this.model_id);
    if (model) {
      return;
    }
    _ref = Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      this.collection.unbind(event, this._checkForUnload);
    }
    _ref2 = Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED;
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      event = _ref2[_j];
      this.collection.bind(event, this._checkForLoad);
    }
    model = this.cached_model;
    this.cached_model = null;
    return this.trigger('unloaded', model);
  };
  return ModelRef;
})();
__extends(Backbone.ModelRef.prototype, Backbone.Events);
Backbone.ModelRef.VERSION = '0.1.1';
Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED = ['reset', 'remove'];
Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED = ['reset', 'add'];
Backbone.Model.prototype.model = function() {
  if (arguments.length === 0) {
    return this;
  }
  throw new Error('cannot set a Backbone.Model');
};
Backbone.Model.prototype.isLoaded = function() {
  return true;
};
Backbone.Model.prototype.bindLoadingStates = function(params) {
  if (_.isFunction(params)) {
    params(this);
  } else if (params.loaded) {
    params.loaded(this);
  }
  return this;
};
Backbone.Model.prototype.unbindLoadingStates = function(params) {
  return this;
};
Backbone.ModelRef.prototype.get = function(attribute_name) {
  if (attribute_name !== 'id') {
    throw new Error("Backbone.ModelRef.get(): only id is permitted");
  }
  if (this.cached_model && !this.cached_model.isNew()) {
    this.model_id = this.cached_model.id;
  }
  return this.model_id;
};
Backbone.ModelRef.prototype.model = function(model) {
  var changed, event, previous_model, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4;
  if (arguments.length === 0) {
    return this.getModel();
  }
  if (model && (model.collection !== this.collection)) {
    throw new Error("Backbone.ModelRef.model(): collections don't match");
  }
  changed = this.model_id ? !model || (this.model_id !== model.get('id')) : !!model;
  if (!changed) {
    return;
  }
  if (this.cached_model) {
    previous_model = this.cached_model;
    this.model_id = null;
    this.cached_model = null;
    _ref = Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      this.collection.unbind(event, this._checkForUnload);
    }
    _ref2 = Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED;
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      event = _ref2[_j];
      this.collection.bind(event, this._checkForLoad);
    }
    this.trigger('unloaded', previous_model);
  }
  if (!model) {
    return;
  }
  this.model_id = model.get('id');
  this.cached_model = model.model();
  _ref3 = Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED;
  for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
    event = _ref3[_k];
    this.collection.unbind(event, this._checkForLoad);
  }
  _ref4 = Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED;
  for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
    event = _ref4[_l];
    this.collection.bind(event, this._checkForUnload);
  }
  return this.trigger('loaded', this.cached_model);
};
Backbone.ModelRef.prototype.isLoaded = function() {
  var model;
  model = this.getModel();
  if (!model) {
    return false;
  }
  if (model.isLoaded) {
    return model.isLoaded();
  } else {
    return true;
  }
};
Backbone.ModelRef.prototype.bindLoadingStates = function(params) {
  var model;
  if (_.isFunction(params)) {
    this.bind('loaded', params);
  } else {
    if (params.loaded) {
      this.bind('loaded', params.loaded);
    }
    if (params.unloaded) {
      this.bind('unloaded', params.unloaded);
    }
  }
  model = this.model();
  if (!model) {
    return null;
  }
  return model.bindLoadingStates(params);
};
Backbone.ModelRef.prototype.unbindLoadingStates = function(params) {
  if (_.isFunction(params)) {
    this.unbind('loaded', params);
  } else {
    if (params.loaded) {
      this.unbind('loaded', params.loaded);
    }
    if (params.unloaded) {
      this.unbind('unloaded', params.unloaded);
    }
  }
  return this.model();
};