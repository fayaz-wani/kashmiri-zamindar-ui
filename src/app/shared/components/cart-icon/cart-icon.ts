// src/app/shared/components/cart-icon/cart-icon.component.ts

import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart-icon',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a routerLink="/cart" class="cart-icon-link">
      <div class="cart-icon-container">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 2L7.17 6M9 2h6m-6 0L7.17 6m8.83-4l1.83 4M15 2l1.83 4M7.17 6H4.18a1 1 0 00-.98 1.18l1.8 10A2 2 0 007 18.82h10a2 2 0 001.98-1.64l1.8-10A1 1 0 0019.82 6h-2.99"/>
          <circle cx="9" cy="21" r="1"/>
          <circle cx="15" cy="21" r="1"/>
        </svg>
        <span *ngIf="itemCount() > 0" class="cart-badge">{{ itemCount() }}</span>
      </div>
    </a>
  `,
  styles: [`
    .cart-icon-link {
      position: relative;
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      color: white;
      transition: transform 0.2s ease;
    }

    .cart-icon-link:hover {
      transform: scale(1.1);
    }

    .cart-icon-container {
      position: relative;
    }

    .cart-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #e74c3c;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  `]
})
export class CartIconComponent {
  itemCount = computed(() => this.cartService.getCartItemCount());
  
  constructor(private cartService: CartService) {}
}