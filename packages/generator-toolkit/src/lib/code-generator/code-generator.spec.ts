import type { IrComponentNode, IrResourceNode } from '../ir/ir.js';
import { CodeGenerator } from './code-generator.js';

const baseResource: IrResourceNode = {
  resourceType: 'Workflow',
  apiVersion: 'github.cdk-x.com/v1',
  mode: 'synth-only',
  properties: [
    {
      name: 'name',
      type: { shape: 'primitive', primitive: 'string' },
      required: false,
    },
  ],
};

describe('CodeGenerator', () => {
  it('generates an import header and a Resource class with resourceType/apiVersion set', () => {
    const source = CodeGenerator.generate(baseResource, []);

    expect(source).toContain(
      "import { Component, Resource } from '@cdk-x/core';",
    );
    expect(source).toContain("import { Construct } from 'constructs';");
    expect(source).toContain('export class Workflow extends Resource {');
    expect(source).toContain("public readonly resourceType = 'Workflow';");
    expect(source).toContain(
      "public readonly apiVersion = 'github.cdk-x.com/v1';",
    );
  });

  it('generates an optional props interface member and a "= {}" default for an all-optional props object', () => {
    const source = CodeGenerator.generate(baseResource, []);

    expect(source).toContain('export interface WorkflowProps {');
    expect(source).toContain('readonly name?: string;');
    expect(source).toContain(
      'constructor(scope: Construct, id: string, props: WorkflowProps = {}) {',
    );
    expect(source).toContain('this.name = props.name;');
  });

  it('omits the "= {}" default and makes the member non-optional when a property is required', () => {
    const resource: IrResourceNode = {
      ...baseResource,
      properties: [
        {
          name: 'name',
          type: { shape: 'primitive', primitive: 'string' },
          required: true,
        },
      ],
    };

    const source = CodeGenerator.generate(resource, []);

    expect(source).toContain('readonly name: string;');
    expect(source).toContain('public name: string;');
    expect(source).toContain(
      'constructor(scope: Construct, id: string, props: WorkflowProps) {',
    );
  });

  it('omits the props parameter entirely when there are no properties', () => {
    const resource: IrResourceNode = { ...baseResource, properties: [] };

    const source = CodeGenerator.generate(resource, []);

    expect(source).toContain('export interface WorkflowProps {}');
    expect(source).toContain('constructor(scope: Construct, id: string) {');
  });

  it('generates a Component class with no resourceType/apiVersion', () => {
    const component: IrComponentNode = {
      name: 'Step',
      properties: [
        {
          name: 'run',
          type: { shape: 'primitive', primitive: 'string' },
          required: false,
        },
      ],
    };

    const source = CodeGenerator.generate(baseResource, [component]);

    expect(source).toContain('export class Step extends Component {');
    expect(source).not.toMatch(
      /class Step extends Component \{[^}]*resourceType/,
    );
  });

  it('renames a non-identifier property to camelCase for the class member while keeping the original key in the props interface', () => {
    const resource: IrResourceNode = {
      ...baseResource,
      properties: [
        {
          name: 'runs-on',
          type: { shape: 'primitive', primitive: 'string' },
          required: false,
        },
      ],
    };

    const source = CodeGenerator.generate(resource, []);

    expect(source).toContain("readonly 'runs-on'?: string;");
    expect(source).toContain('public runsOn?: string;');
    expect(source).toContain("this.runsOn = props['runs-on'];");
    expect(source).toContain("'runs-on': this.runsOn,");
  });

  it('renames a class member that collides with an inherited Construct/Resource/Component name, keeping the original key everywhere else', () => {
    const resource: IrResourceNode = {
      ...baseResource,
      properties: [
        {
          name: 'with',
          type: {
            shape: 'record',
            valueType: { shape: 'primitive', primitive: 'string' },
          },
          required: false,
        },
      ],
    };

    const source = CodeGenerator.generate(resource, []);

    expect(source).toContain('readonly with?: Record<string, string>;');
    expect(source).toContain('public withValue?: Record<string, string>;');
    expect(source).toContain('this.withValue = props.with;');
    expect(source).toContain('with: this.withValue,');
  });

  it('assembles an array-collection component-ref via a Component.isComponent() filter, with no per-class instanceof', () => {
    const resource: IrResourceNode = {
      ...baseResource,
      properties: [
        {
          name: 'steps',
          type: { shape: 'component-ref', target: 'Step', collection: 'array' },
          required: false,
        },
      ],
    };

    const source = CodeGenerator.generate(resource, []);

    expect(source).toContain('export interface WorkflowProps {}');
    expect(source).toContain('this.node.children');
    expect(source).toContain('.filter(Component.isComponent)');
    expect(source).toContain('.map((child) => child._toProperties());');
    expect(source).toContain('steps: steps,');
    expect(source).not.toMatch(/instanceof/);
  });

  it('assembles a map-collection component-ref keyed by node.id', () => {
    const resource: IrResourceNode = {
      ...baseResource,
      properties: [
        {
          name: 'jobs',
          type: { shape: 'component-ref', target: 'Job', collection: 'map' },
          required: false,
        },
      ],
    };

    const source = CodeGenerator.generate(resource, []);

    expect(source).toContain('const jobs: Record<string, unknown> = {};');
    expect(source).toContain('if (Component.isComponent(child)) {');
    expect(source).toContain('jobs[child.node.id] = child._toProperties();');
  });

  it('throws when a Resource/Component has more than one component-ref property', () => {
    const resource: IrResourceNode = {
      ...baseResource,
      properties: [
        {
          name: 'jobs',
          type: { shape: 'component-ref', target: 'Job', collection: 'map' },
          required: false,
        },
        {
          name: 'triggers',
          type: {
            shape: 'component-ref',
            target: 'Trigger',
            collection: 'array',
          },
          required: false,
        },
      ],
    };

    expect(() => CodeGenerator.generate(resource, [])).toThrow(
      /more than one component-ref property/,
    );
  });

  it('renders array, record, enum, and inline-shape property types', () => {
    const resource: IrResourceNode = {
      ...baseResource,
      properties: [
        {
          name: 'tags',
          type: {
            shape: 'array',
            items: { shape: 'primitive', primitive: 'string' },
          },
          required: false,
        },
        {
          name: 'env',
          type: {
            shape: 'record',
            valueType: { shape: 'primitive', primitive: 'string' },
          },
          required: false,
        },
        {
          name: 'kind',
          type: { shape: 'enum', name: 'Kind', values: ['a', 'b'] },
          required: false,
        },
        {
          name: 'contact',
          type: {
            shape: 'inline-shape',
            name: 'Contact',
            properties: [
              {
                name: 'email',
                type: { shape: 'primitive', primitive: 'string' },
                required: true,
              },
            ],
          },
          required: false,
        },
      ],
    };

    const source = CodeGenerator.generate(resource, []);

    expect(source).toContain('readonly tags?: string[];');
    expect(source).toContain('readonly env?: Record<string, string>;');
    expect(source).toContain('readonly kind?: Kind;');
    expect(source).toContain('readonly contact?: { readonly email: string; };');
  });

  it('generates a real TypeScript enum declaration for an enum property, not a string-literal union', () => {
    const resource: IrResourceNode = {
      ...baseResource,
      properties: [
        {
          name: 'kind',
          type: {
            shape: 'enum',
            name: 'Kind',
            values: ['uploaded', 'managed'],
          },
          required: false,
        },
      ],
    };

    const source = CodeGenerator.generate(resource, []);

    expect(source).toContain('export enum Kind {');
    expect(source).toContain("  Uploaded = 'uploaded',");
    expect(source).toContain("  Managed = 'managed',");
    expect(source).not.toMatch(/'uploaded' \| 'managed'/);
  });

  it('deduplicates an identically-named, identically-valued enum used by more than one property', () => {
    const resource: IrResourceNode = {
      ...baseResource,
      properties: [
        {
          name: 'primaryKind',
          type: { shape: 'enum', name: 'Kind', values: ['a', 'b'] },
          required: false,
        },
        {
          name: 'secondaryKind',
          type: { shape: 'enum', name: 'Kind', values: ['a', 'b'] },
          required: false,
        },
      ],
    };

    const source = CodeGenerator.generate(resource, []);

    expect(source.match(/export enum Kind \{/g)).toHaveLength(1);
  });

  it('throws when two different enums share a name but not their values', () => {
    const resource: IrResourceNode = {
      ...baseResource,
      properties: [
        {
          name: 'primaryKind',
          type: { shape: 'enum', name: 'Kind', values: ['a', 'b'] },
          required: false,
        },
        {
          name: 'secondaryKind',
          type: { shape: 'enum', name: 'Kind', values: ['c', 'd'] },
          required: false,
        },
      ],
    };

    expect(() => CodeGenerator.generate(resource, [])).toThrow(
      /Two different enums are both named "Kind"/,
    );
  });
});
