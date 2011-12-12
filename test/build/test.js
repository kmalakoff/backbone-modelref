var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
};
$(document).ready(function() {
  var MyCollection, MyModel;
  module("Backbone-ModelRef.js");
  test("TEST DEPENDENCY MISSING", function() {
    _.VERSION;
    Backbone.VERSION;
    return Backbone.ModelRef.VERSION;
  });
  MyModel = (function() {
    __extends(MyModel, Backbone.Model);
    function MyModel() {
      MyModel.__super__.constructor.apply(this, arguments);
    }
    return MyModel;
  })();
  MyCollection = (function() {
    __extends(MyCollection, Backbone.Collection);
    function MyCollection() {
      MyCollection.__super__.constructor.apply(this, arguments);
    }
    MyCollection.prototype.model = MyModel;
    return MyCollection;
  })();
  test("Standard use case: no events", function() {
    var collection, model_ref;
    collection = new MyCollection();
    model_ref = new Backbone.ModelRef(collection, 'dog');
    equal(model_ref.isLoaded(), false, 'model_ref is not yet loaded');
    equal(model_ref.getModel(), null, 'model_ref is not yet loaded');
    collection.add(collection.parse([
      {
        id: 'cat'
      }
    ]));
    equal(model_ref.isLoaded(), false, 'model_ref is not yet loaded');
    equal(model_ref.getModel(), null, 'model_ref is not yet loaded');
    collection.add(collection.parse([
      {
        id: 'dog'
      }
    ]));
    equal(model_ref.isLoaded(), true, 'model_ref is loaded');
    equal(model_ref.getModel(), collection.get('dog'), 'model_ref is loaded');
    collection.remove(collection.get('dog'));
    equal(model_ref.isLoaded(), false, 'model_ref is no longer loaded');
    equal(model_ref.getModel(), null, 'model_ref is no longer loaded');
    collection.add(collection.parse([
      {
        id: 'dog'
      }
    ]));
    equal(model_ref.isLoaded(), true, 'model_ref is loaded again');
    equal(model_ref.getModel(), collection.get('dog'), 'model_ref is loaded again');
    collection.reset();
    equal(model_ref.isLoaded(), false, 'model_ref is no longer loaded');
    return equal(model_ref.getModel(), null, 'model_ref is no longer loaded');
  });
  test("Standard use case: with events", function() {
    var collection, loaded_count, loaded_fn, model_ref, test_model, unloaded_fn;
    test_model = null;
    loaded_count = 0;
    loaded_fn = function(model) {
      loaded_count++;
      if (model !== test_model) {
        throw new Error('model mismatch');
      }
    };
    unloaded_fn = function(model) {
      loaded_count--;
      if (model !== test_model) {
        throw new Error('model mismatch');
      }
    };
    collection = new MyCollection();
    model_ref = new Backbone.ModelRef(collection, 'dog');
    model_ref.bind('loaded', loaded_fn);
    model_ref.bind('unloaded', unloaded_fn);
    equal(loaded_count, 0, 'test model is not loaded');
    test_model = new MyModel({
      id: 'dog'
    });
    equal(loaded_count, 0, 'test model is not loaded');
    collection.add(test_model);
    equal(loaded_count, 1, 'test model is loaded');
    collection.remove(test_model);
    equal(loaded_count, 0, 'test model is not loaded again');
    collection.add(test_model);
    equal(loaded_count, 1, 'test model is loaded again');
    collection.reset();
    return equal(loaded_count, 0, 'test model is not loaded again, again');
  });
  test("Standard use case: Backbone.View", function() {
    var MyView, collection, model, view;
    MyView = (function() {
      __extends(MyView, Backbone.View);
      function MyView(model_ref) {
        this.model_ref = model_ref;
        MyView.__super__.constructor.apply(this, arguments);
        _.bindAll(this, 'render', 'renderWaiting');
        this.model_ref.retain();
        this.model_ref.bind('loaded', this.render);
        this.model_ref.bind('unloaded', this.renderWaiting);
        if (this.model_ref.isLoaded()) {
          this.render();
        } else {
          this.renderWaiting();
        }
      }
      MyView.prototype.render = function() {
        return this.is_waiting = false;
      };
      MyView.prototype.renderWaiting = function() {
        return this.is_waiting = true;
      };
      MyView.prototype.destroy = function() {
        this.model_ref.release();
        return this.model_ref = null;
      };
      return MyView;
    })();
    collection = new MyCollection();
    view = new MyView(new Backbone.ModelRef(collection, 'dog'));
    equal(view.is_waiting, true, 'view is in waiting state');
    collection.add(collection.parse([
      {
        id: 'dog'
      }
    ]));
    equal(view.is_waiting, false, 'view is in render state');
    model = collection.get('dog');
    collection.reset();
    equal(view.is_waiting, true, 'view is in waiting state again');
    collection.add(model);
    return equal(view.is_waiting, false, 'view is in render state again');
  });
  test("Emulated API signatures: simple case", function() {
    var collection, model, model_ref;
    collection = new MyCollection();
    model = new Backbone.Model({
      id: 'dog',
      name: 'Rover'
    });
    model_ref = new Backbone.ModelRef(collection, 'dog');
    equal(model.get('id'), 'dog', 'can get an id');
    equal(model_ref.get('id'), 'dog', 'can get an id');
    equal(model.get('name'), 'Rover', 'can get an attribute');
    raises((function() {
      return model_ref.get('name');
    }), Error, "Backbone.ModelRef.get(): only id is permitted");
    equal(model.model(), model, 'can get self');
    equal(model_ref.model(), null, 'model is not yet loaded');
    equal(model.isLoaded(), true, 'model is always loaded');
    equal(model_ref.isLoaded(), false, 'model is not yet loaded');
    collection.add(model);
    equal(model.get('id'), 'dog', 'can get an id');
    equal(model_ref.get('id'), 'dog', 'can get an id');
    equal(model.get('name'), 'Rover', 'can get an attribute');
    raises((function() {
      return model_ref.get('name');
    }), Error, "Backbone.ModelRef.get(): only id is permitted");
    equal(model.model(), model, 'can get self');
    equal(model_ref.model(), model, 'model is now loaded');
    equal(model.isLoaded(), true, 'model is always loaded');
    equal(model_ref.isLoaded(), true, 'model is now loaded');
    collection.reset();
    equal(model.get('id'), 'dog', 'can get an id');
    equal(model_ref.get('id'), 'dog', 'can get an id');
    equal(model.get('name'), 'Rover', 'can get an attribute');
    raises((function() {
      return model_ref.get('name');
    }), Error, "Backbone.ModelRef.get(): only id is permitted");
    equal(model.model(), model, 'can get self');
    equal(model_ref.model(), null, 'model is not yet loaded');
    equal(model.isLoaded(), true, 'model is always loaded');
    return equal(model_ref.isLoaded(), false, 'model is not yet loaded');
  });
  test("Emulated API signatures: binding", function() {
    var collection, create_counter_fn, model, model_ref, model_ref2;
    create_counter_fn = function(counter_attribute) {
      return function(model) {
        if (!model.hasOwnProperty(counter_attribute)) {
          model[counter_attribute] = 0;
        }
        return model[counter_attribute]++;
      };
    };
    collection = new MyCollection();
    model = new Backbone.Model({
      id: 'dog',
      name: 'Rover'
    });
    model_ref = new Backbone.ModelRef(collection, 'dog');
    model.bindLoadingStates(create_counter_fn('model_loaded'));
    equal(model.model_loaded, 1, 'model is loaded so called immediately, but not bound so subsequent loads and unload will do nothing. You need a model ref for tracking those changes');
    model.bindLoadingStates({
      loaded: create_counter_fn('model_loaded'),
      unloaded: create_counter_fn('model_unloaded')
    });
    equal(model.model_loaded, 2, 'model is loaded so called immediately');
    equal(model.model_unloaded, void 0, 'model is loaded and unload will never be called');
    model_ref.bindLoadingStates(create_counter_fn('model_ref_loaded'));
    equal(model_ref.model_ref_loaded, void 0, 'model is not loaded so not yet called');
    collection.add(model);
    equal(model_ref.isLoaded(), true, 'model ref is loaded');
    equal(model.model_ref_loaded, 1, 'model is now loaded');
    collection.reset();
    equal(model_ref.isLoaded(), false, 'model ref not loaded');
    equal(model.model_ref_loaded, 1, 'model unload did nothing');
    model_ref.bindLoadingStates({
      loaded: create_counter_fn('model_ref_loaded'),
      unloaded: create_counter_fn('model_ref_unloaded')
    });
    equal(model.model_ref_loaded, 1, 'model still unloaded');
    equal(model.model_ref_unloaded, void 0, 'model unload not yet happened with the function');
    collection.add(model);
    equal(model_ref.isLoaded(), true, 'model ref is loaded');
    equal(model.model_ref_loaded, 3, 'model is loaded again and both original and new binding called');
    equal(model.model_ref_unloaded, void 0, 'model unload not yet happened with the function');
    collection.reset();
    equal(model_ref.isLoaded(), false, 'model ref not loaded');
    equal(model.model_ref_loaded, 3, 'model unload did nothing');
    equal(model.model_ref_unloaded, 1, 'model unload recorded');
    model_ref2 = new Backbone.ModelRef(collection, 'dog');
    collection.add(model);
    model_ref2.bindLoadingStates({
      loaded: create_counter_fn('model_ref2_loaded'),
      unloaded: create_counter_fn('model_ref2_unloaded')
    });
    equal(model_ref2.isLoaded(), true, 'model ref is loaded');
    equal(model.model_ref2_loaded, 1, 'model was already laoded so callback was called');
    equal(model.model_ref2_unloaded, void 0, 'model unload not yet happened with the function');
    collection.reset();
    equal(model_ref2.isLoaded(), false, 'model ref not loaded');
    equal(model.model_ref2_loaded, 1, 'model unload did nothing');
    return equal(model.model_ref2_unloaded, 1, 'model unload recorded');
  });
  test("changing the model ref", function() {
    var collection, create_counter_fn, model_cat, model_dog, model_ref, model_ref2;
    create_counter_fn = function(counter_attribute) {
      return function(model) {
        if (!model.hasOwnProperty(counter_attribute)) {
          model[counter_attribute] = 0;
        }
        return model[counter_attribute]++;
      };
    };
    collection = new MyCollection();
    model_dog = new Backbone.Model({
      id: 'dog',
      name: 'Rover'
    });
    model_cat = new Backbone.Model({
      id: 'cat',
      name: 'Kitty'
    });
    model_ref = new Backbone.ModelRef(collection, 'dog');
    model_ref.bindLoadingStates({
      loaded: create_counter_fn('model_ref_loaded'),
      unloaded: create_counter_fn('model_ref_unloaded')
    });
    model_ref2 = new Backbone.ModelRef(collection, 'dog');
    equal(model_ref.model_ref_loaded, void 0, 'model is not loaded so not yet called');
    collection.add(model_dog);
    equal(model_ref.isLoaded(), true, 'model ref is loaded');
    equal(model_dog.model_ref_loaded, 1, 'model_dog is now loaded');
    collection.reset();
    equal(model_ref.isLoaded(), false, 'model ref not loaded');
    equal(model_dog.model_ref_loaded, 1, 'model_dog unload did nothing');
    equal(model_dog.model_ref_unloaded, 1, 'model_dog was unloaded');
    collection.add([model_dog, model_cat]);
    equal(model_ref.isLoaded(), true, 'model ref is loaded');
    equal(model_dog.model_ref_loaded, 2, 'model_dog is now loaded');
    model_ref.model(model_cat);
    equal(model_dog.model_ref_unloaded, 2, 'model_dog was unloaded');
    equal(model_ref.isLoaded(), true, 'model ref is loaded');
    equal(model_cat.model_ref_loaded, 1, 'model_cat was loaded');
    collection.reset();
    equal(model_ref.isLoaded(), false, 'model ref is unloaded');
    equal(model_cat.model_ref_unloaded, 1, 'model_cat was loaded');
    collection.add([model_dog, model_cat]);
    model_ref.model(model_ref2);
    equal(model_cat.model_ref_unloaded, 2, 'model_cat was unloaded');
    equal(model_ref.isLoaded(), true, 'model ref is loaded');
    equal(model_dog.model_ref_loaded, 3, 'model_dog was loaded');
    collection.reset();
    equal(model_ref.isLoaded(), false, 'model ref is unloaded');
    return equal(model_dog.model_ref_unloaded, 3, 'model_dog was loaded');
  });
  return test("Standard use case: expected errors", function() {
    var model_ref;
    raises((function() {
      return new Backbone.ModelRef(null, 'dog');
    }), Error, "Backbone.ModelRef: collection is missing");
    model_ref = new Backbone.ModelRef(new Backbone.Collection(), null, new Backbone.Model({
      id: 'hello'
    }));
    equal(model_ref.get('id'), 'hello', 'can get an id of a cached model');
    raises((function() {
      return model_ref.get('foo');
    }), Error, "Backbone.ModelRef.get(): only id is permitted");
    model_ref.release();
    raises((function() {
      return model_ref.release();
    }), Error, "Backbone.ModelRef.release(): ref count is corrupt");
    model_ref = new Backbone.ModelRef(new Backbone.Collection(), 'hello');
    equal(model_ref.get('id'), 'hello', 'can get an id of a cached model');
    return raises((function() {
      return model_ref.get('foo');
    }), Error, "Backbone.ModelRef.get(): only id is permitted");
  });
});