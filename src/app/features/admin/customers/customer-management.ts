import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
interface CustomerFilters {
  searchTerm: string;
  customerStatus: string;
  fromDate: string | null;
  toDate: string | null;
  minOrders: number | null;
  maxOrders: number | null;
  minSpending: number | null;
  maxSpending: number | null;
}

interface Customer {
  userGuid: string;
  email: string;
  name: string;
  phoneNumber: string;
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  ordersLast30Days: number;
  customerStatus: string;
  city: string;
  state: string;
}

interface CustomerDetail extends Customer {
  role: string;
  ordersLast90Days: number;
  addresses: Address[];
  recentOrders: RecentOrder[];
  favoriteCategories: FavoriteCategory[];
  spendingTrend: SpendingTrend[];
}

interface Address {
  addressGuid: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

interface RecentOrder {
  orderGuid: string;
  orderId: string;
  createdAt: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentType: string;
  itemCount: number;
}

interface FavoriteCategory {
  category: string;
  purchaseCount: number;
  totalQuantity: number;
  totalSpent: number;
}

interface SpendingTrend {
  month: string;
  orderCount: number;
  totalSpent: number;
}

interface CustomerStatistics {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  churnedCustomers: number;
  customersWithOrders: number;
  customersWithoutOrders: number;
  averageOrdersPerCustomer: number;
  averageLifetimeValue: number;
  customersLast7Days: number;
  customersLast30Days: number;
}

interface ValueSegment {
  segment: string;
  customerCount: number;
  averageValue: number;
  totalValue: number;
}

interface TopCustomer {
  userGuid: string;
  name: string;
  email: string;
  phoneNumber: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
}

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-management.html',
  styleUrl: './customer-management.css'
})
export class CustomerManagementComponent implements OnInit, OnDestroy {
  // Data properties
  customers: Customer[] = [];
  stats: CustomerStatistics | null = null;
  valueSegments: ValueSegment[] = [];
  topCustomers: TopCustomer[] = [];
  selectedCustomer: CustomerDetail | null = null;
  
  // UI state
  loading = false;
  showCustomerModal = false;
  showFiltersPanel = false;
  showValueSegmentsModal = false;
  showTopCustomersModal = false;
  activeTab: 'overview' | 'orders' | 'spending' | 'categories' = 'overview';
  
  // Filters
  filters: CustomerFilters = {
    searchTerm: '',
    customerStatus: '',
    fromDate: null,
    toDate: null,
    minOrders: null,
    maxOrders: null,
    minSpending: null,
    maxSpending: null
  };
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalCustomers = 0;
  totalPages = 1;
  
  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Quick filters
  quickFilters = [
    { label: 'All Customers', value: '', icon: '👥', count: 0 },
    { label: 'New', value: 'New', icon: '🆕', count: 0 },
    { label: 'Active', value: 'Active', icon: '✅', count: 0 },
    { label: 'Inactive', value: 'Inactive', icon: '💤', count: 0 },
    { label: 'Churned', value: 'Churned', icon: '❌', count: 0 }
  ];

  constructor(private adminService: AdminService,private router: Router) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadStatistics();
    this.loadValueSegments();
    this.loadTopCustomers();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadCustomers(): void {
    this.loading = true;
    
    const params: any = {
      page: this.currentPage,
      pageSize: this.pageSize
    };

    if (this.filters.searchTerm) params.searchTerm = this.filters.searchTerm;
    if (this.filters.customerStatus) params.customerStatus = this.filters.customerStatus;
    if (this.filters.fromDate) params.fromDate = this.filters.fromDate;
    if (this.filters.toDate) params.toDate = this.filters.toDate;
    if (this.filters.minOrders) params.minOrders = this.filters.minOrders;
    if (this.filters.maxOrders) params.maxOrders = this.filters.maxOrders;
    if (this.filters.minSpending) params.minSpending = this.filters.minSpending;
    if (this.filters.maxSpending) params.maxSpending = this.filters.maxSpending;
    
    this.adminService.getCustomersAdvanced(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.customers = response.customers || [];
          this.totalCustomers = response.totalCount || 0;
          this.totalPages = Math.ceil(this.totalCustomers / this.pageSize);
          this.loading = false;
          this.showToast('success', 'Customers loaded', `${this.customers.length} customers found`);
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.loading = false;
          this.showToast('error', 'Error', 'Failed to load customers');
        }
      });
  }

  loadStatistics(): void {
    this.adminService.getCustomerStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: CustomerStatistics) => {
          this.stats = stats;
          this.updateQuickFilterCounts();
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      });
  }

  loadValueSegments(): void {
    this.adminService.getCustomerValueSegments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (segments: ValueSegment[]) => {
          this.valueSegments = segments;
        },
        error: (error) => {
          console.error('Error loading value segments:', error);
        }
      });
  }

  loadTopCustomers(orderBy: string = 'Spending'): void {
    this.adminService.getTopCustomers(10, orderBy)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers: TopCustomer[]) => {
          this.topCustomers = customers;
        },
        error: (error) => {
          console.error('Error loading top customers:', error);
        }
      });
  }

  viewCustomerDetails(customer: Customer): void {
    this.loading = true;
    this.adminService.getCustomerDetailsComplete(customer.userGuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details: CustomerDetail) => {
          this.selectedCustomer = details;
          this.showCustomerModal = true;
          this.activeTab = 'overview';
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading customer details:', error);
          this.loading = false;
          this.showToast('error', 'Error', 'Failed to load customer details');
        }
      });
  }

  // ============================================
  // CUSTOMER ACTIONS
  // ============================================

  toggleCustomerStatus(customer: Customer): void {
    const action = customer.isActive ? 'deactivate' : 'activate';
    const confirm = window.confirm(`Are you sure you want to ${action} this customer?`);
    
    if (!confirm) return;

    this.adminService.toggleCustomerStatus(customer.userGuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          customer.isActive = !customer.isActive;
          this.showToast('success', 'Status Updated', `Customer ${action}d successfully`);
        },
        error: (error) => {
          console.error('Error toggling customer status:', error);
          this.showToast('error', 'Error', 'Failed to update customer status');
        }
      });
  }

// customer-management.ts - Update sendEmailToCustomer method
sendEmailToCustomer(customer: Customer): void {
  this.router.navigate(['/admin/notifications'], {
    queryParams: {
      recipientEmail: customer.email,
      recipientName: customer.name
    }
  });
}

  viewCustomerOrders(customer: Customer): void {
    // Navigate to orders page with customer filter
    this.showToast('info', 'Navigation', 'Redirecting to orders page...');
  }

  // ============================================
  // FILTERING & SEARCH
  // ============================================

  setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filters.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadCustomers();
    });
  }

  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  applyQuickFilter(status: string): void {
    this.filters.customerStatus = status;
    this.currentPage = 1;
    this.loadCustomers();
  }

  clearFilters(): void {
    this.filters = {
      searchTerm: '',
      customerStatus: '',
      fromDate: null,
      toDate: null,
      minOrders: null,
      maxOrders: null,
      minSpending: null,
      maxSpending: null
    };
    this.currentPage = 1;
    this.loadCustomers();
  }

  applyAdvancedFilters(): void {
    this.currentPage = 1;
    this.loadCustomers();
    this.showFiltersPanel = false;
  }

  updateQuickFilterCounts(): void {
    if (!this.stats) return;
    
    this.quickFilters[0].count = this.stats.totalCustomers;
    this.quickFilters[1].count = this.stats.newCustomers;
    this.quickFilters[2].count = this.stats.activeCustomers;
    this.quickFilters[3].count = this.stats.inactiveCustomers;
    this.quickFilters[4].count = this.stats.churnedCustomers;
  }

  // ============================================
  // EXPORT FUNCTIONALITY
  // ============================================

  exportCustomers(): void {
    this.loading = true;
    this.adminService.exportCustomerData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers: Customer[]) => {
          this.exportToCSV(customers);
          this.loading = false;
          this.showToast('success', 'Export Complete', 'Customer data exported successfully');
        },
        error: (error) => {
          console.error('Error exporting customers:', error);
          this.loading = false;
          this.showToast('error', 'Error', 'Failed to export customer data');
        }
      });
  }

  private exportToCSV(customers: Customer[]): void {
    const headers = [
      'Name', 'Email', 'Phone', 'Registration Date', 'Status', 
      'Total Orders', 'Total Spent', 'Avg Order Value', 'Last Order', 
      'City', 'State', 'Customer Status'
    ];
    
    const rows = customers.map(c => [
      c.name,
      c.email,
      c.phoneNumber || 'N/A',
      this.formatDate(c.createdAt),
      c.isActive ? 'Active' : 'Inactive',
      c.totalOrders.toString(),
      this.formatPrice(c.totalSpent),
      this.formatPrice(c.averageOrderValue),
      c.lastOrderDate ? this.formatDate(c.lastOrderDate) : 'Never',
      c.city || 'N/A',
      c.state || 'N/A',
      c.customerStatus
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  // ============================================
  // PAGINATION
  // ============================================

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCustomers();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCustomers();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCustomers();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // ============================================
  // MODAL MANAGEMENT
  // ============================================

  closeCustomerModal(): void {
    this.showCustomerModal = false;
    this.selectedCustomer = null;
    this.activeTab = 'overview';
  }

  switchTab(tab: 'overview' | 'orders' | 'spending' | 'categories'): void {
    this.activeTab = tab;
  }

  openValueSegmentsModal(): void {
    this.showValueSegmentsModal = true;
  }

  closeValueSegmentsModal(): void {
    this.showValueSegmentsModal = false;
  }

  openTopCustomersModal(): void {
    this.showTopCustomersModal = true;
  }

  closeTopCustomersModal(): void {
    this.showTopCustomersModal = false;
  }

  toggleFiltersPanel(): void {
    this.showFiltersPanel = !this.showFiltersPanel;
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

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getCustomerStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'New': 'new',
      'Active': 'active',
      'Inactive': 'inactive',
      'Churned': 'churned'
    };
    return statusMap[status] || '';
  }

  getSegmentClass(segment: string): string {
    const segmentMap: { [key: string]: string } = {
      'VIP': 'vip',
      'High Value': 'high-value',
      'Medium Value': 'medium-value',
      'Low Value': 'low-value',
      'No Purchase': 'no-purchase'
    };
    return segmentMap[segment] || '';
  }

  calculatePercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
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

  // ============================================
  // CHART DATA (FOR SPENDING TREND)
  // ============================================

  getSpendingChartData(): any {
    if (!this.selectedCustomer || !this.selectedCustomer.spendingTrend) {
      return null;
    }

    return {
      labels: this.selectedCustomer.spendingTrend.map(t => t.month),
      data: this.selectedCustomer.spendingTrend.map(t => t.totalSpent)
    };
  }
}