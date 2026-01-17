# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-17

### Added

- Initial release of Speckit Autopilot
- Full autopilot workflow tool (`speckit_autopilot`)
- Individual workflow tools:
  - `speckit_specify` - Create feature specifications
  - `speckit_clarify` - Generate clarification questions
  - `speckit_plan` - Create implementation plans
  - `speckit_tasks` - Generate task lists
  - `speckit_implement` - Get implementation tasks
  - `speckit_review` - Review code quality
  - `speckit_mark_task_complete` - Mark tasks complete
- Comprehensive path validation and normalization
- Workflow state tracking
- Error handling with clear messages
- Unit tests with Jest
- Setup script for easy configuration
- Complete documentation

### Fixed

- Undefined path issues in all tools
- Missing field validation in script results
- Error handling for edge cases
- Parameter validation in utility functions

### Security

- Input validation for all user inputs
- Path normalization to prevent directory traversal
- Type safety with TypeScript strict mode

## [Unreleased]

### Planned

- Integration tests for full workflow
- CI/CD pipeline setup
- Additional tool options
- Performance optimizations
- Enhanced error recovery

---

## Version History

- **1.0.0** - Initial release with full workflow automation
