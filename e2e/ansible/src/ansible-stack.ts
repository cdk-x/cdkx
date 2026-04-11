import { App, IResolvable, Stack } from '@cdk-x/core';
import { AnsInventory, AnsPlay, AnsPlaybook, AnsRole } from '@cdk-x/ansible';

export interface AnsibleStackProps {
  /** Token that resolves to the server IPv4 address at deploy time. */
  readonly serverIp: IResolvable;
}

export class AnsibleStack extends Stack {
  constructor(app: App, props: AnsibleStackProps) {
    super(app, 'Ansible');

    const playbook = new AnsPlaybook(this, 'SitePlaybook', {
      name: 'site',
      become: true,
    });

    new AnsInventory(this, 'WebInventory', {
      name: 'web',
      playbookId: playbook.logicalId,
      hosts: [props.serverIp],
      group: 'web',
      vars: {
        ansible_user: 'root',
        ansible_ssh_private_key_file: '~/.ssh/id_ed25519',
      },
    });

    const play = new AnsPlay(this, 'WebPlay', {
      name: 'Configure web server',
      playbookId: playbook.logicalId,
      hosts: 'web',
      become: true,
      gatherFacts: true,
    });

    new AnsRole(this, 'NginxRole', {
      name: 'geerlingguy.nginx',
      playId: play.logicalId,
      source: 'galaxy',
      version: '3.2.0',
    });
  }
}
