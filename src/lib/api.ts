const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Callback para manejar logout automático cuando la cookie expira
let onUnauthorizedCallback: (() => void) | null = null;

// Función para registrar el callback de logout
export const setUnauthorizedHandler = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

// Helper para hacer peticiones
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && token !== 'null' && token !== 'undefined' && !options.skipAuth ? { 'Authorization': `Bearer ${token}` } : {}),
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

    // Loguear detalles técnicos solo en desarrollo
    if (import.meta.env.DEV) {
      console.error(`API Error [${response.status}]:`, errorData);
    }

    // Determinar mensaje de error para el usuario (sin revelar detalles técnicos)
    let userMessage: string;

    if (response.status === 401) {
      userMessage = errorData.error || 'No autorizado. Por favor inicia sesión.';
    } else if (response.status === 403) {
      userMessage = errorData.error || 'No tienes permisos para realizar esta acción.';
    } else if (response.status === 404) {
      userMessage = errorData.error || 'Recurso no encontrado.';
    } else if (response.status === 400) {
      // Errores de validación del backend (estos sí pueden mostrarse)
      userMessage = errorData.error || 'Datos inválidos. Por favor verifica la información.';
    } else if (response.status >= 500) {
      // Errores del servidor - NO revelar detalles técnicos
      userMessage = 'Ups, algo salió mal. Por favor intenta de nuevo.';
    } else {
      // Otros errores
      userMessage = errorData.error || 'Ocurrió un error. Por favor intenta de nuevo.';
    }

    const errorObj = new Error(userMessage) as any;

    // Agregar información adicional del error (como ban_info)
    if (errorData && typeof errorData === 'object') {
      if ('ban_info' in errorData) {
        errorObj.ban_info = errorData.ban_info;
      }
      // Asegurar que si el server manda un mensaje específico, se mantenga
      if ('error' in errorData && typeof errorData.error === 'string') {
        errorObj.message = errorData.error;
      }
    }

    errorObj.status = response.status;

    // Si es un error 401 (cookie expirada o no autenticado)
    if (response.status === 401 && !options.skipAuth) {
      if (endpoint !== '/auth/me' && onUnauthorizedCallback) {
        onUnauthorizedCallback();
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
        rut?: string;
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
        rut?: string;
        comuna: string;
        role_number: number;
        role: string;
        is_active: boolean;
        is_banned: boolean;
        profile_image?: string | null;
        cv_url?: string | null;
        region_id?: string;
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
    rut?: string;
    comuna?: string;
    region_id?: string | number;
    profile_image?: string | null;
    rubro?: string;
    experience?: string;
    service?: string;
    portfolio?: string;
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

  googleRegister: async (data: {
    token: string;
    rut: string;
    phone: string;
    comuna: string;
    region_id?: string | number;
    rol: number;
    rubro?: string;
    experience?: string;
    service?: string;
    portfolio?: string;
  }) => {
    return request<{
      message: string;
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        rut: string;
      };
    }>('/auth/google-register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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


// API de servicios
export const servicesAPI = {
  // Listar servicios (público)
  getServices: async (filters?: {
    search?: string;
    comuna?: string;
    region_id?: string;
    service_type_id?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.comuna) params.append('comuna', filters.comuna);
    if (filters?.region_id) params.append('region_id', filters.region_id);
    if (filters?.service_type_id) params.append('service_type_id', filters.service_type_id);
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
        average_rating?: number;
        reviews_count?: number;
        type_name?: string;
        type_icon?: string;
        type_color?: string;
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
    region_id?: string;
    coverage_communes?: string[];
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
        average_rating?: number;
        reviews_count?: number;
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

  // Obtener tipos de servicios (catálogo estructurado)
  getServiceTypes: async (filters?: { onlyActive?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.onlyActive) params.append('onlyActive', 'true');
    const queryString = params.toString();

    return request<{
      types: Array<{
        id: string;
        name: string;
        description?: string;
        icon?: string;
        color?: string;
      }>;
    }>(`/services/types${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
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
        profile_image?: string | null;
        likes_count: number;
        comments_count: number;
        user_liked: boolean;
        user_role_number?: number;
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
        user_role_number?: number;
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

  // ========== SERVICE CATALOG (Super Admin) ==========
  getAdminServiceTypes: async () => {
    return request<{
      types: Array<{
        id: string;
        name: string;
        description?: string;
        icon?: string;
        color?: string;
        is_active: boolean;
        created_at: string;
      }>;
    }>('/admin/service-types', {
      method: 'GET',
    });
  },

  createServiceType: async (data: { name: string; description?: string; icon?: string; color?: string }) => {
    return request<{ message: string; type: any }>('/admin/service-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateServiceType: async (id: string, data: { name?: string; description?: string; icon?: string; color?: string; is_active?: boolean }) => {
    return request<{ message: string; type: any }>(`/admin/service-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteServiceType: async (id: string) => {
    return request<{ message: string }>(`/admin/service-types/${id}`, {
      method: 'DELETE',
    });
  },

  // ========== SERVICE SUGGESTIONS (Super Admin) ==========
  getServiceSuggestions: async () => {
    return request<{
      suggestions: Array<{
        id: string;
        custom_service_name: string;
        user_id: string;
        user_name: string;
        user_email: string;
        status: 'pending' | 'approved' | 'rejected';
        created_at: string;
      }>;
    }>('/admin/service-suggestions', {
      method: 'GET',
    });
  },

  processServiceSuggestion: async (id: string, action: 'approve' | 'reject') => {
    // Mapping action to status as usually implied by PUT /admin/service-suggestions/:id
    const status = action === 'approve' ? 'approved' : 'rejected';
    return request<{ message: string }>(`/admin/service-suggestions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  approveService: async (id: string) => {
    return request<{ message: string }>(`/admin/services/${id}/approve`, {
      method: 'PUT',
    });
  },

  rejectService: async (id: string, reason?: string) => {
    return request<{ message: string }>(`/admin/services/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
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
        rut?: string;
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

  // ========== CONFIG / PRICES (Super Admin) ==========
  getPricingConfig: async () => {
    return request<{
      config: {
        whatsapp_contact_price: number;
      };
    }>('/admin/config', {
      method: 'GET',
    });
  },

  updatePricingConfig: async (config: { whatsapp_contact_price: number }) => {
    return request<{ message: string }>('/admin/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  updatePackage: async (packageId: string, data: { price: number; publications: number }) => {
    return request<{ message: string }>(`/admin/packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

  // Actualizar paquete (Admin)
  updatePackage: async (packageId: string, data: { price?: number; publications?: number; is_active?: boolean }) => {
    return request<{
      message: string;
      package: any
    }>(`/packages/admin/packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  // Obtener límites del usuario
  getUserLimits: async () => {
    return request<{
      services: {
        limit: number;
        free_limit: number; // For compatibility
        used: number;
        remaining: number;
        requires_payment: boolean;
      };
      jobs: {
        limit: number;
        free_limit: number; // For compatibility
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
      targetName?: string;
      targetPhone?: string;
      createdAt: string;
      completedAt: string | null;
    }>(`/api/flow/payment/${token}`, {
      method: 'GET',
    });
  },
  // Crear pago de contacto WhatsApp
  createContactPayment: async (targetUserId: string, postId?: string, serviceId?: string) => {
    return request<{
      url: string;
      token: string;
      paymentId: string;
    }>('/api/flow/create-contact-payment', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, postId, serviceId }),
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

// API de Configuración (Precios dinámicos)
export const configAPI = {
  // Precios públicos (ej. WhatsApp)
  getPublicPrices: async () => {
    return request<{
      WHATSAPP_CONTACT_PRICE: number;
      PRICING_ENABLED?: boolean;
    }>('/api/prices', {
      method: 'GET',
    });
  },

  // Configuración del sistema (Admin)
  getAdminConfig: async () => {
    return request<{
      config: Array<{
        key: string;
        value: string;
        description: string;
      }>;
    }>('/api/admin/config', {
      method: 'GET',
    });
  },

  // Actualizar configuración (Admin)
  updateAdminConfig: async (key: string, value: string) => {
    return request<{ message: string }>('/api/admin/config', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    });
  },
};

// API de reseñas para servicios
export const reviewsAPI = {
  // Obtener reseñas de un servicio
  getServiceReviews: async (serviceId: string) => {
    return request<{
      reviews: Array<{
        id: string;
        service_id: string;
        user_id: string;
        user_name: string;
        profile_image?: string | null;
        rating: number;
        comment: string;
        created_at: string;
      }>;
      stats: {
        average_rating: number;
        total_reviews: number;
      };
    }>(`/services/${serviceId}/reviews`, {
      method: 'GET',
    });
  },

  // Crear una reseña
  createServiceReview: async (serviceId: string, data: { rating: number; comment: string }) => {
    return request<{
      message: string;
      review: {
        id: string;
        rating: number;
        comment: string;
      };
    }>(`/services/${serviceId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Eliminar una reseña (solo super-admin)
  deleteServiceReview: async (reviewId: string) => {
    return request<{ message: string }>(`/services/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },
};

export const kycAPI = {
  getKYCStatus: async (email?: string) => {
    const endpoint = email ? `/api/kyc/status?email=${encodeURIComponent(email)}` : '/api/kyc/status';
    return request<{
      kyc: {
        kyc_status: 'not_started' | 'pending' | 'verified' | 'rejected';
        id_front_url?: string;
        id_back_url?: string;
        face_url?: string;
        rejection_reason?: string;
      };
    }>(endpoint, {
      method: 'GET',
      skipAuth: !localStorage.getItem('token'),
    });
  },


  uploadKYC: async (formData: FormData) => {
    return request<{ message: string }>('/api/kyc/upload', {
      method: 'POST',
      body: formData,
      skipAuth: !localStorage.getItem('token'),
    });
  },
};

// API de IA para recomendaciones
export const aiAPI = {
  askAIAboutJobs: async (message: string) => {
    return request<{
      answer: string;
      cards?: Array<{
        type: 'job' | 'service';
        id: string | number;
        title: string;
        subtitle: string;
        details: string;
        url: string;
      }>;
    }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
};

