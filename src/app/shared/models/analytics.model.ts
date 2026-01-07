export interface ExecutiveSummaryDto {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  averageOrderValue: number;
}

export interface SalesAnalyticDto {
  date: string;
  totalOrders: number;
  totalRevenue: number;
}

export interface ProductAnalyticsDto {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface CustomerAnalyticsDto {
  totalCustomers: number;
  activeCustomers: number;
  repeatCustomers: number;
}

export interface RevenueReportDto {
  date: string;
  revenue: number;
}

export interface ComparisonReportDto {
  period: string;
  revenue: number;
  orders: number;
}
