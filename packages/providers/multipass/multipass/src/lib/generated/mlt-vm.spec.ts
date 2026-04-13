import { IResolvable, YamlFileSynthesizer } from '@cdk-x/core';
import { TestApp, TestStack } from '@cdk-x/testing';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import {
  MltConfig,
  MltInstance,
  MltMount,
  MltNetwork,
  MltProvider,
} from '../../index';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-mlt-test-'));
}

describe('MltInstance', () => {
  describe('props and attributes', () => {
    it('accepts required name prop', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const vm = new MltInstance(stack, 'Vm', { name: 'dev' });
      expect(vm.name).toBe('dev');
    });

    it('accepts all optional props', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const vm = new MltInstance(stack, 'Vm', {
        name: 'dev',
        image: '22.04',
        cpus: 4,
        memory: '4G',
        disk: '40G',
        bridged: true,
        timeout: 300,
      });

      expect(vm.image).toBe('22.04');
      expect(vm.cpus).toBe(4);
      expect(vm.memory).toBe('4G');
      expect(vm.disk).toBe('40G');
      expect(vm.bridged).toBe(true);
      expect(vm.timeout).toBe(300);
    });

    it('exposes attrVmId as IResolvable', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const vm = new MltInstance(stack, 'Vm', { name: 'dev' });
      expect(vm.attrVmId).toBeDefined();
      expect(typeof (vm.attrVmId as IResolvable).resolve).toBe('function');
    });

    it('has the correct RESOURCE_TYPE_NAME', () => {
      expect(MltInstance.RESOURCE_TYPE_NAME).toBe(
        'Multipass::Compute::Instance',
      );
    });
  });

  describe('YAML synthesis via YamlFileSynthesizer', () => {
    it('writes a YAML file named after the VM name', () => {
      const outputDir = tmpDir();
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {
        synthesizer: new YamlFileSynthesizer({ outputDir }),
      });
      new MltInstance(stack, 'Vm', { name: 'dev', cpus: 2, memory: '2G' });

      app.synth();

      expect(fs.existsSync(path.join(outputDir, 'dev.yaml'))).toBe(true);
      fs.rmSync(outputDir, { recursive: true });
    });

    it('YAML content contains the VM properties', () => {
      const outputDir = tmpDir();
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {
        synthesizer: new YamlFileSynthesizer({ outputDir }),
      });
      new MltInstance(stack, 'Vm', {
        name: 'dev',
        image: 'jammy',
        cpus: 2,
        memory: '2G',
        disk: '20G',
      });

      app.synth();

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'dev.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(content['name']).toBe('dev');
      expect(content['image']).toBe('jammy');
      expect(content['cpus']).toBe(2);
      expect(content['memory']).toBe('2G');
      expect(content['disk']).toBe('20G');
      fs.rmSync(outputDir, { recursive: true });
    });

    it('fileName option overrides the output filename', () => {
      const outputDir = tmpDir();
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {
        synthesizer: new YamlFileSynthesizer({
          outputDir,
          fileName: 'multipass.yaml',
        }),
      });
      new MltInstance(stack, 'Vm', { name: 'dev' });

      app.synth();

      expect(fs.existsSync(path.join(outputDir, 'multipass.yaml'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'dev.yaml'))).toBe(false);
      fs.rmSync(outputDir, { recursive: true });
    });

    it('MltProvider.identifier is "multipass"', () => {
      const provider = new MltProvider();
      expect(provider.identifier).toBe('multipass');
    });
  });

  describe('MltNetwork', () => {
    it('is importable with correct props', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const net = new MltNetwork(stack, 'Net', { name: 'bridge', mode: 'auto' });
      expect(net.name).toBe('bridge');
      expect(net.mode).toBe('auto');
      expect(MltNetwork.RESOURCE_TYPE_NAME).toBe('Multipass::VM::Network');
    });
  });

  describe('MltMount', () => {
    it('is importable with correct props', () => {
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {});
      const mount = new MltMount(stack, 'Mnt', {
        source: '/Users/antonio/code',
        target: '/home/ubuntu/code',
      });
      expect(mount.source).toBe('/Users/antonio/code');
      expect(mount.target).toBe('/home/ubuntu/code');
      expect(MltMount.RESOURCE_TYPE_NAME).toBe('Multipass::VM::Mount');
    });
  });

  describe('composition end-to-end', () => {
    it('VM + network + mount → single YAML with networks and mounts nested', () => {
      const outputDir = tmpDir();
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {
        synthesizer: new YamlFileSynthesizer({ outputDir }),
      });

      const net = new MltNetwork(stack, 'Net', { name: 'bridge', mode: 'auto' });
      const mount = new MltMount(stack, 'Mnt', {
        source: '/Users/antonio/code',
        target: '/home/ubuntu/code',
      });
      new MltInstance(stack, 'Vm', {
        name: 'dev',
        cpus: 4,
        memory: '8G',
        disk: '40G',
        networks: [net.ref],
        mounts: [mount.ref],
      });

      app.synth();

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'dev.yaml'), 'utf-8'),
      ) as Record<string, unknown>;

      expect(content['name']).toBe('dev');
      expect(content['cpus']).toBe(4);

      const networks = content['networks'] as Record<string, unknown>[];
      expect(Array.isArray(networks)).toBe(true);
      expect(networks).toHaveLength(1);
      expect(networks[0]['name']).toBe('bridge');
      expect(networks[0]['mode']).toBe('auto');

      const mounts = content['mounts'] as Record<string, unknown>[];
      expect(Array.isArray(mounts)).toBe(true);
      expect(mounts).toHaveLength(1);
      expect(mounts[0]['source']).toBe('/Users/antonio/code');
      expect(mounts[0]['target']).toBe('/home/ubuntu/code');

      fs.rmSync(outputDir, { recursive: true });
    });

    it('only one YAML file is produced (network and mount are absorbed)', () => {
      const outputDir = tmpDir();
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {
        synthesizer: new YamlFileSynthesizer({ outputDir }),
      });

      const net = new MltNetwork(stack, 'Net', { name: 'bridge' });
      const mount = new MltMount(stack, 'Mnt', { source: '/code' });
      new MltInstance(stack, 'Vm', {
        name: 'dev',
        networks: [net.ref],
        mounts: [mount.ref],
      });

      app.synth();

      const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.yaml'));
      expect(files).toEqual(['dev.yaml']);
      fs.rmSync(outputDir, { recursive: true });
    });

    it('same network referenced by two VMs appears in both YAMLs', () => {
      const outputDir = tmpDir();
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {
        synthesizer: new YamlFileSynthesizer({ outputDir }),
      });

      const net = new MltNetwork(stack, 'Net', { name: 'bridge' });
      new MltInstance(stack, 'Vm1', { name: 'dev', networks: [net.ref] });
      new MltInstance(stack, 'Vm2', { name: 'test', networks: [net.ref] });

      app.synth();

      const dev = yaml.load(
        fs.readFileSync(path.join(outputDir, 'dev.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      const test = yaml.load(
        fs.readFileSync(path.join(outputDir, 'test.yaml'), 'utf-8'),
      ) as Record<string, unknown>;

      expect((dev['networks'] as Record<string, unknown>[])[0]['name']).toBe('bridge');
      expect((test['networks'] as Record<string, unknown>[])[0]['name']).toBe('bridge');

      const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.yaml'));
      expect(files.sort()).toEqual(['dev.yaml', 'test.yaml']);
      fs.rmSync(outputDir, { recursive: true });
    });

    it('MltConfig with instances produces a single file with nested VMs', () => {
      const outputDir = tmpDir();
      const app = new TestApp();
      const stack = new TestStack(app, 'S', {
        synthesizer: new YamlFileSynthesizer({
          outputDir,
          fileName: 'multipass.yaml',
        }),
      });

      const net = new MltNetwork(stack, 'Net', { name: 'bridge', mode: 'auto' });
      const vm = new MltInstance(stack, 'Vm', {
        name: 'dev',
        cpus: 4,
        networks: [net.ref],
      });
      new MltConfig(stack, 'Cfg', { instances: [vm.ref] });

      app.synth();

      const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.yaml'));
      expect(files).toEqual(['multipass.yaml']);

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'multipass.yaml'), 'utf-8'),
      ) as Record<string, unknown>;

      const instances = content['instances'] as Record<string, unknown>[];
      expect(instances).toHaveLength(1);
      expect(instances[0]['name']).toBe('dev');
      expect(instances[0]['cpus']).toBe(4);

      const networks = instances[0]['networks'] as Record<string, unknown>[];
      expect(networks[0]['name']).toBe('bridge');
      expect(networks[0]['mode']).toBe('auto');
      fs.rmSync(outputDir, { recursive: true });
    });
  });
});
