import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// Import from source for testing (can be changed to dist/ for integration testing)
import { speckitSpecify } from '../../tools/specify.js';
import { speckitClarify } from '../../tools/clarify.js';
import { speckitPlan } from '../../tools/plan.js';
import { speckitTasks } from '../../tools/tasks.js';
import { speckitImplement, markTaskAsComplete } from '../../tools/implement.js';
import { speckitReview } from '../../tools/review.js';
import { speckitAutopilot } from '../../tools/autopilot.js';
import { readFile, writeFile, fileExists } from '../../utils/files.js';
import { getWorkflowState, initWorkflowState } from '../../utils/state.js';

describe('All Tools Integration Tests', () => {
  let testDir: string;
  let repoRoot: string;
  let featureDir: string;

  beforeEach(async () => {
    // Create a temporary directory structure that mimics a git repo
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'speckit-test-'));
    repoRoot = testDir;
    
    // Initialize git repo
    execSync('git init', { cwd: repoRoot, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: repoRoot, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: repoRoot, stdio: 'ignore' });
    
    // Create .specify directory structure
    const specifyDir = path.join(repoRoot, '.specify');
    await fs.mkdir(path.join(specifyDir, 'templates'), { recursive: true });
    await fs.mkdir(path.join(specifyDir, 'scripts', 'bash'), { recursive: true });
    await fs.mkdir(path.join(repoRoot, 'specs'), { recursive: true });
    
    // Create spec template
    const specTemplate = `# Feature Specification

## Overview
{{FEATURE_NAME}}

## User Stories

## Functional Requirements

## Success Criteria

## Assumptions
`;
    await writeFile(path.join(specifyDir, 'templates', 'spec-template.md'), specTemplate);
    
    // Create plan template
    const planTemplate = `# Implementation Plan

## Technical Context

## Architecture

## Implementation Phases
`;
    await writeFile(path.join(specifyDir, 'templates', 'plan-template.md'), planTemplate);
    
    // Create tasks template
    const tasksTemplate = `# Implementation Tasks

## Phase 1: Setup
- [ ] T001 Initial setup

## Phase 2: Implementation
- [ ] T002 Core feature
`;
    await writeFile(path.join(specifyDir, 'templates', 'tasks-template.md'), tasksTemplate);
    
    // Create a simple create-new-feature.sh script that handles --number, --short-name, and --json flags
    // Note: executeScriptJSON appends --json at the end, so args are: --number N --short-name NAME "description" --json
    const createScript = `#!/bin/bash
set -e
JSON_MODE=false
SHORT_NAME=""
BRANCH_NUMBER=""
FEATURE_DESC=""

# Parse all arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      JSON_MODE=true
      shift
      ;;
    --number)
      BRANCH_NUMBER="$2"
      shift 2
      ;;
    --short-name)
      SHORT_NAME="$2"
      shift 2
      ;;
    *)
      # Collect remaining args as feature description
      FEATURE_DESC="$FEATURE_DESC $1"
      shift
      ;;
  esac
done

# Trim leading space
FEATURE_DESC=$(echo "$FEATURE_DESC" | sed 's/^ //')

REPO_ROOT="$(git rev-parse --show-toplevel)"
SPECS_DIR="$REPO_ROOT/specs"
BRANCH_NAME="$(printf "%03d" "$BRANCH_NUMBER")-$SHORT_NAME"
FEATURE_DIR="$SPECS_DIR/$BRANCH_NAME"
mkdir -p "$FEATURE_DIR"
SPEC_FILE="$FEATURE_DIR/spec.md"
echo "{}" > "$SPEC_FILE"

if [ "$JSON_MODE" = "true" ]; then
  echo "{\"BRANCH_NAME\":\"$BRANCH_NAME\",\"SPEC_FILE\":\"$SPEC_FILE\"}"
else
  echo "BRANCH_NAME: $BRANCH_NAME"
  echo "SPEC_FILE: $SPEC_FILE"
fi
`;
    await writeFile(path.join(specifyDir, 'scripts', 'bash', 'create-new-feature.sh'), createScript);
    execSync(`chmod +x "${path.join(specifyDir, 'scripts', 'bash', 'create-new-feature.sh')}"`);
    
    // Change to repo root for getRepoRoot() to work
    process.chdir(repoRoot);
  });

  afterEach(async () => {
    process.chdir(os.homedir()); // Change back to home directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('speckitSpecify', () => {
    it('should create a feature specification', async () => {
      const result = await speckitSpecify('Add user login feature');
      
      expect(result.success).toBe(true);
      expect(result.branchName).toBeTruthy();
      expect(result.specPath).toBeTruthy();
      expect(result.featureDir).toBeTruthy();
      
      // Verify files were created
      expect(await fileExists(result.specPath)).toBe(true);
      expect(await fileExists(path.join(result.featureDir, 'checklists', 'requirements.md'))).toBe(true);
      
      // Verify spec content
      const specContent = await readFile(result.specPath);
      expect(specContent).toContain('Add user login feature');
    });

    it('should throw error for empty description', async () => {
      await expect(speckitSpecify('')).rejects.toThrow('Feature description is required');
    });
  });

  describe('speckitClarify', () => {
    it('should generate clarification questions', async () => {
      // First create a spec
      const specifyResult = await speckitSpecify('Add user login feature');
      
      // Then clarify
      const result = await speckitClarify(specifyResult.featureDir, 5);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.questions)).toBe(true);
    });

    it('should throw error if spec not found', async () => {
      const nonExistentDir = path.join(repoRoot, 'specs', '999-nonexistent');
      await expect(speckitClarify(nonExistentDir, 5)).rejects.toThrow('spec.md not found');
    });
  });

  describe('speckitPlan', () => {
    it('should create an implementation plan', async () => {
      // First create a spec
      const specifyResult = await speckitSpecify('Add user login feature');
      
      // Then create plan
      const result = await speckitPlan(specifyResult.featureDir);
      
      expect(result.success).toBe(true);
      expect(result.planPath).toBeTruthy();
      expect(await fileExists(result.planPath)).toBe(true);
    });

    it('should throw error if spec not found', async () => {
      const nonExistentDir = path.join(repoRoot, 'specs', '999-nonexistent');
      await fs.mkdir(nonExistentDir, { recursive: true });
      await expect(speckitPlan(nonExistentDir)).rejects.toThrow('Feature spec not found');
    });
  });

  describe('speckitTasks', () => {
    it('should generate tasks from plan', async () => {
      // Create spec and plan
      const specifyResult = await speckitSpecify('Add user login feature');
      await speckitPlan(specifyResult.featureDir);
      
      // Generate tasks
      const result = await speckitTasks(specifyResult.featureDir);
      
      expect(result.success).toBe(true);
      expect(result.tasksPath).toBeTruthy();
      expect(await fileExists(result.tasksPath)).toBe(true);
      expect(result.taskCount).toBeGreaterThanOrEqual(0);
    });

    it('should throw error if plan not found', async () => {
      const specifyResult = await speckitSpecify('Add user login feature');
      await expect(speckitTasks(specifyResult.featureDir)).rejects.toThrow('plan.md not found');
    });
  });

  describe('speckitImplement', () => {
    it('should return implementation result', async () => {
      // Create spec, plan, and tasks
      const specifyResult = await speckitSpecify('Add user login feature');
      await speckitPlan(specifyResult.featureDir);
      await speckitTasks(specifyResult.featureDir);
      
      // Get implementation status
      const result = await speckitImplement(specifyResult.featureDir, true);
      
      expect(result.success).toBe(true);
      expect(typeof result.tasksCompleted).toBe('number');
      expect(typeof result.totalTasks).toBe('number');
    });

    it('should throw error if tasks not found', async () => {
      const specifyResult = await speckitSpecify('Add user login feature');
      await expect(speckitImplement(specifyResult.featureDir, true)).rejects.toThrow('tasks.md not found');
    });
  });

  describe('markTaskAsComplete', () => {
    it('should mark a task as complete', async () => {
      // Create spec, plan, and tasks
      const specifyResult = await speckitSpecify('Add user login feature');
      await speckitPlan(specifyResult.featureDir);
      await speckitTasks(specifyResult.featureDir);
      
      // Add a task to the tasks file
      const tasksPath = path.join(specifyResult.featureDir, 'tasks.md');
      const tasksContent = `# Tasks
- [ ] T001 Test task
`;
      await writeFile(tasksPath, tasksContent);
      
      // Mark task as complete
      await markTaskAsComplete(specifyResult.featureDir, 'T001');
      
      // Verify task is marked complete
      const updatedContent = await readFile(tasksPath);
      expect(updatedContent).toContain('- [X] T001');
    });
  });

  describe('speckitReview', () => {
    it('should perform code review', async () => {
      // Create spec, plan, and tasks
      const specifyResult = await speckitSpecify('Add user login feature');
      await speckitPlan(specifyResult.featureDir);
      await speckitTasks(specifyResult.featureDir);
      
      // Perform review
      const result = await speckitReview(specifyResult.featureDir, 1);
      
      expect(result.success).toBe(true);
      expect(['pass', 'fail']).toContain(result.buildStatus);
      expect(typeof result.issuesFound).toBe('number');
      expect(typeof result.issuesFixed).toBe('number');
    });
  });

  describe('speckitAutopilot', () => {
    it('should run full autopilot workflow', async () => {
      const result = await speckitAutopilot('Add user login feature', {
        skipClarify: true,
        skipReview: true,
      });
      
      expect(result.success).toBe(true);
      expect(result.featureDir).toBeTruthy();
      expect(result.steps.specify).toBeTruthy();
      expect(result.steps.specify?.success).toBe(true);
      expect(result.steps.plan).toBeTruthy();
      expect(result.steps.tasks).toBeTruthy();
    });

    it('should handle errors gracefully', async () => {
      // This will fail because we don't have a proper git setup
      // But it should return a result object, not throw
      const result = await speckitAutopilot('', {
        skipClarify: true,
        skipReview: true,
      });
      
      // Should return error result, not throw
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });
  });

  describe('Workflow State', () => {
    it('should initialize workflow state', async () => {
      const specifyResult = await speckitSpecify('Add user login feature');
      
      const state = await getWorkflowState(specifyResult.featureDir);
      expect(state).toBeTruthy();
      expect(state?.currentStep).toBe('specify');
      expect(state?.metadata.featureDescription).toBe('Add user login feature');
    });
  });
});
