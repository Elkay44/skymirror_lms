import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.join(__dirname, '../src/app/api');

async function updateFiles() {
  const files = await fs.promises.readdir(apiDir, { recursive: true });
  
  for (const file of files) {
    if (file.endsWith('.ts')) {
      const filePath = path.join(apiDir, file);
      let content = await fs.promises.readFile(filePath, 'utf-8');
      
      // Update imports
      content = content.replace('import { NextRequest, NextResponse }', 'import { NextResponse }');
      content = content.replace('import { type NextRequest, NextResponse }', 'import { NextResponse }');
      
      // Update function signatures
      content = content.replace(/request: NextRequest/g, 'request: Request');
      content = content.replace(/req: NextRequest/g, 'req: Request');
      
      // Update session handling
      content = content.replace(/getServerSession\(request, authOptions\)/g, 'getServerSession(authOptions)');
      content = content.replace(/getServerSession\({ req: request }, authOptions\)/g, 'getServerSession(authOptions)');
      content = content.replace(/getServerSession\({ req: req }, authOptions\)/g, 'getServerSession(authOptions)');
      
      await fs.promises.writeFile(filePath, content, 'utf-8');
      console.log(`Updated: ${file}`);
    }
  }
}

updateFiles().catch(console.error);
