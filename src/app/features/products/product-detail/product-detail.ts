// features/products/product-detail/product-detail.ts
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { CheckoutService } from '../../../core/services/checkout.service';
import { environment } from '../../../../environments/environment';
import { Product, ProductImage, ProductReview, RelatedProduct, AddReview } from '../../../shared/models/product.model';
import { OrderItem } from '../../../shared/models/checkout.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  loading = true;
  error = '';
  
  // Image Gallery State
  selectedImage = signal<string>('');
  selectedImageIndex = signal<number>(0);
  
  // Quantity
  quantity = signal<number>(1);
  
  // Zoom
  isZoomed = signal<boolean>(false);
  zoomPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Tabs
  activeTab = signal<'description' | 'reviews' | 'shipping'>('description');
  
  // Reviews
  reviews = signal<ProductReview[]>([]);
  loadingReviews = signal<boolean>(false);
  
  // Add Review Form
  showReviewForm = signal<boolean>(false);
  reviewForm = signal<AddReview>({
    customerName: '',
    customerEmail: '',
    rating: 5,
    reviewTitle: '',
    reviewText: ''
  });
  
  // Related Products
  relatedProducts = signal<RelatedProduct[]>([]);
  
  // Stock Status
  stockStatus = signal<'in-stock' | 'low-stock' | 'out-of-stock'>('in-stock');
  // ------------------ GETTERS for template ------------------
get totalReviews(): number {
  return this.product?.totalReviews || 0;
}

get averageRating(): number {
  return this.product?.averageRating || 0;
}

get category(): string {
  return this.product?.category || '';
}

get unit(): string {
  return this.product?.unit || '';
}

  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private checkoutService: CheckoutService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.loadProduct(id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProduct(guid: string): void {
    this.loading = true;
    this.error = '';

    this.productService.getProduct(guid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.product = product;
          this.loading = false;
          
          // Set first image as selected
          if (product.images && product.images.length > 0) {
            const primaryImage = product.images.find((img: ProductImage) => img.isPrimary);
            this.selectedImage.set(primaryImage?.imageUrl || product.images[0].imageUrl);
            this.selectedImageIndex.set(primaryImage ? 
              product.images.indexOf(primaryImage) : 0);
          }
          
          // Set stock status
          this.updateStockStatus();
          
          // Set related products
          if (product.relatedProducts) {
            this.relatedProducts.set(product.relatedProducts);
          }
          
          console.log('✅ Product loaded:', product);
        },
        error: (err) => {
          console.error('❌ Error loading product:', err);
          this.error = 'Product not found';
          this.loading = false;
        }
      });
  }

  updateStockStatus(): void {
    if (!this.product) return;
    
    if (this.product.stockQuantity === 0) {
      this.stockStatus.set('out-of-stock');
    } else if (this.product.stockQuantity! <= this.product.lowStockThreshold!) {
      this.stockStatus.set('low-stock');
    } else {
      this.stockStatus.set('in-stock');
    }
  }

  // ============================================
  // TAB MANAGEMENT
  // ============================================
  switchTab(tab: 'description' | 'reviews' | 'shipping'): void {
    this.activeTab.set(tab);
    
    if (tab === 'reviews' && this.reviews().length === 0) {
      this.loadReviews();
    }
  }

  // ============================================
  // REVIEWS
  // ============================================
  loadReviews(): void {
    if (!this.product) return;
    
    this.loadingReviews.set(true);
    
    this.productService.getProductReviews(this.product.productGuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reviews: ProductReview[]) => {
          this.reviews.set(reviews);
          this.loadingReviews.set(false);
          console.log('✅ Reviews loaded:', reviews);
        },
        error: (err: any) => {
          console.error('❌ Error loading reviews:', err);
          this.loadingReviews.set(false);
        }
      });
  }

  toggleReviewForm(): void {
    this.showReviewForm.update(v => !v);
  }

  setRating(rating: number): void {
    this.reviewForm.update(form => ({ ...form, rating }));
  }

  submitReview(): void {
    if (!this.product) return;
    
    const form = this.reviewForm();
    
    if (!form.customerName || !form.rating) {
      alert('Please fill in all required fields');
      return;
    }

    this.productService.addProductReview(this.product.productGuid, form)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          alert('✅ Review submitted successfully!');
          this.showReviewForm.set(false);
          this.resetReviewForm();
          this.loadReviews();
        },
        error: (err: any) => {
          console.error('❌ Error submitting review:', err);
          alert('Failed to submit review. Please try again.');
        }
      });
  }

  resetReviewForm(): void {
    this.reviewForm.set({
      customerName: '',
      customerEmail: '',
      rating: 5,
      reviewTitle: '',
      reviewText: ''
    });
  }

  // ============================================
  // IMAGE GALLERY
  // ============================================
  selectImage(image: ProductImage, index: number): void {
    this.selectedImage.set(image.imageUrl);
    this.selectedImageIndex.set(index);
  }

  nextImage(): void {
    if (!this.product?.images) return;
    const nextIndex = (this.selectedImageIndex() + 1) % this.product.images.length;
    this.selectImage(this.product.images[nextIndex], nextIndex);
  }

  previousImage(): void {
    if (!this.product?.images) return;
    const prevIndex = this.selectedImageIndex() === 0 
      ? this.product.images.length - 1 
      : this.selectedImageIndex() - 1;
    this.selectImage(this.product.images[prevIndex], prevIndex);
  }

  handleImageZoom(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomPosition.set({ x, y });
  }

  enableZoom(): void {
    this.isZoomed.set(true);
  }

  disableZoom(): void {
    this.isZoomed.set(false);
  }

  // ============================================
  // QUANTITY CONTROLS
  // ============================================
  increaseQuantity(): void {
    if (this.quantity() < this.product!.stockQuantity!) {
      this.quantity.update(q => q + 1);
    }
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  // ============================================
  // CART & CHECKOUT
  // ============================================
  addToCart(): void {
    if (!this.product) return;
    
    this.cartService.addToCart(this.product.productGuid, this.quantity()).subscribe({
      next: () => {
        alert(`✅ Added ${this.quantity()} x ${this.product!.name} to cart!`);
        this.cartService.loadCart();
      },
      error: (err) => {
        console.error('❌ Error adding to cart:', err);
        alert('Failed to add to cart. Please try again.');
      }
    });
  }

  buyNow(): void {
    console.log('BUY NOW PRODUCT:', this.product);
    if (!this.product) return;
    
    const orderItem: OrderItem = {
      productGuid: this.product.productGuid,
      productName: this.product.name,
      quantity: this.quantity(),
      price: this.product.price,
      imageUrl: this.product.images?.[0]?.imageUrl || ''
    };

    this.checkoutService.setCheckoutItems([orderItem]);
    console.log('💳 Navigating to checkout:', orderItem);
    this.router.navigate(['/checkout']);
  }

  // ============================================
  // SOCIAL SHARING
  // ============================================
  shareProduct(platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy'): void {
    if (!this.product) return;
    
    const url = window.location.href;
    const text = `Check out ${this.product.name} on Kashmiri Zamindar!`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('✅ Link copied to clipboard!');
        break;
    }
  }

  // ============================================
  // RELATED PRODUCTS
  // ============================================
  navigateToProduct(productGuid: string): void {
    this.router.navigate(['/products', productGuid]);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  }

getImageUrl(url?: string): string {
  if (!url) {
    return 'https://via.placeholder.com/600x600/F5F5F5/999?text=No+Image';
  }

  if (url.startsWith('/')) {
    return `${environment.apiUrl.replace('/api', '')}${url}`;
  }

  return url;
}


  getRatingStars(): number[] {
    return Array(5).fill(0).map((_, i) => i);
  }

  getRatingPercentage(ratingLevel: number): number {
    if (!this.product?.ratingDistribution || !this.product.totalReviews) return 0;
    
    const dist = this.product.ratingDistribution;
    const count = {
      5: dist.rating5Count,
      4: dist.rating4Count,
      3: dist.rating3Count,
      2: dist.rating2Count,
      1: dist.rating1Count
    }[ratingLevel] || 0;
    
    return (count / this.product.totalReviews) * 100;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  // Add these methods to product-detail.ts

// ✅ Add to Wishlist
addToWishlist(): void {
  if (!this.product) return;
  
  // TODO: Implement wishlist API call
  alert(`❤️ ${this.product.name} added to wishlist!`);
  console.log('Add to wishlist:', this.product.productGuid);
}

// ✅ Mark Review as Helpful
markHelpful(reviewId: number): void {
  // TODO: Implement helpful API call
  console.log('Marked review as helpful:', reviewId);
  alert('✅ Thank you for your feedback!');
}

}