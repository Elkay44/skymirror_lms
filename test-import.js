// This is a test file to check module resolution
console.log('Testing module resolution...');

// Try to import using the @ alias
import { Form } from '@/components/ui/form';
console.log('Form imported successfully:', Form);

// Try to import using a relative path
import { Form as FormRelative } from './src/components/ui/form';
console.log('Form imported with relative path:', FormRelative);
