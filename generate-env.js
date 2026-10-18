const fs = require('fs');
const path = require('path');

// 1. Load from .env if present (frontend/.env or .env)
const envCandidates = [
  path.join(__dirname, '.env'),
  path.join(__dirname, 'frontend', '.env')
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        const key = k.trim();
        const val = v.join('=').trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

// 2. Read environment variables (supports standard or VITE_ prefix)
const apiUrl = process.env.API_URL || process.env.VITE_API_URL || '';
const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';

// 3. Generate env.js
const content = `/* Runtime environment configuration */
window.__ENV__ = {
  API_URL: ${JSON.stringify(apiUrl)},
  GOOGLE_CLIENT_ID: ${JSON.stringify(googleClientId)}
};
`;

const targetDir = fs.existsSync(path.join(__dirname, 'frontend'))
  ? path.join(__dirname, 'frontend')
  : __dirname;

const targetFile = path.join(targetDir, 'env.js');
fs.writeFileSync(targetFile, content, 'utf8');

console.log(`✅ Successfully generated ${targetFile}`);
console.log(`   API_URL: ${apiUrl || '(will use auto-detection)'}`);
console.log(`   GOOGLE_CLIENT_ID: ${googleClientId ? googleClientId.slice(0, 15) + '...' : '(none)'}`);
