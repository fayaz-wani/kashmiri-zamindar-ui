// src/app/features/admin/dashboard/admin-dashboard.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})


export class AdminDashboardComponent implements OnInit {
  stats: any = null;
  recentOrders: any[] = [];
  topProducts: any[] = [];
  salesChart: any[] = [];
  loading = true;
  activeTab = 'overview';
todayIso: string = new Date().toISOString();
  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.todayIso = new Date().toISOString();
    if (!this.adminService.isAdminAuthenticated()) {
      this.router.navigate(['/admin/login']);
      return;
    }

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load stats
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.loading = false;
      }
    });

    // Load recent orders
    this.adminService.getRecentOrders(10).subscribe({
      next: (orders) => {
        this.recentOrders = orders;
      },
      error: (err) => console.error('Error loading orders:', err)
    });

    // Load top products
    this.adminService.getTopProducts(5).subscribe({
      next: (products) => {
        this.topProducts = products;
      },
      error: (err) => console.error('Error loading products:', err)
    });

    // Load sales chart
    this.adminService.getSalesChart(7).subscribe({
      next: (data) => {
        this.salesChart = data;
      },
      error: (err) => console.error('Error loading chart:', err)
    });
  }

  logout(): void {
    this.adminService.logout();
    this.router.navigate(['/admin/login']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'Pending': 'status-pending',
      'Processing': 'status-processing',
      'Shipped': 'status-shipped',
      'Delivered': 'status-delivered',
      'Cancelled': 'status-cancelled',
      'Paid': 'status-paid',
      'Unpaid': 'status-unpaid'
    };
    return statusMap[status] || '';
  }

  getChartMaxRevenue(): number {
    if (this.salesChart.length === 0) return 10000;
    const max = Math.max(...this.salesChart.map(d => d.revenue));
    return Math.ceil(max / 1000) * 1000;
  }
// admin-dashboard.ts - Add method
goToNotifications(): void {
  this.router.navigate(['/admin/notifications']);
}
  getChartBarHeight(revenue: number): string {
    const max = this.getChartMaxRevenue();
    const height = (revenue / max) * 100;
    return `${height}%`;
  }
}