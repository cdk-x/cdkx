import { IResolvable, YamlFileSynthesizer } from '@cdk-x/core';
import { TestApp, TestStack } from '@cdk-x/testing';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import { MltInstance, MltProvider } from '../../index';

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
});
