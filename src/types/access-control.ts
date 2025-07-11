/**
 * Types for access control system in LMS
 */

export type AccessControlType =
  | 'TIME_BASED'    // Access based on specific dates
  | 'SEQUENTIAL'    // Must complete previous content
  | 'PREREQUISITE'  // Must complete specific other content
  | 'ENROLLMENT_DURATION' // Based on how long student has been enrolled
  | 'USER_GROUP'    // Available only to specific user groups/cohorts
  | 'CUSTOM'        // Custom logic (e.g. quiz score threshold)
  | 'ALWAYS';       // Always available (default)

export type ResourceType = 'MODULE' | 'LESSON';

// Base access control interface
export interface AccessControl {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  courseId: string;
  type: AccessControlType;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: number;
  configuration: AccessControlConfig;
}

// Union type for all possible configurations
export type AccessControlConfig = 
  | TimeBasedConfig
  | SequentialConfig
  | PrerequisiteConfig
  | EnrollmentDurationConfig
  | UserGroupConfig
  | CustomConfig
  | AlwaysConfig;

// Available from/to specific dates
export interface TimeBasedConfig {
  type: 'TIME_BASED';
  startDate?: string;
  endDate?: string;
  includeTime: boolean;
  timezone?: string;
}

// Must complete previous content
export interface SequentialConfig {
  type: 'SEQUENTIAL';
  requirePrevious: boolean;
  gracePeriod?: number; // Hours
}

// Must complete specific other content
export interface PrerequisiteConfig {
  type: 'PREREQUISITE';
  prerequisites: Array<{
    resourceType: ResourceType;
    resourceId: string;
  }>;
  requireAll: boolean; // If false, require any
}

// Based on enrollment duration
export interface EnrollmentDurationConfig {
  type: 'ENROLLMENT_DURATION';
  minDays: number;
  maxDays?: number;
}

// Available only to specific groups
export interface UserGroupConfig {
  type: 'USER_GROUP';
  groupIds: string[];
  requireAll: boolean; // If false, require any
}

// Custom logic
export interface CustomConfig {
  type: 'CUSTOM';
  condition: string;
  parameters: Record<string, any>;
}

// Always available
export interface AlwaysConfig {
  type: 'ALWAYS';
}

// Request to create or update access controls
export interface AccessControlRequest {
  resourceType: ResourceType;
  resourceId: string;
  type: AccessControlType;
  active: boolean;
  configuration: AccessControlConfig;
}

// Bulk request to update multiple access controls
export interface BulkAccessControlRequest {
  accessControls: AccessControlRequest[];
}

// Response format for access control operations
export interface AccessControlResponse {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  type: AccessControlType;
  active: boolean;
  configuration: AccessControlConfig;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: number;
    name: string;
    image?: string;
  };
}

// Response format for checking if a user has access
export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  unlocksAt?: Date;
  requiredActions?: {
    type: 'COMPLETE_CONTENT' | 'JOIN_GROUP' | 'WAIT_TIME' | 'OTHER';
    resourceId?: string;
    resourceType?: string;
    description: string;
  }[];
}
