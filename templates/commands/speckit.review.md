---
description: Comprehensive code review checking build issues, best practices, code quality, and maintainability. Fixes issues iteratively until code is clean.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Overview

This command performs a comprehensive code review of the implemented feature, checking for:
- **Build/Compile Issues**: TypeScript, Dart, and other language-specific errors
- **Best Practices**: Adherence to latest documentation and industry standards
- **Code Quality**: Clean, solid, maintainable, and scalable code
- **Code Organization**: Proper file splitting, file length, component structure
- **Type Safety**: All type issues resolved
- **Architecture Compliance**: Follows project conventions and patterns

The review runs iteratively, fixing issues until the code passes all checks.

**MCP Server Integration**: This command uses the MCP server tool `speckit_review` for deterministic execution. If the MCP server is configured, it will be used automatically. Otherwise, the command falls back to manual review steps.

## Execution Steps

### Step 1: Setup and Context Loading

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. Load implementation context:
   - **REQUIRED**: Read tasks.md to identify implemented files
   - **REQUIRED**: Read plan.md for tech stack and architecture requirements
   - **IF EXISTS**: Read spec.md for feature requirements
   - **IF EXISTS**: Read data-model.md, contracts/, research.md for design context

3. Identify codebase type:
   - Detect primary language(s): Dart/Flutter, TypeScript/Node.js, etc.
   - Load relevant linting/analysis configs: `analysis_options.yaml`, `tsconfig.json`, `eslint.config.*`, etc.
   - Load project-specific rules: `.cursor/rules/*.mdc`, `DEVELOPMENT.md`

### Step 2: Build and Compile Checks

**Goal**: Ensure code compiles without errors or warnings.

**For Dart/Flutter**:
- Run `flutter analyze` from the Flutter project directory
- Run `flutter build` (or `flutter build apk --debug` for faster check)
- Parse output for:
  - Compile errors
  - Type errors
  - Null-safety issues
  - Linter warnings
  - Deprecation warnings

**For TypeScript/Node.js**:
- Run `npm run build` or `tsc --noEmit` from functions directory
- Parse output for:
  - Type errors
  - Compile errors
  - ESLint errors/warnings
  - Implicit `any` types

**For other languages**: Use appropriate build/compile commands.

**Action**: If errors found, fix them immediately and re-run checks.

### Step 3: Code Quality Review

**Goal**: Ensure code follows best practices and quality standards.

#### 3.1 Best Practices Check

- **Latest Documentation**: Search for latest best practices for:
  - Language version (Dart 3.x, TypeScript 5.x, etc.)
  - Framework version (Flutter 3.x, Node.js 20.x, etc.)
  - Libraries used (Firebase, Provider, etc.)
- **Industry Standards**: Verify adherence to:
  - SOLID principles
  - DRY (Don't Repeat Yourself)
  - KISS (Keep It Simple, Stupid)
  - YAGNI (You Aren't Gonna Need It)

#### 3.2 Code Cleanliness

Check for:
- **Dead Code**: Unused imports, variables, functions, classes
- **Code Smells**: Long parameter lists, magic numbers, deep nesting
- **Naming**: Clear, descriptive names following project conventions
- **Comments**: Appropriate documentation, no commented-out code
- **Formatting**: Consistent style (use `dart format`, `prettier`, etc.)

#### 3.3 Maintainability

Check for:
- **Complexity**: Functions/methods should be short and focused
- **Coupling**: Low coupling between modules
- **Cohesion**: High cohesion within modules
- **Dependencies**: Minimal external dependencies, clear dependency management
- **Error Handling**: Proper try-catch blocks, error propagation
- **Logging**: Appropriate logging for debugging and monitoring

#### 3.4 Scalability

Check for:
- **Performance**: Efficient algorithms, proper use of async/await
- **Memory**: No memory leaks, proper resource cleanup
- **Concurrency**: Thread-safe code where applicable
- **Database**: Efficient queries, proper indexing considerations
- **Caching**: Appropriate caching strategies

### Step 4: Code Organization Review

**Goal**: Ensure code is properly structured and organized.

#### 4.1 File Structure

- **File Length**: 
  - Dart files: Should be < 300 lines (ideally < 200)
  - TypeScript files: Should be < 400 lines (ideally < 300)
  - If exceeded, recommend splitting into smaller components/modules
- **File Naming**: Follows project conventions:
  - Dart: `snake_case.dart`
  - TypeScript: `kebab-case.ts` or `camelCase.ts` (per project)
- **Directory Structure**: Follows feature-first or module-based organization

#### 4.2 Component Splitting

- **Widgets**: Large widgets split into smaller, reusable components
- **Functions**: Long functions split into smaller, focused functions
- **Classes**: Single Responsibility Principle - classes have one clear purpose
- **Modules**: Proper module boundaries, clear exports

#### 4.3 Architecture Compliance

- **State Management**: Follows project patterns (Provider, Riverpod, etc.)
- **Data Flow**: Unidirectional data flow where applicable
- **Separation of Concerns**: UI, business logic, and data layers separated
- **Dependency Injection**: Proper use of DI patterns

### Step 5: Type Safety Review

**Goal**: Ensure all type issues are resolved.

- **Dart**: 
  - No `dynamic` types (unless absolutely necessary)
  - Proper null-safety handling
  - Explicit return types
- **TypeScript**:
  - No implicit `any`
  - Proper type definitions
  - Generic types used appropriately
- **Type Coverage**: Aim for 100% type coverage

### Step 6: Project-Specific Rules

**Goal**: Ensure compliance with project-specific conventions.

Load and check against:
- `.cursor/rules/*.mdc` files (Flutter rules, clean code rules, etc.)
- `DEVELOPMENT.md` guidelines
- Architecture patterns defined in `plan.md`
- Code style guides

**For Poop Diary specifically**:
- Feature-first organization (`lib/features/`)
- Provider for state management
- Firebase for backend
- Soft Chaos design system
- File naming conventions
- Widget splitting rules (one widget per file, < 150 lines)

### Step 7: Generate Review Report

Create a structured report with:

**Issues Found**:
- **CRITICAL**: Build/compile errors (must fix)
- **HIGH**: Type errors, architecture violations (should fix)
- **MEDIUM**: Code quality issues, best practice violations (recommended to fix)
- **LOW**: Style issues, minor improvements (optional)

**Report Format**:
```markdown
## Code Review Report

### Build Status
- [ ] Dart/Flutter: ✓ Pass / ✗ Fail
- [ ] TypeScript: ✓ Pass / ✗ Fail

### Issues Summary
| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | X | Fixed / Pending |
| HIGH | Y | Fixed / Pending |
| MEDIUM | Z | Fixed / Pending |
| LOW | W | Fixed / Pending |

### Detailed Issues
[Issue ID] [Severity] [File:Line] [Description] [Fix Applied]
```

### Step 8: Fix Issues Iteratively

**Process**:
1. Fix all CRITICAL issues first (build/compile errors)
2. Fix HIGH issues (type errors, architecture violations)
3. Fix MEDIUM issues (code quality, best practices)
4. Re-run checks after each batch of fixes
5. Continue until all CRITICAL and HIGH issues are resolved

**Fix Strategy**:
- Apply fixes directly to code files
- Update related files if needed
- Ensure fixes don't break existing functionality
- Re-run build/analyze commands after fixes

### Step 9: Validation Loop

**Loop until clean**:
1. Run build/compile checks
2. Run code quality checks
3. If any CRITICAL or HIGH issues remain:
   - Fix issues
   - Re-run checks
   - Continue loop
4. If only LOW issues remain:
   - Report remaining LOW issues
   - Ask user if they want to fix LOW issues or proceed
5. If all checks pass:
   - Report success
   - Exit loop

**Maximum Iterations**: 10 iterations to prevent infinite loops. If issues persist after 10 iterations, report remaining issues and ask user for guidance.

### Step 10: Final Report

After all issues are resolved (or max iterations reached):

**Success Criteria**:
- ✓ No build/compile errors
- ✓ No type errors
- ✓ Code follows best practices
- ✓ Code is properly organized
- ✓ Architecture compliance verified

**Output**:
- Summary of all fixes applied
- Remaining LOW issues (if any)
- Code quality metrics
- Recommendations for future improvements

## Error Handling

- **If build fails**: Stop and fix critical errors before proceeding
- **If fixes break functionality**: Revert and try alternative approach
- **If max iterations reached**: Report remaining issues and ask user for guidance

## Integration with Autopilot

When called from `/speckit.autopilot`:
- Runs automatically after `/speckit.implement`
- Loops until code is clean (no CRITICAL or HIGH issues)
- Reports progress after each iteration
- Can be skipped with "skip review" command

## Example Output

```
## Code Review - Iteration 1

### Build Status
- Dart/Flutter: ✗ Fail (3 errors)
- TypeScript: ✓ Pass

### Issues Found
- [CRITICAL] dart:lib/features/session/session_screen.dart:45 - Null safety error
- [HIGH] dart:lib/shared/providers/auth_provider.dart:120 - Missing return type
- [MEDIUM] dart:lib/features/profile/profile_screen.dart:250 - File too long (280 lines)

### Fixes Applied
- Fixed null safety error in session_screen.dart
- Added explicit return type to auth_provider.dart

### Re-running checks...
```

## Notes

- This command modifies code files to fix issues
- All fixes should preserve functionality
- Follow project conventions when applying fixes
- Document non-obvious fixes with comments
