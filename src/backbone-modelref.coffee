###
  backbone-modelref.js 0.1.0
  (c) 2011 Kevin Malakoff.
  Backbone-ModelRef.js is freely distributable under the MIT license.
  See the following for full license details:
    https://github.com/kmalakoff/backbone-modelref/blob/master/LICENSE
  Dependencies: Backbone.js and Underscore.js.
###
throw new Error('Backbone.ModelRef: Dependency alert! Backbone.js must be included before this file') if not this.Backbone or not this.Backbone.Model

####################################################
# Triggers Backbone.Events:
#   'loaded'
#   'unloaded'
####################################################
class Backbone.ModelRef
  constructor: (@collection, @model_id, @cached_model=null) ->
    _.bindAll(this, '_checkForLoad', '_checkForUnload')
    throw new Error("Backbone.ModelRef: collection is missing") if not @collection
    @ref_count = 1
    @collection.retain() if @collection.retain

    @model_id = @cached_model.id if @cached_model
    @cached_model = @collection.get(@model_id) if not @cached_model and @model_id
    if (@cached_model)
      @collection.bind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED
    else
      @collection.bind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED

  retain: -> @ref_count++; return this
  release: ->
    throw new Error("Backbone.ModelRef.release(): ref count is corrupt") if @ref_count<=0

    @ref_count--
    return if (@ref_count>0) # not yet ready for release

    if @cached_model
      @collection.unbind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED
    else
      @collection.unbind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED
    @collection.release() if @collection.release
    @collection = null
    return this

  getModel: ->
    @model_id = @cached_model.id if @cached_model and not @cached_model.isNew() # upgrade the reference from the cached model
    return @cached_model if @cached_model # return the cached model
    @cached_model = @collection.get(@model_id) if @model_id # find the model, it may not exist
    return @cached_model

  #######################################
  # Internal
  #######################################
  _checkForLoad: ->
    return if @cached_model or not @model_id # already cached or no model id
    model = @collection.get(@model_id)
    return if not model # not loaded

    # switch binding mode -> now waiting for unload
    @collection.unbind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED
    @collection.bind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED

    @cached_model = model
    @trigger('loaded', @cached_model)

  _checkForUnload: ->
    return if not @cached_model or not @model_id # not cached or no model id
    model = @collection.get(@model_id)
    return if model # still exists

    # switch binding mode -> now waiting for load
    @collection.unbind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED
    @collection.bind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED

    model = @cached_model; @cached_model = null
    @trigger('unloaded', model)

#######################################
# Mix in Backbone.Events so callers can subscribe
#######################################
Backbone.ModelRef.prototype extends Backbone.Events

Backbone.ModelRef.VERSION = '0.1.1'
Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED = ['reset', 'remove']
Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED = ['reset', 'add']

#######################################
# Emulated APIs: Backbone.Model - Helps simplify code that takes either a Backbone.Model or Backbone.ModelRef by providing a common signature
#######################################
Backbone.Model::model = ->
  return this if arguments.length == 0
  throw new Error('cannot set a Backbone.Model')

Backbone.Model::isLoaded = -> return true

Backbone.Model::bindLoadingStates = (params) ->
  if _.isFunction(params)
    params(this)
  else if params.loaded
    params.loaded(this)
  return this

Backbone.Model::unbindLoadingStates = (params) -> return this

#######################################
# Emulated APIs: Backbone.ModelRef - Helps simplify code that takes either a Backbone.Model or Backbone.ModelRef by providing a common signature
#######################################
Backbone.ModelRef::get = (attribute_name) ->
  throw new Error("Backbone.ModelRef.get(): only id is permitted") if attribute_name != 'id'
  @model_id = @cached_model.id if @cached_model and not @cached_model.isNew() # upgrade the reference from the cached model
  return @model_id

Backbone.ModelRef::model = (model) ->
  return @getModel() if arguments.length == 0

  throw new Error("Backbone.ModelRef.model(): collections don't match") if model and (model.collection != @collection)

  changed = if @model_id then (not model or (@model_id != model.get('id'))) else !!model
  return unless changed

  # clear previous
  if @cached_model
    previous_model = @cached_model
    @model_id = null; @cached_model = null

    # switch binding mode -> now waiting for load
    @collection.unbind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED
    @collection.bind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED

    @trigger('unloaded', previous_model)

  return unless model
  @model_id = model.get('id'); @cached_model = model.model()

  # switch binding mode -> now waiting for unload
  @collection.unbind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED
  @collection.bind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED

  @trigger('loaded', @cached_model)

Backbone.ModelRef::isLoaded = ->
  model = @getModel()
  return false if not model
  return if model.isLoaded then model.isLoaded() else true  # allow for a custom isLoaded check (for example, checking lazy dependencies are loaded in Backbone.Relational)

Backbone.ModelRef::bindLoadingStates = (params) ->
  if _.isFunction(params)
    @bind('loaded', params)
  else
    @bind('loaded', params.loaded) if params.loaded
    @bind('unloaded', params.unloaded) if params.unloaded
  model = @model()
  return null unless model
  return model.bindLoadingStates(params)

Backbone.ModelRef::unbindLoadingStates = (params) ->
  if _.isFunction(params)
    @unbind('loaded', params)
  else
    @unbind('loaded', params.loaded) if params.loaded
    @unbind('unloaded', params.unloaded) if params.unloaded
  return @model()
