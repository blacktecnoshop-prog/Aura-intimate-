import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Image as ImageIcon,
  Save,
  LogOut,
  Package,
  Layers,
  Settings,
  ShieldCheck,
  Check,
  AlertTriangle,
  Upload,
  MessageSquare,
  Search,
  Globe,
  Sparkles,
  RefreshCw,
  Sliders,
  Activity,
  KeyRound,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag,
  Mail,
  Send,
  RotateCcw
} from 'lucide-react';
import { Product, Category, StoreSettings, OrderEnquiry, ProductColor, ProductVariant, SecurityLogEntry } from '../../types/store';
import {
  checkAdminStatus,
  adminLogin,
  adminLogout,
  adminSetupPassword,
  adminRequestReset,
  adminResetPassword,
  rotateRecoveryKey,
  fetchAdminStats,
  fetchAdminEnquiries,
  fetchSecurityLogs,
  revokeAllSessions,
  createProduct,
  updateProduct,
  updateProductStock,
  duplicateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  updateStoreSettings,
  uploadImage
} from '../../services/api';
import { useCart } from '../../context/CartContext';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  onRefreshData: () => Promise<void>;
}

// 18 Preset colors specified in design constitution
const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#D32F2F' },
  { name: 'Pink', hex: '#F48FB1' },
  { name: 'Nude', hex: '#E0AC9D' },
  { name: 'Beige', hex: '#D7C4B7' },
  { name: 'Brown', hex: '#6D4C41' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Wine', hex: '#5B1E31' },
  { name: 'Purple', hex: '#6A1B9A' },
  { name: 'Lavender', hex: '#CE93D8' },
  { name: 'Blue', hex: '#1976D2' },
  { name: 'Navy Blue', hex: '#0D233A' },
  { name: 'Green', hex: '#2E7D32' },
  { name: 'Grey', hex: '#757575' },
  { name: 'Yellow', hex: '#FBC02D' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Multi-colour', hex: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)' }
];

// Preset size groups
const PRESET_BRA_SIZES = [
  '30A', '30B', '30C', '30D',
  '32A', '32B', '32C', '32D',
  '34A', '34B', '34C', '34D',
  '36A', '36B', '36C', '36D',
  '38A', '38B', '38C', '38D',
  '40B', '40C', '40D'
];

const PRESET_PANTY_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  onRefreshData,
}) => {
  const { settings, refreshSettings } = useCart();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [setupCompleted, setSetupCompleted] = useState<boolean>(true);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // First time owner setup state
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // Master Password Reset & Recovery State
  const [isResetMode, setIsResetMode] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'key' | 'otp'>('key');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [requestingCode, setRequestingCode] = useState(false);
  const [requestCodeMsg, setRequestCodeMsg] = useState('');
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [rotatingKey, setRotatingKey] = useState(false);
  const [rotateKeyMsg, setRotateKeyMsg] = useState('');

  // 60-second cooldown timer effect
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // Active Tab: Mobile friendly bottom bar / navigation
  type TabType = 'overview' | 'products' | 'categories' | 'enquiries' | 'settings' | 'security' | 'activity';
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Stats & Enquiries & Security Logs
  const [stats, setStats] = useState<any>(null);
  const [enquiries, setEnquiries] = useState<OrderEnquiry[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>([]);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [revokeFeedback, setRevokeFeedback] = useState('');

  // Product Editing / Creation State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productFormError, setProductFormError] = useState('');
  const [productFormLoading, setProductFormLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Bulk Variant stock setter input
  const [bulkVariantStock, setBulkVariantStock] = useState<number>(10);

  // Custom Color / Size / Image inputs
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#D7A79D');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category Editing / Creation State
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deleteCatConfirmId, setDeleteCatConfirmId] = useState<string | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Password Change State
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ error: '', success: '' });
  const [changingPwd, setChangingPwd] = useState(false);

  // Search & Filter in Admin Products
  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('all');
  const [adminStockFilter, setAdminStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Initial Auth Check
  useEffect(() => {
    if (isOpen) {
      verifyAuth();
    }
  }, [isOpen]);

  const verifyAuth = async () => {
    setCheckingAuth(true);
    try {
      const res = await checkAdminStatus();
      setIsAuthenticated(res.authenticated);
      setSetupCompleted(res.setupCompleted !== false);
      if (res.authenticated) {
        loadAdminData();
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [s, enqs, logs] = await Promise.all([
        fetchAdminStats().catch(() => null),
        fetchAdminEnquiries().catch(() => []),
        fetchSecurityLogs().catch(() => []),
      ]);
      setStats(s);
      setEnquiries(enqs);
      setSecurityLogs(logs);
      setSettingsForm(settings);
    } catch (err) {
      console.warn('Failed to load admin stats:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await adminLogin(loginPassword);
      setIsAuthenticated(true);
      setLoginPassword('');
      await loadAdminData();
      await onRefreshData();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid owner credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFirstTimeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    if (setupPassword.length < 8) {
      setSetupError('Password must be at least 8 characters long.');
      return;
    }
    if (setupPassword !== setupConfirm) {
      setSetupError('Passwords do not match.');
      return;
    }
    setSetupLoading(true);
    try {
      const res = await adminSetupPassword({ newPassword: setupPassword });
      setSetupCompleted(true);
      setIsAuthenticated(true);
      if (res?.recoveryKey) {
        setGeneratedRecoveryKey(res.recoveryKey);
      }
      setSetupPassword('');
      setSetupConfirm('');
      await loadAdminData();
      await onRefreshData();
    } catch (err: any) {
      setSetupError(err.message || 'Setup failed');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleRequestCode = async () => {
    setRequestingCode(true);
    setRequestCodeMsg('');
    setResetError('');
    try {
      const res = await adminRequestReset();
      if (res.setupNeeded) {
        setSetupCompleted(false);
        setIsResetMode(false);
      } else {
        setRequestCodeMsg(res.message || 'Reset code dispatched to owner alerts.');
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to request reset code');
    } finally {
      setRequestingCode(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (resetNewPassword.length < 8) {
      setResetError('New password must be at least 8 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    if (!resetIdentifier.trim()) {
      setResetError('Please enter your Recovery Key or 6-digit Reset Code.');
      return;
    }
    setResetLoading(true);
    try {
      const isCode = /^\d{6}$/.test(resetIdentifier.trim());
      const res = await adminResetPassword({
        recoveryKey: isCode ? undefined : resetIdentifier.trim(),
        resetCode: isCode ? resetIdentifier.trim() : undefined,
        newPassword: resetNewPassword
      });
      setResetSuccess(res.message || 'Master password updated successfully!');
      if (res.recoveryKey) {
        setGeneratedRecoveryKey(res.recoveryKey);
      }
      setIsAuthenticated(true);
      setIsResetMode(false);
      setResetIdentifier('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      await loadAdminData();
      await onRefreshData();
    } catch (err: any) {
      setResetError(err.message || 'Password reset failed');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setIsAuthenticated(false);
    setActiveTab('overview');
  };

  const handleRevokeSessions = async () => {
    if (!window.confirm('Revoke all other active sessions except your current device?')) return;
    setRevokingSessions(true);
    setRevokeFeedback('');
    try {
      const res = await revokeAllSessions();
      setRevokeFeedback(res.message || 'Other sessions revoked.');
      const updatedLogs = await fetchSecurityLogs();
      setSecurityLogs(updatedLogs);
      setTimeout(() => setRevokeFeedback(''), 4000);
    } catch (err: any) {
      setRevokeFeedback(err.message || 'Failed to revoke sessions');
    } finally {
      setRevokingSessions(false);
    }
  };

  // Open Product Modal (New or Edit)
  const handleOpenProductModal = (product?: Product) => {
    setProductFormError('');
    if (product) {
      setEditingProduct({
        ...product,
        images: product.images ? [...product.images] : [],
        colors: product.colors ? [...product.colors] : [],
        sizes: product.sizes ? [...product.sizes] : [],
        variants: product.variants ? [...product.variants] : [],
        metaKeywords: product.metaKeywords ? [...product.metaKeywords] : [],
      });
    } else {
      setEditingProduct({
        name: '',
        sku: `BTS-${Math.floor(1000 + Math.random() * 9000)}`,
        categoryId: categories[0]?.id || 'bras',
        categoryName: categories[0]?.name || 'Bras',
        sellingPrice: 1299,
        originalPrice: 1699,
        stock: 25,
        description: '',
        fabricAndCare: '85% Polyamide, 15% Elastane. Hand wash cold.',
        hygieneNotice: 'For sanitary hygiene safety, this item is non-returnable once opened.',
        featured: false,
        newArrival: true,
        isSale: false,
        images: ['/images/hero_luxury_innerwear_1792781847179.jpg'],
        colors: [{ name: 'Black', hex: '#1A1A1A' }],
        sizes: ['32B', '34B', '36B'],
        variants: [],
        metaTitle: '',
        metaDescription: '',
        metaKeywords: ['luxury innerwear', 'Aura Intimates'],
      });
    }
    setIsProductModalOpen(true);
  };

  // Color Toggle helper
  const handleTogglePresetColor = (preset: { name: string; hex: string }) => {
    if (!editingProduct) return;
    const currentColors = editingProduct.colors || [];
    const exists = currentColors.some((c) => c.name.toLowerCase() === preset.name.toLowerCase());
    if (exists) {
      setEditingProduct({
        ...editingProduct,
        colors: currentColors.filter((c) => c.name.toLowerCase() !== preset.name.toLowerCase()),
      });
    } else {
      setEditingProduct({
        ...editingProduct,
        colors: [...currentColors, { name: preset.name, hex: preset.hex, imageIndex: 0 }],
      });
    }
  };

  // Add Custom Color
  const handleAddCustomColor = () => {
    if (!customColorName.trim() || !editingProduct) return;
    const currentColors = editingProduct.colors || [];
    if (currentColors.some((c) => c.name.toLowerCase() === customColorName.trim().toLowerCase())) {
      return;
    }
    setEditingProduct({
      ...editingProduct,
      colors: [
        ...currentColors,
        { name: customColorName.trim(), hex: customColorHex, imageIndex: 0 },
      ],
    });
    setCustomColorName('');
  };

  // Remove Color
  const handleRemoveColor = (index: number) => {
    if (!editingProduct) return;
    const currentColors = [...(editingProduct.colors || [])];
    currentColors.splice(index, 1);
    setEditingProduct({ ...editingProduct, colors: currentColors });
  };

  // Size Toggle helper
  const handleToggleSize = (sz: string) => {
    if (!editingProduct) return;
    const currentSizes = editingProduct.sizes || [];
    if (currentSizes.includes(sz)) {
      setEditingProduct({
        ...editingProduct,
        sizes: currentSizes.filter((s) => s !== sz),
      });
    } else {
      setEditingProduct({
        ...editingProduct,
        sizes: [...currentSizes, sz],
      });
    }
  };

  // Add Custom Size
  const handleAddCustomSize = () => {
    if (!customSizeInput.trim() || !editingProduct) return;
    const sz = customSizeInput.trim().toUpperCase();
    const currentSizes = editingProduct.sizes || [];
    if (!currentSizes.includes(sz)) {
      setEditingProduct({
        ...editingProduct,
        sizes: [...currentSizes, sz],
      });
    }
    setCustomSizeInput('');
  };

  // Preset Size Select All
  const handleSelectAllBraSizes = () => {
    if (!editingProduct) return;
    const currentSizes = new Set(editingProduct.sizes || []);
    PRESET_BRA_SIZES.forEach((s) => currentSizes.add(s));
    setEditingProduct({ ...editingProduct, sizes: Array.from(currentSizes) });
  };

  const handleSelectAllPantySizes = () => {
    if (!editingProduct) return;
    const currentSizes = new Set(editingProduct.sizes || []);
    PRESET_PANTY_SIZES.forEach((s) => currentSizes.add(s));
    setEditingProduct({ ...editingProduct, sizes: Array.from(currentSizes) });
  };

  // Generate Variants Matrix (Color x Size)
  const handleGenerateVariants = () => {
    if (!editingProduct) return;
    const colors = editingProduct.colors || [];
    const sizes = editingProduct.sizes || [];

    if (colors.length === 0 || sizes.length === 0) {
      alert('Please select at least 1 colour and 1 size first.');
      return;
    }

    const newVariants: ProductVariant[] = [];
    const baseSku = editingProduct.sku || 'BTS';

    colors.forEach((c) => {
      sizes.forEach((s) => {
        const cleanColorSlug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const cleanSizeSlug = s.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const variantId = `${baseSku}-${cleanColorSlug}-${cleanSizeSlug}`;

        // Preserve existing if present
        const existing = (editingProduct.variants || []).find(
          (v) => v.color.toLowerCase() === c.name.toLowerCase() && v.size === s
        );

        if (existing) {
          newVariants.push(existing);
        } else {
          newVariants.push({
            id: variantId,
            color: c.name,
            size: s,
            sku: `${baseSku}-${cleanColorSlug.toUpperCase()}-${cleanSizeSlug.toUpperCase()}`,
            stock: bulkVariantStock,
            available: true,
            imageIndex: c.imageIndex || 0,
          });
        }
      });
    });

    setEditingProduct({
      ...editingProduct,
      variants: newVariants,
    });
  };

  // Bulk set all variant stocks
  const handleApplyBulkVariantStock = () => {
    if (!editingProduct || !editingProduct.variants) return;
    const updated = editingProduct.variants.map((v) => ({
      ...v,
      stock: bulkVariantStock,
      available: bulkVariantStock > 0,
    }));
    setEditingProduct({ ...editingProduct, variants: updated });
  };

  // Update specific variant field
  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    if (!editingProduct || !editingProduct.variants) return;
    const updated = [...editingProduct.variants];
    updated[index] = { ...updated[index], [field]: value };
    setEditingProduct({ ...editingProduct, variants: updated });
  };

  // Image Upload Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Image size exceeds 8MB. Please choose a smaller image.');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await uploadImage(base64, file.name);
        if (editingProduct) {
          setEditingProduct({
            ...editingProduct,
            images: [...(editingProduct.images || []), res.url],
          });
        }
      } catch (err: any) {
        alert(err.message || 'Image upload failed');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setProductFormError('');

    if (!editingProduct.name?.trim()) {
      setProductFormError('Product name is required.');
      return;
    }
    if (!editingProduct.sellingPrice || Number(editingProduct.sellingPrice) <= 0) {
      setProductFormError('Valid selling price is required.');
      return;
    }

    setProductFormLoading(true);
    try {
      if (editingProduct.id) {
        await updateProduct(editingProduct.id, editingProduct);
      } else {
        await createProduct(editingProduct);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      await onRefreshData();
      await loadAdminData();
    } catch (err: any) {
      setProductFormError(err.message || 'Failed to save product.');
    } finally {
      setProductFormLoading(false);
    }
  };

  // Quick Inline Stock Update from card / table
  const handleQuickStockUpdate = async (productId: string, newStock: number) => {
    try {
      await updateProductStock(productId, Math.max(0, newStock));
      await onRefreshData();
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    }
  };

  // Duplicate Product
  const handleDuplicateProduct = async (id: string) => {
    setDuplicatingId(id);
    try {
      await duplicateProduct(id);
      await onRefreshData();
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate product');
    } finally {
      setDuplicatingId(null);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setDeleteConfirmId(null);
      await onRefreshData();
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product.');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStoreSettings(settingsForm);
      await refreshSettings();
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg({ error: '', success: '' });
    if (newPwd.length < 8) {
      setPwdMsg({ error: 'New password must be at least 8 characters.', success: '' });
      return;
    }
    if (newPwd !== confirmNewPwd) {
      setPwdMsg({ error: 'New passwords do not match.', success: '' });
      return;
    }

    setChangingPwd(true);
    try {
      await adminSetupPassword({ currentPassword: currentPwd, newPassword: newPwd });
      setPwdMsg({ error: '', success: 'Owner master password updated successfully!' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmNewPwd('');
      const updatedLogs = await fetchSecurityLogs();
      setSecurityLogs(updatedLogs);
    } catch (err: any) {
      setPwdMsg({ error: err.message || 'Password update failed', success: '' });
    } finally {
      setChangingPwd(false);
    }
  };

  // Category Handlers
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory({ ...cat });
    } else {
      setEditingCategory({
        name: '',
        slug: '',
        description: '',
        image: '/images/hero_luxury_innerwear_1792781847179.jpg',
        order: categories.length + 1,
        featured: false,
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name) return;
    try {
      if (editingCategory.id) {
        await updateCategory(editingCategory.id, editingCategory);
      } else {
        await createCategory(editingCategory);
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      await onRefreshData();
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    const productsInCat = products.filter((p) => p.categoryId === catId || p.categoryName?.toLowerCase() === catId.toLowerCase()).length;
    if (productsInCat > 0) {
      if (!window.confirm(`Warning: There are ${productsInCat} products in this category. Are you sure you want to delete it?`)) {
        return;
      }
    }
    try {
      await deleteCategory(catId);
      setDeleteCatConfirmId(null);
      await onRefreshData();
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  // Filtered products in Admin list
  const filteredAdminProducts = useMemo(() => {
    return products.filter((p) => {
      if (adminProductSearch) {
        const q = adminProductSearch.toLowerCase();
        const mName = p.name.toLowerCase().includes(q);
        const mSku = p.sku.toLowerCase().includes(q);
        const mCat = p.categoryName?.toLowerCase().includes(q);
        if (!mName && !mSku && !mCat) return false;
      }
      if (adminCategoryFilter !== 'all' && p.categoryId !== adminCategoryFilter) {
        return false;
      }
      if (adminStockFilter === 'low' && p.stock > 5) return false;
      if (adminStockFilter === 'out' && p.stock > 0) return false;
      return true;
    });
  }, [products, adminProductSearch, adminCategoryFilter, adminStockFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F5] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-2xl flex flex-col shadow-2xl border-0 sm:border border-[#EDE4DE] overflow-hidden text-[#2B1220]">
        
        {/* Compact Admin Top Header */}
        <div className="px-4 py-3 sm:px-6 bg-[#2B1220] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/images/aura-intimates-logo.png"
              alt="Aura Intimates official logo"
              className="w-9 h-9 rounded-lg object-contain bg-white/10 p-0.5 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold tracking-tight">
                  Owner Management Panel
                </h2>
                {isAuthenticated && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Verified Session
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#EED0C9]/80 truncate">
                {settings.brandName || 'Aura Intimates'} · Private Administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
          {checkingAuth ? (
            <div className="flex-1 flex items-center justify-center p-12 text-xs text-[#886A72]">
              Verifying owner security session...
            </div>
          ) : !setupCompleted ? (
            /* First-Time Owner Password Setup */
            <div className="flex-1 overflow-y-auto p-6 sm:p-12 flex items-center justify-center">
              <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE4DE] shadow-md space-y-5">
                <img
                  src="/images/aura-intimates-logo.png"
                  alt="Aura Intimates official logo"
                  className="h-14 w-auto object-contain mx-auto"
                />
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold text-[#2B1220]">Owner Security Initialization</h3>
                  <p className="text-xs text-[#6E5D65]">
                    Welcome! Set your private master password for {settings.brandName || 'Aura Intimates'}. Only you will be able to add or modify products.
                  </p>
                </div>

                <form onSubmit={handleFirstTimeSetup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2B1220] mb-1">
                      Choose Master Password (minimum 8 characters)
                    </label>
                    <input
                      type="password"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="Enter strong password"
                      required
                      minLength={8}
                      className="w-full text-xs p-3 rounded-lg border border-[#DED4CE] outline-none focus:border-[#2B1220] bg-[#FCFAF8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B1220] mb-1">
                      Confirm Master Password
                    </label>
                    <input
                      type="password"
                      value={setupConfirm}
                      onChange={(e) => setSetupConfirm(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      minLength={8}
                      className="w-full text-xs p-3 rounded-lg border border-[#DED4CE] outline-none focus:border-[#2B1220] bg-[#FCFAF8]"
                    />
                  </div>

                  {setupError && (
                    <div className="p-2.5 rounded bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{setupError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={setupLoading}
                    className="w-full py-3 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {setupLoading ? 'Securing Credentials...' : 'Set Owner Password & Open Panel'}
                  </button>
                </form>
              </div>
            </div>
          ) : !isAuthenticated ? (
            /* Clean Owner Login / Password Reset Portal */
            <div className="flex-1 overflow-y-auto p-6 sm:p-12 flex items-center justify-center">
              <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE4DE] shadow-md space-y-5">
                <div className="flex flex-col items-center text-center space-y-2">
                  <img
                    src="/images/aura-intimates-logo.png"
                    alt="Aura Intimates official logo"
                    className="h-16 w-auto object-contain mx-auto"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-[#2B1220]">
                      {isResetMode ? 'Reset Owner Master Password' : `${settings.brandName || 'Aura Intimates'} Owner Portal`}
                    </h3>
                    <p className="text-xs text-[#6E5D65] leading-relaxed mt-0.5">
                      {isResetMode
                        ? 'Use your secure emergency Recovery Key or request a one-time verification code to restore access.'
                        : 'Access catalogue management, variant matrix generator, and customer order inquiries.'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] text-[11px] text-[#6E5D65] space-y-1">
                  <div className="font-semibold text-[#2B1220] flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    <span>Protected Server Endpoint</span>
                  </div>
                  <p>
                    All product mutations require a valid scrypt cryptographic token. Failed attempts are rate-limited to protect your store.
                  </p>
                </div>

                {!isResetMode ? (
                  /* Standard Owner Login Form */
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#2B1220] mb-1">
                        Master Password
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your owner password"
                        required
                        autoFocus
                        className="w-full text-xs p-3 rounded-lg border border-[#DED4CE] outline-none focus:border-[#2B1220] bg-[#FCFAF8]"
                      />
                    </div>

                    {loginError && (
                      <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-start gap-2">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loginLoading ? 'Authenticating...' : 'Sign In to Owner Dashboard'}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetMode(true);
                          setLoginError('');
                          setResetError('');
                          setResetSuccess('');
                        }}
                        className="text-xs text-[#886A72] hover:text-[#2B1220] underline transition-colors cursor-pointer"
                      >
                        Forgot or need to reset master password?
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Owner Password Reset Form */
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#2B1220]">
                          Recovery Key or 6-digit Code
                        </label>
                        <button
                          type="button"
                          disabled={requestingCode}
                          onClick={handleRequestCode}
                          className="text-[11px] text-[#886A72] hover:text-[#2B1220] underline transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {requestingCode ? 'Dispatching...' : 'Request 6-digit Code'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        placeholder="Paste Recovery Key (e.g. bts_rec_...) or 6-digit code"
                        required
                        className="w-full text-xs p-3 rounded-lg border border-[#DED4CE] outline-none focus:border-[#2B1220] bg-[#FCFAF8] font-mono"
                      />
                      {requestCodeMsg && (
                        <p className="text-[11px] text-emerald-700 mt-1 font-medium">{requestCodeMsg}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#2B1220] mb-1">
                        New Master Password (min 8 characters)
                      </label>
                      <input
                        type="password"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Choose new strong password"
                        required
                        minLength={8}
                        className="w-full text-xs p-3 rounded-lg border border-[#DED4CE] outline-none focus:border-[#2B1220] bg-[#FCFAF8]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#2B1220] mb-1">
                        Confirm New Master Password
                      </label>
                      <input
                        type="password"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        minLength={8}
                        className="w-full text-xs p-3 rounded-lg border border-[#DED4CE] outline-none focus:border-[#2B1220] bg-[#FCFAF8]"
                      />
                    </div>

                    {resetError && (
                      <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-start gap-2">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                        <span>{resetError}</span>
                      </div>
                    )}

                    {resetSuccess && (
                      <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                        <Check size={15} className="shrink-0 text-emerald-600" />
                        <span>{resetSuccess}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full py-3 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {resetLoading ? 'Resetting & Securing...' : 'Reset Password & Open Panel'}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetMode(false);
                          setResetError('');
                          setResetSuccess('');
                        }}
                        className="text-xs text-[#886A72] hover:text-[#2B1220] underline transition-colors cursor-pointer"
                      >
                        Return to Owner Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* Authenticated Owner Workspace */
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              {/* Desktop Sidebar Navigation */}
              <aside className="hidden md:flex w-52 bg-[#FAF7F5] border-r border-[#EFE8E5] flex-col justify-between shrink-0 p-3">
                <nav className="space-y-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: TrendingUp },
                    { id: 'products', label: 'Products & Stock', icon: Package, badge: products.length },
                    { id: 'categories', label: 'Categories', icon: Layers, badge: categories.length },
                    { id: 'enquiries', label: 'Order Inquiries', icon: MessageSquare, badge: enquiries.length },
                    { id: 'settings', label: 'Store Settings', icon: Settings },
                    { id: 'security', label: 'Master Password', icon: KeyRound },
                    { id: 'activity', label: 'Security Activity', icon: Activity, badge: securityLogs.length },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as TabType)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#2B1220] text-white font-semibold shadow-xs'
                            : 'text-[#55464D] hover:bg-black/5 hover:text-[#2B1220]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[#6E5D65]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="p-3 bg-white rounded-xl border border-[#EDE4DE] text-[11px] text-[#886A72] space-y-1">
                  <div className="font-medium text-[#2B1220] flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-700" />
                    <span>Owner Exclusive</span>
                  </div>
                  <p className="leading-tight">
                    Only authenticated admin can alter prices, stock, or catalogue.
                  </p>
                </div>
              </aside>

              {/* Mobile Tab Pill Scroller (compact & accessible) */}
              <div className="md:hidden flex items-center gap-1.5 p-2 bg-[#FAF7F5] border-b border-[#EFE8E5] overflow-x-auto scrollbar-none shrink-0">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'products', label: `Products (${products.length})` },
                  { id: 'categories', label: `Categories (${categories.length})` },
                  { id: 'enquiries', label: `Inquiries (${enquiries.length})` },
                  { id: 'settings', label: 'Settings' },
                  { id: 'security', label: 'Password' },
                  { id: 'activity', label: 'Activity' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as TabType)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeTab === item.id
                        ? 'bg-[#2B1220] text-white font-semibold shadow-xs'
                        : 'bg-white text-[#55464D] border border-[#EDE4DE]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Main Tab Content Viewport */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-h-0">
                {generatedRecoveryKey && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-xs">
                        <KeyRound size={15} className="text-amber-700" />
                        <span>Save Your Emergency Master Recovery Key</span>
                      </div>
                      <button
                        onClick={() => setGeneratedRecoveryKey(null)}
                        className="text-xs text-amber-700 hover:text-amber-900 underline cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Store this key securely. If you ever forget your master password, you can use this key on the login screen to immediately reset your credentials.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-lg border border-amber-300 select-all">
                        {generatedRecoveryKey}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedRecoveryKey);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 3000);
                        }}
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedKey ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-serif-luxury font-medium text-[#2B1220]">
                          Store Performance & Overview
                        </h3>
                        <p className="text-xs text-[#6E5D65]">
                          Real-time metrics from your active store catalogue and Instagram enquiries.
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenProductModal()}
                        className="px-4 py-2.5 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        <Plus size={15} />
                        <span>Add New Product</span>
                      </button>
                    </div>

                    {/* Stats Grid: 2 columns on mobile, 4 on desktop */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-1">
                        <div className="text-xs text-[#886A72] font-medium">Total Products</div>
                        <div className="text-2xl font-bold font-mono text-[#2B1220]">{products.length}</div>
                        <div className="text-[11px] text-emerald-700">Active in Catalogue</div>
                      </div>

                      <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-1">
                        <div className="text-xs text-[#886A72] font-medium">Low Stock Items</div>
                        <div className="text-2xl font-bold font-mono text-amber-700">
                          {products.filter((p) => p.stock <= 5).length}
                        </div>
                        <div className="text-[11px] text-[#886A72]">Stock &le; 5 units</div>
                      </div>

                      <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-1">
                        <div className="text-xs text-[#886A72] font-medium">Instagram Inquiries</div>
                        <div className="text-2xl font-bold font-mono text-[#2B1220]">{enquiries.length}</div>
                        <div className="text-[11px] text-[#886A72]">Logged customer orders</div>
                      </div>

                      <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-1">
                        <div className="text-xs text-[#886A72] font-medium">Categories</div>
                        <div className="text-2xl font-bold font-mono text-[#2B1220]">{categories.length}</div>
                        <div className="text-[11px] text-[#886A72]">Display Collections</div>
                      </div>
                    </div>

                    {/* Quick Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div
                        onClick={() => {
                          setActiveTab('products');
                          handleOpenProductModal();
                        }}
                        className="p-4 bg-white rounded-xl border border-[#EDE4DE] hover:border-[#2B1220] transition-colors cursor-pointer space-y-2 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#FAF0ED] text-[#2B1220] flex items-center justify-center group-hover:bg-[#2B1220] group-hover:text-white transition-colors">
                          <Plus size={18} />
                        </div>
                        <div className="text-xs font-semibold text-[#2B1220]">Add Product with Variants</div>
                        <p className="text-[11px] text-[#6E5D65]">
                          Use ready-made colour swatches, bra/panty sizes, and 1-click variant matrix.
                        </p>
                      </div>

                      <div
                        onClick={() => setActiveTab('enquiries')}
                        className="p-4 bg-white rounded-xl border border-[#EDE4DE] hover:border-[#2B1220] transition-colors cursor-pointer space-y-2 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#FAF0ED] text-[#2B1220] flex items-center justify-center group-hover:bg-[#2B1220] group-hover:text-white transition-colors">
                          <MessageSquare size={18} />
                        </div>
                        <div className="text-xs font-semibold text-[#2B1220]">Review Customer Inquiries</div>
                        <p className="text-[11px] text-[#6E5D65]">
                          See items, chosen sizes, and copied Instagram messages from shoppers.
                        </p>
                      </div>

                      <div
                        onClick={() => setActiveTab('activity')}
                        className="p-4 bg-white rounded-xl border border-[#EDE4DE] hover:border-[#2B1220] transition-colors cursor-pointer space-y-2 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#FAF0ED] text-[#2B1220] flex items-center justify-center group-hover:bg-[#2B1220] group-hover:text-white transition-colors">
                          <Activity size={18} />
                        </div>
                        <div className="text-xs font-semibold text-[#2B1220]">Security Activity & Sessions</div>
                        <p className="text-[11px] text-[#6E5D65]">
                          Audit recent login attempts, IP addresses, and revoke active sessions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRODUCTS & STOCK */}
                {activeTab === 'products' && (
                  <div className="space-y-5">
                    {/* Header with Search and Filter */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-[#2B1220]">
                          Product Catalogue & Inventory ({filteredAdminProducts.length})
                        </h3>
                        <p className="text-xs text-[#6E5D65]">
                          Create products, update stock inline, duplicate listings, or modify colour/size variants.
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenProductModal()}
                        className="px-4 py-2.5 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus size={15} />
                        <span>Add Product</span>
                      </button>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#FAF7F5] p-3 rounded-xl border border-[#EDE4DE]">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-3 text-[#886A72]" />
                        <input
                          type="text"
                          value={adminProductSearch}
                          onChange={(e) => setAdminProductSearch(e.target.value)}
                          placeholder="Search title, SKU..."
                          className="w-full text-xs pl-8 pr-3 py-2 bg-white rounded-lg border border-[#DED4CE] outline-none focus:border-[#2B1220]"
                        />
                      </div>

                      <div>
                        <select
                          value={adminCategoryFilter}
                          onChange={(e) => setAdminCategoryFilter(e.target.value)}
                          className="w-full text-xs p-2 bg-white rounded-lg border border-[#DED4CE] outline-none focus:border-[#2B1220] cursor-pointer"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <select
                          value={adminStockFilter}
                          onChange={(e) => setAdminStockFilter(e.target.value as any)}
                          className="w-full text-xs p-2 bg-white rounded-lg border border-[#DED4CE] outline-none focus:border-[#2B1220] cursor-pointer"
                        >
                          <option value="all">All Stock Statuses</option>
                          <option value="low">Low Stock (&le; 5 units)</option>
                          <option value="out">Out of Stock (0 units)</option>
                        </select>
                      </div>
                    </div>

                    {/* Mobile Product Card View (Responsive, no desktop tables cut-off) */}
                    <div className="grid grid-cols-1 md:hidden gap-3">
                      {filteredAdminProducts.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white p-3.5 rounded-xl border border-[#EDE4DE] shadow-xs space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={p.images[0] || '/images/hero_luxury_innerwear_1792781847179.jpg'}
                              alt={p.name}
                              className="w-16 h-20 object-cover rounded-lg bg-stone-100 shrink-0 border border-[#E5DDD7]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-mono text-[#886A72] truncate">
                                SKU: {p.sku} · {p.categoryName}
                              </div>
                              <h4 className="text-xs font-semibold text-[#2B1220] leading-snug truncate">
                                {p.name}
                              </h4>
                              <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-xs font-bold font-mono text-[#2B1220]">
                                  ₹{p.sellingPrice.toLocaleString('en-IN')}
                                </span>
                                {p.originalPrice && p.originalPrice > p.sellingPrice && (
                                  <span className="text-[10px] text-[#886A72] line-through font-mono">
                                    ₹{p.originalPrice.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#6E5D65] mt-1">
                                {p.colors?.length || 0} colours · {p.sizes?.length || 0} sizes
                                {p.variants && p.variants.length > 0 && ` (${p.variants.length} variants)`}
                              </div>
                            </div>
                          </div>

                          {/* Inline Stock Adjustment & Actions */}
                          <div className="pt-2 border-t border-[#F0EAE7] flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-[#886A72]">Stock:</span>
                              <input
                                type="number"
                                defaultValue={p.stock}
                                onBlur={(e) => handleQuickStockUpdate(p.id, Number(e.target.value))}
                                className="w-16 text-xs text-center py-1 px-1.5 rounded border border-[#DED4CE] bg-[#FAF7F5] font-mono font-semibold"
                                min={0}
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDuplicateProduct(p.id)}
                                disabled={duplicatingId === p.id}
                                title="Duplicate"
                                className="p-2 text-[#55464D] hover:text-[#2B1220] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenProductModal(p)}
                                title="Edit"
                                className="p-2 text-[#55464D] hover:text-[#2B1220] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                              {deleteConfirmId === p.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-semibold"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-2 py-1 bg-stone-200 text-stone-700 rounded text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(p.id)}
                                  title="Delete"
                                  className="p-2 text-[#886A72] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-xl border border-[#EDE4DE] overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF7F5] text-[#886A72] uppercase font-semibold text-[10px] tracking-wider border-b border-[#EFE8E5]">
                          <tr>
                            <th className="py-3 px-4">Product</th>
                            <th className="py-3 px-3">Category</th>
                            <th className="py-3 px-3">Price</th>
                            <th className="py-3 px-3">Variants</th>
                            <th className="py-3 px-3">Stock</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFE8E5]">
                          {filteredAdminProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-[#FAF9F7] transition-colors">
                              <td className="py-3 px-4 flex items-center gap-3">
                                <img
                                  src={p.images[0] || '/images/hero_luxury_innerwear_1792781847179.jpg'}
                                  alt={p.name}
                                  className="w-10 h-12 object-cover rounded bg-stone-100 shrink-0 border border-[#E5DDD7]"
                                />
                                <div className="min-w-0">
                                  <div className="font-medium text-[#2B1220] truncate max-w-xs">{p.name}</div>
                                  <div className="text-[10px] font-mono text-[#886A72]">SKU: {p.sku}</div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-[#55464D] whitespace-nowrap">
                                {p.categoryName}
                              </td>
                              <td className="py-3 px-3 font-mono font-semibold text-[#2B1220] whitespace-nowrap">
                                ₹{p.sellingPrice.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-3 text-[#6E5D65]">
                                {p.variants && p.variants.length > 0 ? (
                                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {p.variants.length} matrix
                                  </span>
                                ) : (
                                  <span>{p.colors?.length || 0}c / {p.sizes?.length || 0}s</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <input
                                  type="number"
                                  defaultValue={p.stock}
                                  onBlur={(e) => handleQuickStockUpdate(p.id, Number(e.target.value))}
                                  className="w-18 text-xs text-center py-1 px-1 rounded border border-[#DED4CE] bg-[#FAF7F5] font-mono font-semibold"
                                  min={0}
                                />
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => handleDuplicateProduct(p.id)}
                                    disabled={duplicatingId === p.id}
                                    title="Duplicate product"
                                    className="p-1.5 text-[#55464D] hover:text-[#2B1220] hover:bg-black/5 rounded transition-colors cursor-pointer"
                                  >
                                    <Copy size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenProductModal(p)}
                                    title="Edit product"
                                    className="p-1.5 text-[#55464D] hover:text-[#2B1220] hover:bg-black/5 rounded transition-colors cursor-pointer"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  {deleteConfirmId === p.id ? (
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        onClick={() => handleDeleteProduct(p.id)}
                                        className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold"
                                      >
                                        Yes, Delete
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded text-[10px]"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirmId(p.id)}
                                      title="Delete product"
                                      className="p-1.5 text-[#886A72] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: CATEGORIES */}
                {activeTab === 'categories' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-[#2B1220]">
                          Store Categories ({categories.length})
                        </h3>
                        <p className="text-xs text-[#6E5D65]">
                          Manage navigation hierarchy, collection descriptions, and cover imagery.
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenCategoryModal()}
                        className="px-4 py-2.5 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus size={15} />
                        <span>Add Category</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categories.map((c) => {
                        const count = products.filter((p) => p.categoryId === c.id || p.categoryName?.toLowerCase() === c.id.toLowerCase()).length;
                        return (
                          <div
                            key={c.id}
                            className="p-4 bg-white rounded-xl border border-[#EDE4DE] shadow-xs flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-[#2B1220]">{c.name}</h4>
                                <span className="text-[10px] font-mono bg-[#FAF7F5] px-2 py-0.5 rounded text-[#886A72] border border-[#EFE8E5]">
                                  Order: {c.order}
                                </span>
                              </div>
                              <p className="text-xs text-[#6E5D65] line-clamp-2 leading-relaxed">
                                {c.description}
                              </p>
                              <div className="text-[11px] font-medium text-emerald-700">
                                {count} {count === 1 ? 'Product' : 'Products'} active
                              </div>
                            </div>

                            <div className="pt-2 border-t border-[#F0EAE7] flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenCategoryModal(c)}
                                className="px-3 py-1.5 text-xs text-[#2B1220] hover:bg-black/5 rounded-lg flex items-center gap-1 transition-colors"
                              >
                                <Edit2 size={13} />
                                <span>Edit</span>
                              </button>
                              {deleteCatConfirmId === c.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteCategory(c.id)}
                                    className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-semibold"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setDeleteCatConfirmId(null)}
                                    className="px-2 py-1 bg-stone-200 text-stone-700 rounded text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteCatConfirmId(c.id)}
                                  className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 transition-colors"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 4: ORDER INQUIRIES */}
                {activeTab === 'enquiries' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-[#2B1220]">
                        Instagram Order Inquiries ({enquiries.length})
                      </h3>
                      <p className="text-xs text-[#6E5D65]">
                        Log of orders generated via "Order via Instagram DM" on your store.
                      </p>
                    </div>

                    {enquiries.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#886A72] bg-[#FAF7F5] rounded-xl border border-[#EDE4DE]">
                        No order enquiries logged yet. Customers who initiate orders will appear here.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {enquiries.map((enq) => (
                          <div
                            key={enq.id}
                            className="p-4 bg-white rounded-xl border border-[#EDE4DE] shadow-xs space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EAE7] pb-2">
                              <div>
                                <span className="text-[10px] font-mono text-[#886A72]">
                                  ID: {enq.id} · {new Date(enq.createdAt).toLocaleString('en-IN')}
                                </span>
                                <div className="text-xs font-semibold text-[#2B1220] flex items-center gap-1.5 mt-0.5">
                                  <span>Subtotal:</span>
                                  <span className="font-mono text-emerald-700 font-bold">
                                    ₹{enq.subtotal.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-medium bg-[#FAF7F5] px-2 py-0.5 rounded text-[#2B1220] border border-[#EFE8E5] self-start sm:self-auto">
                                Channel: Instagram DM
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {enq.items.map((it, idx) => (
                                <div key={idx} className="text-xs flex items-center justify-between text-[#55464D]">
                                  <span>
                                    {it.quantity}x {it.productName} ({it.color} / {it.size})
                                  </span>
                                  <span className="font-mono font-medium text-[#2B1220]">
                                    ₹{it.subtotal.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {enq.copiedMessage && (
                              <details className="text-[11px] text-[#6E5D65] pt-1 border-t border-[#F5EFEA]">
                                <summary className="cursor-pointer hover:text-[#2B1220] font-medium">
                                  View Sent Message Payload
                                </summary>
                                <pre className="mt-2 p-2.5 bg-[#FAF7F5] rounded-lg font-mono text-[10px] text-[#3D2533] whitespace-pre-wrap">
                                  {enq.copiedMessage}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: STORE SETTINGS (NO WHATSAPP) */}
                {activeTab === 'settings' && (
                  <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                    <div>
                      <h3 className="text-base font-semibold text-[#2B1220]">
                        Store Settings & Policies
                      </h3>
                      <p className="text-xs text-[#6E5D65]">
                        Customize brand identity, Instagram channel, discreet shipping fees, and announcement bar.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#2B1220] mb-1">Brand Name</label>
                        <input
                          type="text"
                          value={settingsForm.brandName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, brandName: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#2B1220] mb-1">Brand Tagline</label>
                        <input
                          type="text"
                          value={settingsForm.brandTagline}
                          onChange={(e) => setSettingsForm({ ...settingsForm, brandTagline: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#2B1220] mb-1">Instagram Handle</label>
                        <input
                          type="text"
                          value={settingsForm.instagramHandle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, instagramHandle: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#2B1220] mb-1">Instagram Profile URL</label>
                        <input
                          type="text"
                          value={settingsForm.instagramUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#2B1220] mb-1">Free Shipping Above (₹)</label>
                        <input
                          type="number"
                          value={settingsForm.freeShippingThreshold}
                          onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                          className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#2B1220] mb-1">Standard Shipping Fee (₹)</label>
                        <input
                          type="number"
                          value={settingsForm.shippingFee}
                          onChange={(e) => setSettingsForm({ ...settingsForm, shippingFee: Number(e.target.value) })}
                          className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#2B1220] mb-1">Announcement Bar Text</label>
                        <input
                          type="text"
                          value={settingsForm.announcementText}
                          onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                          className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="ann-enabled"
                        checked={settingsForm.announcementEnabled}
                        onChange={(e) => setSettingsForm({ ...settingsForm, announcementEnabled: e.target.checked })}
                        className="rounded accent-[#2B1220]"
                      />
                      <label htmlFor="ann-enabled" className="text-xs text-[#2B1220] font-medium cursor-pointer">
                        Enable top announcement banner on storefront
                      </label>
                    </div>

                    {/* SEO & Search Engine Console Settings */}
                    <div className="pt-4 border-t border-[#EDE4DE] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-[#2B1220] flex items-center gap-1.5">
                            <Globe size={15} className="text-[#886A72]" />
                            <span>Storewide SEO & Google Search Console</span>
                          </h4>
                          <p className="text-xs text-[#6E5D65]">
                            Customise search engine index directives, meta tags, and indexing verification.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href="/sitemap.xml"
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 text-[11px] bg-[#FAF5F2] hover:bg-[#F2E8E4] text-[#2B1220] rounded border border-[#EDE4DE] flex items-center gap-1"
                          >
                            <span>sitemap.xml</span>
                            <ExternalLink size={11} />
                          </a>
                          <a
                            href="/robots.txt"
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 text-[11px] bg-[#FAF5F2] hover:bg-[#F2E8E4] text-[#2B1220] rounded border border-[#EDE4DE] flex items-center gap-1"
                          >
                            <span>robots.txt</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#2B1220] mb-1">Storefront Meta Title</label>
                          <input
                            type="text"
                            value={settingsForm.metaTitle || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, metaTitle: e.target.value })}
                            placeholder="Aura Intimates — Women's Bras, Panties & Lingerie India"
                            className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#2B1220] mb-1">Google Site Verification Token</label>
                          <input
                            type="text"
                            value={settingsForm.googleSiteVerification || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, googleSiteVerification: e.target.value })}
                            placeholder="e.g. gsc-verification-code or google-site-verification content"
                            className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white font-mono text-[11px]"
                          />
                          <span className="text-[10px] text-[#886A72]">Injected as &lt;meta name="google-site-verification"&gt; in &lt;head&gt;</span>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#2B1220] mb-1">Storefront Meta Description</label>
                          <textarea
                            rows={2}
                            value={settingsForm.metaDescription || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, metaDescription: e.target.value })}
                            placeholder="Shop luxury women's bras, panties, matching lingerie sets, and seamless innerwear in India with discreet delivery and 100% untouched sanitary liners."
                            className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white resize-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#2B1220] mb-1">Canonical Domain</label>
                          <input
                            type="text"
                            value={settingsForm.canonicalDomain || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, canonicalDomain: e.target.value })}
                            placeholder={typeof window !== 'undefined' ? window.location.origin : 'https://auraintimates.com'}
                            className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white font-mono text-[11px]"
                          />
                          <span className="text-[10px] text-[#886A72]">Used to generate absolute canonical URLs in sitemap and page headers</span>
                        </div>
                      </div>
                    </div>

                    {settingsSaved && (
                      <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                        <Check size={14} />
                        <span>Store settings and SEO configuration successfully updated!</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      Save Store Settings
                    </button>
                  </form>
                )}

                {/* TAB 6: MASTER PASSWORD */}
                {activeTab === 'security' && (
                  <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                    <div>
                      <h3 className="text-base font-semibold text-[#2B1220]">
                        Update Owner Master Password
                      </h3>
                      <p className="text-xs text-[#6E5D65]">
                        Choose a strong, confidential password with at least 8 characters. All existing browser sessions will be invalidated.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#2B1220] mb-1">Current Password</label>
                      <input
                        type="password"
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#2B1220] mb-1">New Master Password</label>
                      <input
                        type="password"
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                        minLength={8}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#2B1220] mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmNewPwd}
                        onChange={(e) => setConfirmNewPwd(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        minLength={8}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white"
                      />
                    </div>

                    {pwdMsg.error && (
                      <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>{pwdMsg.error}</span>
                      </div>
                    )}

                    {pwdMsg.success && (
                      <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                        <Check size={14} />
                        <span>{pwdMsg.success}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={changingPwd}
                      className="px-6 py-2.5 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {changingPwd ? 'Updating Security...' : 'Update Master Password'}
                    </button>
                  </form>
                )}

                {/* TAB 7: SECURITY ACTIVITY & LOGS */}
                {activeTab === 'activity' && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-[#2B1220]">
                          Security Activity Log & Session Control
                        </h3>
                        <p className="text-xs text-[#6E5D65]">
                          Every login attempt, password change, and session revocation is cryptographically recorded.
                        </p>
                      </div>

                      <button
                        onClick={handleRevokeSessions}
                        disabled={revokingSessions}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        <ShieldCheck size={14} />
                        <span>{revokingSessions ? 'Revoking...' : 'Revoke All Other Sessions'}</span>
                      </button>
                    </div>

                    {revokeFeedback && (
                      <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-xs border border-amber-200">
                        {revokeFeedback}
                      </div>
                    )}

                    <div className="bg-white rounded-xl border border-[#EDE4DE] overflow-hidden">
                      {securityLogs.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#886A72]">
                          No security events recorded yet in this cycle.
                        </div>
                      ) : (
                        <div className="divide-y divide-[#EFE8E5]">
                          {securityLogs.map((log) => {
                            const badgeColor = {
                              success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                              warning: 'bg-amber-50 text-amber-700 border-amber-200',
                              alert: 'bg-rose-50 text-rose-700 border-rose-200',
                            }[log.status] || 'bg-stone-50 text-stone-700 border-stone-200';

                            return (
                              <div key={log.id} className="p-3.5 sm:p-4 hover:bg-[#FAF9F7] transition-colors space-y-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${badgeColor}`}>
                                      {log.event.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs font-semibold text-[#2B1220]">{log.details || 'System event'}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-[#886A72]">
                                    {new Date(log.timestamp).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-[#886A72] flex items-center gap-3">
                                  <span>IP: <strong className="text-[#55464D]">{log.ip}</strong></span>
                                  <span className="truncate max-w-sm sm:max-w-md">Device: {log.userAgent}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL-WIDTH MOBILE-FRIENDLY PRODUCT EDIT / ADD MODAL */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[94vh] sm:max-w-4xl sm:rounded-2xl flex flex-col shadow-2xl border-0 sm:border border-[#EDE4DE] overflow-hidden text-[#2B1220]">
            
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-6 border-b border-[#F0EAE7] flex items-center justify-between bg-[#FCFAF8] shrink-0 sticky top-0 z-10">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[#2B1220]">
                  {editingProduct.id ? 'Edit Product & Variants' : 'Add New Innerwear Silhouette'}
                </h3>
                <p className="text-[11px] text-[#886A72]">
                  Fill details, pick visual colour presets, select sizes, and generate variant matrix.
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-[#886A72] hover:text-[#2B1220] rounded-full hover:bg-black/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {productFormError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{productFormError}</span>
                </div>
              )}

              {/* Section 1: Core Details */}
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#886A72] border-b border-[#F0EAE7] pb-1">
                  1. Core Product Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#2B1220] mb-1">Product Title *</label>
                    <input
                      type="text"
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="e.g. Aura Cloud Seamless T-Shirt Bra"
                      required
                      className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white outline-none focus:border-[#2B1220]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B1220] mb-1">SKU / Code</label>
                    <input
                      type="text"
                      value={editingProduct.sku || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      placeholder="e.g. BTS-BR-01"
                      className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B1220] mb-1">Category *</label>
                    <select
                      value={editingProduct.categoryId || ''}
                      onChange={(e) => {
                        const cat = categories.find((c) => c.id === e.target.value);
                        setEditingProduct({
                          ...editingProduct,
                          categoryId: e.target.value,
                          categoryName: cat?.name || 'Innerwear',
                        });
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B1220] mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      value={editingProduct.sellingPrice || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: Number(e.target.value) })}
                      placeholder="1299"
                      required
                      min={0}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B1220] mb-1">Original Price (₹)</label>
                    <input
                      type="number"
                      value={editingProduct.originalPrice || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                      placeholder="1699 (optional for discount % tag)"
                      min={0}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B1220] mb-1">Product Description</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="Describe comfort, fit, and silhouette highlights..."
                    className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#2B1220] mb-1">Fabric & Care Instructions</label>
                    <input
                      type="text"
                      value={editingProduct.fabricAndCare || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fabricAndCare: e.target.value })}
                      placeholder="e.g. 85% Polyamide, 15% Elastane. Hand wash cold."
                      className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B1220] mb-1">General Stock Quantity</label>
                    <input
                      type="number"
                      value={editingProduct.stock || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Math.max(0, Number(e.target.value)) })}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white font-mono"
                      min={0}
                    />
                  </div>
                </div>

                {/* Badges: Featured, New, Sale */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-[#2B1220] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.featured)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                      className="rounded accent-[#2B1220]"
                    />
                    <span>Best Seller / Featured</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-[#2B1220] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.newArrival)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, newArrival: e.target.checked })}
                      className="rounded accent-[#2B1220]"
                    />
                    <span>New Arrival</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-[#2B1220] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isSale)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isSale: e.target.checked })}
                      className="rounded accent-[#2B1220]"
                    />
                    <span>Genuine Sale Offer</span>
                  </label>
                </div>
              </div>

              {/* Section 2: Visual Ready-Made Colour Palette Selector */}
              <div className="space-y-3 pt-4 border-t border-[#F0EAE7]">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#886A72]">
                    2. Ready-Made Colour Swatches ({editingProduct.colors?.length || 0} selected)
                  </div>
                  <span className="text-[11px] text-[#886A72]">Click swatches to toggle</span>
                </div>

                {/* 18 Ready-Made Presets Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_COLORS.map((preset) => {
                    const isSelected = (editingProduct.colors || []).some(
                      (c) => c.name.toLowerCase() === preset.name.toLowerCase()
                    );
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleTogglePresetColor(preset)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#2B1220] bg-[#FAF5F2] ring-1 ring-[#2B1220] font-semibold text-[#2B1220]'
                            : 'border-[#E2D8D2] bg-white text-[#55464D] hover:border-[#886A72]'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-xs"
                          style={{
                            background: preset.hex.includes('gradient') ? preset.hex : preset.hex,
                          }}
                        />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Colour */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    className="w-9 h-9 p-0.5 rounded border border-[#DED4CE] bg-white cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColorName}
                    onChange={(e) => setCustomColorName(e.target.value)}
                    placeholder="Custom colour name (e.g. Sage Green)"
                    className="flex-1 text-xs p-2 rounded-lg border border-[#DED4CE] bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="px-3 py-2 bg-white border border-[#DED4CE] hover:border-[#2B1220] rounded-lg text-xs font-semibold text-[#2B1220] cursor-pointer"
                  >
                    Add Colour
                  </button>
                </div>

                {/* Active Selected Colours Tags */}
                {editingProduct.colors && editingProduct.colors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {editingProduct.colors.map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF5F2] border border-[#E5DAD4] text-xs font-medium text-[#2B1220]"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                          style={{ background: c.hex }}
                        />
                        <span>{c.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(idx)}
                          className="text-[#886A72] hover:text-rose-600 ml-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Ready-Made Size Selector */}
              <div className="space-y-3 pt-4 border-t border-[#F0EAE7]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#886A72]">
                    3. Available Sizes ({editingProduct.sizes?.length || 0} selected)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllBraSizes}
                      className="text-[11px] text-[#2B1220] underline hover:text-[#622D52]"
                    >
                      + All Bra Sizes (30A–40D)
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={handleSelectAllPantySizes}
                      className="text-[11px] text-[#2B1220] underline hover:text-[#622D52]"
                    >
                      + All Panty Sizes (XS–XXXL)
                    </button>
                  </div>
                </div>

                {/* Bra Sizes Presets */}
                <div className="space-y-1">
                  <span className="text-[11px] text-[#6E5D65]">Bra Sizes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_BRA_SIZES.map((sz) => {
                      const isSelected = (editingProduct.sizes || []).includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleToggleSize(sz)}
                          className={`py-1 px-2.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#2B1220] text-white border-[#2B1220] shadow-xs'
                              : 'bg-white text-[#2B1220] border-[#DED4CE] hover:border-[#886A72]'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Panty Sizes Presets */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-[#6E5D65]">Panty & Brief Sizes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PANTY_SIZES.map((sz) => {
                      const isSelected = (editingProduct.sizes || []).includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleToggleSize(sz)}
                          className={`py-1 px-3 rounded text-xs font-medium border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#2B1220] text-white border-[#2B1220] shadow-xs'
                              : 'bg-white text-[#2B1220] border-[#DED4CE] hover:border-[#886A72]'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Size Input */}
                <div className="flex items-center gap-2 pt-1 max-w-sm">
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    placeholder="Custom size (e.g. 42C, 34B/M)"
                    className="flex-1 text-xs p-2 rounded-lg border border-[#DED4CE] bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3 py-2 bg-white border border-[#DED4CE] hover:border-[#2B1220] rounded-lg text-xs font-semibold text-[#2B1220] cursor-pointer"
                  >
                    Add Size
                  </button>
                </div>
              </div>

              {/* Section 4: 1-Click Variant & Inventory Generator */}
              <div className="space-y-3 pt-4 border-t border-[#F0EAE7] bg-[#FAF7F5] -mx-4 sm:-mx-6 p-4 sm:p-6 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#2B1220] flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#886A72]" />
                      <span>4. Variants & Inventory Matrix Generator</span>
                    </div>
                    <p className="text-[11px] text-[#6E5D65]">
                      Generate combinations of chosen colours &times; sizes to track stock, pricing, and availability per option.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateVariants}
                      className="px-3.5 py-2 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Generate Matrix ({editingProduct.colors?.length || 0} &times; {editingProduct.sizes?.length || 0})
                    </button>
                  </div>
                </div>

                {/* Bulk Stock Setter */}
                {editingProduct.variants && editingProduct.variants.length > 0 && (
                  <div className="p-3 bg-white rounded-lg border border-[#EDE4DE] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#55464D]">Bulk stock quantity:</span>
                      <input
                        type="number"
                        value={bulkVariantStock}
                        onChange={(e) => setBulkVariantStock(Number(e.target.value))}
                        className="w-18 text-xs p-1.5 rounded border border-[#DED4CE] font-mono text-center"
                        min={0}
                      />
                      <button
                        type="button"
                        onClick={handleApplyBulkVariantStock}
                        className="px-3 py-1.5 bg-[#FAF7F5] border border-[#DED4CE] hover:border-[#2B1220] text-xs font-medium rounded cursor-pointer"
                      >
                        Apply to All ({editingProduct.variants.length})
                      </button>
                    </div>

                    <span className="text-[11px] font-mono text-[#886A72]">
                      Total Inventory: {editingProduct.variants.reduce((s, v) => s + (v.stock || 0), 0)} units
                    </span>
                  </div>
                )}

                {/* Variants List / Table */}
                {editingProduct.variants && editingProduct.variants.length > 0 && (
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-[#EDE4DE] bg-white divide-y divide-[#EFE8E5]">
                    {editingProduct.variants.map((v, i) => (
                      <div
                        key={v.id || i}
                        className="p-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-semibold text-[#2B1220] whitespace-nowrap">{v.color}</span>
                          <span className="text-[#886A72]">·</span>
                          <span className="font-mono font-medium text-[#2B1220]">{v.size}</span>
                          <span className="hidden sm:inline text-[10px] font-mono text-[#886A72] truncate">
                            ({v.sku})
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-[#886A72]">Stock:</span>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => handleUpdateVariant(i, 'stock', Math.max(0, Number(e.target.value)))}
                              className="w-16 text-center text-xs p-1 rounded border border-[#DED4CE] font-mono"
                              min={0}
                            />
                          </div>

                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={v.available}
                              onChange={(e) => handleUpdateVariant(i, 'available', e.target.checked)}
                              className="rounded accent-[#2B1220]"
                            />
                            <span className="text-[11px] text-[#6E5D65]">Active</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 5: Product Imagery */}
              <div className="space-y-3 pt-4 border-t border-[#F0EAE7]">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#886A72]">
                  5. Product Photography & Images
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {editingProduct.images?.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-24 rounded-lg overflow-hidden border border-[#EDE4DE] bg-stone-50 group"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(editingProduct.images || [])];
                          updated.splice(i, 1);
                          setEditingProduct({ ...editingProduct, images: updated });
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[9px] text-center rounded py-0.5">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}

                  <label className="w-20 h-24 rounded-lg border-2 border-dashed border-[#DED4CE] hover:border-[#2B1220] flex flex-col items-center justify-center text-[#886A72] cursor-pointer transition-colors p-2 text-center">
                    <Upload size={18} />
                    <span className="text-[10px] mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Section 6: SEO Discoverability */}
              <div className="space-y-4 pt-4 border-t border-[#F0EAE7]">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#886A72] flex items-center gap-1.5">
                    <Globe size={14} className="text-[#886A72]" />
                    <span>6. Search Engine Optimization (SEO) & Discoverability</span>
                  </div>
                  <span className="text-[11px] text-[#886A72]">Google & Social Previews</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#2B1220]">Custom Meta Title</label>
                      <span className={`text-[10px] font-mono ${(editingProduct.metaTitle || '').length > 60 ? 'text-amber-600 font-bold' : (editingProduct.metaTitle || '').length >= 40 ? 'text-emerald-700' : 'text-[#886A72]'}`}>
                        {(editingProduct.metaTitle || '').length}/60 chars (ideal: 50-60)
                      </span>
                    </div>
                    <input
                      type="text"
                      value={editingProduct.metaTitle || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, metaTitle: e.target.value })}
                      placeholder={editingProduct.name ? `${editingProduct.name} | ${settings.brandName || 'Aura Intimates'}` : "Women's Bra / Innerwear Title"}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white outline-none focus:border-[#2B1220]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2B1220] mb-1">Primary Image Alt Text</label>
                    <input
                      type="text"
                      value={editingProduct.imageAlt || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, imageAlt: e.target.value })}
                      placeholder="e.g. Aura Cloud seamless non-padded t-shirt bra in almond beige"
                      className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white outline-none focus:border-[#2B1220]"
                    />
                    <span className="text-[10px] text-[#886A72]">Accessible text for Google Image indexing & screen readers</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#2B1220]">Custom Meta Description</label>
                    <span className={`text-[10px] font-mono ${(editingProduct.metaDescription || '').length > 160 ? 'text-amber-600 font-bold' : (editingProduct.metaDescription || '').length >= 110 ? 'text-emerald-700' : 'text-[#886A72]'}`}>
                      {(editingProduct.metaDescription || '').length}/160 chars (ideal: 120-160)
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={editingProduct.metaDescription || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, metaDescription: e.target.value })}
                    placeholder="Shop comfortable everyday lingerie with discreet delivery and 100% untouched sanitary liner seals across India. Order directly on Instagram DM."
                    className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white resize-none outline-none focus:border-[#2B1220]"
                  />
                </div>

                {/* Published / Search Indexing Status */}
                <div className="flex items-center justify-between p-3 bg-[#FAF5F2] rounded-lg border border-[#EDE4DE]">
                  <div>
                    <div className="text-xs font-semibold text-[#2B1220]">Search Indexing & Catalogue Status</div>
                    <div className="text-[11px] text-[#6E5D65]">Include in public sitemap.xml and allow Googlebot to index this product</div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isPublished !== false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isPublished: e.target.checked })}
                      className="rounded accent-[#2B1220]"
                    />
                    <span className="text-xs font-semibold text-[#2B1220]">
                      {editingProduct.isPublished !== false ? 'Published (Indexable)' : 'Draft (Noindex)'}
                    </span>
                  </label>
                </div>

                {/* Live Google Search Result (SERP) Preview */}
                <div className="p-3.5 bg-white rounded-lg border border-[#EDE4DE] shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#886A72] flex items-center gap-1">
                      <Sparkles size={12} className="text-[#886A72]" />
                      <span>Google SERP Preview</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">Canonical Link</span>
                  </div>
                  <div className="text-[11px] text-[#202124] flex items-center gap-1 truncate font-sans">
                    <span className="font-medium text-[#4d5156]">{settings.brandName || 'Aura Intimates'}</span>
                    <span className="text-stone-400">›</span>
                    <span className="text-[#5f6368] font-mono text-[10px] truncate">
                      {typeof window !== 'undefined' ? window.location.origin : 'https://auraintimates.com'}/product/{editingProduct.id || 'slug'}
                    </span>
                  </div>
                  <div className="text-sm text-[#1a0dab] hover:underline font-medium cursor-pointer truncate">
                    {editingProduct.metaTitle || (editingProduct.name ? `${editingProduct.name} — Luxury Women's Innerwear | ${settings.brandName || 'Aura Intimates'}` : `Product Title | ${settings.brandName || 'Aura Intimates'}`)}
                  </div>
                  <div className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                    {editingProduct.metaDescription || editingProduct.description || 'Discover everyday luxury innerwear with discreet delivery across India. Order directly on Instagram.'}
                  </div>
                </div>
              </div>

              {/* Sticky Save Actions */}
              <div className="pt-4 border-t border-[#F0EAE7] flex items-center justify-end gap-3 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 border border-[#DED4CE] text-[#55464D] hover:text-[#2B1220] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={productFormLoading}
                  className="px-6 py-2.5 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{productFormLoading ? 'Saving Product...' : 'Save Product & Variants'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY EDIT / ADD MODAL */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[#EDE4DE] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EAE7] pb-3">
              <h3 className="text-base font-semibold text-[#2B1220]">
                {editingCategory.id ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[#886A72] hover:text-[#2B1220]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B1220] mb-1">Category Name *</label>
                <input
                  type="text"
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="e.g. Lace Bralettes"
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1220] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Curated innerwear silhouettes..."
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1220] mb-1">Display Order</label>
                <input
                  type="number"
                  value={editingCategory.order || 1}
                  onChange={(e) => setEditingCategory({ ...editingCategory, order: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DED4CE] bg-white font-mono"
                  min={1}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0EAE7]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-[#DED4CE] text-xs font-semibold rounded-lg text-[#55464D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2B1220] text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
