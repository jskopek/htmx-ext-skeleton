/**
 * Simple HTTP server for testing
 * Serves static files with configurable delays to simulate network latency
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = 3000;
const DEFAULT_DELAY = 0;

// Parse command line arguments
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='));
const delayArg = args.find(arg => arg.startsWith('--delay='));

const PORT = portArg ? parseInt(portArg.split('=')[1]) : DEFAULT_PORT;
const DELAY = delayArg ? parseInt(delayArg.split('=')[1]) : DEFAULT_DELAY;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
};

const server = http.createServer((req, res) => {
    // Decode URL to handle encoded characters
    let filePath = decodeURIComponent(req.url);

    // Remove query string
    filePath = filePath.split('?')[0];

    // Default to index.html
    if (filePath === '/' || filePath === '/tests/fixtures/' || filePath === '/tests/fixtures') {
        filePath = '/tests/fixtures/index.html';
    }

    // Resolve file path relative to project root
    const projectRoot = path.join(__dirname, '..', '..');
    const absolutePath = path.join(projectRoot, filePath);

    // Security check - ensure we're not serving files outside the project
    if (!absolutePath.startsWith(projectRoot)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Add delay if specified (for content.html only to simulate network latency)
    const shouldDelay = DELAY > 0 && filePath.includes('content.html');

    const serveFile = () => {
        fs.readFile(absolutePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }

            const ext = path.extname(absolutePath);
            const contentType = mimeTypes[ext] || 'application/octet-stream';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    };

    if (shouldDelay) {
        setTimeout(serveFile, DELAY);
    } else {
        serveFile();
    }
});

server.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}`);
    if (DELAY > 0) {
        console.log(`Artificial delay: ${DELAY}ms for content.html`);
    }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        process.exit(0);
    });
});
