import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface SalesAnalytics {
  dailySales: DailySales[];
  summary: SalesSummary;
  hourlyPattern: HourlyPattern[];
  dayOfWeekPattern: DayOfWeekPattern[];
}

interface DailySales {
  date: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
  uniqueCustomers: number;
}

interface SalesSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  deliveredRevenue: number;
  cancelledRevenue: number;
}

interface HourlyPattern {
  hour: number;
  orderCount: number;
  revenue: number;
}

interface DayOfWeekPattern {
  dayOfWeek: string;
  dayNumber: number;
  orderCount: number;
  revenue: number;
}

interface ProductAnalytics {
  topProducts: TopProduct[];
  categoryPerformance: CategoryPerformance[];
  lowPerformers: LowPerformer[];
}

interface TopProduct {
  productGuid: string;
  productName: string;
  category: string;
  totalSold: number;
  totalRevenue: number;
}

interface CategoryPerformance {
  category: string;
  productCount: number;
  totalSales: number;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
}

interface LowPerformer {
  productGuid: string;
  productName: string;
  category: string;
  price: number;
  timesSold: number;
  totalQuantity: number;
  totalRevenue: number;
}

interface CustomerAnalytics {
  customerAcquisition: CustomerAcquisition[];
  retention: CustomerRetention;
  valueDistribution: ValueDistribution[];
  geographicDistribution: GeographicDistribution[];
}

interface CustomerAcquisition {
  date: string;
  newCustomers: number;
}

interface CustomerRetention {
  activeCustomers: number;
  returningCustomers: number;
  newCustomersWithOrders: number;
}

interface ValueDistribution {
  valueSegment: string;
  customerCount: number;
  averageValue: number;
  totalValue: number;
}

interface GeographicDistribution {
  city: string;
  state: string;
  customerCount: number;
  orderCount: number;
  totalRevenue: number;
}

interface RevenueReport {
  dailyRevenue: DailyRevenue[];
  paymentMethods: PaymentMethodBreakdown[];
  categoryRevenue: CategoryRevenue[];
  summary: RevenueSummary;
}

interface DailyRevenue {
  date: string;
  totalRevenue: number;
  subtotal: number;
  tax: number;
  shipping: number;
  orderCount: number;
}

interface PaymentMethodBreakdown {
  paymentType: string;
  orderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface CategoryRevenue {
  category: string;
  revenue: number;
  orderCount: number;
  totalQuantity: number;
}

interface RevenueSummary {
  totalRevenue: number;
  totalSubtotal: number;
  totalTax: number;
  totalShipping: number;
  totalOrders: number;
  averageOrderValue: number;
  uniqueCustomers: number;
}

interface ExecutiveSummary {
  overallMetrics: OverallMetrics;
  topProducts: TopProductSummary[];
  growthMetrics: GrowthMetrics;
}

interface OverallMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  registeredUsers: number;
  totalProducts: number;
  activeProducts: number;
  ordersLast30Days: number;
  revenueLast30Days: number;
  newCustomersLast30Days: number;
}

interface TopProductSummary {
  productName: string;
  category: string;
  totalSold: number;
  totalRevenue: number;
}

interface GrowthMetrics {
  recentRevenue: number;
  previousRevenue: number;
  recentOrders: number;
  previousOrders: number;
  revenueGrowth: number;
  orderGrowth: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css'
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  // Data
  salesAnalytics: SalesAnalytics | null = null;
  productAnalytics: ProductAnalytics | null = null;
  customerAnalytics: CustomerAnalytics | null = null;
  revenueReport: RevenueReport | null = null;
  executiveSummary: ExecutiveSummary | null = null;

  // UI State
  loading = false;
  activeTab: 'overview' | 'sales' | 'products' | 'customers' | 'revenue' = 'overview';
  selectedDays = 30;
  
  // Revenue Report Dates
  revenueStartDate: string = '';
  revenueEndDate: string = '';

  // Comparison
  showComparisonModal = false;
  comparisonPeriod1Start: string = '';
  comparisonPeriod1End: string = '';
  comparisonPeriod2Start: string = '';
  comparisonPeriod2End: string = '';
  comparisonResult: any = null;

  // Charts visibility
  showSalesChart = true;
  showHourlyChart = true;
  showDayOfWeekChart = true;
  showCategoryChart = true;
  showGeographicChart = true;

  private destroy$ = new Subject<void>();

  constructor(private adminService: AdminService) {
    // Set default dates
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.revenueEndDate = this.formatDateForInput(today);
    this.revenueStartDate = this.formatDateForInput(thirtyDaysAgo);
  }

  ngOnInit(): void {
    this.loadExecutiveSummary();
    this.loadAllAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadAllAnalytics(): void {
    this.loadSalesAnalytics();
    this.loadProductAnalytics();
    this.loadCustomerAnalytics();
    this.loadRevenueReport();
  }

  loadExecutiveSummary(): void {
    this.loading = true;
    this.adminService.getExecutiveSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary: ExecutiveSummary) => {
          this.executiveSummary = summary;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading executive summary:', error);
          this.loading = false;
          this.showToast('error', 'Error', 'Failed to load executive summary');
        }
      });
  }

  loadSalesAnalytics(): void {
    this.adminService.getSalesAnalytics(this.selectedDays)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (analytics: SalesAnalytics) => {
          this.salesAnalytics = analytics;
        },
        error: (error) => {
          console.error('Error loading sales analytics:', error);
          this.showToast('error', 'Error', 'Failed to load sales analytics');
        }
      });
  }

  loadProductAnalytics(): void {
    this.adminService.getProductAnalytics(this.selectedDays)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (analytics: ProductAnalytics) => {
          this.productAnalytics = analytics;
        },
        error: (error) => {
          console.error('Error loading product analytics:', error);
          this.showToast('error', 'Error', 'Failed to load product analytics');
        }
      });
  }

  loadCustomerAnalytics(): void {
    this.adminService.getCustomerAnalytics(this.selectedDays)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (analytics: CustomerAnalytics) => {
          this.customerAnalytics = analytics;
        },
        error: (error) => {
          console.error('Error loading customer analytics:', error);
          this.showToast('error', 'Error', 'Failed to load customer analytics');
        }
      });
  }

  loadRevenueReport(): void {
    if (!this.revenueStartDate || !this.revenueEndDate) return;

    this.adminService.getRevenueReport(this.revenueStartDate, this.revenueEndDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report: RevenueReport) => {
          this.revenueReport = report;
        },
        error: (error) => {
          console.error('Error loading revenue report:', error);
          this.showToast('error', 'Error', 'Failed to load revenue report');
        }
      });
  }

  // ============================================
  // TAB MANAGEMENT
  // ============================================

  switchTab(tab: 'overview' | 'sales' | 'products' | 'customers' | 'revenue'): void {
    this.activeTab = tab;
  }

  changeDaysFilter(days: number): void {
    this.selectedDays = days;
    this.loadAllAnalytics();
  }

  // ============================================
  // COMPARISON
  // ============================================

  openComparisonModal(): void {
    // Set default comparison dates
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);

    this.comparisonPeriod1Start = this.formatDateForInput(thirtyDaysAgo);
    this.comparisonPeriod1End = this.formatDateForInput(today);
    this.comparisonPeriod2Start = this.formatDateForInput(sixtyDaysAgo);
    this.comparisonPeriod2End = this.formatDateForInput(thirtyDaysAgo);

    this.showComparisonModal = true;
  }

  closeComparisonModal(): void {
    this.showComparisonModal = false;
    this.comparisonResult = null;
  }

  runComparison(): void {
    if (!this.comparisonPeriod1Start || !this.comparisonPeriod1End || 
        !this.comparisonPeriod2Start || !this.comparisonPeriod2End) {
      this.showToast('warning', 'Missing Dates', 'Please select all date ranges');
      return;
    }

    this.loading = true;
    this.adminService.getComparisonReport(
      this.comparisonPeriod1Start,
      this.comparisonPeriod1End,
      this.comparisonPeriod2Start,
      this.comparisonPeriod2End
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: any) => {
          this.comparisonResult = result;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error running comparison:', error);
          this.loading = false;
          this.showToast('error', 'Error', 'Failed to run comparison');
        }
      });
  }

  calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  // ============================================
  // EXPORT FUNCTIONALITY
  // ============================================

  exportSalesReport(): void {
    if (!this.salesAnalytics) return;

    const headers = ['Date', 'Orders', 'Revenue', 'Avg Order Value', 'Customers'];
    const rows = this.salesAnalytics.dailySales.map(d => [
      this.formatDate(d.date),
      d.orderCount.toString(),
      this.formatPrice(d.revenue),
      this.formatPrice(d.averageOrderValue),
      d.uniqueCustomers.toString()
    ]);

    this.exportToCSV('sales-report', headers, rows);
  }

  exportProductReport(): void {
    if (!this.productAnalytics) return;

    const headers = ['Product', 'Category', 'Total Sold', 'Revenue'];
    const rows = this.productAnalytics.topProducts.map(p => [
      p.productName,
      p.category,
      p.totalSold.toString(),
      this.formatPrice(p.totalRevenue)
    ]);

    this.exportToCSV('product-report', headers, rows);
  }

  exportRevenueReport(): void {
    if (!this.revenueReport) return;

    const headers = ['Date', 'Revenue', 'Subtotal', 'Tax', 'Shipping', 'Orders'];
    const rows = this.revenueReport.dailyRevenue.map(d => [
      this.formatDate(d.date),
      this.formatPrice(d.totalRevenue),
      this.formatPrice(d.subtotal),
      this.formatPrice(d.tax),
      this.formatPrice(d.shipping),
      d.orderCount.toString()
    ]);

    this.exportToCSV('revenue-report', headers, rows);
  }

  private exportToCSV(filename: string, headers: string[], rows: string[][]): void {
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    this.showToast('success', 'Exported', 'Report exported successfully');
  }

  // ============================================
  // PRINT FUNCTIONALITY
  // ============================================

  printReport(): void {
    window.print();
  }

  // ============================================
  // CHART HELPERS
  // ============================================

  getMaxValue(data: any[], key: string): number {
    if (!data || data.length === 0) return 100;
    return Math.max(...data.map(item => item[key]));
  }

  calculatePercentage(value: number, max: number): number {
    if (max === 0) return 0;
    return (value / max) * 100;
  }

getBarHeight(value: number, maxValue: number): number {
    const percentage = (value / maxValue) * 100;
    return Math.max(percentage, 10); // Minimum 10% so small values aren’t too tiny
}


  // ============================================
  // UTILITY METHODS
  // ============================================

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
  }

  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  getGrowthClass(growth: number): string {
    if (growth > 0) return 'positive';
    if (growth < 0) return 'negative';
    return 'neutral';
  }

  getGrowthIcon(growth: number): string {
    if (growth > 0) return '📈';
    if (growth < 0) return '📉';
    return '➡️';
  }

  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================

  private toastTimeout: any;

  showToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div class="toast-content">
        <h4>${title}</h4>
        <p>${message}</p>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    
    this.toastTimeout = setTimeout(() => {
      toast.remove();
    }, 5000);
  }
getPaymentIcon(paymentType: string): string {
  if (!paymentType) return '💳';

  switch (paymentType.toLowerCase()) {
    case 'upi':
      return '📱';        // UPI
    case 'cod':
    case 'cashondelivery':
      return '💵';        // Cash on Delivery
    case 'card':
    case 'debit':
    case 'credit':
      return '💳';        // Card
    case 'netbanking':
      return '🏦';        // Net Banking
    case 'wallet':
      return '👛';        // Wallet
    default:
      return '💳';        // Fallback
  }
}

  // ============================================
  // REFRESH
  // ============================================

  refreshAllData(): void {
    this.loadExecutiveSummary();
    this.loadAllAnalytics();
    this.showToast('success', 'Refreshed', 'All data has been refreshed');
  }
}