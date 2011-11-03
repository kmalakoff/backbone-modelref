````
|_) _. _ | |_  _ ._  _ __ |\/| _  _| _ ||_) _ _|_
|_)(_|(_ |<|_)(_)| |(/_   |  |(_)(_|(/_|| \(/_ |
````

Backbone-ModelRef.js provides a mechanism to respond to lazy-loaded Backbone.js models.

You can get the library here:

* Development version: https://github.com/kmalakoff/backbone-modelref/raw/master/backbone-modelref.js
* Production version: https://github.com/kmalakoff/backbone-modelref/raw/master/backbone-modelref.min.js

# An Example:

````
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
````

# Classes:

## Backbone.ModelRef
This is the only class! It just wraps a collection and a model id, and tells you when the model is loaded and unloaded.

## Other notes:

* Backbone.ModelRefs are reference counted so use retain() and release() to properly ensure non-dangling pointers.
* You can optionally provide an function Backbone.Model.isLoaded() id you have custom loading checks like for lazy-loaded Backbone.Relational models.
* You can optionally provide a reference counted collection (implementing retain() and release()).

Please look at the provided examples and specs for sample code:

* https://github.com/kmalakoff/backbone-modelref/blob/master/test
