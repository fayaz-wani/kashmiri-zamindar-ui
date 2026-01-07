// features/products/product-list/product-list.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../shared/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  error = '';
  selectedCategory = 'All';
  categories: string[] = ['All'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.filteredProducts = products;
          this.extractCategories();
          this.loading = false;
          console.log('✅ Products loaded:', products);
        },
        error: (err) => {
          console.error('❌ Error loading products:', err);
          this.error = 'Failed to load products. Please try again.';
          this.loading = false;
        }
      });
  }

  extractCategories(): void {
    const uniqueCategories = new Set(this.products.map(p => p.category));
    this.categories = ['All', ...Array.from(uniqueCategories)];
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    
    if (category === 'All') {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => p.category === category);
    }
  }

  viewProductDetails(product: Product): void {
    console.log('📦 Navigating to product:', product);
    this.router.navigate(['/products', product.productGuid]);
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation(); // Prevent card click
    
    console.log('🛒 Adding to cart:', product);
    
    this.cartService.addToCart(product.productGuid, 1).subscribe({
      next: () => {
        console.log('✅ Added to cart successfully');
        alert(`${product.name} added to cart!`);
      },
      error: (err) => {
        console.error('❌ Error adding to cart:', err);
        alert('Failed to add to cart. Please try again.');
      }
    });
  }

  getProductImage(product: Product): string {
    return product.imageUrl || 'https://via.placeholder.com/400x400/F5F5F5/999?text=No+Image';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  }
}