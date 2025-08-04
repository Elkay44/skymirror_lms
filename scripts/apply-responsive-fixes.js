#!/usr/bin/env node

/**
 * Responsive Design Fix Script for SkyMirror LMS
 * 
 * This script applies consistent responsive design patterns across the entire LMS:
 * - Text overflow fixes (break-words, overflow-wrap-anywhere)
 * - Container constraints (min-w-0, max-w-full, overflow-hidden)
 * - Responsive grid layouts
 * - Proper flex behavior
 * - Icon sizing consistency
 */

import fs from 'fs';
import path from 'path';

// Responsive design patterns to apply
const RESPONSIVE_PATTERNS = {
  // Grid layout improvements
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  'grid grid-cols-1 md:grid-cols-3': 'grid grid-cols-1 lg:grid-cols-3',
  'grid grid-cols-1 md:grid-cols-4': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  
  // Container improvements
  'className="p-6"': 'className="p-4 lg:p-6"',
  'className="px-6 py-4"': 'className="px-4 py-3 lg:px-6 lg:py-4"',
  
  // Text overflow fixes
  'className="text-': 'className="text-',
  
  // Icon sizing consistency
  'className="h-6 w-6"': 'className="h-5 w-5 lg:h-6 lg:w-6"',
  'className="h-8 w-8"': 'className="h-6 w-6 lg:h-8 lg:w-8"',
};

// Text elements that need break-words
const TEXT_ELEMENTS_NEEDING_BREAK_WORDS = [
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'font-medium',
  'font-semibold',
  'font-bold'
];

// Container elements that need overflow protection
const CONTAINER_CLASSES_NEEDING_OVERFLOW_PROTECTION = [
  'bg-white',
  'bg-gray-50',
  'bg-gray-100',
  'rounded-lg',
  'rounded-xl',
  'shadow-sm',
  'border'
];

function addBreakWordsToTextElements(content) {
  // Add break-words to text elements that don't already have it
  TEXT_ELEMENTS_NEEDING_BREAK_WORDS.forEach(textClass => {
    const regex = new RegExp(`className="([^"]*${textClass}[^"]*)"`, 'g');
    content = content.replace(regex, (match, classes) => {
      if (!classes.includes('break-words')) {
        return `className="${classes} break-words"`;
      }
      return match;
    });
  });
  
  return content;
}

function addOverflowProtectionToContainers(content) {
  // Add min-w-0 to flex containers
  content = content.replace(
    /className="([^"]*flex[^"]*)"(?![^>]*min-w-0)/g,
    'className="$1 min-w-0"'
  );
  
  // Add overflow-hidden to main content containers
  content = content.replace(
    /className="([^"]*bg-white[^"]*rounded[^"]*)"(?![^>]*overflow-hidden)/g,
    'className="$1 overflow-hidden"'
  );
  
  return content;
}

function improveGridLayouts(content) {
  // Apply responsive grid patterns
  Object.entries(RESPONSIVE_PATTERNS).forEach(([pattern, replacement]) => {
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, replacement);
  });
  
  return content;
}

function addFlexShrinkToIcons(content) {
  // Add flex-shrink-0 to icon containers
  content = content.replace(
    /className="([^"]*p-2[^"]*rounded[^"]*)"(?![^>]*flex-shrink-0)/g,
    'className="$1 flex-shrink-0"'
  );
  
  return content;
}

function improveResponsiveSpacing(content) {
  // Improve gap spacing
  content = content.replace(/gap-6/g, 'gap-4 lg:gap-6');
  content = content.replace(/gap-8/g, 'gap-6 lg:gap-8');
  content = content.replace(/space-y-6/g, 'space-y-4 lg:space-y-6');
  content = content.replace(/space-y-8/g, 'space-y-6 lg:space-y-8');
  
  return content;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply all responsive fixes
    content = addBreakWordsToTextElements(content);
    content = addOverflowProtectionToContainers(content);
    content = improveGridLayouts(content);
    content = addFlexShrinkToIcons(content);
    content = improveResponsiveSpacing(content);
    
    // Write back the modified content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Processed: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function findTsxFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, .git directories
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function main() {
  const projectRoot = process.argv[2] || process.cwd();
  const srcDir = path.join(projectRoot, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found. Please run this script from the project root.');
    process.exit(1);
  }
  
  console.log('🚀 Starting responsive design fixes...');
  console.log(`📁 Processing files in: ${srcDir}`);
  
  const tsxFiles = findTsxFiles(srcDir);
  console.log(`📄 Found ${tsxFiles.length} TSX/JSX files`);
  
  let processedCount = 0;
  
  tsxFiles.forEach(file => {
    // Focus on dashboard and component files
    if (file.includes('/dashboard/') || file.includes('/components/')) {
      processFile(file);
      processedCount++;
    }
  });
  
  console.log(`\n✨ Responsive design fixes completed!`);
  console.log(`📊 Processed ${processedCount} files`);
  console.log(`\n🎯 Applied fixes:`);
  console.log(`   • Text overflow protection (break-words)`);
  console.log(`   • Container overflow handling (min-w-0, overflow-hidden)`);
  console.log(`   • Responsive grid layouts`);
  console.log(`   • Improved spacing and gaps`);
  console.log(`   • Icon sizing consistency`);
  console.log(`   • Flex shrink protection`);
}

// Run the main function
main();
