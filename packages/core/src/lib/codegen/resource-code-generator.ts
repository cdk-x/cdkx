import type {
  EnumSpec,
  GeneratedFile,
  NestedInterfaceSpec,
  PropertySpec,
  ResourceSpec,
} from './types.js';

/**
 * Generates TypeScript source files from `ResourceSpec` objects.
 *
 * Each call to `generateFile()` produces one `GeneratedFile` containing:
 *
 * 1. A header comment marking the file as auto-generated
 * 2. Imports (`ProviderResource`, `IResolvable`, `Construct`, resource type constant)
 * 3. Interfaces for nested inline objects (e.g. `FirewallRule`)
 * 4. TypeScript enums (e.g. `CertificateType`)
 * 5. The resource props interface (e.g. `HetznerNetwork`)
 * 6. The L1 props interface (e.g. `NtvHetznerNetworkProps extends HetznerNetwork`)
 * 7. The L1 class (e.g. `NtvHetznerNetwork extends ProviderResource`)
 *
 * The generator does NOT write to disk — callers are responsible for writing
 * `GeneratedFile.content` to `GeneratedFile.relativePath`.
 *
 * @example
 * const generator = new ResourceCodeGenerator('Hetzner', 'HetznerResourceType');
 * const file = generator.generateFile(spec);
 * // file.relativePath → 'networking/ntv-hetzner-network.ts'
 * // file.content      → full TypeScript source
 */
export class ResourceCodeGenerator {
  /**
   * @param providerName       - PascalCase provider name prefix. e.g. "Hetzner".
   * @param resourceTypeConst  - Name of the resource type constant object.
   *                             e.g. "HetznerResourceType".
   */
  constructor(
    private readonly providerName: string,
    private readonly resourceTypeConst: string,
  ) {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Generate a single TypeScript source file for the given `ResourceSpec`.
   */
  generateFile(spec: ResourceSpec): GeneratedFile {
    const content = [
      this.renderHeader(),
      this.renderImports(spec),
      this.renderNestedInterfaces(spec),
      this.renderEnums(spec),
      this.renderPropsInterface(spec),
      this.renderL1PropsInterface(spec),
      this.renderL1Class(spec),
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      relativePath: this.toFilePath(spec),
      content: content + '\n',
    };
  }

  // ---------------------------------------------------------------------------
  // File path
  // ---------------------------------------------------------------------------

  /**
   * Derives the output file path relative to `src/lib/`.
   *
   * @example
   * // domain: "Networking", resourceName: "Network", provider: "Hetzner"
   * // → "networking/ntv-hetzner-network.ts"
   */
  toFilePath(spec: ResourceSpec): string {
    const domainDir = spec.domain.toLowerCase();
    const kebab = spec.resourceName
      .replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)
      .replace(/^-/, '');
    const provider = this.providerName.toLowerCase();
    return `${domainDir}/ntv-${provider}-${kebab}.ts`;
  }

  // ---------------------------------------------------------------------------
  // Private renderers
  // ---------------------------------------------------------------------------

  private renderHeader(): string {
    return [
      '// =============================================================================',
      '// AUTO-GENERATED — do not edit manually.',
      `// Regenerate with: yarn nx run @cdk-x/${this.providerName.toLowerCase()}:codegen`,
      '// =============================================================================',
    ].join('\n');
  }

  private renderImports(spec: ResourceSpec): string {
    const hasIResolvable =
      spec.createProps.some((p) => p.isCrossRef) || spec.attributes.length > 0;

    const coreImports: string[] = ['ProviderResource', 'PropertyValue'];
    if (hasIResolvable) coreImports.push('IResolvable');

    const lines = [
      `import { ${coreImports.join(', ')} } from '@cdk-x/core';`,
      `import { Construct } from 'constructs';`,
      `import { ${this.resourceTypeConst} } from '../common/index.js';`,
    ];

    return lines.join('\n');
  }

  private renderNestedInterfaces(spec: ResourceSpec): string {
    if (spec.nestedInterfaces.length === 0) return '';

    return spec.nestedInterfaces
      .map((ni) => this.renderNestedInterface(ni))
      .join('\n\n');
  }

  private renderNestedInterface(ni: NestedInterfaceSpec): string {
    const desc = ni.description ? `/**\n * ${ni.description}\n */\n` : '';
    const props = ni.properties.map((p) => this.renderProp(p, 2)).join('\n');

    return `${desc}export interface ${ni.name} {\n${props}\n}`;
  }

  private renderEnums(spec: ResourceSpec): string {
    if (spec.enums.length === 0) return '';
    return spec.enums.map((e) => this.renderEnum(e)).join('\n\n');
  }

  private renderEnum(e: EnumSpec): string {
    const desc = e.description ? `/**\n * ${e.description}\n */\n` : '';
    const members = e.values
      .map((v) => {
        const memberDesc = v.description
          ? `  /** ${v.description} */\n  `
          : '  ';
        return `${memberDesc}${v.label} = '${v.value}',`;
      })
      .join('\n');

    return `${desc}export enum ${e.name} {\n${members}\n}`;
  }

  private renderPropsInterface(spec: ResourceSpec): string {
    const interfaceName = `${this.providerName}${spec.resourceName}`;
    const props = spec.createProps.map((p) => this.renderProp(p, 2)).join('\n');
    const desc = `/**\n * Properties that describe a ${this.providerName} ${spec.resourceName} resource.\n */`;
    return `${desc}\nexport interface ${interfaceName} {\n${props}\n}`;
  }

  private renderL1PropsInterface(spec: ResourceSpec): string {
    const base = `${this.providerName}${spec.resourceName}`;
    const l1 = `Ntv${this.providerName}${spec.resourceName}Props`;
    const desc = [
      `/**`,
      ` * Props for {@link Ntv${this.providerName}${spec.resourceName}}.`,
      ` *`,
      ` * Identical to {@link ${base}} — extended here for future additions.`,
      ` */`,
    ].join('\n');
    return `${desc}\nexport interface ${l1} extends ${base} {}`;
  }

  private renderL1Class(spec: ResourceSpec): string {
    const className = `Ntv${this.providerName}${spec.resourceName}`;
    const propsType = `${className}Props`;
    const typeRef = `${this.resourceTypeConst}.${spec.domain}.${spec.resourceName.toUpperCase()}`;

    const desc = [
      `/**`,
      ` * L1 construct representing a \`${spec.providerType}\` resource.`,
      ` */`,
    ].join('\n');

    const getters = spec.attributes
      .map((attr) => this.renderGetter(attr.name, attr.description))
      .join('\n\n');

    const ctor = [
      `  /**`,
      `   * @param scope - The construct scope (parent).`,
      `   * @param id    - The construct ID, unique within the scope.`,
      `   * @param props - Resource configuration.`,
      `   */`,
      `  constructor(scope: Construct, id: string, props: ${propsType}) {`,
      `    super(scope, id, {`,
      `      type: ${typeRef},`,
      `      properties: props as unknown as Record<string, PropertyValue>,`,
      `    });`,
      `    this.node.defaultChild = this;`,
      `  }`,
    ].join('\n');

    const body = [getters, ctor].filter(Boolean).join('\n\n');

    return `${desc}\nexport class ${className} extends ProviderResource {\n${body}\n}`;
  }

  private renderGetter(attrName: string, description: string): string {
    const lines = [
      `  /**`,
      `   * ${description}`,
      `   */`,
      `  get ${attrName}(): IResolvable {`,
      `    return {`,
      `      resolve: () => ({ ref: this.logicalId, attr: '${attrName}' }),`,
      `    };`,
      `  }`,
    ];
    return lines.join('\n');
  }

  private renderProp(prop: PropertySpec, indent: number): string {
    const pad = ' '.repeat(indent);
    const optional = prop.required ? '' : '?';
    const nullable =
      prop.isNullable && !prop.type.includes('| null') ? ' | null' : '';
    const desc = prop.description
      ? `${pad}/** ${prop.description.split('\n')[0].trim()} */\n`
      : '';
    return `${desc}${pad}readonly ${prop.name}${optional}: ${prop.type}${nullable};`;
  }
}
