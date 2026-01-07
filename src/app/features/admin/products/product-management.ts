// src/app/features/admin/products/product-management.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-management.html',
  styleUrl: './product-management.css'
})
export class ProductManagementComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  loading = true;
  
  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showImageModal = false;
  
  // Current product
  selectedProduct: any = null;
  
  // Form data
  productForm: any = {
    name: '',
    category: '',
    price: 0,
    unit: '',
    description: '',
    images: []
  };
  
  // Image upload
  selectedImages: File[] = [];
  imagePreviews: string[] = [];
  
  // Search & Filter
  searchTerm = '';
  selectedCategory = 'All';
  categories: string[] = ['All'];
  
  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.adminService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        this.extractCategories();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  extractCategories(): void {
    const unique = new Set(this.products.map(p => p.category));
    this.categories = ['All', ...Array.from(unique)];
  }

  filterProducts(): void {
    let filtered = this.products;

    // Filter by category
    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }

    this.filteredProducts = filtered;
  }

  onSearchChange(): void {
    this.filterProducts();
  }

  onCategoryChange(): void {
    this.filterProducts();
  }

  // Create Product
  openCreateModal(): void {
    this.resetForm();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  onImagesSelected(event: any): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    this.selectedImages = Array.from(files);
    this.imagePreviews = [];

    // Convert to base64 for preview and upload
    this.selectedImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  async createProduct(): Promise<void> {
    if (!this.validateForm()) return;

    const images = await this.convertImagesToBase64();

    const createDto = {
      name: this.productForm.name,
      category: this.productForm.category,
      price: parseFloat(this.productForm.price),
      unit: this.productForm.unit,
      description: this.productForm.description,
      images: images.map((img, index) => ({
        base64Image: img,
        fileName: this.selectedImages[index].name,
        isPrimary: index === 0
      }))
    };

    this.adminService.createProduct(createDto).subscribe({
      next: () => {
        alert('Product created successfully!');
        this.closeCreateModal();
        this.loadProducts();
      },
      error: (err) => {
        console.error('Error creating product:', err);
        alert('Failed to create product');
      }
    });
  }

  async convertImagesToBase64(): Promise<string[]> {
    const promises = this.selectedImages.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e: any) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    return Promise.all(promises);
  }

  validateForm(): boolean {
    if (!this.productForm.name) {
      alert('Product name is required');
      return false;
    }
    if (!this.productForm.category) {
      alert('Category is required');
      return false;
    }
    if (!this.productForm.price || this.productForm.price <= 0) {
      alert('Valid price is required');
      return false;
    }
    if (!this.productForm.unit) {
      alert('Unit is required');
      return false;
    }
    if (this.imagePreviews.length === 0) {
      alert('At least one image is required');
      return false;
    }
    return true;
  }

  // Edit Product
  openEditModal(product: any): void {
    this.selectedProduct = product;
    this.productForm = {
      name: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit,
      description: product.description,
      isActive: product.isActive
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedProduct = null;
  }

  updateProduct(): void {
    if (!this.selectedProduct) return;

    const updateDto = {
      name: this.productForm.name,
      category: this.productForm.category,
      price: parseFloat(this.productForm.price),
      unit: this.productForm.unit,
      description: this.productForm.description,
      isActive: this.productForm.isActive
    };

    this.adminService.updateProduct(this.selectedProduct.productGuid, updateDto).subscribe({
      next: () => {
        alert('Product updated successfully!');
        this.closeEditModal();
        this.loadProducts();
      },
      error: (err) => {
        console.error('Error updating product:', err);
        alert('Failed to update product');
      }
    });
  }

  // Manage Images
  openImageModal(product: any): void {
    this.adminService.getProductDetails(product.productGuid).subscribe({
      next: (details) => {
        this.selectedProduct = details;
        this.showImageModal = true;
      },
      error: (err) => console.error('Error loading product details:', err)
    });
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedProduct = null;
  }

  async addNewImage(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const imageDto = {
        base64Image: e.target.result,
        fileName: file.name,
        isPrimary: false
      };

      this.adminService.addProductImage(this.selectedProduct.productGuid, imageDto).subscribe({
        next: () => {
          alert('Image added successfully!');
          this.openImageModal(this.selectedProduct); // Reload
        },
        error: (err) => {
          console.error('Error adding image:', err);
          alert('Failed to add image');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  deleteImage(imageId: number): void {
    if (!confirm('Delete this image?')) return;

    this.adminService.deleteProductImage(imageId).subscribe({
      next: () => {
        alert('Image deleted successfully!');
        this.openImageModal(this.selectedProduct); // Reload
      },
      error: (err) => {
        console.error('Error deleting image:', err);
        alert('Failed to delete image');
      }
    });
  }

  // Toggle Status
  toggleStatus(product: any): void {
    this.adminService.toggleProductStatus(product.productGuid).subscribe({
      next: () => {
        product.isActive = !product.isActive;
        alert('Product status updated!');
      },
      error: (err) => {
        console.error('Error toggling status:', err);
        alert('Failed to update status');
      }
    });
  }

  resetForm(): void {
    this.productForm = {
      name: '',
      category: '',
      price: 0,
      unit: '',
      description: '',
      images: []
    };
    this.selectedImages = [];
    this.imagePreviews = [];
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  }
}