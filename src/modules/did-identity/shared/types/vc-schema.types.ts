export type SchemaType = 'json-schema' | 'json-ld' | 'protobuf';

export interface VcSchema {
  id: string;
  type: SchemaType;
  name: string;
  description?: string;
  version: string;
  schema: Record<string, unknown>;
  author: string;
  createdAt: number;
  updatedAt?: number;
}

export interface VcSchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
  warnings: SchemaValidationWarning[];
}

export interface SchemaValidationError {
  code: string;
  message: string;
  path?: string;
  details?: Record<string, unknown>;
}

export interface SchemaValidationWarning {
  code: string;
  message: string;
  path?: string;
  details?: Record<string, unknown>;
}

export interface SchemaField {
  name: string;
  type: string | string[];
  required?: boolean;
  description?: string;
  pattern?: string;
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  items?: SchemaField;
  properties?: Record<string, SchemaField>;
  enum?: unknown[];
}

export interface SchemaRegistryEntry {
  entryId: string;
  schemaId: string;
  schema: VcSchema;
  status: 'active' | 'deprecated' | 'revoked';
  trusted: boolean;
  issuerDids: string[];
  createdAt: number;
  updatedAt?: number;
}

export interface SchemaCreateOptions {
  name: string;
  description?: string;
  version: string;
  type: SchemaType;
  schema: Record<string, unknown>;
  author: string;
}

export interface SchemaUpdateOptions {
  name?: string;
  description?: string;
  version?: string;
  schema?: Record<string, unknown>;
  status?: 'active' | 'deprecated' | 'revoked';
}