import { ResourceWrapperGenerator } from './resource-wrapper-generator.js';

describe('ResourceWrapperGenerator.generate', () => {
  const options = {
    resourceType: 'Workflow',
    apiVersion: 'github.cdk-x.com/v1',
    propsTypeName: 'WorkflowProps',
    serializerClassName: 'WorkflowSerializer',
  };

  it('emits a class extending Resource with resourceType and apiVersion set', () => {
    const source = ResourceWrapperGenerator.generate(options);

    expect(source).toContain('export class Workflow extends Resource {');
    expect(source).toContain("public readonly resourceType = 'Workflow';");
    expect(source).toContain(
      "public readonly apiVersion = 'github.cdk-x.com/v1';",
    );
  });

  it('holds a single props bag rather than flattened members', () => {
    const source = ResourceWrapperGenerator.generate(options);

    expect(source).toContain(
      'constructor(scope: Construct, id: string, public readonly props: WorkflowProps) {',
    );
  });

  it('implements toProperties() by delegating to the serializer class', () => {
    const source = ResourceWrapperGenerator.generate(options);

    expect(source).toContain(
      'protected toProperties(): Record<string, unknown> {',
    );
    expect(source).toContain(
      'return WorkflowSerializer.toJsonWorkflowProps(this.props) ?? {};',
    );
  });

  it('never references Component — auto-generation is Resource-only', () => {
    const source = ResourceWrapperGenerator.generate(options);

    expect(source).not.toContain('Component');
  });
});
