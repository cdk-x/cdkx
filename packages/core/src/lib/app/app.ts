import { RootConstruct } from 'constructs';
import { ResourceAssemblyWriter } from '../assembly/resource-assembly.js';
import type { ManifestEntry } from '../synth/synth.js';
import { Synthesizer } from '../synth/synth.js';

/**
 * Configuration for an {@link App}.
 */
export interface AppProps {
  /**
   * The directory to which synthesized output is written.
   *
   * @default 'cdkx.out'
   */
  readonly outdir?: string;
}

/**
 * The root of a cdkx construct tree. Every Stack must ultimately be scoped
 * under an App.
 */
export class App extends RootConstruct {
  /**
   * Type guard for App.
   *
   * @param x - the value to test.
   * @returns true if `x` is an App, narrowing its type.
   * @example
   * if (App.isApp(scope)) {
   *   // scope is now typed as App
   * }
   */
  public static isApp(x: unknown): x is App {
    return x instanceof App;
  }

  public readonly outdir: string;

  /**
   * @param props - configuration for this App.
   */
  constructor(props: AppProps = {}) {
    super();
    this.outdir = props.outdir ?? 'cdkx.out';
  }

  /**
   * Synthesizes the construct tree into deployable output — one manifest
   * per Stack, keyed by Stack id — and writes it to {@link outdir} as a
   * resource assembly (one `<StackId>.json` file per Stack plus a
   * `manifest.json` index), the same way `cdk synth` always produces a
   * cloud assembly on disk.
   *
   * @returns the synthesized manifests, keyed by Stack id.
   */
  public synth(): Record<string, Record<string, ManifestEntry>> {
    const manifests = Synthesizer.synthesize(this);
    ResourceAssemblyWriter.write(this.outdir, manifests);
    return manifests;
  }
}
