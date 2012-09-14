[![Build Status](https://secure.travis-ci.org/kmalakoff/backbone-modelref.png)](http://travis-ci.org/kmalakoff/backbone-modelref)

````
|_) _. _ | |_  _ ._  _ __ |\/| _  _| _ ||_) _ _|_
|_)(_|(_ |<|_)(_)| |(/_   |  |(_)(_|(/_|| \(/_ |
````

Backbone-ModelRef.js provides a mechanism to respond to lazy-loaded Backbone.js models.

#Download Latest (0.1.5):

Please see the [release notes](https://github.com/kmalakoff/backbone-modelref/blob/master/RELEASE_NOTES.md) for upgrade pointers.

* [Development version](https://raw.github.com/kmalakoff/backbone-modelref/0.1.5/backbone-modelref.js)
* [Production version](https://raw.github.com/kmalakoff/backbone-modelref/0.1.5/backbone-modelref.min.js)

# An Example:

```
  class MyView extends Backbone.View
    constructor: (@model_ref) ->
      super; _.bindAll(this, 'render', 'renderWaiting')
      @model_ref.bind('loaded', @render); @model_ref.bind('unloaded', @renderWaiting)
      if @model_ref.isLoaded() then @render() else @renderWaiting()

    render: -> @is_waiting = false
    renderWaiting: -> @is_waiting = true

  collection = new MyCollection()
  view = new MyView(new Backbone.ModelRef(collection, 'dog')) # view is now rendering in waiting state
  collection.add(collection.parse([{id: 'dog'}]))             # view is now rendering in loaded state
```

Classes
-------
*Backbone.ModelRef*: This is the only class! It just wraps a collection and a model id, and tells you when the model is loaded and unloaded.

API Signature Parity between Backbone.Model and Backbone.ModelRef
-----------------------------------------------------------------

|*Function*|*Backbone.Model*|*Backbone.ModelRef*|
-----------------|--------------|-----------------|
*get(attribute_name)*|returns model.get(attribute_name)|returns the model id only and throws an exception otherwise|
*model()*|returns this|returns its model if it is loaded or null if not|
*isLoaded()*|returns true|returns true if its model is loaded and false otherwise|
*bindLoadingStates( loaded_fn or {loaded:fn, unloaded:fn} )*|loaded function called one time (immediately) and unloaded function never called. No Backbone.Event binding occurs|loaded function called immediately if the model is loaded otherwise they are bound using Backbone.Events 'loaded' and 'unloaded' where each is called when the model is loaded or unloaded, respectively|
*unbindLoadingStates( loaded_fn or {loaded:fn, unloaded:fn} )*|ignored|unbinds Backbone.Events 'loaded' and 'unloaded'|

## Other notes:

* Backbone.ModelRefs are reference counted so use retain() and release() to properly ensure non-dangling pointers.
* You can optionally provide an function Backbone.Model.isLoaded() id you have custom loading checks like for lazy-loaded Backbone.Relational models.
* You can optionally provide a reference counted collection (implementing retain() and release()).

Please look at the provided examples and specs for sample code:

* https://github.com/kmalakoff/backbone-modelref/blob/master/test


Building, Running and Testing the library
-----------------------

###Installing:

1. install node.js: http://nodejs.org
2. install node packages: 'npm install'

###Commands:

Look at: https://github.com/kmalakoff/easy-bake