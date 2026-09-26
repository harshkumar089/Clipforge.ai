const API_BASE = '/api';

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('clipforge_token');
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  getMe: () => request<any>('/auth/me'),
  getAuthStatus: () => request<any>('/auth/status'),
  googleSignIn: (email?: string, name?: string) =>
    request<any>('/auth/google/dev-callback', {
      method: 'POST',
      body: JSON.stringify({ email: email || 'ashme@gmail.com', name: name || 'Ashme' }),
    }),
  updateProfile: (body: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Videos
  uploadVideo: (
    formData: FormData,
    onProgress?: (percent: number, loaded: number, total: number) => void
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/videos/upload`);
      xhr.withCredentials = true;

      const token = localStorage.getItem('clipforge_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
            onProgress(percent, event.loaded, event.total);
          }
        };
      }

      xhr.onload = () => {
        let data: any = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = { message: xhr.responseText };
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.message || `Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during file upload. Please check connection and server.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('File upload timed out.'));
      };

      // 30 minutes timeout for 2GB+ video upload
      xhr.timeout = 1800000;

      xhr.send(formData);
    });
  },
  getVideos: () => request<{ success: boolean; videos: any[] }>('/videos'),
  getVideoById: (id: string) => request<any>(`/videos/${id}`),
  deleteVideo: (id: string) => request<any>(`/videos/${id}`, { method: 'DELETE' }),
  analyzeVideo: (id: string, options: any) =>
    request<any>(`/videos/${id}/analyze`, { method: 'POST', body: JSON.stringify(options) }),
  generateClips: (id: string, options: any) =>
    request<any>(`/videos/${id}/generate-clips`, { method: 'POST', body: JSON.stringify(options) }),
  getProcessingStatus: (id: string) => request<any>(`/videos/${id}/processing-status`),

  // Clips
  getClips: (params?: { status?: string; videoId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all' && params.status !== 'undefined') {
      searchParams.append('status', params.status);
    }
    if (params?.videoId && params.videoId !== 'undefined' && params.videoId.trim() !== '') {
      searchParams.append('videoId', params.videoId);
    }
    const query = searchParams.toString();
    return request<{ success: boolean; clips: any[] }>(`/clips${query ? `?${query}` : ''}`);
  },
  getClipById: (id: string) => request<any>(`/clips/${id}`),
  updateClip: (id: string, body: any) => request<any>(`/clips/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteClip: (id: string) => request<any>(`/clips/${id}`, { method: 'DELETE' }),

  // Projects
  projects: {
    getProjects: () => request<{ success: boolean; projects: any[] }>('/projects'),
    getProjectByClipId: (clipId: string) => request<{ success: boolean; project: any }>(`/projects/clip/${clipId}`),
    saveProject: (data: { clipId: string; name?: string; edits?: any; exportSettings?: any }) =>
      request<{ success: boolean; project: any }>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    deleteProject: (id: string) => request<any>(`/projects/${id}`, { method: 'DELETE' }),
  },

  // Export
  exportClip: (clipId: string, settings: any) =>
    request<any>(`/export/clips/${clipId}/export`, { method: 'POST', body: JSON.stringify(settings) }),
  getExportStatus: (jobId: string) => request<any>(`/export/status/${jobId}`),
  batchExport: (clipIds: string[], commonEdits: any) =>
    request<any>('/export/batch', { method: 'POST', body: JSON.stringify({ clipIds, commonEdits }) }),
  getBatchExportStatus: (batchId: string) => request<any>(`/export/batch/${batchId}`),

  // Audio / Music
  uploadAudio: (formData: FormData) =>
    request<{ success: boolean; audio: { url: string; fileName: string; originalName: string; duration: number; size: number } }>(
      '/audio/upload',
      {
        method: 'POST',
        body: formData,
      }
    ),
  getAudioPresets: () =>
    request<{
      success: boolean;
      presets: Array<{
        id: string;
        title: string;
        artist: string;
        genre: string;
        duration: number;
        fileName: string;
        url: string;
        tag: string;
      }>;
    }>('/audio/presets'),
};
