import { RootConstruct } from 'constructs';

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
   * ```ts
   * if (App.isApp(scope)) {
   *   // scope is now typed as App
   * }
   * ```
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
   * Synthesizes the construct tree into deployable output.
   * Not implemented yet — lands once Stack/Resource/Component all exist.
   */
  public synth(): never {
    throw new Error('App.synth() is not implemented yet.');
  }
}
