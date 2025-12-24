import type {
  Workspace,
  CreateWorkspace,
  File,
  CreateFile,
  Chat,
  CreateChat,
  ChatMessage,
  CreateChatMessage,
  HealthCheck,
  UploadResponse,
  IndexingResponse,
  EmbeddingResponse,
  RagRetrieveRequest,
  RagRetrieveResponse,
  ApiResponse,
} from '@vng-qa/shared';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return response.json();
  }

  // Health check
  async getHealth(): Promise<HealthCheck> {
    return this.request('/health');
  }

  // Workspace CRUD
  async getWorkspaces(): Promise<Workspace[]> {
    return this.request('/workspaces');
  }

  async getWorkspace(id: string): Promise<Workspace> {
    return this.request(`/workspaces/${id}`);
  }

  async createWorkspace(data: CreateWorkspace): Promise<Workspace> {
    return this.request('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkspace(id: string, data: Partial<CreateWorkspace>): Promise<Workspace> {
    return this.request(`/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.request(`/workspaces/${id}`, {
      method: 'DELETE',
    });
  }

  // File CRUD
  async getFiles(workspaceId: string): Promise<File[]> {
    return this.request(`/workspaces/${workspaceId}/files`);
  }

  async getFile(workspaceId: string, fileId: string): Promise<File> {
    return this.request(`/workspaces/${workspaceId}/files/${fileId}`);
  }

  async createFile(workspaceId: string, data: CreateFile): Promise<File> {
    return this.request(`/workspaces/${workspaceId}/files`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFile(workspaceId: string, fileId: string, data: Partial<CreateFile>): Promise<File> {
    return this.request(`/workspaces/${workspaceId}/files/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFile(workspaceId: string, fileId: string): Promise<void> {
    await this.request(`/workspaces/${workspaceId}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // File upload endpoints
  async uploadDocFile(workspaceId: string, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', workspaceId);

    return this.request('/files/upload/doc', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadCodeZip(workspaceId: string, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', workspaceId);

    return this.request('/files/upload/codezip', {
      method: 'POST',
      body: formData,
    });
  }

  async runIndexing(workspaceId: string): Promise<IndexingResponse> {
    return this.request(`/index/${workspaceId}/run`, {
      method: 'POST',
    });
  }

  async runEmbedding(workspaceId: string): Promise<EmbeddingResponse> {
    return this.request(`/index/${workspaceId}/embed`, {
      method: 'POST',
    });
  }

  async ragRetrieve(request: RagRetrieveRequest): Promise<RagRetrieveResponse> {
    return this.request('/rag/retrieve', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Chat CRUD
  async getChats(workspaceId: string): Promise<Chat[]> {
    return this.request(`/workspaces/${workspaceId}/chats`);
  }

  async getChat(workspaceId: string, chatId: string): Promise<Chat> {
    return this.request(`/workspaces/${workspaceId}/chats/${chatId}`);
  }

  async createChat(workspaceId: string, data: CreateChat): Promise<Chat> {
    return this.request(`/workspaces/${workspaceId}/chats`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateChat(workspaceId: string, chatId: string, data: Partial<CreateChat>): Promise<Chat> {
    return this.request(`/workspaces/${workspaceId}/chats/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteChat(workspaceId: string, chatId: string): Promise<void> {
    await this.request(`/workspaces/${workspaceId}/chats/${chatId}`, {
      method: 'DELETE',
    });
  }

  // Chat Messages
  async getChatMessages(workspaceId: string, chatId: string): Promise<ChatMessage[]> {
    return this.request(`/workspaces/${workspaceId}/chats/${chatId}/messages`);
  }

  async sendMessage(workspaceId: string, chatId: string, content: string): Promise<ChatMessage> {
    return this.request(`/workspaces/${workspaceId}/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export { ApiClient, ApiError };
