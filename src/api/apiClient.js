import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Only redirect if we're not already on the login/root page to avoid loops
      const pathname = window.location.pathname;
      const isPublic = pathname === '/' || pathname === '' || pathname.toLowerCase().startsWith('/start');

      if (!isPublic) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const auth = {
  async emailLogin(email) {
    const { data } = await api.post('/auth/email-login', { email });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data.user;
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data.user;
  },

  async updateMe(updates) {
    const { data } = await api.patch('/auth/me', updates);
    return data.user;
  },

  logout() {
    localStorage.removeItem('auth_token');
  }
};

// Entity helpers
const createEntityAPI = (endpoint) => ({
  async filter(filters = {}, orderBy = null) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    const { data } = await api.get(`/${endpoint}?${params}`);
    return data.data || [];
  },

  async get(id) {
    const { data } = await api.get(`/${endpoint}/${id}`);
    return data.data;
  },

  async create(payload) {
    const { data } = await api.post(`/${endpoint}`, payload);
    return data.data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/${endpoint}/${id}`, payload);
    return data.data;
  },

  async delete(id) {
    const { data } = await api.delete(`/${endpoint}/${id}`);
    return data;
  }
});

// Entities
export const entities = {
  Company: createEntityAPI('companies'),
  Report: {
    ...createEntityAPI('reports'),
    async getPrompts(reportId) {
      const { data } = await api.get(`/reports/${reportId}/prompts`);
      return data.data || [];
    },
    async createPrompt(reportId, promptData) {
      const { data } = await api.post(`/reports/${reportId}/prompts`, promptData);
      return data.data;
    }
  },
  Competitor: createEntityAPI('competitors'),
  EmailSubmission: createEntityAPI('email_submissions'),
  PromptResult: {
    async filter(filters = {}) {
      if (filters.report_id) {
        const { data } = await api.get(`/reports/${filters.report_id}/prompts`);
        return data.data || [];
      }
      return [];
    }
  },
  TopicAnalysis: createEntityAPI('topic_analyses')
};

// Integrations (LLM calls)
export const integrations = {
  Core: {
    async InvokeLLM(provider, prompt, options = {}) {
      const { data } = await api.post('/analysis/invoke-llm', {
        provider,
        prompt,
        options
      });
      return data.data;
    }
  }
};

// Functions (custom backend functions)
export const functions = {
  async invoke(functionName, params) {
    switch (functionName) {
      case 'runAnalysis':
        // Transform frontend field names to backend expected names
        const analysisParams = {
          company_id: params.companyId,
          report_id: params.reportId,
          topics: params.topics,
          prompts_by_topic: params.promptsByTopic,
          competitors: params.competitors
        };
        const { data } = await api.post('/analysis/run', analysisParams);
        return data;

      case 'getAnalysisProgress':
        const progress = await api.get(`/analysis/progress/${params.report_id}`);
        return progress.data;

      case 'discoverCompany':
        const discovery = await api.post('/companies/discover', params);
        return discovery.data;

      case 'discoverCompetitors':
        const competitors = await api.post('/competitors/discover', params);
        return competitors.data;

      case 'generatePrompts':
        const prompts = await api.post('/analysis/generate-prompts', params);
        return prompts.data;

      case 'getMaxPrompts':
        const maxPrompts = await api.get('/analysis/max-prompts');
        return maxPrompts.data;

      case 'getAdminData':
        const adminData = await api.get('/admin/data');
        return adminData.data;

      case 'verifyAdminPassword':
        const verification = await api.post('/admin/verify-password', params);
        return verification.data;

      case 'exportReportPDF':
        // Request as blob for binary PDF download
        const pdfResponse = await api.post(
          `/reports/${params.reportId}/export-pdf`,
          {},
          { responseType: 'blob' }
        );
        return pdfResponse;

      default:
        throw new Error(`Function ${functionName} not implemented`);
    }
  }
};

// Main client export (compatible with base44 structure)
export const apiClient = {
  auth,
  entities,
  integrations,
  functions
};

export default apiClient;
