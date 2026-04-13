import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as yaml from 'js-yaml';
import { YamlFileSynthesizer } from './synthesizer';
import { ProviderResource } from '../provider-resource/provider-resource';
import { Stack } from '../stack/stack';
import { makeApp, makeStack } from '../../../test/helpers';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-yaml-synth-test-'));
}

describe('YamlFileSynthesizer', () => {
  describe('single root resource → one YAML file', () => {
    it('writes a .yaml file named after the resource name property', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', cpus: 2 },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize();

      expect(fs.existsSync(path.join(outputDir, 'dev.yaml'))).toBe(true);
      fs.rmSync(outputDir, { recursive: true });
    });

    it('YAML content contains the resource properties', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', cpus: 2, memory: '2G' },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize();

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'dev.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(content['name']).toBe('dev');
      expect(content['cpus']).toBe(2);
      expect(content['memory']).toBe('2G');
      fs.rmSync(outputDir, { recursive: true });
    });

    it('falls back to logicalId.yaml when no name property', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');
      const resource = new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { cpus: 1 },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize();

      expect(
        fs.existsSync(path.join(outputDir, `${resource.logicalId}.yaml`)),
      ).toBe(true);
      fs.rmSync(outputDir, { recursive: true });
    });

    it('does not register any artifact in the cloud assembly', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = new Stack(app, 'TestStack', {
        synthesizer: new YamlFileSynthesizer({ outputDir }),
      });
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });

      const assembly = app.synth();

      expect(assembly.getStack('TestStack')).toBeUndefined();
      fs.rmSync(outputDir, { recursive: true });
    });
  });

  describe('fileName option overrides derived filename', () => {
    it('uses fileName as the output filename', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });

      const synth = new YamlFileSynthesizer({
        outputDir,
        fileName: 'multipass.yaml',
      });
      synth.bind(stack);
      synth.synthesize();

      expect(fs.existsSync(path.join(outputDir, 'multipass.yaml'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'dev.yaml'))).toBe(false);
      fs.rmSync(outputDir, { recursive: true });
    });

    it('falls back to name-based filename when fileName is not set', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize();

      expect(fs.existsSync(path.join(outputDir, 'dev.yaml'))).toBe(true);
      fs.rmSync(outputDir, { recursive: true });
    });
  });

  describe('root + child → composed YAML', () => {
    it('nests child under pluralised type-name key in parent YAML', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');

      const vm = new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });
      // Network references the VM via a { ref, attr } token — the composition signal
      new ProviderResource(stack, 'Net', {
        type: 'Multipass::VM::Network',
        properties: {
          vmId: vm.getAtt('vmId'),
          name: 'eth0',
          mode: 'auto',
        },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize();

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'dev.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(content['networks']).toBeDefined();
      expect(Array.isArray(content['networks'])).toBe(true);
      const networks = content['networks'] as Record<string, unknown>[];
      expect(networks).toHaveLength(1);
      expect(networks[0]['name']).toBe('eth0');
      expect(networks[0]['mode']).toBe('auto');
      fs.rmSync(outputDir, { recursive: true });
    });

    it('does not produce a separate file for the child resource', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');

      const vm = new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });
      new ProviderResource(stack, 'Net', {
        type: 'Multipass::VM::Network',
        properties: { vmId: vm.getAtt('vmId'), name: 'eth0' },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize();

      const files = fs
        .readdirSync(outputDir)
        .filter((f) => f.endsWith('.yaml'));
      expect(files).toHaveLength(1);
      expect(files[0]).toBe('dev.yaml');
      fs.rmSync(outputDir, { recursive: true });
    });
  });

  describe('root + { ref } whole-object tokens in arrays → composed YAML', () => {
    it('resolves { ref } token in array to the full object of the referenced resource', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');

      const network = new ProviderResource(stack, 'Net', {
        type: 'Multipass::VM::Network',
        properties: { name: 'bridge', mode: 'auto' },
      });
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', networks: [network.ref] },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize();

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'dev.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      const networks = content['networks'] as Record<string, unknown>[];
      expect(Array.isArray(networks)).toBe(true);
      expect(networks).toHaveLength(1);
      expect(networks[0]['name']).toBe('bridge');
      expect(networks[0]['mode']).toBe('auto');
      fs.rmSync(outputDir, { recursive: true });
    });

    it('does not produce a separate file for the referenced resource', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');

      const network = new ProviderResource(stack, 'Net', {
        type: 'Multipass::VM::Network',
        properties: { name: 'bridge', mode: 'auto' },
      });
      new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', networks: [network.ref] },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize();

      const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.yaml'));
      expect(files).toHaveLength(1);
      expect(files[0]).toBe('dev.yaml');
      fs.rmSync(outputDir, { recursive: true });
    });

    it('two resources referencing the same { ref } token both absorb the referenced resource', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');

      const network = new ProviderResource(stack, 'Net', {
        type: 'Multipass::VM::Network',
        properties: { name: 'bridge' },
      });
      new ProviderResource(stack, 'Vm1', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', networks: [network.ref] },
      });
      new ProviderResource(stack, 'Vm2', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'test', networks: [network.ref] },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize();

      const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.yaml'));
      expect(files).toHaveLength(2);
      expect(files.sort()).toEqual(['dev.yaml', 'test.yaml']);

      const dev = yaml.load(
        fs.readFileSync(path.join(outputDir, 'dev.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      const test = yaml.load(
        fs.readFileSync(path.join(outputDir, 'test.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      expect((dev['networks'] as Record<string, unknown>[])[0]['name']).toBe('bridge');
      expect((test['networks'] as Record<string, unknown>[])[0]['name']).toBe('bridge');
      fs.rmSync(outputDir, { recursive: true });
    });

    it('resolves nested { ref } tokens (instance referenced by config)', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');

      const network = new ProviderResource(stack, 'Net', {
        type: 'Multipass::VM::Network',
        properties: { name: 'bridge' },
      });
      const vm = new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev', networks: [network.ref] },
      });
      new ProviderResource(stack, 'Cfg', {
        type: 'Multipass::Compute::Config',
        properties: { instances: [vm.ref] },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize();

      const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.yaml'));
      expect(files).toHaveLength(1);

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, files[0]), 'utf-8'),
      ) as Record<string, unknown>;
      const instances = content['instances'] as Record<string, unknown>[];
      expect(instances).toHaveLength(1);
      expect(instances[0]['name']).toBe('dev');
      const networks = instances[0]['networks'] as Record<string, unknown>[];
      expect(networks[0]['name']).toBe('bridge');
      fs.rmSync(outputDir, { recursive: true });
    });
  });

  describe('filename collision → throws', () => {
    it('throws when two root resources would produce the same filename', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');
      new ProviderResource(stack, 'VmA', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });
      new ProviderResource(stack, 'VmB', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' }, // same name → same filename
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      expect(() => synth.synthesize()).toThrow(/filename collision/);
      fs.rmSync(outputDir, { recursive: true });
    });
  });

  describe('{ ref, attr } token fields excluded from YAML output', () => {
    it('excludes token fields from child YAML content', () => {
      const outputDir = tmpDir();
      const app = makeApp();
      const stack = makeStack(app, 'TestStack');

      const vm = new ProviderResource(stack, 'Vm', {
        type: 'Multipass::VM::Instance',
        properties: { name: 'dev' },
      });
      new ProviderResource(stack, 'Net', {
        type: 'Multipass::VM::Network',
        properties: { vmId: vm.getAtt('vmId'), name: 'eth0' },
      });

      const synth = new YamlFileSynthesizer({ outputDir });
      synth.bind(stack);
      synth.synthesize();

      const content = yaml.load(
        fs.readFileSync(path.join(outputDir, 'dev.yaml'), 'utf-8'),
      ) as Record<string, unknown>;
      const networks = content['networks'] as Record<string, unknown>[];
      // vmId was a token field — must NOT appear in the composed output
      expect(networks[0]['vmId']).toBeUndefined();
      expect(networks[0]['name']).toBe('eth0');
      fs.rmSync(outputDir, { recursive: true });
    });
  });
});
