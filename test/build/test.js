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
  return test("Standard use case: expected errors", function() {
    var model_ref;
    raises((function() {
      return new Backbone.ModelRef(null, 'dog');
    }), Error, "Backbone.ModelRef: collection is missing");
    raises((function() {
      return new Backbone.ModelRef(new Backbone.Collection());
    }), Error, "Backbone.ModelRef: model_id and cached_model missing");
    raises((function() {
      return new Backbone.ModelRef(new Backbone.Collection(), null, null);
    }), Error, "Backbone.ModelRef: model_id and cached_model missing");
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