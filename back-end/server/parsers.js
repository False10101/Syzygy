// server/parsers.js

/**
 * THE UNIVERSAL NORMALIZER
 * 1. Strips all quote types (single, double, backtick).
 * 2. Strips query parameters.
 * 3. Converts all dynamic variable formats (${id}, [id], :id, <id>) into {id}.
 */
function normalizePath(path) {
    if (!path) return '';
    let clean = path.trim();

    // 1. Strip wrapping quotes AND BACKTICKS
    // Matches: 'path', "path", `path`
    clean = clean.replace(/^['"`]|['"`]$/g, '');

    // 2. Strip Query Parameters (everything after ?)
    // `/api/note/get?id=${id}` -> `/api/note/get`
    clean = clean.split('?')[0];

    // 3. Handle JS Template Variables (The React/Next.js Fix)
    // `/api/users/${userId}` -> `/api/users/{userId}`
    clean = clean.replace(/\$\{([^}]+)\}/g, '{$1}');

    // 4. Handle Framework Specifics
    clean = clean
        // Flask: <int:id> -> {id}
        .replace(/<[a-zA-Z0-9_:]*:([a-zA-Z0-9_]+)>/g, '{$1}') 
        // Flask simple: <id> -> {id}
        .replace(/<([a-zA-Z0-9_]+)>/g, '{$1}')
        // Next.js: [id] -> {id}
        .replace(/\[([a-zA-Z0-9_.]+)\]/g, '{$1}')
        // Express: :id -> {id}
        .replace(/:([a-zA-Z0-9_.]+)/g, '{$1}');

    return clean;
}

const PARSERS = {
    // ----------------------
    // BACKEND PARSERS
    // ----------------------

    // 1. NODE / EXPRESS
    express: {
        pattern: /\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
        extract: (match) => ({
            method: match[1].toUpperCase(),
            path: normalizePath(match[2]),
            original: match[0]
        })
    },

    // 2. PYTHON / FLASK
    flask: {
        pattern: /@app\.route\s*\(\s*['"`]([^'"`]+)['"`](?:,\s*methods=\['([^']+)'\])?/gi,
        extract: (match) => ({
            method: match[2] ? match[2].toUpperCase() : 'GET',
            path: normalizePath(match[1]),
            original: match[0]
        })
    },

    // 3. PYTHON / FASTAPI
    fastapi: {
        pattern: /@app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
        extract: (match) => ({
            method: match[1].toUpperCase(),
            path: normalizePath(match[2]),
            original: match[0]
        })
    },

    // 4. NEXT.JS APP ROUTER
    nextjs: {
        pattern: /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/gi,
        extract: (match) => ({
            method: match[1].toUpperCase(),
            path: null, // Path is derived from file structure later
            original: match[0]
        })
    },

    // ----------------------
    // FRONTEND PARSERS
    // ----------------------

    // 5. AXIOS (Captures variables + backticks)
    frontend: {
        // Looks for axios.get(ANYTHING_UNTIL_COMMA_OR_PAREN)
        pattern: /(?:axios|http|api)\.(get|post|put|delete|patch)\s*\(\s*([^,)]+)/gi,
        extract: (match) => ({
            method: match[1].toUpperCase(),
            path: normalizePath(match[2]),
            original: match[0]
        })
    },
    
    // 6. NATIVE FETCH (Captures variables + backticks)
    fetch: {
        // Looks for fetch(ANYTHING_UNTIL_COMMA_OR_PAREN)
        pattern: /fetch\s*\(\s*([^,)]+)/gi,
        extract: (match) => {
            return {
                method: 'GET', // Fetch defaults to GET
                path: normalizePath(match[1]),
                original: match[0]
            }
        }
    }
};

module.exports = { PARSERS };