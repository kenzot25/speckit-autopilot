import { getRepoRoot } from '../utils/scripts.js';
import { readFile, writeFile, fileExists } from '../utils/files.js';
import { updateWorkflowState } from '../utils/state.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface PlanResult {
  success: boolean;
  planPath: string;
  artifacts: string[];
  message: string;
}

/**
 * Create implementation plan
 */
export async function speckitPlan(featureDir: string): Promise<PlanResult> {
  const repoRoot = getRepoRoot();
  
  // Use the provided featureDir directly instead of relying on script to find it
  // This avoids conflicts when multiple specs share the same numeric prefix
  const absoluteFeatureDir = path.isAbsolute(featureDir)
    ? featureDir
    : path.join(repoRoot, featureDir);
  
  const absoluteFeatureSpec = path.join(absoluteFeatureDir, 'spec.md');
  const absoluteImplPlan = path.join(absoluteFeatureDir, 'plan.md');
  
  // Ensure the feature directory exists
  await fs.mkdir(absoluteFeatureDir, { recursive: true });
  
  // Verify the spec file exists
  if (!(await fileExists(absoluteFeatureSpec))) {
    throw new Error(`Feature spec not found: ${absoluteFeatureSpec}`);
  }
  
  // Extract branch name directly from featureDir to avoid script lookup conflicts
  // This prevents errors when multiple specs share the same numeric prefix
  const branchName = path.basename(absoluteFeatureDir);
  
  // Load spec and constitution
  const specContent = await readFile(absoluteFeatureSpec);
  const constitutionPath = path.join(repoRoot, '.specify/memory/constitution.md');
  const constitutionContent = await fileExists(constitutionPath)
    ? await readFile(constitutionPath)
    : '';
  
  // Load plan template
  const templatePath = path.join(repoRoot, '.specify/templates/plan-template.md');
  let planContent = '';
  
  if (await fileExists(templatePath)) {
    planContent = await readFile(templatePath);
  } else {
    // Basic plan template
    planContent = `# Implementation Plan

## Technical Context

## Architecture

## Data Model

## API Contracts

## Implementation Phases

## Dependencies
`;
  }
  
  // Write plan file
  await writeFile(absoluteImplPlan, planContent);
  
  const artifacts = [absoluteImplPlan];
  
  // Update workflow state
  await updateWorkflowState(featureDir, 'plan', {
    planPath: absoluteImplPlan,
  });
  
  return {
    success: true,
    planPath: absoluteImplPlan,
    artifacts,
    message: `Implementation plan created: ${absoluteImplPlan}`,
  };
}
