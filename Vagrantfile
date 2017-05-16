#!/usr/bin/env ruby

ENV['MINKO_CLOUD_HOME'] = Dir.pwd

require './deployment/vagrant.rb'

hosts = JSON.parse(File.read('hosts.json'))
Vagrant::AutoConfigure.symbolize_keys_deep!(hosts)

Vagrant.autoconfigure(hosts)
