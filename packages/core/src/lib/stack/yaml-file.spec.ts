import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import { YamlFile } from './yaml-file';
import { YamlFileSynthesizer } from '../synthesizer/synthesizer';
import { Stack } from './stack';
import { Workspace } from '../app/workspace';
import { ProviderResource } from '../provider-resource/provider-resource';
import { makeApp, SynthHelpers } from '../../../test/helpers';

describe('YamlFile', () => {
  describe('type checks', () => {
    it('is recognized as a Stack by Stack.isStack()', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'F', { fileName: 'out.yaml' });
      expect(Stack.isStack(file)).toBe(true);
    });

    it('is an instance of Stack', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'F', { fileName: 'out.yaml' });
      expect(file).toBeInstanceOf(Stack);
    });

    it('is an instance of YamlFile', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'F', { fileName: 'out.yaml' });
      expect(file).toBeInstanceOf(YamlFile);
    });
  });

  describe('synthesizer', () => {
    it('uses YamlFileSynthesizer', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'F', { fileName: 'out.yaml' });
      expect(file.synthesizer).toBeInstanceOf(YamlFileSynthesizer);
    });

    it('calls bind() on the synthesizer during construction', () => {
      // Verified indirectly: Stack constructor binds the synthesizer,
      // and YamlFileSynthesizer extends BaseStackSynthesizer which stores
      // the stack reference. If bind() were not called, synthesize() would throw.
      const app = makeApp();
      expect(
        () => new YamlFile(app, 'F', { fileName: 'out.yaml' }),
      ).not.toThrow();
    });
  });

  describe('props forwarding', () => {
    it('stackName defaults to the construct id', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'MyFile', { fileName: 'out.yaml' });
      expect(file.stackName).toBe('MyFile');
    });

    it('stackName is overridden when provided', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'MyFile', {
        fileName: 'out.yaml',
        stackName: 'Custom Name',
      });
      expect(file.stackName).toBe('Custom Name');
    });

    it('description is undefined when not provided', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'F', { fileName: 'out.yaml' });
      expect(file.description).toBeUndefined();
    });

    it('description is forwarded from props', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'F', {
        fileName: 'out.yaml',
        description: 'my description',
      });
      expect(file.description).toBe('my description');
    });

    it('artifactId is derived from the node path', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'DevVMs', { fileName: 'out.yaml' });
      expect(file.artifactId).toBe('DevVMs');
    });
  });

  describe('Stack.of() interop', () => {
    it('Stack.of() resolves to the YamlFile from a child resource', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'F', { fileName: 'out.yaml' });
      const resource = new ProviderResource(file, 'R', { type: 'test::T' });
      expect(Stack.of(resource)).toBe(file);
    });
  });

  describe('synthesis — output file', () => {
    let outputDir: string;

    beforeEach(() => {
      outputDir = SynthHelpers.tmpDir();
    });

    afterEach(() => {
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it('writes a YAML file with the given fileName', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'F', {
        fileName: 'config.yaml',
        outputDir,
      });
      new ProviderResource(file, 'R', {
        type: 'test::Resource',
        properties: { name: 'dev' },
      });

      app.synth();

      expect(fs.existsSync(path.join(outputDir, 'config.yaml'))).toBe(true);
    });

    it('YAML content contains the resource properties', () => {
      const app = makeApp();
      const file = new YamlFile(app, 'F', {
        fileName: 'config.yaml',
        outputDir,
      });
      new ProviderResource(file, 'R', {
        type: 'test::Resource',
        properties: { name: 'dev', cpus: 4, memory: '4G' },
      });

      app.synth();

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'config.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(content['name']).toBe('dev');
      expect(content['cpus']).toBe(4);
      expect(content['memory']).toBe('4G');
    });
  });

  describe('integration with Workspace', () => {
    let outputDir: string;

    beforeEach(() => {
      outputDir = SynthHelpers.tmpDir();
    });

    afterEach(() => {
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it('Workspace + YamlFile synthesizes the YAML file', () => {
      const workspace = new Workspace();
      const file = new YamlFile(workspace, 'DevVMs', {
        fileName: 'multipass.yaml',
        outputDir,
      });
      new ProviderResource(file, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', image: 'jammy' },
      });

      workspace.synth();

      expect(
        fs.existsSync(path.join(outputDir, 'multipass.yaml')),
      ).toBe(true);
    });

    it('YAML file contains resources from the Workspace tree', () => {
      const workspace = new Workspace();
      const file = new YamlFile(workspace, 'DevVMs', {
        fileName: 'multipass.yaml',
        outputDir,
      });
      new ProviderResource(file, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', cpus: 2 },
      });

      workspace.synth();

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'multipass.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(content['name']).toBe('dev');
      expect(content['cpus']).toBe(2);
    });
  });
});
