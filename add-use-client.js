const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'src/app');

// Function to check if a file uses React hooks
function usesHooks(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return /(useState|useEffect|useRef|useRouter|useParams|useSession|usePathname)\(/.test(content);
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return false;
  }
}

// Function to add 'use client' directive
function addUseClient(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has 'use client' or is a server component
    if (content.includes("'use client'") || content.includes('"use client"')) {
      return false;
    }
    
    // Add 'use client' at the top
    const lines = content.split('\n');
    let newContent = '';
    
    // Find the first non-comment line
    let i = 0;
    while (i < lines.length && (lines[i].trim().startsWith('//') || lines[i].trim() === '')) {
      newContent += lines[i] + '\n';
      i++;
    }
    
    // Add 'use client' directive
    newContent += "'use client';\n\n";
    
    // Add the rest of the content
    for (; i < lines.length; i++) {
      newContent += lines[i] + (i < lines.length - 1 ? '\n' : '');
    }
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  } catch (err) {
    console.error(`Error updating file ${filePath}:`, err);
    return false;
  }
}

// Recursively process all .tsx and .ts files in the app directory
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  let count = 0;
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      count += processDirectory(filePath);
    } else if ((file.endsWith('.tsx') || file.endsWith('.ts')) && !file.endsWith('.d.ts')) {
      if (usesHooks(filePath)) {
        if (addUseClient(filePath)) {
          console.log(`Added 'use client' to ${filePath}`);
          count++;
        }
      }
    }
  });
  
  return count;
}

console.log('Adding "use client" directive to client components...');
const updatedCount = processDirectory(rootDir);
console.log(`\nDone! Updated ${updatedCount} files.`);
