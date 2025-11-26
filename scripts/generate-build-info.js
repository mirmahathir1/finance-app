const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const outputPath = path.join(__dirname, '..', 'public', 'build-info.json');

try {
  // Read package.json for version
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version || '0.1.0';

  // Generate build info
  const buildInfo = {
    buildTime: new Date().toISOString(),
    buildTimestamp: Date.now(),
    version: version,
  };

  // Ensure public directory exists
  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write build info
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2), 'utf8');

  console.log('Build info generated:', buildInfo);
} catch (error) {
  console.error('Error generating build info:', error.message);
  process.exit(1);
}

