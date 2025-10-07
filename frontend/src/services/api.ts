import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  FileData,
  FileListResponse,
  SaveFileResponse,
  DeleteFileResponse,
  FolderTree,
  InitFoldersResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error
          console.error('API Error:', error.response.data);
          throw new Error(error.response.data.error?.message || 'API request failed');
        } else if (error.request) {
          // Request made but no response
          console.error('Network Error:', error.message);
          throw new Error('Network error - please check your connection');
        } else {
          // Something else happened
          console.error('Error:', error.message);
          throw new Error(error.message);
        }
      }
    );
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // File operations
  async listFiles(folder?: string, search?: string): Promise<FileListResponse> {
    const params: any = {};
    if (folder) params.folder = folder;
    if (search) params.search = search;

    const response = await this.client.get('/api/files', { params });
    return response.data;
  }

  async getFile(path: string): Promise<FileData> {
    const response = await this.client.get(`/api/files/${path}`);
    return response.data;
  }

  async saveFile(path: string, content: string): Promise<SaveFileResponse> {
    const response = await this.client.post(`/api/files/${path}`, { content });
    return response.data;
  }

  async deleteFile(path: string): Promise<DeleteFileResponse> {
    const response = await this.client.delete(`/api/files/${path}`);
    return response.data;
  }

  // Folder operations
  async getFolderTree(): Promise<FolderTree> {
    const response = await this.client.get('/api/folders');
    return response.data;
  }

  async initializeFolders(): Promise<InitFoldersResponse> {
    const response = await this.client.post('/api/folders/init');
    return response.data;
  }

  // Calendar operations
  async getDailyNote(date: string): Promise<FileData> {
    const response = await this.client.get(`/api/calendar/daily/${date}`);
    return response.data;
  }

  async createTodayNote(): Promise<FileData> {
    const response = await this.client.post('/api/calendar/daily');
    return response.data;
  }

  async getDateRange(start: string, end: string): Promise<any> {
    const response = await this.client.get('/api/calendar/range', {
      params: { start, end }
    });
    return response.data;
  }

  async getTimeBlocks(date: string): Promise<any> {
    const response = await this.client.get(`/api/calendar/timeblocks/${date}`);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiService();
export default api;
