import { IConstruct } from 'constructs';
import { AnnotationEntry } from './annotation-types';

/**
 * Collects all annotations from a construct tree.
 * Traverses the entire tree and extracts annotation metadata.
 */
export class AnnotationCollector {
  /**
   * Collects all annotations from the construct tree starting at root.
   * Returns annotations sorted by level: errors first, then warnings, then info.
   */
  public static collect(root: IConstruct): AnnotationEntry[] {
    const annotations: AnnotationEntry[] = [];

    for (const construct of root.node.findAll()) {
      for (const entry of construct.node.metadata) {
        if (
          entry.type === 'info' ||
          entry.type === 'warning' ||
          entry.type === 'error'
        ) {
          annotations.push({
            level: entry.type,
            message: entry.data as string,
            id: AnnotationCollector.extractId(entry.data as string),
            constructPath: construct.node.path,
          });
        }
      }
    }

    // Sort: errors first, then warnings, then info
    const levelOrder = { error: 0, warning: 1, info: 2 };
    annotations.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

    return annotations;
  }

  private static extractId(message: string): string | undefined {
    const match = message.match(/\[ack: ([^\]]+)\]$/);
    return match ? match[1] : undefined;
  }
}
