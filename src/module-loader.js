/*
  backbone-modelref.js 0.1.5
  (c) 2011, 2012 Kevin Malakoff - http://kmalakoff.github.com/backbone-modelref/
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Dependencies: Backbone.js, and Underscore.js.
*/
(function() {
  return (function(factory) {
    // AMD
    if (typeof define === 'function' && define.amd) {
      return define('backbone-relational', ['underscore', 'backbone'], factory);
    }
    // CommonJS/NodeJS or No Loader
    else {
      return factory.call(this);
    }
  })(function() {'__REPLACE__'; return Backbone.ModelRef;});
}).call(this);