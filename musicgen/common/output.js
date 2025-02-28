/**
 * Common utility for standardized file paths and output handling across all modules.
 * Uses a simplified directory structure.
 */

import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs/ensure-dir";
import { exists } from "jsr:@std/fs/exists";
import * as colors from "jsr:@std/fmt/colors";

/**
 * Determines output paths and ensures directories exist.
 * @param {string} moduleName - Name of the module (e.g., "00_analysis")
 * @param {string} outputArg - Optional output argument from command line
 * @returns {Object} - Object containing various output paths
 */
export async function setupPaths(moduleName, outputArg = "./output") {
  // Determine if running from root or module directory
  const isRunningFromRoot = Deno.cwd().endsWith("musicgen") &&
    !Deno.cwd().endsWith(moduleName);

  // Base directory of the project
  const baseDir = isRunningFromRoot ? Deno.cwd() : join(Deno.cwd(), "..");

  // Module directory path
  const moduleDir = isRunningFromRoot ? join(baseDir, moduleName) : Deno.cwd();

  // Create standard directories - simplified structure
  const directories = {
    moduleDir,
    typstDir: join(moduleDir, "typst"),
    inputDir: join(moduleDir, "input"),
    outputDir: join(moduleDir, "output"),
    rootOutputDir: join(baseDir, "output"),
  };

  // Ensure all directories exist
  for (const [name, path] of Object.entries(directories)) {
    await ensureDir(path);
    console.log(colors.dim(`Ensured ${name} directory: ${path}`));
  }

  return {
    // Basic path info
    isRunningFromRoot,
    baseDir,
    moduleDir,

    // Directory paths
    typstDir: directories.typstDir,
    inputDir: directories.inputDir,
    outputDir: directories.outputDir,
    rootOutputDir: directories.rootOutputDir,

    // Helper to get path for a module file
    getTypstPath: (filename) => join(directories.typstDir, filename),
    getInputPath: (filename) => join(directories.inputDir, filename),
    getOutputPath: (filename) => join(directories.outputDir, filename),
    getRootOutputPath: (filename) => join(directories.rootOutputDir, filename),

    // Helper to ensure a file is copied to root output if needed
    copyToRootOutput: async (sourceFilename, targetFilename = null) => {
      const sourceFile = join(
        sourceFilename.startsWith("/") ? "" : directories.outputDir,
        sourceFilename,
      );

      const targetFile = join(
        directories.rootOutputDir,
        targetFilename || sourceFilename.split("/").pop(),
      );

      try {
        if (await exists(sourceFile)) {
          await Deno.copyFile(sourceFile, targetFile);
          console.log(colors.dim(`Copied ${sourceFile} to ${targetFile}`));
          return true;
        } else {
          console.log(
            colors.yellow(`Warning: Source file not found: ${sourceFile}`),
          );
          return false;
        }
      } catch (err) {
        console.warn(
          colors.yellow(
            `Warning: Could not copy to root output: ${err.message}`,
          ),
        );
        return false;
      }
    },
  };
}

/**
 * Compiles a Typst file to PDF.
 * @param {string} templatePath - Path to the Typst template file
 * @param {string} outputPath - Where to save the PDF
 * @returns {boolean} - Success status
 */
export async function compileTypst(templatePath, outputPath) {
  try {
    console.log(
      colors.blue(`Compiling Typst file: ${templatePath} to ${outputPath}`),
    );

    const typstCmd = new Deno.Command("typst", {
      args: ["compile", "--root", Deno.cwd(), templatePath, outputPath],
      stdout: "piped",
      stderr: "piped",
    });

    const typstOutput = await typstCmd.output();

    if (typstOutput.code === 0) {
      console.log(
        colors.green(`Successfully compiled Typst file to: ${outputPath}`),
      );
      return true;
    } else {
      const errorMessage = new TextDecoder().decode(typstOutput.stderr);
      console.log(
        colors.yellow(`Warning: Typst compilation had issues: ${errorMessage}`),
      );
      return false;
    }
  } catch (typstError) {
    console.log(
      colors.yellow(
        `Warning: Could not run typst command: ${typstError.message}`,
      ),
    );
    console.log(
      colors.yellow(
        `To generate the PDF, manually run: typst compile ${templatePath} ${outputPath}`,
      ),
    );
    return false;
  }
}
