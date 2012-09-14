###
  backbone-modelref.js 0.1.5
  (c) 2011, 2012 Kevin Malakoff - http://kmalakoff.github.com/backbone-modelref/
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Dependencies: Backbone.js, and Underscore.js.
###

# helpers
isFunction = (obj) -> return typeof(obj) is 'function'
bind = (obj, fn_name) -> fn = obj[fn_name]; return obj[fn_name] = -> fn.apply(obj, arguments)

# import Backbone
Backbone = if not @Backbone and (typeof(require) != 'undefined') then require('backbone') else @Backbone

class Backbone.ModelRef
  @VERSION = '0.1.5'

  # Mix in Backbone.Events so callers can subscribe
  @prototype extends Backbone.Events
  @MODEL_EVENTS_WHEN_LOADED = ['reset', 'remove']
  @MODEL_EVENTS_WHEN_UNLOADED = ['reset', 'add']

  constructor: (@collection, @id, @cached_model=null) ->
    @_checkForLoad = bind(@, '_checkForLoad'); @_checkForUnload = bind(@, '_checkForUnload')

    throw new Error("Backbone.ModelRef: collection is missing") if not @collection
    @ref_count = 1

    @id = @cached_model.id if @cached_model
    @cached_model = @collection.get(@id) if not @cached_model and @id
    if (@cached_model)
      @collection.bind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED
    else
      @collection.bind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED

  retain: -> @ref_count++; return @
  release: ->
    throw new Error("Backbone.ModelRef.release(): ref count is corrupt") if @ref_count<=0

    @ref_count--
    return if (@ref_count>0) # not yet ready for release

    if @cached_model
      @collection.unbind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED
    else
      @collection.unbind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED
    @collection = null

    # unbind all remaining events
    @unbind(null)
    @

  getModel: ->
    @id = @cached_model.id if @cached_model and not @cached_model.isNew() # upgrade the reference from the cached model
    return @cached_model if @cached_model # return the cached model
    @cached_model = @collection.get(@id) if @id # find the model, it may not exist
    return @cached_model

  #######################################
  # Internal
  #######################################
  _checkForLoad: ->
    return if @cached_model or not @id # already cached or no model id
    model = @collection.get(@id)
    return if not model # not loaded

    # switch binding mode -> now waiting for unload
    @collection.unbind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED
    @collection.bind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED

    @cached_model = model
    @trigger('loaded', @cached_model)

  _checkForUnload: ->
    return if not @cached_model or not @id # not cached or no model id
    model = @collection.get(@id)
    return if model # still exists

    # switch binding mode -> now waiting for load
    @collection.unbind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED
    @collection.bind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED

    model = @cached_model; @cached_model = null
    @trigger('unloaded', model)

#######################################
# Emulated APIs: Backbone.Model - Helps simplify code that takes either a Backbone.Model or Backbone.ModelRef by providing a common signature
#######################################
Backbone.Model::model = ->
  return this if arguments.length == 0
  throw new Error('cannot set a Backbone.Model')

Backbone.Model::isLoaded = -> return true

Backbone.Model::bindLoadingStates = (params) ->
  if isFunction(params)
    params(@)
  else if params.loaded
    params.loaded(@)
  @

Backbone.Model::unbindLoadingStates = (params) -> @

#######################################
# Emulated APIs: Backbone.ModelRef - Helps simplify code that takes either a Backbone.Model or Backbone.ModelRef by providing a common signature
#######################################
Backbone.ModelRef::get = (attribute_name) ->
  throw new Error("Backbone.ModelRef.get(): only id is permitted") if attribute_name != 'id'
  @id = @cached_model.id if @cached_model and not @cached_model.isNew() # upgrade the reference from the cached model
  return @id

Backbone.ModelRef::model = (model) ->
  return @getModel() if arguments.length == 0

  throw new Error("Backbone.ModelRef.model(): collections don't match") if model and (model.collection != @collection)

  changed = if @id then (not model or (@id != model.get('id'))) else !!model
  return unless changed

  # clear previous
  if @cached_model
    previous_model = @cached_model
    @id = null; @cached_model = null

    # switch binding mode -> now waiting for load
    @collection.unbind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED
    @collection.bind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED

    @trigger('unloaded', previous_model)

  return unless model
  @id = model.get('id'); @cached_model = model.model()

  # switch binding mode -> now waiting for unload
  @collection.unbind(event, @_checkForLoad) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_UNLOADED
  @collection.bind(event, @_checkForUnload) for event in Backbone.ModelRef.MODEL_EVENTS_WHEN_LOADED

  @trigger('loaded', @cached_model)

Backbone.ModelRef::isLoaded = ->
  model = @getModel()
  return false if not model
  return if model.isLoaded then model.isLoaded() else true  # allow for a custom isLoaded check (for example, checking lazy dependencies are loaded in Backbone.Relational)

Backbone.ModelRef::bindLoadingStates = (params) ->
  params = {loaded: params} if isFunction(params)
  not params.loaded or @bind('loaded', params.loaded)
  not params.unloaded or @bind('unloaded', params.unloaded)
  model = @model()
  return null unless model
  return model.bindLoadingStates(params)

Backbone.ModelRef::unbindLoadingStates = (params) ->
  params = {loaded: params} if isFunction(params)
  not params.loaded or @unbind('loaded', params.loaded)
  not params.unloaded or @unbind('unloaded', params.unloaded)
  return @model()

##############################################
# export or create Backbone.ModelRef namespace
module.exports = Backbone.ModelRef if (typeof(exports) != 'undefined'); @Backbone.ModelRef = Backbone.ModelRef if @Backbone
Backbone.ModelRef.VERSION = '0.1.5'