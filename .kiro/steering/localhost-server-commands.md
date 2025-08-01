---
inclusion: always
---

# Localhost Server Commands

## Open Command Instructions

When executing `open` commands for HTML files or web applications:

1. **Always use localhost server**: Instead of opening files directly with `open filename.html`, start a local server first
2. **Preferred method**: Use Python's built-in HTTP server or Node.js serve
3. **Default port**: Use port 8000 unless specified otherwise
4. **Server commands**:
   - Python 3: `python3 -m http.server 8000`
   - Python 2: `python -m SimpleHTTPServer 8000`
   - Node.js (if available): `npx serve -p 8000`

## Implementation Pattern

When a user requests to open an HTML file or test a web application:

1. Start the localhost server in the background
2. Open the browser to `http://localhost:8000/filename.html`
3. Inform the user that the server is running and how to stop it

## Example Usage

Instead of:

```bash
open test-results-display.html
```

Use:

```bash
python3 -m http.server 8000 &
open http://localhost:8000/test-results-display.html
```

## Rationale

- Prevents CORS issues when loading local files
- Ensures proper JavaScript module loading
- Simulates production environment more accurately
- Allows for proper testing of web applications
- Enables proper file serving for assets and resources

## Server Management

- Always inform the user when starting a server
- Provide instructions on how to stop the server (usually `Ctrl+C` or kill the background process)
- Use background processes (`&`) when appropriate to allow continued terminal use
