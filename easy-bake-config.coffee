module.exports =
  library:
    join: 'backbone-modelref.js'
    compress: true
    files: 'src/**/*.coffee'
    modes:
      build:
        commands: [
          'cp backbone-modelref.js packages/npm/backbone-modelref.js'
          'cp backbone-modelref.min.js packages/npm/backbone-modelref.min.js'
          'cp backbone-modelref.js packages/nuget/Content/Scripts/backbone-modelref.js'
          'cp backbone-modelref.min.js packages/nuget/Content/Scripts/backbone-modelref.min.js'
        ]

  tests:
    output: 'build'
    directories: [
      'test/core'
      'test/packaging'
      'test/lodash'
    ]
    files: '**/*.coffee'
    modes:
      build:
        bundles:
          'test/packaging/build/bundle-latest.js':
            underscore: 'underscore'
            backbone: 'backbone'
            'backbone-modelref': 'backbone-modelref.js'
          'test/packaging/build/bundle-legacy.js':
            underscore: 'vendor/underscore-1.0.3.js'
            backbone: 'vendor/backbone-0.5.1.js'
            'backbone-modelref': 'backbone-modelref.js'
          'test/lodash/build/bundle-lodash.js':
            lodash: 'vendor/lodash-0.3.2.js'
            backbone: 'backbone'
            'backbone-modelref': 'backbone-modelref.js'
            _alias:
              underscore: 'lodash'
        no_files_ok: 'test/packaging'
      test:
        command: 'phantomjs'
        runner: 'phantomjs-qunit-runner.js'
        files: '**/*.html'

  postinstall:
    commands: [
      'cp underscore vendor/underscore-latest.js'
      'cp backbone vendor/backbone-latest.js'
    ]