import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Copies asset files into the cloud assembly staging area.
 *
 * `stageFile` copies a single source file into `destDir` under the given
 * `fileName`, creating the destination directory if necessary. Copies preserve
 * raw byte content.
 */
export class AssetStager {
  /**
   * Copies `src` to `destDir/fileName`. Creates `destDir` recursively if
   * missing. Throws if `src` does not exist.
   */
  public static stageFile(
    src: string,
    destDir: string,
    fileName: string,
  ): void {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, path.join(destDir, fileName));
  }

  /**
   * Recursively copies the contents of `src` into `destDir`. Creates `destDir`
   * (including parents) when it does not exist. Symlinks encountered during
   * traversal are followed and their target contents are copied.
   */
  public static stageDirectory(src: string, destDir: string): void {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    for (const name of fs.readdirSync(src)) {
      const srcEntry = path.join(src, name);
      const destEntry = path.join(destDir, name);
      const stat = fs.statSync(srcEntry);
      if (stat.isDirectory()) {
        AssetStager.stageDirectory(srcEntry, destEntry);
      } else if (stat.isFile()) {
        fs.copyFileSync(srcEntry, destEntry);
      }
    }
  }
}
