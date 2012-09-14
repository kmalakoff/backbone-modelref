$(document).ready( ->
  module("knockback-page-navigators-simple-amd.js")

  # Knockback and depdenencies
  require(['underscore', 'backbone', 'backbone-modelref'], (_, Backbone, ModelRef) ->
    _ or= @_
    Backbone or= @Backbone

    test("TEST DEPENDENCY MISSING", ->
      ok(!!_); ok(!!Backbone); ok(!!ModelRef)
    )

    class MyModel extends Backbone.Model
    class MyCollection extends Backbone.Collection
      model: MyModel

    test("Standard use case: no events", ->
      collection = new MyCollection()
      model_ref = new ModelRef(collection, 'dog')
      equal(model_ref.isLoaded(), false, 'model_ref is not yet loaded')
      ok(!model_ref.getModel(), 'model_ref is not yet loaded')

      collection.add(collection.parse([{id: 'cat'}]))
      equal(model_ref.isLoaded(), false, 'model_ref is not yet loaded')
      ok(!model_ref.getModel(), 'model_ref is not yet loaded')

      collection.add(collection.parse([{id: 'dog'}]))
      equal(model_ref.isLoaded(), true, 'model_ref is loaded')
      equal(model_ref.getModel(), collection.get('dog'), 'model_ref is loaded')

      collection.remove(collection.get('dog'))
      equal(model_ref.isLoaded(), false, 'model_ref is no longer loaded')
      ok(!model_ref.getModel(), 'model_ref is no longer loaded')

      collection.add(collection.parse([{id: 'dog'}]))
      equal(model_ref.isLoaded(), true, 'model_ref is loaded again')
      equal(model_ref.getModel(), collection.get('dog'), 'model_ref is loaded again')

      collection.reset()
      equal(model_ref.isLoaded(), false, 'model_ref is no longer loaded')
      ok(!model_ref.getModel(), 'model_ref is no longer loaded')
    )

    test("Standard use case: with events", ->
      test_model = null
      loaded_count = 0
      loaded_fn = (model) -> loaded_count++; throw new Error('model mismatch') if model != test_model
      unloaded_fn = (model) -> loaded_count--; ; throw new Error('model mismatch') if model != test_model

      collection = new MyCollection()
      model_ref = new ModelRef(collection, 'dog')
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

    test("Standard use case in a view", ->
      class MyView
        constructor: (@model_ref) ->
          _.bindAll(this, 'render', 'renderWaiting')
          @model_ref.retain()
          @model_ref.bind('loaded', @render); @model_ref.bind('unloaded', @renderWaiting)
          if @model_ref.isLoaded() then @render() else @renderWaiting()

        render: -> @is_waiting = false
        renderWaiting: -> @is_waiting = true
        destroy: -> @model_ref.release(); @model_ref = null

      collection = new MyCollection()
      view = new MyView(new ModelRef(collection, 'dog'))
      equal(view.is_waiting, true, 'view is in waiting state')

      collection.add(collection.parse([{id: 'dog'}]))
      equal(view.is_waiting, false, 'view is in render state')

      model = collection.get('dog')
      collection.reset()
      equal(view.is_waiting, true, 'view is in waiting state again')

      collection.add(model)
      equal(view.is_waiting, false, 'view is in render state again')
    )

    test("Emulated API signatures: simple case", ->
      collection = new MyCollection()
      model = new Backbone.Model({id: 'dog', name: 'Rover'})
      model_ref = new ModelRef(collection, 'dog')

      #######################################
      equal(model.get('id'), 'dog', 'can get an id')
      equal(model_ref.get('id'), 'dog', 'can get an id')

      equal(model.get('name'), 'Rover', 'can get an attribute')
      raises((->model_ref.get('name')), Error, "ModelRef.get(): only id is permitted")

      equal(model.model(), model, 'can get self')
      equal(model_ref.model(), null, 'model is not yet loaded')

      equal(model.isLoaded(), true, 'model is always loaded')
      equal(model_ref.isLoaded(), false, 'model is not yet loaded')

      #######################################
      collection.add(model)
      equal(model.get('id'), 'dog', 'can get an id')
      equal(model_ref.get('id'), 'dog', 'can get an id')

      equal(model.get('name'), 'Rover', 'can get an attribute')
      raises((->model_ref.get('name')), Error, "ModelRef.get(): only id is permitted")

      equal(model.model(), model, 'can get self')
      equal(model_ref.model(), model, 'model is now loaded')

      equal(model.isLoaded(), true, 'model is always loaded')
      equal(model_ref.isLoaded(), true, 'model is now loaded')

      #######################################
      collection.reset()
      equal(model.get('id'), 'dog', 'can get an id')
      equal(model_ref.get('id'), 'dog', 'can get an id')

      equal(model.get('name'), 'Rover', 'can get an attribute')
      raises((->model_ref.get('name')), Error, "ModelRef.get(): only id is permitted")

      equal(model.model(), model, 'can get self')
      equal(model_ref.model(), null, 'model is not yet loaded')

      equal(model.isLoaded(), true, 'model is always loaded')
      equal(model_ref.isLoaded(), false, 'model is not yet loaded')
    )

    test("Emulated API signatures: binding", ->
      create_counter_fn = (counter_attribute) ->
        return (model) ->
          model[counter_attribute] = 0 unless model.hasOwnProperty(counter_attribute)
          model[counter_attribute]++

      collection = new MyCollection()
      model = new Backbone.Model({id: 'dog', name: 'Rover'})
      model_ref = new ModelRef(collection, 'dog')

      #######################################
      model.bindLoadingStates(create_counter_fn('model_loaded'))
      equal(model.model_loaded, 1, 'model is loaded so called immediately, but not bound so subsequent loads and unload will do nothing. You need a model ref for tracking those changes')

      #######################################
      model.bindLoadingStates({loaded: create_counter_fn('model_loaded'), unloaded: create_counter_fn('model_unloaded')})
      equal(model.model_loaded, 2, 'model is loaded so called immediately')
      equal(model.model_unloaded, undefined, 'model is loaded and unload will never be called')

      #######################################
      model_ref.bindLoadingStates(create_counter_fn('model_ref_loaded'))
      equal(model_ref.model_ref_loaded, undefined, 'model is not loaded so not yet called')
      collection.add(model)
      equal(model_ref.isLoaded(), true, 'model ref is loaded')
      equal(model.model_ref_loaded, 1, 'model is now loaded')
      collection.reset()
      equal(model_ref.isLoaded(), false, 'model ref not loaded')
      equal(model.model_ref_loaded, 1, 'model unload did nothing')

      #######################################
      model_ref.bindLoadingStates({loaded: create_counter_fn('model_ref_loaded'), unloaded: create_counter_fn('model_ref_unloaded')})
      equal(model.model_ref_loaded, 1, 'model still unloaded')
      equal(model.model_ref_unloaded, undefined, 'model unload not yet happened with the function')

      collection.add(model)
      equal(model_ref.isLoaded(), true, 'model ref is loaded')
      equal(model.model_ref_loaded, 3, 'model is loaded again and both original and new binding called')
      equal(model.model_ref_unloaded, undefined, 'model unload not yet happened with the function')
      collection.reset()
      equal(model_ref.isLoaded(), false, 'model ref not loaded')
      equal(model.model_ref_loaded, 3, 'model unload did nothing')
      equal(model.model_ref_unloaded, 1, 'model unload recorded')

      #######################################
      model_ref2 = new ModelRef(collection, 'dog')
      collection.add(model)
      model_ref2.bindLoadingStates({loaded: create_counter_fn('model_ref2_loaded'), unloaded: create_counter_fn('model_ref2_unloaded')})
      equal(model_ref2.isLoaded(), true, 'model ref is loaded')
      equal(model.model_ref2_loaded, 1, 'model was already laoded so callback was called')
      equal(model.model_ref2_unloaded, undefined, 'model unload not yet happened with the function')

      collection.reset()
      equal(model_ref2.isLoaded(), false, 'model ref not loaded')
      equal(model.model_ref2_loaded, 1, 'model unload did nothing')
      equal(model.model_ref2_unloaded, 1, 'model unload recorded')
    )

    test("changing the model ref", ->
      create_counter_fn = (counter_attribute) ->
        return (model) ->
          model[counter_attribute] = 0 unless model.hasOwnProperty(counter_attribute)
          model[counter_attribute]++

      collection = new MyCollection()
      model_dog = new Backbone.Model({id: 'dog', name: 'Rover'})
      model_cat = new Backbone.Model({id: 'cat', name: 'Kitty'})
      model_ref = new ModelRef(collection, 'dog')
      model_ref.bindLoadingStates({loaded: create_counter_fn('model_ref_loaded'), unloaded: create_counter_fn('model_ref_unloaded')})
      model_ref2 = new ModelRef(collection, 'dog')

      #######################################
      equal(model_ref.model_ref_loaded, undefined, 'model is not loaded so not yet called')
      collection.add(model_dog)
      equal(model_ref.isLoaded(), true, 'model ref is loaded')
      equal(model_dog.model_ref_loaded, 1, 'model_dog is now loaded')
      collection.reset()
      equal(model_ref.isLoaded(), false, 'model ref not loaded')
      equal(model_dog.model_ref_loaded, 1, 'model_dog unload did nothing')
      equal(model_dog.model_ref_unloaded, 1, 'model_dog was unloaded')

      #######################################
      collection.add([model_dog, model_cat])
      equal(model_ref.isLoaded(), true, 'model ref is loaded')
      equal(model_dog.model_ref_loaded, 2, 'model_dog is now loaded')

      #######################################
      model_ref.model(model_cat)
      equal(model_dog.model_ref_unloaded, 2, 'model_dog was unloaded')
      equal(model_ref.isLoaded(), true, 'model ref is loaded')
      equal(model_cat.model_ref_loaded, 1, 'model_cat was loaded')

      collection.reset()
      equal(model_ref.isLoaded(), false, 'model ref is unloaded')
      equal(model_cat.model_ref_unloaded, 1, 'model_cat was loaded')

      #######################################
      collection.add([model_dog, model_cat])
      model_ref.model(model_ref2)
      equal(model_cat.model_ref_unloaded, 2, 'model_cat was unloaded')
      equal(model_ref.isLoaded(), true, 'model ref is loaded')
      equal(model_dog.model_ref_loaded, 3, 'model_dog was loaded')

      collection.reset()
      equal(model_ref.isLoaded(), false, 'model ref is unloaded')
      equal(model_dog.model_ref_unloaded, 3, 'model_dog was loaded')
    )

    test("Standard use case: expected errors", ->
      raises((->new ModelRef(null, 'dog')), Error, "ModelRef: collection is missing")

      model_ref = new ModelRef(new Backbone.Collection(), null, new Backbone.Model({id: 'hello'}))
      equal(model_ref.get('id'), 'hello', 'can get an id of a cached model')
      raises((->model_ref.get('foo')), Error, "ModelRef.get(): only id is permitted")

      model_ref.release()
      raises((->model_ref.release()), Error, "ModelRef.release(): ref count is corrupt")

      model_ref = new ModelRef(new Backbone.Collection(), 'hello')
      equal(model_ref.get('id'), 'hello', 'can get an id of a cached model')
      raises((->model_ref.get('foo')), Error, "ModelRef.get(): only id is permitted")
    )
  )
)