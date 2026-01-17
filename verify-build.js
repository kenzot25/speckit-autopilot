#!/usr/bin/env node
/**
 * Verification script to test that the build output works correctly
 * Run this after building to ensure all modules can be imported
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { access } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distRoot = join(__dirname, 'dist');

async function verifyModule(modulePath, moduleName) {
  try {
    const module = await import(modulePath);
    console.log(`✅ ${moduleName}: OK (exports: ${Object.keys(module).join(', ')})`);
    return true;
  } catch (error) {
    console.error(`❌ ${moduleName}: FAILED`);
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
    return false;
  }
}

async function main() {
  console.log('Verifying build output...\n');
  
  // Check dist directory exists
  try {
    await access(distRoot);
  } catch {
    console.error('❌ dist/ directory does not exist. Run npm run build first.');
    process.exit(1);
  }
  
  let allPassed = true;
  
  // Test tool modules
  console.log('Testing tool modules:');
  allPassed = await verifyModule(join(distRoot, 'tools', 'specify.js'), 'tools/specify.js') && allPassed;
  allPassed = await verifyModule(join(distRoot, 'tools', 'clarify.js'), 'tools/clarify.js') && allPassed;
  allPassed = await verifyModule(join(distRoot, 'tools', 'plan.js'), 'tools/plan.js') && allPassed;
  allPassed = await verifyModule(join(distRoot, 'tools', 'tasks.js'), 'tools/tasks.js') && allPassed;
  allPassed = await verifyModule(join(distRoot, 'tools', 'implement.js'), 'tools/implement.js') && allPassed;
  allPassed = await verifyModule(join(distRoot, 'tools', 'review.js'), 'tools/review.js') && allPassed;
  allPassed = await verifyModule(join(distRoot, 'tools', 'autopilot.js'), 'tools/autopilot.js') && allPassed;
  
  console.log('\nTesting utility modules:');
  allPassed = await verifyModule(join(distRoot, 'utils', 'scripts.js'), 'utils/scripts.js') && allPassed;
  allPassed = await verifyModule(join(distRoot, 'utils', 'files.js'), 'utils/files.js') && allPassed;
  allPassed = await verifyModule(join(distRoot, 'utils', 'state.js'), 'utils/state.js') && allPassed;
  
  console.log('\nTesting main entry point:');
  allPassed = await verifyModule(join(distRoot, 'index.js'), 'index.js') && allPassed;
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All modules verified successfully!');
    process.exit(0);
  } else {
    console.log('❌ Some modules failed verification.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
