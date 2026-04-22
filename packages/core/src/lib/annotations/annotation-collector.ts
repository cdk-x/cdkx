import { IConstruct } from 'constructs';
import { Acknowledgements } from '../acknowledgements/acknowledgements';
import { AnnotationEntry } from './annotation-types';

/**
 * Result of collecting annotations, including the annotations themselves
 * and the set of IDs that were actually used.
 */
export interface AnnotationCollectResult {
  /** The collected annotations */
  readonly annotations: AnnotationEntry[];
  /** Set of annotation IDs that were found in the tree */
  readonly usedIds: Set<string>;
}

/**
 * Collects all annotations from a construct tree.
 * Traverses the entire tree and extracts annotation metadata.
 */
export class AnnotationCollector {
  /**
   * Collects all annotations from the construct tree starting at root.
   * Returns annotations sorted by level: errors first, then warnings, then info.
   * Filters out acknowledged annotations using the Acknowledgements singleton.
   */
  public static collect(root: IConstruct): AnnotationCollectResult {
    const annotations: AnnotationEntry[] = [];
    const usedIds = new Set<string>();
    const acknowledgements = Acknowledgements.of(root);

    for (const construct of root.node.findAll()) {
      for (const entry of construct.node.metadata) {
        if (entry.type === 'info' || entry.type === 'warning' || entry.type === 'error') {
          const id = AnnotationCollector.extractId(entry.data as string);

          // Track used IDs for cleanup
          if (id) {
            usedIds.add(id);
          }

          // Skip if this ID is acknowledged
          if (id && acknowledgements.has(construct, id)) {
            continue;
          }

          annotations.push({
            level: entry.type,
            message: entry.data as string,
            id,
            constructPath: construct.node.path,
          });
        }
      }
    }

    // Sort: errors first, then warnings, then info
    const levelOrder = { error: 0, warning: 1, info: 2 };
    annotations.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

    return { annotations, usedIds };
  }

  private static extractId(message: string): string | undefined {
    const match = message.match(/\[ack: ([^\]]+)\]$/);
    return match ? match[1] : undefined;
  }
}
