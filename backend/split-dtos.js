const fs = require('fs');
const path = require('path');
const glob = require('glob');

function splitFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let currentFile = null;
  let currentContent = [];
  
  // Find match like: // src/modules/something/something.ts
  // or: // ====== \n // src/...
  const regex = /^\/\/\s*(src\/modules\/[a-zA-Z0-9_\-\.\/]+)\s*$/;
  
  for (let line of lines) {
    const match = line.match(regex);
    if (match) {
      if (currentFile) {
        fs.writeFileSync(currentFile, currentContent.join('\n').trim() + '\n');
      }
      
      const relativePath = match[1];
      currentFile = path.resolve(__dirname, relativePath);
      currentContent = [line];
      
      const dir = path.dirname(currentFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } else {
      if (currentFile) {
        currentContent.push(line);
      } else {
        // Just keep appending to the first file until a match is found
        currentFile = filePath;
        currentContent.push(line);
      }
    }
  }
  
  if (currentFile) {
    fs.writeFileSync(currentFile, currentContent.join('\n').trim() + '\n');
  }
}

const files = glob.sync('src/modules/**/*.ts');
for (const file of files) {
  // Read first to check if it has multiple files
  const content = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
  const regex = /^\/\/\s*(src\/modules\/[a-zA-Z0-9_\-\.\/]+)\s*$/m;
  if (regex.test(content)) {
    splitFile(path.resolve(__dirname, file));
  }
}
