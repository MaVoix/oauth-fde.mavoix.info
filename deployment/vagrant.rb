#!/usr/bin/env ruby

require 'digest/md5'
require 'fileutils'

module Vagrant
  module AutoConfigure

    DIRECTORY_MAPPING = {
      "." => {
        :dest => "/vagrant",
        :mountOptions => []
      }
    }

    class DestroyVBoxData
      def initialize(app, env)
        @app = app
      end

      def call(env)
        @env = env

        FileUtils.rm_rf(File.join(
          env[:machine].provider.driver.read_machine_folder,
          env[:machine].provider_config.name
        ).sub('\\', '/'))

        @app.call(env)
      end
    end

    class AutoConfigurePlugin < Vagrant.plugin('2')
      name 'auto_configure_plugin'

      # We create our own VDI file to be able to setup a drive with a custom file.
      # As a result, this VDI file is not removed by the VirtualBox provisioner
      # and the VM data directory that contains it is left over.
      # Two problems:
      # * this unused VDI file will use disk space for nothing;
      # * trying to create the machine again will fail because the directory
      #   already exists.
      # We use the ProviderVirtualBox::Action::Destroy hook to destroy that
      # directory and the VDI file inside of it.
      action_hook("remove VM directory", :machine_action_destroy) do |hook|
        hook.after(VagrantPlugins::ProviderVirtualBox::Action::Destroy, DestroyVBoxData)
      end

      Vagrant.define_singleton_method(:autoconfigure) do |inventory|
        Vagrant.configure('2') do |config|
          AutoConfigure::install_plugins([
            "vagrant-cachier",
            "vagrant-managed-servers",
            "vagrant-triggers",
            "vagrant-vbguest"
          ])

          inventory.each do |key, value|
            value[:provider] = "virtualbox" if not value.key?(:provider)
            value[:box] = "ubuntu/trusty64" if not value.key?(:box)
            value[:memory] = 4096 if not value.key?(:memory)
            value[:skipTags] = [] if not value.key?(:skipTags)
            AutoConfigure::send("define_#{value[:provider]}", config, key.to_s, value)
          end
        end
      end
    end

    def self.install_plugins(plugins)
      should_restart = false

      plugins.each do |plugin|
        unless Vagrant.has_plugin? plugin
          system "vagrant plugin install #{plugin}"
          should_restart = true
        end
      end

      if should_restart
        puts "Plugins were installed. Please run the Vagrant command again if there's an error."
      end
    end

    def self.provision_with_ansible(config, name, params)
      script_path = "deployment/ansible.sh"

      script = <<-SH
        export PLAYBOOK=provisioning/provision.yml
        export INVENTORY=provisioning/inventory
        export LIMIT=#{name}
        export SKIP_TAGS=#{params[:skipTags].join(",")}
        export VERBOSE=#{if !params[:verbose] then "vvv" else "v" * params[:verbose] end}
        export PROVIDER=#{params[:provider]}

        cd /vagrant
        source #{script_path}
      SH

      config.vm.provision :shell, :inline => script
    end

    def self.define_managed(config, name, params)
      # Workaround for https://github.com/tknerr/vagrant-managed-servers/issues/34
      return unless ARGV.include?(name)

      config.vm.define name, autostart: false do |config|
        config.vm.box = "tknerr/managed-server-dummy"

        config.vm.hostname = params[:vars][:hostname]

        config.vm.provider :managed do |managed, override|
          managed.server = params[:hosts][0] # FIXME: Deal with multiple hosts.

          override.ssh.username = params[:vars][:ansible_ssh_user]
          override.ssh.private_key_path = params[:vars][:ansible_ssh_private_key_file]
          if (params[:vars].key?(:ansible_ssh_port))
            override.ssh.port = params[:vars][:ansible_ssh_port]
          end
        end

        DIRECTORY_MAPPING.merge(params[:sharedFolders]).each {
          |src, dest|

          src = "#{src}"

          if (src && File.exist?(src))
            config.vm.synced_folder src, dest[:dest], mount_options: dest[:mountOptions], type: 'rsync', rsync__args: ["--verbose", "--archive", "--delete", "-z"]
          end
        }

        self.provision_with_ansible config, name, params
      end
    end

    def self.define_virtualbox(config, name, params)
      config.vm.define name, primary: true do |config|
        config.vm.box = params[:box]

        # Read the first host in the list. Might support multiple hosts in the future.
        config.vm.network :private_network, ip: params[:hosts][0]

        config.vm.hostname = params[:vars][:hostname]

        # Fix for slow networking on CentOS boxes
        # https://github.com/mitchellh/vagrant/issues/1172
        if (config.vm.box.include?('centos'))
          config.vm.provision :shell, inline: "if [ ! $(grep single-request-reopen /etc/sysconfig/network) ]; then echo RES_OPTIONS=single-request-reopen >> /etc/sysconfig/network && service network restart; fi"
        end

        config.vm.provider :virtualbox do |vbox, override|
          vbox.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
          vbox.customize ["guestproperty", "set", :id, "/VirtualBox/GuestAdd/VBoxService/--timesync-set-threshold", 10000]
          vbox.customize ["modifyvm", :id, "--natdnshostresolver1", "off"]
          vbox.customize ["modifyvm", :id, "--natdnsproxy1", "off"]
          vbox.customize ["modifyvm", :id, "--memory", params[:memory]]
          vbox.customize ["modifyvm", :id, "--cpus", 2]
          vbox.customize ["modifyvm", :id, "--ioapic", "on"]
          vbox.customize ["modifyvm", :id, "--rtcuseutc", "on"]

          # Increase the max size of the hard drive
          vm_path = `"#{self.get_vboxmanage_path()}" list systemproperties`
            .split("\n").select{ |i| i.include? "machine folder" }[0][33..-1]
            .gsub('\\', '/')
          hash = Digest::MD5.hexdigest(name + '@' + Dir.pwd)
          vbox.name = "#{File.basename(Dir.pwd)}_#{name}_#{hash}"

          if !File.file?("#{vm_path}/#{vbox.name}/box-disk1.vdi")
            vbox.customize [
              "storagectl", :id,
              "--name", "SATAController",
              "--controller", "IntelAHCI",
              "--portcount", "1",
              "--hostiocache", "on"
            ]
            vbox.customize [
              "clonehd", "#{vm_path}/#{vbox.name}/box-disk1.vmdk",
                         "#{vm_path}/#{vbox.name}/box-disk1.vdi",
              "--format", "VDI"
            ]
            vbox.customize [
              "modifyhd", "#{vm_path}/#{vbox.name}/box-disk1.vdi",
              "--resize", 100 * 1024 # size in megabytes
            ]
            vbox.customize [
              "storageattach", :id,
              "--storagectl", "SATAController",
              "--port", "0",
              "--device", "0",
              "--type", "hdd",
              "--nonrotational", "on",
              "--medium", "#{vm_path}/#{vbox.name}/box-disk1.vdi"
            ]
          end

          # Resolve "stdin: is not a tty" errors.
          # Disabling because it breaks `vagrant ssh -c COMMAND`.
          # override.ssh.shell = "bash -c 'BASH_ENV=/etc/profile exec bash'"
        end

        DIRECTORY_MAPPING.merge(params[:sharedFolders]).each {
          |src, dest|

          src = "#{src}"

          if (src && File.exist?(src))
            config.vm.synced_folder src, dest[:dest], mount_options: dest[:mountOptions]
          end
        }

        self.provision_with_ansible config, name, params

        config.vm.post_up_message = "Please add this line to your /etc/hosts:\n" +
        "#{params[:hosts][0]} #{params[:vars][:hostname]}"

        if Vagrant.has_plugin?("vagrant-cachier")
          config.cache.scope = :box
        end
      end
    end

    def self.define_docker(config, name, params)
      return unless ARGV.include?(name)

      export_path = "../docker-image/#{params[:vars][:hostname]}.tar"
      script_path = "deployment/ansible.sh"

      config.trigger.before :up, :vm => name do |trigger|
        if not File.exist? export_path
          data = { "provisioners" => [] }

          DIRECTORY_MAPPING.merge(params[:sharedFolders]).each {
            |src, dest|

            src = "#{src}"

            data["provisioners"].push({
              :type => "file",
              :source => (Pathname.new(src).absolute? ? "#{src}/" : "{{ pwd }}/#{src}/"),
              :destination => dest[:dest]
            }) if src && File.exist?(src)
          }

          data["provisioners"].push({
            :type => "shell",
            :environment_vars => [
              "PLAYBOOK=provisioning/provision.yml",
              "INVENTORY=provisioning/inventory",
              "LIMIT=#{name}",
              "SKIP_TAGS=#{params[:skipTags].join(",")}",
              "VERBOSE=vvv",
              "PROVIDER=#{params[:provider]}"
            ],
            :script => script_path
          })

          docker_image_mapping = {
            "ubuntu/trusty64" => "ubuntu:14.04",
          }

          raise "Unsupported box for Docker: #{params[:box]}" unless docker_image_mapping.key?(params[:box])

          data["builders"] = [{
            :type => "docker",
            :image => docker_image_mapping[params[:box]],
            :export_path => export_path,
            :run_command => [
              "--add-host=#{params[:vars][:hostname]}:127.0.0.1",
              "-d", "-i", "-t", "{{.Image}}", "/bin/bash"
            ]
          }]

          data["post-processors"] = [{
            :type => "docker-import",
            :tag => "latest",
            :keep_input_artifact => true
          }]

          Vagrant::AutoConfigure::write(data, "provisioning/generated/packer.json")

          `mkdir -p $(dirname #{export_path})`

          system "packer build provisioning/generated/packer.json"
        end
      end

      config.vm.define name, autostart: false do |config|
        config.vm.network :forwarded_port, guest: 80, host: 80
        config.vm.network :forwarded_port, guest: 443, host: 443

        config.vm.hostname = params[:vars][:hostname]

        config.vm.provider :docker do |d|
          d.image = "ubuntu:14.04"
          d.cmd = ["bash"]
          d.create_args = ["--add-host=#{params[:vars][:hostname]}:127.0.0.1"]
        end
      end
    end

    def self.write(inventory, filename)
      require 'fileutils'

      FileUtils.mkdir_p(File.dirname(filename))

      File.open(filename, "w") do |f|
        f.write(JSON.pretty_generate(inventory))
      end
    end

    def self.symbolize_keys_deep!(h)
        h.keys.each do |k|
            ks    = k.to_sym
            h[ks] = h.delete k
            symbolize_keys_deep! h[ks] if h[ks].kind_of? Hash
        end
    end

    # https://github.com/mitchellh/vagrant/blob/master/plugins/providers/virtualbox/driver/base.rb
    def self.get_vboxmanage_path()
      if Vagrant::Util::Platform.windows? || Vagrant::Util::Platform.cygwin?
        vboxmanage_path = Vagrant::Util::Which.which("VBoxManage")

        # On Windows, we use the VBOX_INSTALL_PATH environmental
        # variable to find VBoxManage.
        if !vboxmanage_path && (ENV.key?("VBOX_INSTALL_PATH") ||
          ENV.key?("VBOX_MSI_INSTALL_PATH"))

          # Get the path.
          path = ENV["VBOX_INSTALL_PATH"] || ENV["VBOX_MSI_INSTALL_PATH"]

          # There can actually be multiple paths in here, so we need to
          # split by the separator ";" and see which is a good one.
          path.split(";").each do |single|
            # Make sure it ends with a \
            single += "\\" if !single.end_with?("\\")

            # If the executable exists, then set it as the main path
            # and break out
            vboxmanage = "#{single}VBoxManage.exe"
            if File.file?(vboxmanage)
              vboxmanage_path = Vagrant::Util::Platform.cygwin_windows_path(vboxmanage)
              break
            end
          end
        end

        # If we still don't have one, try to find it using common locations
        drive = ENV["SYSTEMDRIVE"] || "C:"
        [
          "#{drive}/Program Files/Oracle/VirtualBox",
          "#{drive}/Program Files (x86)/Oracle/VirtualBox",
          "#{ENV["PROGRAMFILES"]}/Oracle/VirtualBox"
        ].each do |maybe|
          path = File.join(maybe, "VBoxManage.exe")
          if File.file?(path)
            vboxmanage_path = path
            break
          end
        end
      end

      # Fall back to hoping for the PATH to work out
      vboxmanage_path ||= "VBoxManage"

      return vboxmanage_path
    end

  end

end
