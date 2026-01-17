import { executeScript, executeScriptJSON, getRepoRoot } from '../utils/scripts.js';
import { readFile, writeFile, fileExists } from '../utils/files.js';
import { initWorkflowState } from '../utils/state.js';
import * as path from 'path';
import { execSync } from 'child_process';
import * as fs from 'fs/promises';

export interface SpecifyResult {
  success: boolean;
  branchName: string;
  specPath: string;
  featureDir: string;
  message: string;
}

/**
 * Generate short name from feature description (2-4 words)
 */
function generateShortName(description: string): string {
  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .slice(0, 4);
  
  return words.join('-').substring(0, 50); // Max 50 chars
}

/**
 * Check if a git branch exists
 */
async function branchExists(branchName: string): Promise<boolean> {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
    return true;
  } catch {
    try {
      // Also check remote branches
      execSync(`git show-ref --verify --quiet refs/remotes/origin/${branchName}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Find highest feature number for a short name, or return existing branch number if branch exists
 */
async function findFeatureNumber(shortName: string): Promise<{ number: number; branchName: string | null }> {
  const repoRoot = getRepoRoot();
  const specsDir = path.join(repoRoot, 'specs');
  
  let highest = 0;
  let existingBranch: string | null = null;
  
  try {
    // Check git branches (both local and remote)
    try {
      const allBranches = execSync('git branch -a', { encoding: 'utf-8' });
      const escapedShortName = shortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const branchPattern = new RegExp(`(?:refs/heads/|remotes/origin/)?(\\d+)-${escapedShortName}`, 'g');
      const matches = allBranches.match(branchPattern);
      
      if (matches) {
        matches.forEach((match: string) => {
          const numMatch = match.match(/(\d+)-/);
          if (numMatch) {
            const num = parseInt(numMatch[1]);
            if (num > highest) {
              highest = num;
              existingBranch = `${num.toString().padStart(3, '0')}-${shortName}`;
            }
          }
        });
      }
    } catch {
      // Git not available
    }
    
    // Check specs directories
    try {
      const entries = await fs.readdir(specsDir);
      const escapedShortName = shortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const entry of entries) {
        const match = entry.match(new RegExp(`^(\\d+)-${escapedShortName}$`));
        if (match) {
          const num = parseInt(match[1]);
          if (num > highest) {
            highest = num;
            existingBranch = entry;
          }
        }
      }
    } catch {
      // Specs dir doesn't exist yet
    }
  } catch (error) {
    // Continue with default
  }
  
  // If we found an existing branch, return its number (don't increment)
  if (existingBranch) {
    return { number: highest, branchName: existingBranch };
  }
  
  // Otherwise, return next number
  return { number: highest + 1, branchName: null };
}

/**
 * Checkout existing branch or create new one
 */
async function ensureBranch(branchName: string): Promise<void> {
  const exists = await branchExists(branchName);
  
  if (exists) {
    // Branch exists, just checkout
    try {
      execSync(`git checkout ${branchName}`, { stdio: 'pipe', encoding: 'utf-8' });
    } catch (error: any) {
      // If checkout fails, try to fetch and checkout remote branch
      try {
        execSync(`git fetch origin ${branchName}:${branchName}`, { stdio: 'pipe', encoding: 'utf-8' });
        execSync(`git checkout ${branchName}`, { stdio: 'pipe', encoding: 'utf-8' });
      } catch {
        throw new Error(`Failed to checkout branch ${branchName}: ${error.message}`);
      }
    }
  } else {
    // Branch doesn't exist, create it
    execSync(`git checkout -b ${branchName}`, { stdio: 'pipe', encoding: 'utf-8' });
  }
}

/**
 * Create feature specification
 */
export async function speckitSpecify(featureDescription: string): Promise<SpecifyResult> {
  if (!featureDescription || featureDescription.trim().length === 0) {
    throw new Error('Feature description is required');
  }
  
  const repoRoot = getRepoRoot();
  const shortName = generateShortName(featureDescription);
  const { number: branchNumber, branchName: existingBranch } = await findFeatureNumber(shortName);
  
  const featureNum = branchNumber.toString().padStart(3, '0');
  const branchName = existingBranch || `${featureNum}-${shortName}`;
  const specsDir = path.join(repoRoot, 'specs');
  const featureDir = path.join(specsDir, branchName);
  const specFile = path.join(featureDir, 'spec.md');
  
  // Check if branch/feature already exists
  const branchExistsAlready = await branchExists(branchName);
  const featureDirExists = await fileExists(featureDir);
  
  let result: {
    BRANCH_NAME: string;
    SPEC_FILE: string;
    FEATURE_DIR: string;
  };
  
  if (branchExistsAlready || featureDirExists || existingBranch) {
    // Use existing branch/directory
    if (branchExistsAlready) {
      await ensureBranch(branchName);
    } else if (!featureDirExists) {
      // Branch doesn't exist but we want to create it
      await ensureBranch(branchName);
    }
    
    // Ensure feature directory exists
    if (!featureDirExists) {
      await fs.mkdir(featureDir, { recursive: true });
    }
    
    result = {
      BRANCH_NAME: branchName,
      SPEC_FILE: specFile,
      FEATURE_DIR: featureDir,
    };
  } else {
    // Create new branch and feature
    try {
      // Execute create-new-feature script
      const scriptPath = path.join(repoRoot, '.specify/scripts/bash/create-new-feature.sh');
      const scriptResult = await executeScriptJSON<{
        BRANCH_NAME: string;
        SPEC_FILE: string;
        FEATURE_NUM?: string;
      }>(scriptPath, [
        '--number', branchNumber.toString(),
        '--short-name', shortName,
        featureDescription
      ], { cwd: repoRoot });
      
      // Script returns SPEC_FILE but not FEATURE_DIR, so we need to derive it
      const scriptSpecFile = scriptResult.SPEC_FILE;
      const scriptFeatureDir = path.dirname(scriptSpecFile);
      
      result = {
        BRANCH_NAME: scriptResult.BRANCH_NAME,
        SPEC_FILE: scriptSpecFile,
        FEATURE_DIR: scriptFeatureDir,
      };
    } catch (error: any) {
      // If script fails because branch exists, handle it gracefully
      const errorMsg = error.message || error.stderr || '';
      if (errorMsg.includes('already exists') || errorMsg.includes('fatal: a branch named')) {
        // Branch was created between check and script execution, use it
        await ensureBranch(branchName);
        await fs.mkdir(featureDir, { recursive: true });
        
        result = {
          BRANCH_NAME: branchName,
          SPEC_FILE: specFile,
          FEATURE_DIR: featureDir,
        };
      } else {
        // For other errors, try to use the paths we calculated
        console.error(`Script error: ${errorMsg}`);
        // Fallback to calculated paths
        await ensureBranch(branchName);
        await fs.mkdir(featureDir, { recursive: true });
        
        result = {
          BRANCH_NAME: branchName,
          SPEC_FILE: specFile,
          FEATURE_DIR: featureDir,
        };
      }
    }
  }
  
  // Ensure result is properly set
  if (!result) {
    throw new Error('Failed to create feature specification: result is undefined');
  }
  
  // Normalize paths - ensure they're absolute
  if (!result.FEATURE_DIR || !result.SPEC_FILE) {
    // Use calculated paths as fallback
    result.FEATURE_DIR = result.FEATURE_DIR || featureDir;
    result.SPEC_FILE = result.SPEC_FILE || specFile;
    result.BRANCH_NAME = result.BRANCH_NAME || branchName;
  }
  
  // Validate result
  if (!result || !result.FEATURE_DIR || !result.SPEC_FILE) {
    throw new Error(`Failed to create feature specification. Result: ${JSON.stringify(result)}`);
  }
  
  // Ensure paths are absolute
  const absoluteFeatureDir = path.isAbsolute(result.FEATURE_DIR) 
    ? result.FEATURE_DIR 
    : path.join(repoRoot, result.FEATURE_DIR);
  const absoluteSpecFile = path.isAbsolute(result.SPEC_FILE)
    ? result.SPEC_FILE
    : path.join(repoRoot, result.SPEC_FILE);
  
  // Initialize workflow state
  await initWorkflowState(absoluteFeatureDir, featureDescription);
  
  // Load spec template and generate initial spec
  const templatePath = path.join(repoRoot, '.specify/templates/spec-template.md');
  let specContent = '';
  
  if (await fileExists(templatePath)) {
    specContent = await readFile(templatePath);
    // Replace placeholders with actual content
    specContent = specContent
      .replace(/\{\{FEATURE_NAME\}\}/g, featureDescription)
      .replace(/\{\{DATE\}\}/g, new Date().toISOString().split('T')[0]);
  } else {
    // Basic template if file doesn't exist
    specContent = `# Feature Specification

## Overview
${featureDescription}

## User Stories

## Functional Requirements

## Non-Functional Requirements

## Success Criteria

## Edge Cases

## Assumptions
`;
  }
  
  // Write spec file
  await writeFile(absoluteSpecFile, specContent);
  
  // Create checklist directory and requirements checklist
  const checklistDir = path.join(absoluteFeatureDir, 'checklists');
  const checklistPath = path.join(checklistDir, 'requirements.md');
  const checklistContent = `# Specification Quality Checklist

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: ${new Date().toISOString().split('T')[0]}
**Feature**: [spec.md](${absoluteSpecFile})

## Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

## Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Success criteria are technology-agnostic
- [ ] All acceptance scenarios are defined
- [ ] Edge cases are identified
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

## Feature Readiness
- [ ] All functional requirements have clear acceptance criteria
- [ ] User scenarios cover primary flows
- [ ] Feature meets measurable outcomes defined in Success Criteria
- [ ] No implementation details leak into specification
`;

  await writeFile(checklistPath, checklistContent);
  
  return {
    success: true,
    branchName: result.BRANCH_NAME || branchName,
    specPath: absoluteSpecFile,
    featureDir: absoluteFeatureDir,
    message: `Feature specification created: ${result.BRANCH_NAME || branchName}`,
  };
}
