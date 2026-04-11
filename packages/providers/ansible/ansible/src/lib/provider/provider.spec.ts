import { App, Stack } from '@cdk-x/core';
import { SynthHelpers } from '@cdk-x/testing';
import { HtzServer, ServerType } from '@cdk-x/hetzner';
import { AnsibleProvider } from './provider';
import { AnsInventory, AnsPlay, AnsPlaybook, AnsRole, AnsTask } from '../generated';

describe('AnsibleProvider', () => {
  it('has identifier "ansible"', () => {
    const provider = new AnsibleProvider();

    expect(provider.identifier).toBe('ansible');
  });

  it('serializes AnsRole source and version in the JSON manifest', () => {
    const app = new App({ outdir: SynthHelpers.tmpDir() });
    const stack = new Stack(app, 'AnsStack');

    const play = new AnsPlay(stack, 'MyPlay', {
      name: 'common',
      playbookId: 'some-playbook-id',
      hosts: 'all',
    });
    new AnsRole(stack, 'MyRole', {
      name: 'nginx',
      playId: play.logicalId,
      source: 'galaxy',
      version: '1.2.3',
    });

    const snapshot = SynthHelpers.synthSnapshot(app, 'AnsStack');
    const resources = SynthHelpers.resourceValues(snapshot);
    const role = resources.find((r) => r.type === 'Ansible::Content::Role');

    expect(role).toBeDefined();
    expect(role!.properties['source']).toBe('galaxy');
    expect(role!.properties['version']).toBe('1.2.3');
  });

  it('serializes AnsInventory hosts array in the JSON manifest', () => {
    const app = new App({ outdir: SynthHelpers.tmpDir() });
    const stack = new Stack(app, 'AnsStack');

    new AnsInventory(stack, 'MyInventory', {
      name: 'prod',
      playbookId: 'some-playbook-id',
      hosts: ['10.0.0.1', '10.0.0.2'],
    });

    const snapshot = SynthHelpers.synthSnapshot(app, 'AnsStack');
    const resources = SynthHelpers.resourceValues(snapshot);
    const inventory = resources.find(
      (r) => r.type === 'Ansible::Inventory::Inventory',
    );

    expect(inventory).toBeDefined();
    expect(inventory!.properties['hosts']).toEqual(['10.0.0.1', '10.0.0.2']);
  });

  it('serializes AnsInventory hosts as a cross-resource ref token', () => {
    const app = new App({ outdir: SynthHelpers.tmpDir() });
    const stack = new Stack(app, 'AnsStack');

    const server = new HtzServer(stack, 'MyServer', {
      name: 'web-01',
      serverType: ServerType.CX22,
      image: 'ubuntu-24.04',
    });
    const playbook = new AnsPlaybook(stack, 'MyPlaybook', { name: 'site' });
    new AnsInventory(stack, 'MyInventory', {
      name: 'prod',
      playbookId: playbook.logicalId,
      hosts: [server.attrPublicIpv4],
    });

    const snapshot = SynthHelpers.synthSnapshot(app, 'AnsStack');
    const resources = SynthHelpers.resourceValues(snapshot);
    const inventory = resources.find(
      (r) => r.type === 'Ansible::Inventory::Inventory',
    );

    expect(inventory).toBeDefined();
    const hosts = inventory!.properties['hosts'] as unknown[];
    expect(hosts).toHaveLength(1);
    expect(hosts[0]).toEqual({ ref: server.logicalId, attr: 'publicIpv4' });
  });

  it('produces dependsOn when task2 depends on task1', () => {
    const app = new App({ outdir: SynthHelpers.tmpDir() });
    const stack = new Stack(app, 'AnsStack');

    const play = new AnsPlay(stack, 'MyPlay', {
      name: 'common',
      playbookId: 'some-id',
      hosts: 'all',
    });
    const task1 = new AnsTask(stack, 'Task1', {
      name: 'install nginx',
      playId: play.logicalId,
      module: 'apt',
    });
    const task2 = new AnsTask(stack, 'Task2', {
      name: 'start nginx',
      playId: play.logicalId,
      module: 'service',
    });
    task2.addDependency(task1);

    const snapshot = SynthHelpers.synthSnapshot(app, 'AnsStack');
    const resources = snapshot['resources'] as Record<
      string,
      { type: string; dependsOn?: string[] }
    >;
    const task2Entry = resources[task2.logicalId];

    expect(task2Entry.dependsOn).toContain(task1.logicalId);
  });

  it('allows cross-provider dependency from AnsPlaybook to HtzServer', () => {
    const app = new App({ outdir: SynthHelpers.tmpDir() });
    const stack = new Stack(app, 'AnsStack');

    const server = new HtzServer(stack, 'MyServer', {
      name: 'web-01',
      serverType: ServerType.CX22,
      image: 'ubuntu-24.04',
    });
    const playbook = new AnsPlaybook(stack, 'MyPlaybook', { name: 'site' });

    expect(() => playbook.addDependency(server)).not.toThrow();
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
