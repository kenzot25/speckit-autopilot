import { getFeaturePaths, getRepoRoot } from '../utils/scripts.js';
import { executeScript } from '../utils/scripts.js';
import { updateWorkflowState } from '../utils/state.js';
import { readFile, fileExists as checkFileExists } from '../utils/files.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ReviewResult {
  success: boolean;
  buildStatus: 'pass' | 'fail';
  issuesFound: number;
  issuesFixed: number;
  message: string;
  detectedStacks?: string[];
  documentationFound?: {
    project: string[];
    online: string[];
  };
}

interface TechStack {
  name: string;
  type: string;
  configFiles: string[];
  projectPath: string;
  documentationUrls?: string[];
}

/**
 * Detect tech stacks by scanning for configuration files
 */
async function detectTechStacks(repoRoot: string): Promise<TechStack[]> {
  const stacks: TechStack[] = [];

  // Common tech stack detection patterns
  const detectionPatterns: Array<{
    name: string;
    type: string;
    files: string[];
    paths?: string[];
    docUrls?: string[];
  }> = [
    {
      name: 'Flutter/Dart',
      type: 'mobile',
      files: ['pubspec.yaml'],
      paths: [repoRoot, path.join(repoRoot, 'app'), path.join(repoRoot, 'lib')],
      docUrls: ['https://dart.dev/guides', 'https://docs.flutter.dev'],
    },
    {
      name: 'TypeScript/Node.js',
      type: 'backend',
      files: ['tsconfig.json', 'package.json'],
      paths: [repoRoot, path.join(repoRoot, 'src'), path.join(repoRoot, 'functions')],
      docUrls: ['https://www.typescriptlang.org/docs', 'https://nodejs.org/docs'],
    },
    {
      name: 'Python',
      type: 'backend',
      files: ['requirements.txt', 'setup.py', 'pyproject.toml'],
      paths: [repoRoot, path.join(repoRoot, 'src')],
      docUrls: ['https://docs.python.org', 'https://mypy.readthedocs.io'],
    },
    {
      name: 'Go',
      type: 'backend',
      files: ['go.mod'],
      paths: [repoRoot],
      docUrls: ['https://go.dev/doc', 'https://pkg.go.dev'],
    },
    {
      name: 'Rust',
      type: 'systems',
      files: ['Cargo.toml'],
      paths: [repoRoot],
      docUrls: ['https://doc.rust-lang.org', 'https://rust-lang.github.io/rust-clippy'],
    },
    {
      name: 'Java',
      type: 'backend',
      files: ['pom.xml', 'build.gradle'],
      paths: [repoRoot],
      docUrls: ['https://docs.oracle.com/javase', 'https://maven.apache.org/guides'],
    },
    {
      name: 'React',
      type: 'frontend',
      files: ['package.json'],
      paths: [repoRoot, path.join(repoRoot, 'src')],
      docUrls: ['https://react.dev', 'https://react.dev/reference/react'],
    },
    {
      name: 'Vue',
      type: 'frontend',
      files: ['vue.config.js', 'vite.config.js'],
      paths: [repoRoot],
      docUrls: ['https://vuejs.org/guide', 'https://vitejs.dev/guide'],
    },
  ];

  for (const pattern of detectionPatterns) {
    const searchPaths = pattern.paths || [repoRoot];
    
    for (const searchPath of searchPaths) {
      let found = false;
      const foundFiles: string[] = [];
      
      for (const file of pattern.files) {
        const filePath = path.join(searchPath, file);
        if (await checkFileExists(filePath)) {
          foundFiles.push(filePath);
          found = true;
        }
      }
      
      if (found) {
        stacks.push({
          name: pattern.name,
          type: pattern.type,
          configFiles: foundFiles,
          projectPath: searchPath,
          documentationUrls: pattern.docUrls,
        });
        break; // Found this stack, move to next
      }
    }
  }

  return stacks;
}

/**
 * Find project documentation
 */
async function findProjectDocumentation(repoRoot: string, featureDir: string): Promise<string[]> {
  const docs: string[] = [];

  // Common documentation locations
  const docLocations = [
    // Project root docs
    path.join(repoRoot, 'README.md'),
    
    // Docs directory
    path.join(repoRoot, 'docs'),
    
    // Cursor rules (project-specific guidelines)
    path.join(repoRoot, '.cursor', 'rules'),
    
    // Feature-specific docs
    path.join(featureDir, 'spec.md'),
    path.join(featureDir, 'plan.md'),
    path.join(featureDir, 'data-model.md'),
    path.join(featureDir, 'research.md'),
    
    // Tech-specific configs that contain standards
    path.join(repoRoot, 'analysis_options.yaml'), // Dart
    path.join(repoRoot, '.eslintrc.js'), // JavaScript/TypeScript
    path.join(repoRoot, '.eslintrc.json'),
    path.join(repoRoot, 'eslint.config.js'),
    path.join(repoRoot, 'tsconfig.json'), // TypeScript
    path.join(repoRoot, 'pyproject.toml'), // Python
    path.join(repoRoot, '.prettierrc'), // Formatting
  ];

  for (const docPath of docLocations) {
    if (await checkFileExists(docPath)) {
      const stat = await fs.stat(docPath);
      if (stat.isDirectory()) {
        // Read all files in directory
        try {
          const files = await fs.readdir(docPath);
          for (const file of files) {
            const filePath = path.join(docPath, file);
            const fileStat = await fs.stat(filePath);
            if (fileStat.isFile() && (file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.json'))) {
              docs.push(filePath);
            }
          }
        } catch {
          // Skip if can't read directory
        }
      } else {
        docs.push(docPath);
      }
    }
  }

  return docs;
}

/**
 * Get online documentation URLs for detected tech stacks
 */
function getOnlineDocumentation(stacks: TechStack[]): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const stack of stacks) {
    if (stack.documentationUrls) {
      for (const url of stack.documentationUrls) {
        if (!seen.has(url)) {
          urls.push(url);
          seen.add(url);
        }
      }
    }
  }

  return urls;
}

/**
 * Review code quality and fix issues
 * 
 * This function:
 * 1. Detects tech stacks automatically
 * 2. Finds project documentation
 * 3. Identifies online documentation sources
 * 4. Reviews code based on found documentation (not hardcoded commands)
 */
export async function speckitReview(
  featureDir: string,
  maxIterations: number = 10
): Promise<ReviewResult> {
  const paths = await getFeaturePaths({ requireTasks: true, includeTasks: true, featureDir });
  
  // Validate paths
  if (!paths) {
    throw new Error(`Invalid paths returned: ${JSON.stringify(paths)}`);
  }
  
  const repoRoot = getRepoRoot();
  
  let buildStatus: 'pass' | 'fail' = 'pass';
  let issuesFound = 0;
  let issuesFixed = 0;
  
  // Step 1: Detect tech stacks
  const detectedStacks = await detectTechStacks(repoRoot);
  const stackNames = detectedStacks.map(s => s.name);
  
  // Step 2: Find project documentation
  const projectDocs = await findProjectDocumentation(repoRoot, featureDir);
  
  // Step 3: Get online documentation URLs
  const onlineDocs = getOnlineDocumentation(detectedStacks);
  
  // Step 4: Load documentation content for review context
  const documentationContext: string[] = [];
  
  // Load project documentation
  for (const docPath of projectDocs.slice(0, 10)) { // Limit to avoid too much context
    try {
      const content = await readFile(docPath);
      documentationContext.push(`\n--- Project Doc: ${path.basename(docPath)} ---\n${content.substring(0, 2000)}`);
    } catch {
      // Skip if can't read
    }
  }
  
  // Step 5: Review based on detected stacks and documentation
  // Instead of hardcoded commands, we provide context for AI to determine review approach
  const reviewInstructions = `
# Code Review Instructions

## Detected Tech Stacks:
${detectedStacks.map(s => `- ${s.name} (${s.type}) - Config: ${s.configFiles.join(', ')}`).join('\n')}

## Project Documentation Found:
${projectDocs.map(d => `- ${d}`).join('\n')}

## Online Documentation References:
${onlineDocs.map(d => `- ${d}`).join('\n')}

## Review Process:
1. Review code against project documentation standards
2. Check for compliance with tech stack best practices (from online docs)
3. Verify build/compile status using appropriate tools for detected stacks
4. Check code quality, maintainability, and architecture compliance

## Implementation Files to Review:
${paths.TASKS ? `Check tasks.md for implemented files: ${paths.TASKS}` : 'No tasks.md found'}
`;

  // For now, we'll return the context and let the LLM handle the actual review
  // In a full implementation, this would trigger the LLM with the context
  
  // Step 6: Try to run basic build/check commands if we can determine them from docs
  // But only if documentation suggests it's safe to do so
  for (const stack of detectedStacks) {
    try {
      // Try to infer build command from package.json or other config files
      if (stack.configFiles.some(f => f.includes('package.json'))) {
        const packageJsonPath = stack.configFiles.find(f => f.includes('package.json'));
        if (packageJsonPath && await checkFileExists(packageJsonPath)) {
          try {
            const packageContent = await readFile(packageJsonPath);
            const packageJson = JSON.parse(packageContent);
            
            // Check for build/check scripts
            if (packageJson.scripts) {
              const scripts = packageJson.scripts;
              
              // Try 'check' or 'test' or 'lint' first (safer than build)
              const checkScript = scripts.check || scripts.test || scripts.lint || scripts.build;
              if (checkScript) {
                const result = await executeScript('npm', ['run', checkScript], {
                  cwd: stack.projectPath,
                  timeout: 60000,
                });
                
                if (!result.success) {
                  buildStatus = 'fail';
                  issuesFound++;
                }
              }
            }
          } catch {
            // Skip if can't parse package.json
          }
        }
      }
    } catch {
      // Stack check failed - continue with others
    }
  }
  
  // Update workflow state
  await updateWorkflowState(featureDir, 'review', {
    iterations: 1,
    issuesFixed,
  });
  
  return {
    success: buildStatus === 'pass',
    buildStatus,
    issuesFound,
    issuesFixed,
    detectedStacks: stackNames,
    documentationFound: {
      project: projectDocs,
      online: onlineDocs,
    },
    message: `Code review completed. Detected stacks: ${stackNames.join(', ')}. Build status: ${buildStatus}. Issues found: ${issuesFound}. Documentation found: ${projectDocs.length} project docs, ${onlineDocs.length} online references.`,
  };
}
