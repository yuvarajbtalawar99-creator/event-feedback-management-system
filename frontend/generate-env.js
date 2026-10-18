const fs = require('fs');
const path = require('path');

// Load .env if present
const envPath = path.join(__dirname, '.env');
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

const apiUrl = process.env.API_URL || process.env.VITE_API_URL || '';
const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';

const content = `/* Runtime environment configuration */
window.__ENV__ = {
  API_URL: ${JSON.stringify(apiUrl)},
  GOOGLE_CLIENT_ID: ${JSON.stringify(googleClientId)}
};
`;

const targetFile = path.join(__dirname, 'env.js');
fs.writeFileSync(targetFile, content, 'utf8');

console.log(`✅ Successfully generated ${targetFile}`);
console.log(`   API_URL: ${apiUrl || '(will use auto-detection)'}`);
console.log(`   GOOGLE_CLIENT_ID: ${googleClientId ? googleClientId.slice(0, 15) + '...' : '(none)'}`);
