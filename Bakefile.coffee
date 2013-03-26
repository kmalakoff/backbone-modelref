module.exports =
  library:
    join: 'backbone-modelref.js'
    wrapper: 'src/module-loader.js'
    compress: true
    files: 'src/**/*.coffee'
    _build:
      commands: [
        'cp backbone-modelref.js packages/npm/backbone-modelref.js'
        'cp backbone-modelref.min.js packages/npm/backbone-modelref.min.js'
        'cp README.md packages/npm/README.md'
        'cp backbone-modelref.js packages/nuget/Content/Scripts/backbone-modelref.js'
        'cp backbone-modelref.min.js packages/nuget/Content/Scripts/backbone-modelref.min.js'
      ]

  tests:
    _build:
      output: 'build'
      directories: [
        'test/core'
      ]
      commands: [
        'mbundle test/packaging/bundle-config.coffee'
        'mbundle test/lodash/bundle-config.coffee'
      ]

    _test:
      command: 'phantomjs'
      runner: 'phantomjs-qunit-runner.js'
      files: ['**/*.html']
      directories: [
        'test/core'
        'test/packaging'
        'test/lodash'
      ]

  _postinstall:
    commands: [
      'cp -v underscore vendor/underscore.js'
      'cp -v backbone vendor/backbone.js'
      'cp -v lodash vendor/optional/lodash.js'
    ]