// src/app/features/admin/inventory/inventory-management.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-management.html',
  styleUrl: './inventory-management.css'
})
export class InventoryManagementComponent implements OnInit {
  inventory: any[] = [];
  filteredInventory: any[] = [];
  lowStockAlerts: any[] = [];
  inventoryHistory: any[] = [];
  loading = true;
  
  // Modals
  showAdjustModal = false;
  showHistoryModal = false;
  selectedProduct: any = null;
  
  // Adjustment form
  adjustmentForm = {
    quantityChange: 0,
    changeType: 'Adjustment',
    reason: ''
  };
  
  // Filters
  searchTerm = '';
  selectedCategory = 'All';
  stockStatusFilter = 'All'; // All, In Stock, Low Stock, Out of Stock
  categories: string[] = ['All'];
  
  // Stats
  stats = {
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadInventory();
    this.loadLowStockAlerts();
  }

  loadInventory(): void {
    this.loading = true;
    this.adminService.getInventoryOverview().subscribe({
      next: (data) => {
        this.inventory = data;
        this.filteredInventory = data;
        this.extractCategories();
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.loading = false;
      }
    });
  }

  loadLowStockAlerts(): void {
    this.adminService.getLowStockAlerts().subscribe({
      next: (alerts) => {
        this.lowStockAlerts = alerts;
      },
      error: (err) => console.error('Error loading alerts:', err)
    });
  }

  extractCategories(): void {
    const unique = new Set(this.inventory.map(p => p.category));
    this.categories = ['All', ...Array.from(unique)];
  }

  calculateStats(): void {
    this.stats.totalProducts = this.inventory.length;
    this.stats.lowStockCount = this.inventory.filter(p => p.stockStatus === 'Low Stock').length;
    this.stats.outOfStockCount = this.inventory.filter(p => p.stockStatus === 'Out of Stock').length;
    this.stats.totalValue = this.inventory.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0);
  }

  filterInventory(): void {
    let filtered = this.inventory;

    // Category filter
    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    // Stock status filter
    if (this.stockStatusFilter !== 'All') {
      filtered = filtered.filter(p => p.stockStatus === this.stockStatusFilter);
    }

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.productName.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    }

    this.filteredInventory = filtered;
  }

  onSearchChange(): void {
    this.filterInventory();
  }

  onCategoryChange(): void {
    this.filterInventory();
  }

  onStockStatusChange(): void {
    this.filterInventory();
  }

  // Adjust Stock
  openAdjustModal(product: any): void {
    this.selectedProduct = product;
    this.adjustmentForm = {
      quantityChange: 0,
      changeType: 'Adjustment',
      reason: ''
    };
    this.showAdjustModal = true;
  }

  closeAdjustModal(): void {
    this.showAdjustModal = false;
    this.selectedProduct = null;
  }

  adjustStock(): void {
    if (!this.selectedProduct) return;

    const dto = {
      quantityChange: parseInt(this.adjustmentForm.quantityChange.toString()),
      changeType: this.adjustmentForm.changeType,
      reason: this.adjustmentForm.reason
    };

    this.adminService.updateStock(this.selectedProduct.productGuid, dto).subscribe({
      next: () => {
        alert('Stock updated successfully!');
        this.closeAdjustModal();
        this.loadInventory();
        this.loadLowStockAlerts();
      },
      error: (err) => {
        console.error('Error updating stock:', err);
        alert(err.error?.message || 'Failed to update stock');
      }
    });
  }

  // View History
  openHistoryModal(product: any): void {
    this.selectedProduct = product;
    this.loadProductHistory(product.productGuid);
    this.showHistoryModal = true;
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.selectedProduct = null;
    this.inventoryHistory = [];
  }

  loadProductHistory(productGuid: string): void {
    this.adminService.getInventoryHistory(productGuid, 30).subscribe({
      next: (history) => {
        this.inventoryHistory = history;
      },
      error: (err) => console.error('Error loading history:', err)
    });
  }

  getStockStatusClass(status: string): string {
    const map: any = {
      'In Stock': 'status-in-stock',
      'Low Stock': 'status-low-stock',
      'Out of Stock': 'status-out-stock'
    };
    return map[status] || '';
  }

  getChangeTypeIcon(type: string): string {
    const icons: any = {
      'Purchase': '📦',
      'Sale': '🛒',
      'Adjustment': '⚖️',
      'Return': '↩️'
    };
    return icons[type] || '📝';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}