try
  require.config({
    paths:
      'underscore': "../../vendor/underscore-1.4.4"
      'backbone': "../../vendor/backbone-1.0.0"
      'backbone-modelref': "../../backbone-modelref"
    shim:
      underscore:
        exports: '_'
      backbone:
        exports: 'Backbone'
        deps: ['underscore']
  })

  # library and dependencies
  require ['underscore', 'backbone', 'backbone-modelref', 'qunit_test_runner'], (_, Backbone, ModelRef, runner) ->
    window._ = window.Backbone = null # force each test to require dependencies synchronously
    runner.start(); require ['./build/test'], ->

catch error
  alert("AMD tests failed: '#{error}'")