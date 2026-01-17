import { getFeaturePaths } from '../utils/scripts.js';
import { readFile, writeFile, fileExists } from '../utils/files.js';
import { updateWorkflowState } from '../utils/state.js';

export interface ClarifyResult {
  success: boolean;
  questions: string[];
  specUpdated: boolean;
  message: string;
}

/**
 * Review specification and generate clarification questions
 */
export async function speckitClarify(
  featureDir: string,
  maxQuestions: number = 5
): Promise<ClarifyResult> {
  const paths = await getFeaturePaths({ featureDir });
  
  // Validate paths
  if (!paths || !paths.FEATURE_SPEC) {
    throw new Error(`Invalid paths returned: ${JSON.stringify(paths)}`);
  }
  
  if (!(await fileExists(paths.FEATURE_SPEC))) {
    throw new Error('spec.md not found. Run speckit_specify first.');
  }
  
  const specContent = await readFile(paths.FEATURE_SPEC);
  
  // Simple ambiguity detection - look for common vague terms
  const vagueTerms = [
    'fast', 'quick', 'slow', 'efficient', 'scalable', 'robust',
    'intuitive', 'user-friendly', 'easy', 'simple', 'complex',
    'secure', 'safe', 'reliable', 'available', 'performant'
  ];
  
  const questions: string[] = [];
  const lines = specContent.split('\n');
  
  for (const line of lines) {
    if (questions.length >= maxQuestions) break;
    
    const lowerLine = line.toLowerCase();
    for (const term of vagueTerms) {
      if (lowerLine.includes(term) && !questions.some(q => q.includes(term))) {
        questions.push(`The spec mentions "${term}" - can you provide specific, measurable criteria for this?`);
        break;
      }
    }
  }
  
  // Check for NEEDS CLARIFICATION markers
  const clarificationMatches = specContent.match(/\[NEEDS CLARIFICATION[:\s]+([^\]]+)\]/gi);
  if (clarificationMatches) {
    for (const match of clarificationMatches.slice(0, maxQuestions - questions.length)) {
      const question = match.replace(/\[NEEDS CLARIFICATION[:\s]+/i, '').replace(/\]/, '');
      questions.push(question);
    }
  }
  
  // Update workflow state
  await updateWorkflowState(featureDir, 'clarify', {
    roundsCompleted: 1,
    questionsAsked: questions.length,
  });
  
  return {
    success: true,
    questions,
    specUpdated: false,
    message: `Generated ${questions.length} clarification questions`,
  };
}
