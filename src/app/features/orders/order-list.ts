// src/app/features/orders/order-list/order-list.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderService, UserOrder } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-list.html',
  styleUrls: ['./order-list.css']
})
export class OrderListComponent implements OnInit {
  orders: UserOrder[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalOrders = 0;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    // ✅ FIX: Get userGuid from AuthService
    const userGuid = this.authService.getUserGuid();
    
    console.log('Loading orders for user:', userGuid);
    
    if (!userGuid) {
      console.error('No userGuid found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.orderService.getUserOrders(userGuid, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.orders = response.orders;
        this.totalOrders = response.totalOrders;
        this.loading = false;
        console.log('Orders loaded:', response);
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loading = false;
        
        // If 401 error, redirect to login
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  viewOrderDetails(orderGuid: string): void {
    this.router.navigate(['/orders', orderGuid]);
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'Pending': 'status-pending',
      'Processing': 'status-processing',
      'Shipped': 'status-shipped',
      'Delivered': 'status-delivered',
      'Cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-default';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalOrders / this.pageSize);
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}