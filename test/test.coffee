$(document).ready( ->
  module("Backbone-ModelRef.js")
  test("TEST DEPENDENCY MISSING", ->
    _.VERSION; Backbone.VERSION; Backbone.ModelRef.VERSION
  )

  class MyModel extends Backbone.Model
  class MyCollection extends Backbone.Collection
    model: MyModel

  test("Standard use case: no events", ->
    collection = new MyCollection()
    model_ref = new Backbone.ModelRef(collection, 'dog')
    equal(model_ref.isLoaded(), false, 'model_ref is not yet loaded')
    equal(model_ref.getModel(), null, 'model_ref is not yet loaded')

    collection.add(collection.parse([{id: 'cat'}]))
    equal(model_ref.isLoaded(), false, 'model_ref is not yet loaded')
    equal(model_ref.getModel(), null, 'model_ref is not yet loaded')

    collection.add(collection.parse([{id: 'dog'}]))
    equal(model_ref.isLoaded(), true, 'model_ref is loaded')
    equal(model_ref.getModel(), collection.get('dog'), 'model_ref is loaded')

    collection.remove(collection.get('dog'))
    equal(model_ref.isLoaded(), false, 'model_ref is no longer loaded')
    equal(model_ref.getModel(), null, 'model_ref is no longer loaded')

    collection.add(collection.parse([{id: 'dog'}]))
    equal(model_ref.isLoaded(), true, 'model_ref is loaded again')
    equal(model_ref.getModel(), collection.get('dog'), 'model_ref is loaded again')

    collection.reset()
    equal(model_ref.isLoaded(), false, 'model_ref is no longer loaded')
    equal(model_ref.getModel(), null, 'model_ref is no longer loaded')
  )

  test("Standard use case: with events", ->
    test_model = null
    loaded_count = 0
    loaded_fn = (model) -> loaded_count++; throw new Error('model mismatch') if model != test_model
    unloaded_fn = (model) -> loaded_count--; ; throw new Error('model mismatch') if model != test_model

    collection = new MyCollection()
    model_ref = new Backbone.ModelRef(collection, 'dog')
    model_ref.bind('loaded', loaded_fn)
    model_ref.bind('unloaded', unloaded_fn)
    equal(loaded_count, 0, 'test model is not loaded')

    test_model = new MyModel({id: 'dog'})
    equal(loaded_count, 0, 'test model is not loaded')
    collection.add(test_model)
    equal(loaded_count, 1, 'test model is loaded')
    collection.remove(test_model)

    equal(loaded_count, 0, 'test model is not loaded again')
    collection.add(test_model)
    equal(loaded_count, 1, 'test model is loaded again')
    collection.reset()
    equal(loaded_count, 0, 'test model is not loaded again, again')
  )

  test("Standard use case: Backbone.View", ->
    class MyView extends Backbone.View
      constructor: (@model_ref) ->
        super; _.bindAll(this, 'render', 'renderWaiting')
        @model_ref.retain()
        @model_ref.bind('loaded', @render); @model_ref.bind('unloaded', @renderWaiting)
        if @model_ref.isLoaded() then @render() else @renderWaiting()

      render: -> @is_waiting = false
      renderWaiting: -> @is_waiting = true
      destroy: -> @model_ref.release(); @model_ref = null

    collection = new MyCollection()
    view = new MyView(new Backbone.ModelRef(collection, 'dog'))
    equal(view.is_waiting, true, 'view is in waiting state')

    collection.add(collection.parse([{id: 'dog'}]))
    equal(view.is_waiting, false, 'view is in render state')

    model = collection.get('dog')
    collection.reset()
    equal(view.is_waiting, true, 'view is in waiting state again')

    collection.add(model)
    equal(view.is_waiting, false, 'view is in render state again')
  )

  test("Standard use case: expected errors", ->
    raises((->new Backbone.ModelRef(null, 'dog')), Error, "Backbone.ModelRef: collection is missing")
    raises((->new Backbone.ModelRef(new Backbone.Collection())), Error, "Backbone.ModelRef: model_id and cached_model missing")
    raises((->new Backbone.ModelRef(new Backbone.Collection(), null, null)), Error, "Backbone.ModelRef: model_id and cached_model missing")

    model_ref = new Backbone.ModelRef(new Backbone.Collection(), null, new Backbone.Model({id: 'hello'}))
    equal(model_ref.get('id'), 'hello', 'can get an id of a cached model')
    raises((->model_ref.get('foo')), Error, "Backbone.ModelRef.get(): only id is permitted")

    model_ref.release()
    raises((->model_ref.release()), Error, "Backbone.ModelRef.release(): ref count is corrupt")

    model_ref = new Backbone.ModelRef(new Backbone.Collection(), 'hello')
    equal(model_ref.get('id'), 'hello', 'can get an id of a cached model')
    raises((->model_ref.get('foo')), Error, "Backbone.ModelRef.get(): only id is permitted")
  )
)