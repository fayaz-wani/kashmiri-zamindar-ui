// src/app/core/services/admin.service.ts

import { Injectable, signal } from '@angular/core';
import { HttpClient,HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUser {
  adminGuid: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  adminGuid: string;
  email: string;
  fullName: string;
  role: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;
  
  currentAdmin = signal<AdminUser | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadAdminFromStorage();
  }

  private loadAdminFromStorage(): void {
    const adminJson = localStorage.getItem('currentAdmin');
    if (adminJson) {
      const admin = JSON.parse(adminJson);
      this.currentAdmin.set(admin);
      this.isAuthenticated.set(true);
    }
  }

  login(request: AdminLoginRequest): Observable<AdminAuthResponse> {
    return this.http.post<AdminAuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  private handleAuthSuccess(response: AdminAuthResponse): void {
    const admin: AdminUser = {
      adminGuid: response.adminGuid,
      email: response.email,
      fullName: response.fullName,
      role: response.role
    };

    localStorage.setItem('currentAdmin', JSON.stringify(admin));
    localStorage.setItem('adminToken', response.token);

    this.currentAdmin.set(admin);
    this.isAuthenticated.set(true);
  }

  logout(): void {
    localStorage.removeItem('currentAdmin');
    localStorage.removeItem('adminToken');
    this.currentAdmin.set(null);
    this.isAuthenticated.set(false);
  }

  isAdminAuthenticated(): boolean {
    return this.isAuthenticated();
  }

  getToken(): string | null {
    return localStorage.getItem('adminToken');
  }

  // Dashboard APIs
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/stats`);
  }

  getRecentOrders(top: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/recent-orders?top=${top}`);
  }

  getTopProducts(top: number = 5): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/top-products?top=${top}`);
  }

  getSalesChart(days: number = 7): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/sales-chart?days=${days}`);
  }

  // Order Management
  getAllOrders(page: number = 1, pageSize: number = 20, status?: string): Observable<any> {
    let url = `${this.apiUrl}/orders?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    return this.http.get(url);
  }

  getOrderDetails(orderGuid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${orderGuid}`);
  }

  updateOrderStatus(orderGuid: string, orderStatus: string, paymentStatus: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${orderGuid}/status`, {
      orderStatus,
      paymentStatus
    });
  }

  // Product Management APIs
  getAllProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products`);
  }

  getProductDetails(productGuid: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${productGuid}`);
  }

  createProduct(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, dto);
  }

  updateProduct(productGuid: string, dto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${productGuid}`, dto);
  }

  addProductImage(productGuid: string, dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/products/${productGuid}/images`, dto);
  }

  deleteProductImage(imageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/images/${imageId}`);
  }

  toggleProductStatus(productGuid: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${productGuid}/toggle-status`, {});
  }
  // Inventory APIs
getInventoryOverview(): Observable<any> {
  return this.http.get(`${this.apiUrl}/inventory`);
}

updateStock(productGuid: string, dto: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/inventory/${productGuid}/stock`, dto);
}

getInventoryHistory(productGuid: string, days: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/inventory/${productGuid}/history?days=${days}`);
}

getLowStockAlerts(): Observable<any> {
  return this.http.get(`${this.apiUrl}/inventory/alerts`);
}

// Order APIs
getOrdersAdvanced(page: number, pageSize: number, orderStatus?: string, 
                  paymentStatus?: string, paymentType?: string, 
                  searchTerm?: string, fromDate?: any, toDate?: any): Observable<any> {
  let params = `?page=${page}&pageSize=${pageSize}`;
  if (orderStatus) params += `&orderStatus=${orderStatus}`;
  if (paymentStatus) params += `&paymentStatus=${paymentStatus}`;
  if (paymentType) params += `&paymentType=${paymentType}`;
  if (searchTerm) params += `&searchTerm=${searchTerm}`;
  if (fromDate) params += `&fromDate=${fromDate}`;
  if (toDate) params += `&toDate=${toDate}`;
  
  return this.http.get(`${this.apiUrl}/orders/advanced${params}`);
}

getOrderDetailsComplete(orderGuid: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/orders/${orderGuid}/complete`);
}

getOrderStatistics(days: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/orders/statistics?days=${days}`);
}

bulkUpdateOrderStatus(orderGuids: string[], orderStatus: string, paymentStatus?: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/orders/bulk-update`, {
    orderGuids,
    orderStatus,
    paymentStatus
  });
}
// ===================================
// Customer Management APIs
// ===================================

getCustomersAdvanced(params: any): Observable<any> {
  let query = '';

  Object.keys(params).forEach((key, index) => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      query += `${query ? '&' : '?'}${key}=${encodeURIComponent(params[key])}`;
    }
  });

  return this.http.get(
    `${this.apiUrl}/customers${query}`
  );
}

getCustomerStatistics(): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/customers/statistics`
  );
}

getCustomerValueSegments(): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/customers/value-segments`
  );
}

getTopCustomers(limit: number = 10, orderBy: string = 'Spending'): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/customers/top?limit=${limit}&orderBy=${orderBy}`
  );
}

getCustomerDetailsComplete(userGuid: string): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/customers/${userGuid}`
  );
}

toggleCustomerStatus(userGuid: string): Observable<any> {
  return this.http.put(
    `${this.apiUrl}/customers/${userGuid}/toggle-status`,
    {}
  );
}

exportCustomerData(): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl}/customers/export`
  );
}

 // =====================================================
  // ANALYTICS & REPORTS APIs
  // =====================================================
  
  // Executive Summary
  getExecutiveSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/executive-summary`);
  }

  // Sales Analytics
  getSalesAnalytics(days: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/sales`, {
      params: new HttpParams().set('days', days.toString())
    });
  }

  // Product Analytics
  getProductAnalytics(days: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/products`, {
      params: new HttpParams().set('days', days.toString())
    });
  }

  // Customer Analytics
  getCustomerAnalytics(days: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/customers`, {
      params: new HttpParams().set('days', days.toString())
    });
  }

  // Revenue Report
  getRevenueReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/revenue`, {
      params: new HttpParams()
        .set('startDate', startDate)
        .set('endDate', endDate)
    });
  }

  // Inventory Report
  getInventoryReport(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/inventory`);
  }

  // Order Fulfillment Report
  getOrderFulfillmentReport(days: number = 30): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/fulfillment`, {
      params: new HttpParams().set('days', days.toString())
    });
  }

  // Comparison Report
  getComparisonReport(
    period1Start: string,
    period1End: string,
    period2Start: string,
    period2End: string
  ): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/comparison`, {
      params: new HttpParams()
        .set('period1Start', period1Start)
        .set('period1End', period1End)
        .set('period2Start', period2Start)
        .set('period2End', period2End)
    });
  }
}