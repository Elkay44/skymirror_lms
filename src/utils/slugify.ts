export function generateCourseSlug(title: string): string {
  // Convert to lowercase
  let slug = title.toLowerCase();
  
  // Replace special characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  
  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);
  
  return `${slug}-${timestamp}`;
}
