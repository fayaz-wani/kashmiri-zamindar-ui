import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface OrderFilters {
  orderStatus: string;
  paymentStatus: string;
  paymentType: string;
  searchTerm: string;
  fromDate: string | null;
  toDate: string | null;
}

interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  orderGrowth: number;
  revenueGrowth: number;
}

interface Order {
  orderGuid: string;
  orderId: string;
  customerName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  itemCount: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentType: string;
}

interface OrderDetail extends Order {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  subtotal: number;
  shippingCharges: number;
  tax: number;
  orderItems: OrderItem[];
}

interface OrderItem {
  productGuid: string;
  productName: string;
  productImage: string;
  category: string;
  quantity: number;
  price: number;
}

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-management.html',
  styleUrl: './orders-management.css'
})
export class OrdersManagementComponent implements OnInit, OnDestroy {
  // Data properties
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  stats: OrderStatistics | null = null;
  selectedOrder: OrderDetail | null = null;
  
  // UI state
  loading = false;
  showOrderDetailsModal = false;
  showExportMenu = false;
  showAdvancedSearch = false;
  showFiltersOnMobile = false;
  
  // Selection
  selectedOrders: Set<string> = new Set();
  
  // Filters
  filters: OrderFilters = {
    orderStatus: '',
    paymentStatus: '',
    paymentType: '',
    searchTerm: '',
    fromDate: null,
    toDate: null
  };
  
  // Pagination
  currentPage = 1;
  pageSize = 50;
  totalOrders = 0;
  totalPages = 1;
  
  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Quick filters
  quickFilters = [
    { label: 'All Orders', value: '', icon: '📋', count: 0 },
    { label: 'Pending', value: 'Pending', icon: '⏳', count: 0 },
    { label: 'Processing', value: 'Processing', icon: '⚙️', count: 0 },
    { label: 'Shipped', value: 'Shipped', icon: '🚚', count: 0 },
    { label: 'Delivered', value: 'Delivered', icon: '✅', count: 0 },
    { label: 'Cancelled', value: 'Cancelled', icon: '❌', count: 0 }
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadStatistics();
    this.setupSearchDebounce();
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // DATA LOADING
  // ============================================

  loadOrders(): void {
    this.loading = true;
    
    const { orderStatus, paymentStatus, paymentType, searchTerm, fromDate, toDate } = this.filters;
    
    this.adminService.getOrdersAdvanced(
      this.currentPage,
      this.pageSize,
      orderStatus,
      paymentStatus,
      paymentType,
      searchTerm,
      fromDate,
      toDate
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.orders = response.orders || response;
          this.filteredOrders = [...this.orders];
          this.totalOrders = response.totalCount || this.orders.length;
          this.totalPages = Math.ceil(this.totalOrders / this.pageSize);
          this.updateQuickFilterCounts();
          this.loading = false;
          this.showToast('success', 'Orders loaded successfully', `${this.orders.length} orders found`);
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.loading = false;
          this.showToast('error', 'Error', 'Failed to load orders');
        }
      });
  }

  loadStatistics(days: number = 30): void {
    this.adminService.getOrderStatistics(days)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: OrderStatistics) => {
          this.stats = stats;
          this.updateQuickFilterCounts();
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      });
  }

  viewOrderDetails(order: Order): void {
    this.loading = true;
    this.adminService.getOrderDetailsComplete(order.orderGuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details: OrderDetail) => {
          this.selectedOrder = details;
          this.showOrderDetailsModal = true;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading order details:', error);
          this.loading = false;
          this.showToast('error', 'Error', 'Failed to load order details');
        }
      });
  }

  // ============================================
  // ORDER UPDATES
  // ============================================

  updateOrderStatus(orderGuid: string, orderStatus: string, paymentStatus: string): void {
    this.adminService.updateOrderStatus(orderGuid, orderStatus, paymentStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast('success', 'Order Updated', 'Order status updated successfully');
          this.loadOrders();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Error updating order:', error);
          this.showToast('error', 'Error', 'Failed to update order status');
          this.loadOrders(); // Reload to revert UI
        }
      });
  }

  bulkUpdateStatus(): void {
    if (this.selectedOrders.size === 0) {
      this.showToast('warning', 'No Selection', 'Please select orders first');
      return;
    }

    const status = prompt('Enter new Order Status (Pending/Processing/Shipped/Delivered/Cancelled):');
    if (!status) return;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      this.showToast('error', 'Invalid Status', 'Please enter a valid order status');
      return;
    }

    const paymentStatus = prompt('Enter Payment Status (optional - Paid/Pending/Failed):') || null;

    const orderGuids = Array.from(this.selectedOrders);
    
    this.adminService.bulkUpdateOrderStatus(orderGuids, status, paymentStatus?? undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: any) => {
          this.showToast('success', 'Bulk Update Complete', `${result.updatedCount || orderGuids.length} orders updated`);
          this.selectedOrders.clear();
          this.loadOrders();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Error in bulk update:', error);
          this.showToast('error', 'Error', 'Failed to update orders');
        }
      });
  }

  // ============================================
  // SELECTION MANAGEMENT
  // ============================================

  toggleOrderSelection(orderGuid: string): void {
    if (this.selectedOrders.has(orderGuid)) {
      this.selectedOrders.delete(orderGuid);
    } else {
      this.selectedOrders.add(orderGuid);
    }
  }

  selectAll(event: any): void {
    if (event.target.checked) {
      this.filteredOrders.forEach(order => {
        this.selectedOrders.add(order.orderGuid);
      });
    } else {
      this.selectedOrders.clear();
    }
  }

  allSelected(): boolean {
    return this.filteredOrders.length > 0 && 
           this.filteredOrders.every(order => this.selectedOrders.has(order.orderGuid));
  }

  clearSelection(): void {
    this.selectedOrders.clear();
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
      this.loadOrders();
    });
  }

  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  applyQuickFilter(status: string): void {
    this.filters.orderStatus = status;
    this.currentPage = 1;
    this.loadOrders();
  }

  clearFilters(): void {
    this.filters = {
      orderStatus: '',
      paymentStatus: '',
      paymentType: '',
      searchTerm: '',
      fromDate: null,
      toDate: null
    };
    this.currentPage = 1;
    this.loadOrders();
  }

  updateQuickFilterCounts(): void {
    if (!this.stats) return;
    
    this.quickFilters[0].count = this.stats.totalOrders;
    this.quickFilters[1].count = this.stats.pendingOrders;
    this.quickFilters[2].count = this.stats.processingOrders;
    this.quickFilters[3].count = this.stats.shippedOrders;
    this.quickFilters[4].count = this.stats.deliveredOrders;
    this.quickFilters[5].count = this.stats.cancelledOrders;
  }

  // ============================================
  // PAGINATION
  // ============================================

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadOrders();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadOrders();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadOrders();
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
  // EXPORT FUNCTIONALITY
  // ============================================

  exportOrders(): void {
    this.showExportMenu = !this.showExportMenu;
  }

  exportToCSV(): void {
    const headers = ['Order ID', 'Customer', 'Email', 'Date', 'Items', 'Total', 'Order Status', 'Payment Status', 'Payment Type'];
    const rows = this.filteredOrders.map(order => [
      order.orderId,
      order.customerName,
      order.email,
      this.formatDate(order.createdAt),
      order.itemCount.toString(),
      order.totalAmount.toString(),
      order.orderStatus,
      order.paymentStatus,
      order.paymentType
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    this.showExportMenu = false;
    this.showToast('success', 'Export Complete', 'Orders exported to CSV');
  }

  exportToExcel(): void {
    // Implement Excel export using a library like xlsx
    this.showToast('info', 'Coming Soon', 'Excel export will be available soon');
    this.showExportMenu = false;
  }

  exportToPDF(): void {
    // Implement PDF export using a library like jsPDF
    this.showToast('info', 'Coming Soon', 'PDF export will be available soon');
    this.showExportMenu = false;
  }

  // ============================================
  // PRINTING
  // ============================================

  printInvoice(order: Order | OrderDetail): void {
    if ('orderItems' in order) {
      // Already have full details
      this.printOrderInvoice(order);
    } else {
      // Need to fetch full details first
      this.adminService.getOrderDetailsComplete(order.orderGuid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (details: OrderDetail) => {
            this.printOrderInvoice(details);
          },
          error: (error) => {
            console.error('Error loading order for print:', error);
            this.showToast('error', 'Error', 'Failed to load order details');
          }
        });
    }
  }

  private printOrderInvoice(order: OrderDetail): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.showToast('error', 'Error', 'Please allow popups to print invoices');
      return;
    }
    
    const invoiceHTML = this.generateInvoiceHTML(order);
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
    
    this.showToast('success', 'Printing', 'Invoice ready to print');
  }

  bulkPrintInvoices(): void {
    if (this.selectedOrders.size === 0) {
      this.showToast('warning', 'No Selection', 'Please select orders first');
      return;
    }
    
    this.showToast('info', 'Preparing', 'Preparing invoices for printing...');
    
    // In a real implementation, you'd fetch all selected orders and print them
    const selectedOrdersList = this.filteredOrders.filter(order => 
      this.selectedOrders.has(order.orderGuid)
    );
    
    selectedOrdersList.forEach((order, index) => {
      setTimeout(() => {
        this.printInvoice(order);
      }, index * 1000); // Stagger prints by 1 second
    });
  }

  private generateInvoiceHTML(order: OrderDetail): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.orderId}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .info-section {
            flex: 1;
          }
          .info-section h3 {
            margin-bottom: 10px;
            color: #2c3e50;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background: #667eea;
            color: white;
          }
          .total-section {
            text-align: right;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: flex-end;
            padding: 8px 0;
          }
          .total-label {
            width: 150px;
            text-align: right;
            padding-right: 20px;
            font-weight: bold;
          }
          .total-value {
            width: 100px;
            text-align: right;
          }
          .grand-total {
            font-size: 18px;
            color: #667eea;
            border-top: 2px solid #667eea;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">🏔️ Kashmiri Zamindar</div>
          <p>Premium Kashmiri Products</p>
        </div>
        
        <div class="invoice-details">
          <div class="info-section">
            <h3>Invoice To:</h3>
            <p><strong>${order.customerName}</strong></p>
            <p>${order.email}</p>
            <p>${order.phoneNumber}</p>
            <p>${order.address}</p>
            <p>${order.city}, ${order.state} ${order.postalCode}</p>
          </div>
          
          <div class="info-section">
            <h3>Invoice Details:</h3>
            <p><strong>Invoice #:</strong> ${order.orderId}</p>
            <p><strong>Date:</strong> ${this.formatDate(order.createdAt)}</p>
            <p><strong>Status:</strong> ${order.orderStatus}</p>
            <p><strong>Payment:</strong> ${order.paymentStatus} (${order.paymentType})</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.orderItems.map(item => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${this.formatPrice(item.price)}</td>
                <td>${this.formatPrice(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-row">
            <div class="total-label">Subtotal:</div>
            <div class="total-value">${this.formatPrice(order.subtotal)}</div>
          </div>
          <div class="total-row">
            <div class="total-label">Shipping:</div>
            <div class="total-value">${this.formatPrice(order.shippingCharges || 0)}</div>
          </div>
          <div class="total-row">
            <div class="total-label">Tax:</div>
            <div class="total-value">${this.formatPrice(order.tax || 0)}</div>
          </div>
          <div class="total-row grand-total">
            <div class="total-label">Grand Total:</div>
            <div class="total-value">${this.formatPrice(order.totalAmount)}</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>For any queries, contact us at support@kashmirizamindar.com</p>
        </div>
      </body>
      </html>
    `;
  }

  // ============================================
  // MODAL MANAGEMENT
  // ============================================

  closeModal(): void {
    this.showOrderDetailsModal = false;
    this.selectedOrder = null;
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  toggleMobileFilters(): void {
    this.showFiltersOnMobile = !this.showFiltersOnMobile;
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

  getStockStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'pending',
      'Processing': 'processing',
      'Shipped': 'shipped',
      'Delivered': 'delivered',
      'Cancelled': 'cancelled'
    };
    return statusMap[status] || '';
  }

  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================

  private toastTimeout: any;

  showToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string): void {
    // Clear existing toast
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    // Create toast element
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
    
    // Auto remove after 5 seconds
    this.toastTimeout = setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
      
      // Ctrl/Cmd + R: Refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        this.loadOrders();
      }
      
      // Escape: Close modal
      if (e.key === 'Escape') {
        if (this.showOrderDetailsModal) {
          this.closeModal();
        }
        if (this.showExportMenu) {
          this.showExportMenu = false;
        }
      }
    });
  }

  // ============================================
  // CONTEXT MENU (RIGHT-CLICK)
  // ============================================

  onOrderRightClick(event: MouseEvent, order: Order): void {
    event.preventDefault();
    // Implement context menu if needed
    console.log('Right-clicked order:', order);
  }
}