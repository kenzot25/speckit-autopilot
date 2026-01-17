# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities to **[kenzo.devweb@gmail.com](mailto:kenzo.devweb@gmail.com)**. You will receive a response within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity but historically within a few days.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Best Practices

### For Users

1. **Keep dependencies updated**: Regularly run `npm audit` and `npm update`
2. **Use absolute paths**: Always use absolute paths in MCP configuration
3. **Validate inputs**: The server validates all inputs, but be cautious with user-provided data
4. **Review scripts**: Review any bash scripts executed by the server
5. **File permissions**: Ensure proper file permissions on scripts and directories

### For Developers

1. **Input validation**: Always validate and sanitize inputs
2. **Path normalization**: Normalize all paths to prevent directory traversal
3. **Error handling**: Don't expose sensitive information in error messages
4. **Dependencies**: Keep dependencies up-to-date and review security advisories
5. **Testing**: Write tests for security-sensitive code paths

## Known Security Considerations

### Path Traversal

- All paths are normalized to absolute paths
- Script results are validated before use
- File operations check for path validity

### Script Execution

- Scripts are executed with limited permissions
- Script output is validated before parsing
- Errors are caught and handled gracefully

### State Management

- State files contain workflow metadata only
- No sensitive data is stored in state files
- State files are project-local only

## Disclosure Policy

- We follow responsible disclosure practices
- Security issues are fixed before public disclosure
- Credit will be given to reporters (if desired)

## Security Updates

Security updates will be:
- Released as patch versions (e.g., 1.0.1)
- Documented in [CHANGELOG.md](CHANGELOG.md)
- Announced via GitHub releases

Thank you for helping keep Speckit Autopilot secure!
