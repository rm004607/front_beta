const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Callback para manejar logout automático cuando la cookie expira
let onUnauthorizedCallback: (() => void) | null = null;

// Función para registrar el callback de logout
export const setUnauthorizedHandler = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Helper para hacer peticiones
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Incluir cookies en todas las peticiones (requiere CORS configurado correctamente)
  });

  if (!response.ok) {
    // Intentar parsear el error, pero si falla, usar un error genérico
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `Error ${response.status}: ${response.statusText}` };
    }

    const errorObj = new Error(errorData.error || `Error: ${response.statusText}`) as any;

    // Agregar información adicional del error (como ban_info)
    if (errorData.ban_info) {
      errorObj.ban_info = errorData.ban_info;
    }
    errorObj.status = response.status;

    // Si es un error 401 (cookie expirada o no autenticado)
    if (response.status === 401) {
      // Si no es /auth/me (que es normal cuando no hay sesión), significa que la cookie expiró
      // y el usuario estaba logueado, así que cerramos sesión automáticamente
      if (endpoint !== '/auth/me' && onUnauthorizedCallback) {
        // La cookie expiró mientras el usuario estaba usando la app
        onUnauthorizedCallback();
      }
    } else if (response.status !== 401) {
      // Para otros errores que no sean 401, loguear en desarrollo para debugging
      if (import.meta.env.DEV) {
        console.error(`API Error [${response.status}]:`, errorData);
      }
    }

    throw errorObj;
  }

  return response.json();
}

// API de autenticación
export const authAPI = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    comuna: string;
    rol: number;
  }) => {
    return request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }) => {
    const response = await request<{
      message: string;
      user: {
        id: string;
        name: string;
        email: string;
        role_number: number;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // El token ahora se guarda automáticamente en una cookie HttpOnly
    // No necesitamos hacer nada aquí

    return response;
  },

  getMe: async () => {
    return request<{
      user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        comuna: string;
        role_number: number;
        role: string;
        is_active: boolean;
        is_banned: boolean;
        profile_image?: string | null;
        cv_url?: string | null;
      };
    }>('/auth/me', {
      method: 'GET',
    });
  },

  logout: async () => {
    try {
      await request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Si falla el logout, continuar de todas formas
      console.error('Error al cerrar sesión:', error);
    }
    // Limpiar cualquier dato local si existe
    localStorage.removeItem('token');
  },

  // Obtener información pública de un usuario por ID
  getUserById: async (id: string) => {
    return request<{
      user: {
        id: string;
        name: string;
        phone: string;
        comuna: string;
        profile_image?: string | null;
        role: string;
      };
    }>(`/auth/user/${id}`, {
      method: 'GET',
    });
  },

  updateProfile: async (data: {
    name?: string;
    phone?: string;
    comuna?: string;
    profile_image?: string | null;
    cv_url?: string | null;
    cv_text?: string | null;
    cv_analysis?: any | null;
  }) => {
    return request<{
      message: string;
      user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        comuna: string;
        profile_image: string | null;
        cv_url: string | null;
        role_number: number;
        role: string;
      };
    }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Iniciar login con Google
  googleLogin: (role?: string) => {
    window.location.href = `${API_BASE_URL}/auth/google${role ? `?role=${role}` : ''}`;
  },

  verifyEmail: async (data: { email: string; code: string }) => {
    return request<{ message: string; user: { id: string; name: string; email: string } }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resendCode: async (email: string) => {
    return request<{ message: string }>('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

// API de empleos
export const jobsAPI = {
  // Listar empleos (público)
  getJobs: async (filters?: {
    search?: string;
    comuna?: string;
    job_type?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.comuna) params.append('comuna', filters.comuna);
    if (filters?.job_type) params.append('job_type', filters.job_type);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return request<{
      jobs: Array<{
        id: string;
        title: string;
        description: string;
        requirements?: string;
        salary?: string;
        comuna: string;
        job_type: string;
        created_at: string;
        company_name: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/jobs${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  // Obtener un empleo específico
  getJobById: async (id: string) => {
    return request<{
      job: {
        id: string;
        title: string;
        description: string;
        requirements?: string;
        salary?: string;
        comuna: string;
        job_type: string;
        created_at: string;
        updated_at: string;
        company_id: string;
        company_name: string;
        company_email: string;
        company_phone: string;
      };
    }>(`/jobs/${id}`, {
      method: 'GET',
    });
  },

  // Crear empleo (solo empresas)
  createJob: async (data: {
    title: string;
    description: string;
    requirements?: string;
    salary?: string;
    comuna: string;
    job_type: 'fulltime' | 'parttime' | 'shifts' | 'freelance';
  }) => {
    return request<{
      message: string;
      job: {
        id: string;
        title: string;
        company: string;
        comuna: string;
        job_type: string;
        free_jobs_remaining: number;
      };
    }>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Obtener mis empleos (solo empresas)
  getMyJobs: async () => {
    return request<{
      jobs: Array<{
        id: string;
        title: string;
        description: string;
        requirements?: string;
        salary?: string;
        comuna: string;
        job_type: string;
        is_active: number;
        created_at: string;
        updated_at: string;
      }>;
      stats: {
        total: number;
        active: number;
        inactive: number;
        free_jobs_used: number;
        free_jobs_limit: number;
        free_jobs_remaining: number;
        requires_payment: boolean;
      };
    }>('/jobs/my/jobs', {
      method: 'GET',
    });
  },

  // Actualizar empleo (solo empresas)
  updateJob: async (id: string, data: {
    title?: string;
    description?: string;
    requirements?: string;
    salary?: string;
    comuna?: string;
    job_type?: 'fulltime' | 'parttime' | 'shifts' | 'freelance';
    is_active?: number;
  }) => {
    return request<{ message: string }>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Eliminar empleo (solo empresas)
  deleteJob: async (id: string) => {
    return request<{ message: string }>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  // Obtener estadísticas de empleos (solo empresas o super-admin)
  getJobStats: async () => {
    return request<{
      free_jobs_used?: number;
      free_jobs_limit?: number;
      free_jobs_remaining?: number;
      requires_payment?: boolean;
      is_admin?: boolean;
      unlimited?: boolean;
      total_jobs?: number;
      active_jobs?: number;
      inactive_jobs?: number;
      total_companies?: number;
      company_id?: string;
    }>('/jobs/stats', {
      method: 'GET',
    });
  },
};

// API de servicios
export const servicesAPI = {
  // Listar servicios (público)
  getServices: async (filters?: {
    search?: string;
    comuna?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.comuna) params.append('comuna', filters.comuna);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return request<{
      services: Array<{
        id: string;
        service_name: string;
        description: string;
        price_range?: string;
        comuna: string;
        phone?: string;
        status: string;
        created_at: string;
        user_id: string;
        user_name: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/services${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  // Obtener un servicio específico
  getServiceById: async (id: string) => {
    return request<{
      service: {
        id: string;
        service_name: string;
        description: string;
        price_range?: string;
        comuna: string;
        phone?: string;
        status: string;
        created_at: string;
        updated_at: string;
        user_id: string;
        user_name: string;
        user_email: string;
      };
    }>(`/services/${id}`, {
      method: 'GET',
    });
  },

  // Crear servicio (solo emprendedores o super-admin)
  createService: async (data: {
    service_name: string;
    description: string;
    price_range?: string;
    comuna: string;
    phone?: string;
  }) => {
    return request<{
      message: string;
      service: {
        id: string;
        service_name: string;
        user_name: string;
        comuna: string;
        created_by_admin: boolean;
      };
    }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Obtener mis servicios (solo emprendedores o super-admin)
  getMyServices: async () => {
    return request<{
      services: Array<{
        id: string;
        service_name: string;
        description: string;
        price_range?: string;
        comuna: string;
        phone?: string;
        status: string;
        created_at: string;
        updated_at: string;
        user_name?: string;
        user_id?: string;
      }>;
      stats: {
        total: number;
        active: number;
        inactive: number;
        is_admin?: boolean;
      };
    }>('/services/my/services', {
      method: 'GET',
    });
  },

  // Actualizar servicio (solo emprendedores o super-admin)
  updateService: async (id: string, data: {
    service_name?: string;
    description?: string;
    price_range?: string;
    comuna?: string;
    phone?: string;
    status?: 'active' | 'inactive' | 'suspended';
  }) => {
    return request<{ message: string }>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Eliminar servicio (solo emprendedores o super-admin)
  deleteService: async (id: string) => {
    return request<{ message: string }>(`/services/${id}`, {
      method: 'DELETE',
    });
  },
};

// API de posts del muro
export const postsAPI = {
  // Listar posts (público, puede tener usuario autenticado)
  getPosts: async (filters?: {
    type?: string;
    comuna?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.comuna) params.append('comuna', filters.comuna);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return request<{
      posts: Array<{
        id: string;
        type: 'Busco Trabajo' | 'Busco Servicio' | 'Ofrezco' | 'Info';
        content: string;
        comuna: string;
        created_at: string;
        user_id: string;
        user_name: string;
        likes_count: number;
        comments_count: number;
        user_liked: boolean;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/posts${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  // Obtener un post específico con comentarios
  getPostById: async (id: string) => {
    return request<{
      post: {
        id: string;
        type: 'Busco Trabajo' | 'Busco Servicio' | 'Ofrezco' | 'Info';
        content: string;
        comuna: string;
        created_at: string;
        updated_at: string;
        user_id: string;
        user_name: string;
        likes_count: number;
        comments_count: number;
        user_liked: boolean;
        comments: Array<{
          id: string;
          content: string;
          comment_type: 'info' | 'dato_pega';
          created_at: string;
          updated_at: string;
          user_id: string;
          user_name: string;
        }>;
      };
    }>(`/posts/${id}`, {
      method: 'GET',
    });
  },

  // Crear post (requiere autenticación)
  createPost: async (data: {
    type: 'Busco Trabajo' | 'Busco Servicio' | 'Ofrezco' | 'Info';
    content: string;
    comuna: string;
  }) => {
    return request<{
      message: string;
      post: {
        id: string;
        type: string;
        content: string;
        comuna: string;
        user_name: string;
      };
    }>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Dar like/quitar like a un post (requiere autenticación)
  likePost: async (id: string) => {
    return request<{
      message: string;
      liked: boolean;
      likes_count: number;
    }>(`/posts/${id}/like`, {
      method: 'POST',
    });
  },

  // Comentar en un post (requiere autenticación)
  commentPost: async (id: string, content: string, comment_type: 'info' | 'dato_pega' = 'info') => {
    return request<{
      message: string;
      comment: {
        id: string;
        content: string;
        comment_type: 'info' | 'dato_pega';
        created_at: string;
        updated_at: string;
        user_id: string;
        user_name: string;
      };
    }>(`/posts/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content, comment_type }),
    });
  },

  // Obtener comentarios de un post
  getPostComments: async (id: string) => {
    return request<{
      comments: Array<{
        id: string;
        content: string;
        comment_type: 'info' | 'dato_pega';
        created_at: string;
        updated_at: string;
        user_id: string;
        user_name: string;
      }>;
    }>(`/posts/${id}/comments`, {
      method: 'GET',
    });
  },

  // Eliminar comentario (requiere autenticación, solo el autor o super-admin)
  deleteComment: async (postId: string, commentId: string) => {
    return request<{ message: string }>(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  // Eliminar post (requiere autenticación, solo el autor o super-admin)
  deletePost: async (id: string) => {
    return request<{ message: string }>(`/posts/${id}`, {
      method: 'DELETE',
    });
  },

  // Obtener mis posts (requiere autenticación)
  getMyPosts: async () => {
    return request<{
      posts: Array<{
        id: string;
        type: 'Busco Trabajo' | 'Busco Servicio' | 'Ofrezco' | 'Info';
        content: string;
        comuna: string;
        created_at: string;
        updated_at: string;
        likes_count: number;
        comments_count: number;
      }>;
    }>('/posts/my/posts', {
      method: 'GET',
    });
  },
};

// API de administración
export const adminAPI = {
  // ========== POSTS ==========
  getAllPosts: async (filters?: {
    type?: string;
    comuna?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.comuna) params.append('comuna', filters.comuna);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return request<{
      posts: Array<{
        id: string;
        type: string;
        content: string;
        comuna: string;
        created_at: string;
        updated_at: string;
        user_id: string;
        user_name: string;
        user_email: string;
        likes_count: number;
        comments_count: number;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/posts${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  deletePost: async (id: string) => {
    return request<{ message: string }>(`/admin/posts/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== JOBS ==========
  getAllJobs: async (filters?: {
    job_type?: string;
    comuna?: string;
    is_active?: number;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.job_type) params.append('job_type', filters.job_type);
    if (filters?.comuna) params.append('comuna', filters.comuna);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return request<{
      jobs: Array<{
        id: string;
        title: string;
        description: string;
        requirements?: string;
        salary?: string;
        comuna: string;
        job_type: string;
        is_active: number;
        created_at: string;
        updated_at: string;
        company_id: string;
        company_name: string;
        company_email: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/jobs${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  deleteJob: async (id: string) => {
    return request<{ message: string }>(`/admin/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== SERVICES ==========
  getAllServices: async (filters?: {
    comuna?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.comuna) params.append('comuna', filters.comuna);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return request<{
      services: Array<{
        id: string;
        service_name: string;
        description: string;
        price_range?: string;
        comuna: string;
        phone?: string;
        status: string;
        created_at: string;
        updated_at: string;
        user_id: string;
        user_name: string;
        user_email: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/services${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  deleteService: async (id: string) => {
    return request<{ message: string }>(`/admin/services/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== USERS (Solo Super Admin) ==========
  getAllUsers: async (filters?: {
    role?: string;
    is_active?: number;
    is_banned?: number;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.is_banned !== undefined) params.append('is_banned', filters.is_banned.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return request<{
      users: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
        comuna: string;
        is_active: boolean;
        is_banned: boolean;
        ban_reason?: string;
        banned_until?: string;
        ban_count: number;
        created_at: string;
        updated_at: string;
        role: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/users${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  banUser: async (userId: string, data: { reason: string; days: number }) => {
    return request<{
      message: string;
      ban_count: number;
      permanent: boolean;
    }>(`/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  unbanUser: async (userId: string) => {
    return request<{ message: string }>(`/admin/users/${userId}/unban`, {
      method: 'POST',
    });
  },

  deleteUser: async (userId: string) => {
    return request<{ message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  updateUserRole: async (userId: string, role: string) => {
    return request<{ message: string; role: string }>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  // ========== PUBLICATION LIMITS (Super Admin) ==========
  getUserPublicationLimits: async (userId: string) => {
    return request<{
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
      services: {
        base_limit: number;
        bonus: number;
        total_limit: number;
        used: number;
        remaining: number;
      };
      jobs?: {
        base_limit: number;
        bonus: number;
        total_limit: number;
        used: number;
        remaining: number;
      };
    }>(`/super-admin/users/${userId}/publication-limits`, {
      method: 'GET',
    });
  },

  updateUserPublicationLimits: async (
    userId: string,
    data: {
      services_limit?: number;
      jobs_limit?: number;
      services_bonus?: number;
      jobs_bonus?: number;
    }
  ) => {
    return request<{
      message: string;
      limits: {
        services: {
          base_limit: number;
          bonus: number;
          total_limit: number;
        };
        jobs?: {
          base_limit: number;
          bonus: number;
          total_limit: number;
        };
      };
    }>(`/super-admin/users/${userId}/publication-limits`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // ========== STATS ==========
  getStats: async () => {
    return request<{
      stats: {
        total_posts?: number;
        total_jobs?: number;
        active_jobs?: number;
        total_services?: number;
        active_services?: number;
        total_users?: number;
        active_users?: number;
        banned_users?: number;
        total_companies?: number;
      };
    }>('/admin/stats', {
      method: 'GET',
    });
  },

  // ========== TICKETS ==========
  getAllTickets: async (filters?: { page?: number; limit?: number; status?: string; category?: string }) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);

    const queryString = params.toString();
    return request<{
      tickets: Array<{
        id: string;
        subject: string;
        message: string;
        category: string;
        status: string;
        response?: string;
        created_at: string;
        updated_at: string;
        user_id: string;
        user_name: string;
        user_email: string;
        profile_image?: string | null;
        responder_name?: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/support/tickets/all${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  respondToTicket: async (ticketId: string, response: string, status?: string) => {
    return request<{
      message: string;
      ticket: {
        id: string;
        status: string;
        response: string;
      };
    }>(`/api/support/tickets/${ticketId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response, status }),
    });
  },

  updateTicketStatus: async (ticketId: string, status: string) => {
    return request<{
      message: string;
      ticket: {
        id: string;
        status: string;
      };
    }>(`/api/support/tickets/${ticketId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // ========== LOGS (Solo Super Admin) ==========
  getLogs: async (filters?: { limit?: number; level?: string }) => {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.level) params.append('level', filters.level);

    const queryString = params.toString();
    return request<{
      logs: Array<{
        id: number;
        timestamp: string;
        level: string;
        message: string;
      }>;
      stats: {
        total: number;
        byLevel: {
          log: number;
          error: number;
          warn: number;
          info: number;
        };
      };
      total: number;
    }>(`/admin/logs${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  clearLogs: async () => {
    return request<{ message: string }>('/admin/logs', {
      method: 'DELETE',
    });
  },
};

// API de paquetes
export const packagesAPI = {
  // Obtener paquetes de servicios
  getServicePackages: async () => {
    return request<{
      packages: Array<{
        id: string;
        name: string;
        description: string;
        publications: number;
        price: number;
        type: string;
      }>;
    }>('/packages/services', {
      method: 'GET',
    });
  },

  // Obtener paquetes de empleos
  getJobPackages: async () => {
    return request<{
      packages: Array<{
        id: string;
        name: string;
        description: string;
        publications: number;
        price: number;
        type: string;
      }>;
    }>('/packages/jobs', {
      method: 'GET',
    });
  },

  // Obtener límites del usuario
  getUserLimits: async () => {
    return request<{
      services: {
        free_limit: number;
        used: number;
        remaining: number;
        requires_payment: boolean;
      };
      jobs: {
        free_limit: number;
        used: number;
        remaining: number;
        requires_payment: boolean;
      } | null;
    }>('/packages/limits', {
      method: 'GET',
    });
  },
};

// API de Flow (pagos)
export const flowAPI = {
  // Crear pago
  createPayment: async (packageId: string, packageType: 'services' | 'jobs') => {
    return request<{
      url: string;
      token: string;
      paymentId: string;
    }>('/api/flow/create-payment', {
      method: 'POST',
      body: JSON.stringify({ packageId, packageType }),
    });
  },

  // Obtener estado de pago
  getPaymentStatus: async (token: string) => {
    return request<{
      paymentId: string;
      packageId: string;
      packageType: string;
      amount: number;
      status: 'pending' | 'completed' | 'failed' | 'cancelled';
      publicationsAdded: number;
      createdAt: string;
      completedAt: string | null;
    }>(`/api/flow/payment/${token}`, {
      method: 'GET',
    });
  },
};

// API de postulaciones
export const applicationsAPI = {
  // Postular a un empleo
  applyToJob: async (jobId: string, message?: string) => {
    return request<{
      message: string;
      application: {
        id: string;
        job_id: string;
        job_title: string;
        status: string;
      };
    }>(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Obtener postulaciones de un empleo específico
  getJobApplications: async (jobId: string) => {
    return request<{
      job: {
        id: string;
        title: string;
      };
      applications: Array<{
        id: string;
        job_id: string;
        user_id: string;
        status: string;
        message: string | null;
        created_at: string;
        updated_at: string;
        user_name: string;
        user_email: string;
        user_phone: string | null;
        user_comuna: string;
        profile_image: string | null;
        cv_url: string | null;
      }>;
    }>(`/api/jobs/${jobId}/applications`, {
      method: 'GET',
    });
  },

  // Obtener todas las postulaciones de la empresa
  getCompanyApplications: async () => {
    return request<{
      applications: Array<{
        id: string;
        job_id: string;
        user_id: string;
        status: string;
        message: string | null;
        created_at: string;
        updated_at: string;
        job_title: string;
        company_id: string;
        company_name?: string;
        user_name: string;
        user_email: string;
        user_phone: string | null;
        user_comuna: string;
        profile_image: string | null;
        cv_url: string | null;
      }>;
    }>('/api/company/applications', {
      method: 'GET',
    });
  },

  // Actualizar estado de una postulación
  updateApplicationStatus: async (applicationId: string, status: string) => {
    return request<{
      message: string;
      application: {
        id: string;
        status: string;
      };
    }>(`/api/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Enviar correo a un postulante
  sendEmailToApplicant: async (applicationId: string, subject?: string, message?: string) => {
    return request<{
      message: string;
      email: {
        to: string;
        subject: string;
        sent: boolean;
      };
    }>(`/api/applications/${applicationId}/email`, {
      method: 'POST',
      body: JSON.stringify({ subject, message }),
    });
  },
};

// API de soporte
export const supportAPI = {
  createTicket: async (data: {
    subject: string;
    message: string;
    category?: string;
  }) => {
    return request<{
      message: string;
      ticket: {
        id: string;
        subject: string;
        status: string;
        created_at: string;
      };
    }>('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyTickets: async () => {
    return request<{
      tickets: Array<{
        id: string;
        subject: string;
        message: string;
        category: string;
        status: string;
        response?: string;
        created_at: string;
        updated_at: string;
      }>;
    }>('/api/support/tickets', {
      method: 'GET',
    });
  },
};

// API de IA y recomendaciones

