import { orderEntity } from "../entities/order.entity";
import { ProductVariationEntity } from "../entities/product.entity";
export interface RecentOrderSummary {
  id: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
}
export interface GrowthDataPoint {
  period: string;
  revenue: number;
  orders: number;
}
export interface userdetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
}
export interface StockAlertItem {
  id: string;
  productName: string;
  stock: number;
  createdAt: Date;
}

export interface DashboardDto {
  totalSales: number;
  totalOrders: number;
  totalPurchase: number;
  averageOrderValue: number;
  totalGrowth: {
    revenueGrowth: string;
    orderGrowth: string;
  };
  totalUsers: number;
  userDetail: userdetail[];
  stockAlerts: StockAlertItem[];
  totalProducts: number;
  totalcategories: number;
  recentOrders: RecentOrderSummary[];

  topProducts: { id: string; name: string; totalRevenue: number }[];
  orderStatusBreakdown: Record<string, number>;
  growthHistory: GrowthDataPoint[];
}
