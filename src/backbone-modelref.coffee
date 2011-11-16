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
  MODEL_EVENTS_WHEN_LOADED = ['reset', 'remove']
  MODEL_EVENTS_WHEN_UNLOADED = ['reset', 'add']

  constructor: (@collection, @model_id, @cached_model=null) ->
    _.bindAll(this, '_checkForLoad', '_checkForUnload')
    throw new Error("Backbone.ModelRef: collection is missing") if not @collection
    throw new Error("Backbone.ModelRef: model_id and cached_model missing") if not (@model_id or @cached_model)
    @collection.retain() if @collection.retain

    @cached_model = @cached_model || @collection.get(@model_id)
    if (@cached_model)
      @collection.bind(event, @_checkForUnload) for event in MODEL_EVENTS_WHEN_LOADED
    else
      @collection.bind(event, @_checkForLoad) for event in MODEL_EVENTS_WHEN_UNLOADED
    @ref_count = 1

  retain: -> @ref_count++; return this
  release: ->
    throw new Error("Backbone.ModelRef.release(): ref count is corrupt") if @ref_count<=0

    @ref_count--
    return if (@ref_count>0) # not yet ready for release

    if @cached_model
      @collection.unbind(event, @_checkForUnload) for event in MODEL_EVENTS_WHEN_LOADED
    else
      @collection.unbind(event, @_checkForLoad) for event in MODEL_EVENTS_WHEN_UNLOADED
    @collection.release() if @collection.release
    @collection = null
    return this

  get: (attribute_name) ->
    throw new Error("Backbone.ModelRef.get(): only id is permitted") if attribute_name != 'id'
    @model_id = @cached_model.id if @cached_model and not @cached_model.isNew() # upgrade the reference from the cached model
    return @model_id

  getModel: ->
    @model_id = @cached_model.id if @cached_model and not @cached_model.isNew() # upgrade the reference from the cached model
    return @cached_model if @cached_model # return the cached model
    return (@cached_model = @collection.get(@model_id)) # find the model, it may not exist

  isLoaded: ->
    model = @getModel()
    return false if not model
    return if model.isLoaded then model.isLoaded() else true  # allow for a custom isLoaded check (for example, checking lazy dependencies are loaded in Backbone.Relational)

  #######################################
  # Internal
  #######################################
  _checkForLoad: ->
    model = @collection.get(@model_id)
    return if not model # not loaded
    return if @cached_model # already cached

    # switch binding mode -> now waiting for unload
    @collection.unbind(event, @_checkForLoad) for event in MODEL_EVENTS_WHEN_UNLOADED
    @collection.bind(event, @_checkForUnload) for event in MODEL_EVENTS_WHEN_LOADED

    @cached_model = model
    @trigger('loaded', @cached_model)

  _checkForUnload: ->
    model = @collection.get(@model_id)
    return if model # still exists
    return if not @cached_model # not cached

    # switch binding mode -> now waiting for load
    @collection.unbind(event, @_checkForUnload) for event in MODEL_EVENTS_WHEN_LOADED
    @collection.bind(event, @_checkForLoad) for event in MODEL_EVENTS_WHEN_UNLOADED

    model = @cached_model; @cached_model = null
    @trigger('unloaded', model)

Backbone.ModelRef.VERSION = '0.1.0'

#######################################
# Mix in Backbone.Events so callers can subscribe
#######################################
Backbone.ModelRef.prototype extends Backbone.Events
