import { App, Stack } from '@cdk-x/core';
import { SynthHelpers } from '@cdk-x/testing';
import { AnsibleProvider } from './provider';
import { AnsPlay, AnsPlaybook, AnsTask } from '../generated';

describe('AnsibleProvider', () => {
  it('has identifier "ansible"', () => {
    const provider = new AnsibleProvider();

    expect(provider.identifier).toBe('ansible');
  });

  it('synthesizes a stack with playbook, play and two tasks', () => {
    const app = new App({ outdir: SynthHelpers.tmpDir() });
    const stack = new Stack(app, 'AnsStack');

    const playbook = new AnsPlaybook(stack, 'MyPlaybook', { name: 'site' });
    const play = new AnsPlay(stack, 'MyPlay', {
      name: 'common',
      playbookId: playbook.logicalId,
      hosts: 'all',
    });
    new AnsTask(stack, 'Task1', {
      name: 'install nginx',
      playId: play.logicalId,
      module: 'apt',
    });
    new AnsTask(stack, 'Task2', {
      name: 'start nginx',
      playId: play.logicalId,
      module: 'service',
    });

    const snapshot = SynthHelpers.synthSnapshot(app, 'AnsStack');
    const resources = SynthHelpers.resourceValues(snapshot);

    expect(resources).toHaveLength(4);
    expect(
      resources.map((r) => r.type).sort(),
    ).toEqual([
      'Ansible::Content::Task',
      'Ansible::Content::Task',
      'Ansible::Execution::Play',
      'Ansible::Execution::Playbook',
    ]);
  });
});
