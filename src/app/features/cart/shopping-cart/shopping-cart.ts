// src/app/features/cart/shopping-cart/shopping-cart.ts

import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { Cart, CartItem } from '../../../shared/models/cart.model';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.css'
})
export class ShoppingCartComponent implements OnInit {
  cart = computed(() => this.cartService.cartSignal());
  
  // Computed values
  isEmpty = computed(() => this.cart().items.length === 0);
  
  constructor(public cartService: CartService) {}

  ngOnInit(): void {
this.cartService.loadCart();
  }

  updateQuantity(item: CartItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      this.cartService.updateQuantity(item.cartItemId, newQuantity).subscribe({
        error: (err) => console.error('Error updating quantity:', err)
      });
    }
  }

  removeItem(cartItemId: number): void {
    if (confirm('Remove this item from cart?')) {
      this.cartService.removeItem(cartItemId).subscribe({
        error: (err) => console.error('Error removing item:', err)
      });
    }
  }

  clearCart(): void {
    if (confirm('Clear all items from cart?')) {
      this.cartService.clearCart().subscribe({
        error: (err) => console.error('Error clearing cart:', err)
      });
    }
  }

  getImageUrl(url: string | null): string {
    return url || 'assets/images/placeholder.jpg';
  }

  
}