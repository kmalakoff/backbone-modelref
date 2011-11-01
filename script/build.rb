# Run me with: 'ruby script/build.rb'
require 'rubygems'
PROJECT_ROOT = File.expand_path('../..', __FILE__)

####################################################
# Backbone-ModelRef Library
####################################################
`cd #{PROJECT_ROOT}; coffee -b -o . -c #{PROJECT_ROOT}/src`

####################################################
# Tests
####################################################
`cd #{PROJECT_ROOT}; coffee -b -o test/build -c test`
