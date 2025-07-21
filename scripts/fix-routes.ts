import fs from 'fs';
import path from 'path';

const routesDir = path.join(process.cwd(), 'src/app/api');

// Find all route.ts files recursively
function findRouteFiles(dir: string): string[] {
  const files = fs.readdirSync(dir);
  let routeFiles: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      routeFiles = routeFiles.concat(findRouteFiles(fullPath));
    } else if (file === 'route.ts') {
      routeFiles.push(fullPath);
    }
  }

  return routeFiles;
}

// Fix route handler types
function fixRouteFile(file: string) {
  const content = fs.readFileSync(file, 'utf-8');
  
  // Find all route handlers
  const handlers = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  
  handlers.forEach(handler => {
    const handlerRegex = new RegExp(`export async function ${handler}\\s*\\(\\s*request: NextRequest,\\s*{ params }:\s*{ params: { assignmentId: string } }\\)\\s*:\s*Promise<NextResponse>`, 'g');
    const newContent = content.replace(handlerRegex, `export async function ${handler}(request: NextRequest, { params }: { params: { assignmentId: string } })`);
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      console.log(`Fixed ${handler} handler in ${file}`);
    }
  });
}

// Main execution
const routeFiles = findRouteFiles(routesDir);
console.log(`Found ${routeFiles.length} route files`);

routeFiles.forEach(fixRouteFile);
console.log('Route type fixing completed!');
