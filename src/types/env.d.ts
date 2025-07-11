// Environment variable type definitions to ensure type safety
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DATABASE_URL: string;
      
      // Authentication
      NEXTAUTH_URL: string;
      NEXTAUTH_SECRET: string;
      
      // Redis cache
      REDIS_URL?: string;
      REDIS_TOKEN?: string;
      
      // Storage
      S3_ACCESS_KEY?: string;
      S3_SECRET_KEY?: string;
      S3_BUCKET_NAME?: string;
      S3_REGION?: string;
      
      // Email
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASSWORD?: string;
      SMTP_FROM?: string;
      
      // Application settings
      NODE_ENV: 'development' | 'production' | 'test';
      APP_URL: string;
      INSTRUCTOR_APPROVAL_REQUIRED?: string; // "true" | "false"
      COURSE_APPROVAL_REQUIRED?: string; // "true" | "false"
      MAX_UPLOAD_SIZE?: string; // In bytes
      ENABLE_AUTOSAVE?: string; // "true" | "false"
      
      // Analytics and monitoring
      ENABLE_ANALYTICS?: string; // "true" | "false"
      ANALYTICS_KEY?: string;
      
      // Feature flags
      ENABLE_DISCUSSIONS?: string; // "true" | "false"
      ENABLE_VERSIONING?: string; // "true" | "false"
      ENABLE_NOTIFICATIONS?: string; // "true" | "false"
    }
  }
}

// Export nothing - this is just for type augmentation
export {}
