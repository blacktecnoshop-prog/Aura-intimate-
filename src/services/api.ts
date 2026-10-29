import { Product, Category, StoreSettings, Banner, OrderEnquiry, SecurityLogEntry } from '../types/store';

const API_BASE = '/api';

export function getAdminToken(): string | null {
  return localStorage.getItem('bts_admin_token');
}

export function setAdminToken(token: string): void {
  localStorage.setItem('bts_admin_token', token);
}

export function removeAdminToken(): void {
  localStorage.removeItem('bts_admin_token');
}

function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchSettings(): Promise<StoreSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to load store settings');
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to load categories');
  return res.json();
}

export async function fetchBanners(): Promise<Banner[]> {
  const res = await fetch(`${API_BASE}/banners`);
  if (!res.ok) throw new Error('Failed to load banners');
  return res.json();
}

export async function fetchProducts(params?: {
  category?: string;
  search?: string;
  featured?: boolean;
  newArrival?: boolean;
  isSale?: boolean;
  sort?: string;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.category && params.category !== 'all') searchParams.append('category', params.category);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.featured) searchParams.append('featured', 'true');
  if (params?.newArrival) searchParams.append('newArrival', 'true');
  if (params?.isSale) searchParams.append('isSale', 'true');
  if (params?.sort) searchParams.append('sort', params.sort);

  const res = await fetch(`${API_BASE}/products?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

export async function fetchProductById(id: string): Promise<Product & { matchingProducts?: Product[] }> {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error('Product not found');
  return res.json();
}

export async function subscribeNewsletter(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Subscription failed');
  return data;
}

export async function logOrderEnquiry(payload: {
  items: any[];
  subtotal: number;
  channel?: 'instagram';
  copiedMessage: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/orders/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, channel: 'instagram' }),
  });
  return res.json();
}

// ================= ADMIN API =================

export async function checkAdminStatus(): Promise<{
  authenticated: boolean;
  setupCompleted: boolean;
  lastPasswordChange?: string;
  smtpConfigured?: boolean;
  smtpTarget?: string;
}> {
  const res = await fetch(`${API_BASE}/admin/status`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return { authenticated: false, setupCompleted: false };
  return res.json();
}

export async function fetchSmtpStatus(): Promise<{
  configured: boolean;
  host?: string;
  port?: number;
  userConfigured: boolean;
  passConfigured: boolean;
  alertEmailConfigured: boolean;
  targetEmail?: string;
}> {
  const res = await fetch(`${API_BASE}/admin/smtp-status`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch SMTP configuration status");
  return res.json();
}

export async function testSmtpConnection(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/test-smtp`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "SMTP test failed");
  return data;
}

export async function adminLogin(password: string): Promise<{ success: boolean; token: string }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  setAdminToken(data.token);
  return data;
}

export async function adminLogout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/admin/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } finally {
    removeAdminToken();
  }
}

export async function adminSetupPassword(payload: {
  currentPassword?: string;
  newPassword: string;
}): Promise<{ success: boolean; token: string; recoveryKey?: string; message?: string }> {
  const res = await fetch(`${API_BASE}/admin/setup`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Password setup failed');
  if (data.token) {
    setAdminToken(data.token);
  }
  return data;
}

export async function adminRequestReset(): Promise<{ success: boolean; message: string; setupNeeded?: boolean }> {
  const res = await fetch(`${API_BASE}/admin/request-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to request password reset code');
  return data;
}

export async function adminResetPassword(payload: {
  recoveryKey?: string;
  resetCode?: string;
  newPassword: string;
}): Promise<{ success: boolean; token: string; recoveryKey?: string; message: string }> {
  const res = await fetch(`${API_BASE}/admin/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Password reset failed');
  if (data.token) {
    setAdminToken(data.token);
  }
  return data;
}

export async function rotateRecoveryKey(): Promise<{ success: boolean; recoveryKey: string; message: string }> {
  const res = await fetch(`${API_BASE}/admin/rotate-recovery-key`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate new recovery key');
  return data;
}

export async function fetchAdminStats(): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Unauthorized or failed to fetch stats');
  return res.json();
}

export async function fetchAdminEnquiries(): Promise<OrderEnquiry[]> {
  const res = await fetch(`${API_BASE}/admin/enquiries`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch enquiries');
  return res.json();
}

export async function fetchSecurityLogs(): Promise<SecurityLogEntry[]> {
  const res = await fetch(`${API_BASE}/admin/security-logs`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch security activity logs');
  return res.json();
}

export async function revokeAllSessions(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/revoke-sessions`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to revoke sessions');
  return data;
}

export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create product');
  return data;
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update product');
  return data;
}

export async function updateProductStock(id: string, stock: number): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}/stock`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ stock }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update stock');
  return data;
}

export async function duplicateProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}/duplicate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to duplicate product');
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete product');
  }
}

export async function createCategory(catData: Partial<Category>): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(catData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create category');
  return data;
}

export async function updateCategory(id: string, catData: Partial<Category>): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(catData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update category');
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete category');
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  return data;
}

export async function uploadImage(base64Data: string, filename?: string): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ base64Data, filename }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}
