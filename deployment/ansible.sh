#!/bin/bash

shopt -s nullglob

echo PLAYBOOK=${PLAYBOOK}
echo INVENTORY=${INVENTORY}
echo LIMIT=${LIMIT}
echo SKIP_TAGS=${SKIP_TAGS}
echo VERBOSE=${VERBOSE}
echo PROVIDER=${PROVIDER}

test -z "${PLAYBOOK}" || test -z "${INVENTORY}" || test -z "${LIMIT}"  || test -z "${PROVIDER}" && {
    echo "Environment variables not set." > /dev/stderr
    exit 1
}

ROOT=/vagrant

test -d "${ROOT}" || {
    echo "Invalid root directory '${ROOT}'" > /dev/stderr
    exit 1
}

cd ${ROOT}

# Fix output buffering and colors.
export PYTHONUNBUFFERED=1
export ANSIBLE_FORCE_COLOR=true
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Check internet.
test -x /bin/ping && {
    ping -q -c 1 google.com > /dev/null
    if [ "$?" != 0 ]; then
        echo "No internet connectivity!" > /dev/stderr
        # exit 1
    fi
}

# Install Ansible locally.
if [ ! -x /usr/bin/ansible-playbook ]; then
    echo "Installing Ansible."

    if [ -f /etc/debian_version ]; then
        export DEBIAN_FRONTEND=noninteractive
        rm -rf /var/lib/apt/lists/*
        apt-get update -qq
        apt-get install -qq -y software-properties-common apt-transport-https
        apt-add-repository ppa:fkrull/deadsnakes-python2.7 2>&1 >/dev/null
        # apt-add-repository ppa:ansible/ansible 2>&1 >/dev/null
        apt-get update -qq
        # Ansible 2.0.2.0 breaks the URI module, and PPA doesn't provide old versions.
        apt-get install -qq -y wget python2.7 python-six python-support python-jinja2 python-paramiko python-markupsafe python-setuptools python-yaml python-httplib2 sshpass
        wget http://releases.ansible.com/ansible-network/2.0.1.0-0.1/ansible_2.0.1.0-0.1.networkppa~trusty_all.deb -O /tmp/ansible.deb --quiet
        dpkg -i /tmp/ansible.deb
    elif [ -f /etc/redhat-release ]; then
        VERSION=`. /etc/os-release ; echo $VERSION_ID`
        VERSION_MAJOR=`echo $VERSION | cut -d '.' -f 1`
        VERSION_MINOR=`echo $VERSION | cut -d '.' -f 2`

        if [ $VERSION_MAJOR == '6' ]; then
            # rpm -Uvh http://download.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
            # yum install centos-release-SCL -y
            # Ansible 2.0.2.0 breaks the URI module.
            yum install -y python27 libselinux-python python-crypto2.6 python-keyczar python-six python-jinja2 python-paramiko python-markupsafe python-setuptools python-yaml python-httplib2 sshpass
            rpm -Uvh http://releases.ansible.com/ansible-network/2.0.1.0-0.1/ansible-2.0.1.0-0.1.network.el6.noarch.rpm
        elif [ $VERSION_MAJOR == '7' ]; then
            yum install -y python27 libselinux-python python-crypto python-keyczar python-six python-jinja2 python-paramiko python-markupsafe python-setuptools python-yaml python-httplib2 sshpass
            rpm -Uvh https://releases.ansible.com/ansible-network/2.0.1.0-0.1/ansible-2.0.1.0-0.1.network.el7.centos.noarch.rpm
        fi
    fi
fi

# Show versions.
ansible --version 2> /dev/null | head -n1
python --version 2>&1

# Make sure Ansible playbook exists.
if [ ! -f ${PLAYBOOK} ]; then
    echo "Cannot find Ansible playbook."
    exit 1
fi

# Mark inventory scripts as executable (otherwise Ansible treats them differently).
chmod +x ${INVENTORY}/*.sh

ansible-galaxy install -r provisioning/requirements.yml

# Run the playbook.
echo "Running Ansible provisioner defined in Vagrantfile."
ansible-playbook ${PLAYBOOK} -i provisioning/inventory --extra-vars "provider=${PROVIDER} limit=${LIMIT}" --connection=local ${LIMIT:+--limit=$LIMIT} ${SKIP_TAGS:+--skip-tags=$SKIP_TAGS} ${VERBOSE:+-$VERBOSE}
