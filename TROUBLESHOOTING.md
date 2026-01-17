# Troubleshooting Guide

## "require is not defined" Error

If you're seeing the error `"require is not defined"` when using the MCP server, follow these steps:

### 1. Rebuild the Project

```bash
cd /path/to/mcp-speckit-server
npm run build
```

### 2. Verify the Build

```bash
npm run verify
# or
npm run build:verify
```

This will test that all modules can be imported correctly.

### 3. Restart the MCP Server

The MCP server process needs to be restarted to pick up the new build:

#### Option A: Restart Cursor/IDE
- Completely quit and restart Cursor (or your IDE)
- This will restart the MCP server process

#### Option B: Restart MCP Server Manually
If you're running the server manually:
```bash
# Kill any running processes
pkill -f "node.*dist/index.js"

# Start fresh
npm start
```

### 4. Check MCP Configuration

Verify your MCP configuration file (usually `.cursor/mcp.json` or similar) points to the correct path:

```json
{
  "mcpServers": {
    "speckit": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-speckit-server/dist/index.js"]
    }
  }
}
```

**Important**: Use an **absolute path** to `dist/index.js`, not a relative path.

### 5. Verify Node.js Version

Ensure you're using Node.js 20+ (required for ES modules):

```bash
node --version
# Should show v20.x.x or higher
```

### 6. Clear Node Modules Cache (if needed)

If issues persist, try clearing caches:

```bash
rm -rf node_modules dist
npm install
npm run build
npm run verify
```

## Common Issues

### Issue: "Module not found" errors

**Solution**: Ensure the build completed successfully:
```bash
npm run build
ls -la dist/
```

### Issue: "Cannot find module" errors

**Solution**: Check that all imports use `.js` extensions:
- ✅ `import { x } from './file.js'`
- ❌ `import { x } from './file'`

### Issue: MCP server not responding

**Solution**: 
1. Check MCP server logs (usually in IDE logs)
2. Verify the server process is running
3. Check file permissions on `dist/index.js`

### Issue: Functions not working after rebuild

**Solution**: Always restart the MCP server after rebuilding:
1. Rebuild: `npm run build`
2. Verify: `npm run verify`
3. Restart Cursor/IDE

## Verification Checklist

Before reporting an issue, verify:

- [ ] Project builds successfully (`npm run build`)
- [ ] Build verification passes (`npm run verify`)
- [ ] Node.js version is 20+ (`node --version`)
- [ ] MCP server has been restarted
- [ ] MCP configuration uses absolute path
- [ ] All tests pass (`npm test`)

## Getting Help

If the issue persists after following these steps:

1. Check the build output: `npm run build:verify`
2. Check test results: `npm test`
3. Check MCP server logs in your IDE
4. Verify the error message and stack trace

## Quick Fix Script

Run this to rebuild and verify everything:

```bash
#!/bin/bash
cd /path/to/mcp-speckit-server
echo "Building..."
npm run build
echo "Verifying..."
npm run verify
echo "Running tests..."
npm test
echo "Done! Now restart Cursor/IDE to pick up changes."
```
