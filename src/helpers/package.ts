import { type NextUIComponents, nextUIComponents } from 'src/constants/component';

import { Logger } from './logger';

/**
 * Get the package information
 * @param packagePath string
 */
export async function getPackageInfo(packagePath: string) {
  let pkg;

  try {
    pkg = await import(packagePath);
  } catch (error) {
    Logger.prefix('error', `Error reading package.json file: ${packagePath} \nError: ${error}`);
  }

  const devDependencies = pkg.devDependencies || {};
  const dependencies = pkg.dependencies || {};
  const allDependencies = { ...devDependencies, ...dependencies };
  const dependenciesKeys = new Set(Object.keys(allDependencies));

  const currentComponents = nextUIComponents.filter((component) =>
    dependenciesKeys.has(component.name)
  ) as NextUIComponents;

  return {
    allDependencies,
    currentComponents,
    dependencies,
    dependenciesKeys,
    devDependencies,
    package: pkg
  };
}