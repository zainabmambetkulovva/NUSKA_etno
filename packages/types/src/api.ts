// Response shapes of the NUSKA_etno API (apps/api), used by the frontend.
// Money amounts are integers in tyiyn (1 som = 100 tyiyn).

export type Locale = 'ky' | 'ru';
export type UserRole = 'USER' | 'ADMIN';
export type ProductType = 'FOOD' | 'BEVERAGE';
/** 3D packaging shown on the product page. */
export type PackagingModel = 'BOTTLE' | 'JAR' | 'BOX' | 'PACK';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type OrderStatus =
  'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'ONLINE';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_READY'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED'
  | 'GENERAL';

export interface Money {
  amount: number;
  currency: string;
}

export interface Page<T> {
  data: T[];
  meta: { total: number; limit: number; offset: number };
}

export interface ApiErrorBody {
  statusCode: number;
  code?: string;
  message?: string | string[];
  errors?: { field: string; messages: string[] }[];
  [key: string]: unknown;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: UserRole;
  locale: Locale;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CategoryRef {
  id: string;
  slug: string;
  name: string;
}

export interface CategoryNode extends CategoryRef {
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
  children: CategoryNode[];
}

export interface ImageRef {
  url: string;
  alt: string | null;
}

export interface ProductCard {
  id: string;
  slug: string;
  sku: string;
  type: ProductType;
  name: string;
  shortDescription: string | null;
  price: Money;
  isFeatured: boolean;
  inStock: boolean;
  availableQuantity: number | null;
  image: ImageRef | null;
  categories: CategoryRef[];
}

export interface ProductDetail extends ProductCard {
  description: string | null;
  ingredients: string | null;
  storageInstructions: string | null;
  characteristics: { name: string; value: string }[];
  images: (ImageRef & {
    id: string;
    isPrimary: boolean;
    width: number | null;
    height: number | null;
  })[];
  units: { id: string; unitName: string; quantityValue: number; quantityUnit: string }[];
  rating: { average: number | null; count: number };
  packaging3d: PackagingModel | null;
}

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: string;
  product?: { slug: string; name: string };
}

export type CartIssue = 'UNAVAILABLE' | 'INSUFFICIENT_STOCK' | null;

export interface Cart {
  items: {
    productId: string;
    quantity: number;
    product: ProductCard;
    lineTotal: number;
    issue: CartIssue;
  }[];
  itemsCount: number;
  subtotal: Money;
  canCheckout: boolean;
}

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  description: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: string | null;
}

export interface StatusHistoryEntry {
  oldStatus: OrderStatus | null;
  newStatus: OrderStatus;
  comment: string | null;
  createdAt: string;
  changedBy?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  productSlug: string | null;
  image: ImageRef | null;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
  review: { id: string; status: ReviewStatus } | null;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  subtotal: Money;
  total: Money;
  locale: Locale;
  customer: { name: string; phone: string; email: string | null };
  pickup: { locationId: string; name: string; address: string; time: string | null };
  comment: string | null;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
  payments: {
    id: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: Money;
    paidAt: string | null;
    createdAt: string;
  }[];
  canCancel: boolean;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface AdminOrder extends Order {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
  allowedTransitions: OrderStatus[];
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
  _count: { items: number };
}

export interface Notification {
  id: string;
  type: NotificationType;
  locale: Locale;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedOrder: { id: string; orderNumber: number; status: OrderStatus } | null;
}

export interface Banner {
  id: string;
  imageUrl: string | null;
  linkUrl: string | null;
  title: string;
  subtitle: string | null;
  buttonLabel: string | null;
}

export interface SiteContent {
  key: string;
  title: string | null;
  body: string | null;
  data: Record<string, unknown> | null;
  updatedAt: string;
}

export interface AdminProduct {
  id: string;
  sku: string;
  slug: string;
  type: ProductType;
  status: ProductStatus;
  priceAmount: number;
  currency: string;
  stockQuantity: number;
  trackInventory: boolean;
  isFeatured: boolean;
  packaging3d: PackagingModel | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  translations: {
    locale: Locale;
    name: string;
    shortDescription: string | null;
    description: string | null;
    ingredients: string | null;
    storageInstructions: string | null;
    characteristics: { name: string; value: string }[] | null;
  }[];
  images: { id: string; url: string; alt: string | null; isPrimary: boolean; sortOrder: number }[];
  units: { id: string; unitName: string; quantityValue: number; quantityUnit: string }[];
  categories: { id: string; slug: string; translations: { locale: Locale; name: string }[] }[];
}

export interface AdminCategory {
  id: string;
  parentId: string | null;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  translations: { locale: Locale; name: string; description: string | null }[];
  _count?: { products: number; children: number };
}

export interface AdminUser extends User {
  ordersCount?: number;
  orders?: {
    id: string;
    orderNumber: number;
    status: OrderStatus;
    totalAmount: number;
    currency: string;
    createdAt: string;
  }[];
}

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
  orderItem: { productName: string; productSku: string; orderId: string };
}

export interface AdminPickupLocation extends PickupLocation {
  isActive: boolean;
  sortOrder: number;
}

export interface AdminBanner {
  id: string;
  imageUrl: string | null;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  translations: {
    locale: Locale;
    title: string;
    subtitle: string | null;
    buttonLabel: string | null;
  }[];
}

export interface AdminSiteContent {
  id: string;
  key: string;
  data: Record<string, unknown> | null;
  isActive: boolean;
  translations: { locale: Locale; title: string | null; body: string | null }[];
}

export interface Dashboard {
  currency: string;
  orders: { total: number; byStatus: Record<OrderStatus, number>; new: number };
  revenue: { total: number; period: { days: number; amount: number; completedOrders: number } };
  usersTotal: number;
  activeProducts: number;
  popularProducts: { productId: string; name: string | null; quantity: number; revenue: number }[];
  lowStock: { id: string; sku: string; name: string; stockQuantity: number }[];
  latestNewOrders: {
    id: string;
    orderNumber: number;
    customerName: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
  }[];
  salesByDay: { date: string; orders: number; revenue: number }[];
}

// --- FAQ and newsletter -----------------------------------------------------

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface AdminFaqItem {
  id: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  translations: { locale: Locale; question: string; answer: string }[];
  createdAt: string;
  updatedAt: string;
}

export type NewsletterStatus = 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED';

export interface AdminNewsletterSubscriber {
  id: string;
  email: string;
  locale: Locale;
  status: NewsletterStatus;
  consentAt: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
}

// --- Gift set builder -------------------------------------------------------

export interface GiftSetLine {
  product: ProductCard;
  quantity: number;
  lineTotal: Money;
  issue: 'INSUFFICIENT_STOCK' | null;
}

export interface GiftSetQuote {
  items: GiftSetLine[];
  /** Products that are no longer sold. */
  unavailable: string[];
  itemsCount: number;
  total: Money;
  canOrder: boolean;
}

export interface SavedGiftSet extends GiftSetQuote {
  id: string;
  name: string;
  createdAt: string;
}
