/**
 * Spec Loader
 *
 * Main entry point for loading and processing API specifications.
 * Automatically detects spec type and normalizes to unified model.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { UnifiedContract } from '../normalization/unified-model.js';
import { detectSpecType, detectSpecTypeFromPath, validateSpecVersion } from '../parsers/spec-detector';
import { parseOpenAPIObject } from '../parsers/openapi-parser';
import { parseAsyncAPIString } from '../parsers/asyncapi-parser';
import { normalizeOpenAPISpec } from '../normalization/openapi-normalizer';
import { normalizeAsyncAPISpec } from '../normalization/asyncapi-normalizer';

/**
 * Load and process a single spec file
 */
export async function loadSpec(filePath: string): Promise<UnifiedContract> {
  try {
    // Read file
    const content = await readFile(filePath, 'utf-8');

    // Parse YAML/JSON
    const spec = yaml.load(content);

    // Detect spec type
    const specType = detectSpecType(spec);
    validateSpecVersion(spec, specType);

    // Parse and normalize based on type
    if (specType === 'openapi') {
      const parsed = await parseOpenAPIObject(spec);
      return normalizeOpenAPISpec(parsed);
    } else {
      const parsed = await parseAsyncAPIString(content);
      return normalizeAsyncAPISpec(parsed);
    }
  } catch (error) {
    throw new Error(
      `Failed to load spec from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Load all specs from a directory
 */
export async function loadSpecsFromDirectory(directoryPath: string): Promise<UnifiedContract[]> {
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    const files = await fs.readdir(directoryPath);
    const specFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json'));

    const contracts: UnifiedContract[] = [];

    for (const file of specFiles) {
      const filePath = path.join(directoryPath, file);
      try {
        const contract = await loadSpec(filePath);
        contracts.push(contract);
      } catch (error) {
        console.error(`Error loading ${file}:`, error);
        // Continue with other files
      }
    }

    return contracts;
  } catch (error) {
    throw new Error(
      `Failed to load specs from directory ${directoryPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Load all specs from both OpenAPI and AsyncAPI directories
 */
export async function loadAllSpecs(baseDir: string = 'specs'): Promise<UnifiedContract[]> {
  const path = await import('path');

  const openapiDir = path.join(process.cwd(), baseDir, 'openapi');
  const asyncapiDir = path.join(process.cwd(), baseDir, 'asyncapi');

  const contracts: UnifiedContract[] = [];

  // Load OpenAPI specs
  try {
    const openapiContracts = await loadSpecsFromDirectory(openapiDir);
    contracts.push(...openapiContracts);
  } catch (error) {
    console.warn('No OpenAPI specs found or error loading:', error);
  }

  // Load AsyncAPI specs
  try {
    const asyncapiContracts = await loadSpecsFromDirectory(asyncapiDir);
    contracts.push(...asyncapiContracts);
  } catch (error) {
    console.warn('No AsyncAPI specs found or error loading:', error);
  }

  return contracts;
}

/**
 * Get spec file paths from directories
 */
export async function getSpecFilePaths(baseDir: string = 'specs'): Promise<string[]> {
  const path = await import('path');
  const fs = await import('fs/promises');

  const openapiDir = path.join(process.cwd(), baseDir, 'openapi');
  const asyncapiDir = path.join(process.cwd(), baseDir, 'asyncapi');

  const paths: string[] = [];

  // Get OpenAPI files
  try {
    const openapiFiles = await fs.readdir(openapiDir);
    const openapiPaths = openapiFiles
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json'))
      .map(f => path.join(openapiDir, f));
    paths.push(...openapiPaths);
  } catch (error) {
    // Directory doesn't exist or is empty
  }

  // Get AsyncAPI files
  try {
    const asyncapiFiles = await fs.readdir(asyncapiDir);
    const asyncapiPaths = asyncapiFiles
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json'))
      .map(f => path.join(asyncapiDir, f));
    paths.push(...asyncapiPaths);
  } catch (error) {
    // Directory doesn't exist or is empty
  }

  return paths;
}
