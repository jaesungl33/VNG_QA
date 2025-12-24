import { z } from 'zod';

// Workspace types and schemas
export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export type CreateWorkspace = z.infer<typeof CreateWorkspaceSchema>;

// File types and schemas
export const FileSourceTypeSchema = z.enum(['doc', 'code']);
export const FileStatusSchema = z.enum(['uploaded', 'processing', 'ready', 'failed']);

export type FileSourceType = z.infer<typeof FileSourceTypeSchema>;
export type FileStatus = z.infer<typeof FileStatusSchema>;

export const FileSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  file_type: z.string().max(50),
  size_bytes: z.number().int().min(0).optional(),
  source_type: FileSourceTypeSchema,
  file_path: z.string().optional(),
  file_ext: z.string().optional(),
  mime_type: z.string().optional(),
  status: FileStatusSchema,
  error_message: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type File = z.infer<typeof FileSchema>;

export const CreateFileSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  file_type: z.string().max(50),
  size_bytes: z.number().int().min(0).optional(),
  source_type: FileSourceTypeSchema,
  file_path: z.string().optional(),
  file_ext: z.string().optional(),
  mime_type: z.string().optional(),
});

export type CreateFile = z.infer<typeof CreateFileSchema>;

export const UpdateFileSchema = z.object({
  status: FileStatusSchema.optional(),
  error_message: z.string().optional(),
});

export type UpdateFile = z.infer<typeof UpdateFileSchema>;

// Chunk types and schemas
export const ChunkSchema = z.object({
  id: z.string().uuid(),
  file_id: z.string().uuid(),
  content: z.string(),
  chunk_index: z.number().int().min(0),
  char_start: z.number().int().min(0).optional(),
  char_end: z.number().int().min(0).optional(),
  line_start: z.number().int().min(0).optional(),
  line_end: z.number().int().min(0).optional(),
  source_file_path: z.string().optional(),
  section_title: z.string().optional(),
  created_at: z.string().datetime(),
});

export type Chunk = z.infer<typeof ChunkSchema>;

export const CreateChunkSchema = z.object({
  file_id: z.string().uuid(),
  content: z.string(),
  chunk_index: z.number().int().min(0),
  char_start: z.number().int().min(0).optional(),
  char_end: z.number().int().min(0).optional(),
  line_start: z.number().int().min(0).optional(),
  line_end: z.number().int().min(0).optional(),
  source_file_path: z.string().optional(),
  section_title: z.string().optional(),
});

export type CreateChunk = z.infer<typeof CreateChunkSchema>;

// Embedding types and schemas
export const EmbeddingSchema = z.object({
  chunk_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  file_id: z.string().uuid(),
  embedding: z.array(z.number()),
  model: z.string(),
  created_at: z.string().datetime(),
});

export type Embedding = z.infer<typeof EmbeddingSchema>;

export const CreateEmbeddingSchema = z.object({
  chunk_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  file_id: z.string().uuid(),
  embedding: z.array(z.number()),
  model: z.string(),
});

export type CreateEmbedding = z.infer<typeof CreateEmbeddingSchema>;

// RAG retrieval types
export const RagRetrieveRequestSchema = z.object({
  workspace_id: z.string().uuid(),
  query: z.string(),
  scope: z.enum(['doc', 'codebase', 'both']).default('both'),
  file_slugs: z.array(z.string()).optional(),
  top_k: z.number().int().min(1).max(50).default(12),
});

export type RagRetrieveRequest = z.infer<typeof RagRetrieveRequestSchema>;

export const RagRetrievalResultSchema = z.object({
  chunk_id: z.string().uuid(),
  file_id: z.string().uuid(),
  file_slug: z.string(),
  file_path: z.string().optional(),
  file_name: z.string(),
  source_type: z.enum(['doc', 'code']),
  text: z.string(),
  char_start: z.number().int().optional(),
  char_end: z.number().int().optional(),
  line_start: z.number().int().optional(),
  line_end: z.number().int().optional(),
  score: z.number(),
});

export type RagRetrievalResult = z.infer<typeof RagRetrievalResultSchema>;

export const RagRetrieveResponseSchema = z.object({
  results: z.array(RagRetrievalResultSchema),
  total_found: z.number().int(),
});

export type RagRetrieveResponse = z.infer<typeof RagRetrieveResponseSchema>;

// Embedding API response
export const EmbeddingResponseSchema = z.object({
  workspace_id: z.string(),
  total_chunks: z.number().int(),
  newly_embedded: z.number().int(),
  skipped: z.number().int(),
});

export type EmbeddingResponse = z.infer<typeof EmbeddingResponseSchema>;

// Upload and indexing types
export const UploadResponseSchema = z.object({
  file_id: z.string().uuid(),
  message: z.string(),
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;

export const IndexingResponseSchema = z.object({
  processed_files: z.number().int().min(0),
  total_chunks: z.number().int().min(0),
  message: z.string(),
});

export type IndexingResponse = z.infer<typeof IndexingResponseSchema>;

// Chat types and schemas
export const ChatSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Chat = z.infer<typeof ChatSchema>;

export const CreateChatSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(1).max(200),
});

export type CreateChat = z.infer<typeof CreateChatSchema>;

// Chat Message types and schemas
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  chat_id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  created_at: z.string().datetime(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const CreateChatMessageSchema = z.object({
  chat_id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
});

export type CreateChatMessage = z.infer<typeof CreateChatMessageSchema>;

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Directive parsing types
export const DirectiveScopeSchema = z.enum(['doc', 'codebase', 'both', 'file']);

export type DirectiveScope = z.infer<typeof DirectiveScopeSchema>;

export const ParsedDirectivesSchema = z.object({
  scope: DirectiveScopeSchema.optional(),
  fileSlugs: z.array(z.string()),
  cleanQuery: z.string(),
});

export type ParsedDirectives = z.infer<typeof ParsedDirectivesSchema>;

// Health check
export const HealthCheckSchema = z.object({
  status: z.string(),
  timestamp: z.string().datetime(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;
