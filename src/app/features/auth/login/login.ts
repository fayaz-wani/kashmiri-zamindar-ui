// src/app/features/auth/login/login.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { LoginRequest } from '../../../shared/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginData: LoginRequest = {
    email: '',
    password: ''
  };

  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: () => {
        // After successful login, merge guest cart if exists
        const guestSessionId = localStorage.getItem('guestSessionId');
        if (guestSessionId) {
          this.cartService.mergeGuestCart().subscribe({
            next: () => {
              console.log('Cart merged successfully');
              this.router.navigate(['/products']);
            },
            error: (err) => {
              console.error('Error merging cart:', err);
              // Still navigate even if merge fails
              this.router.navigate(['/products']);
            }
          });
        } else {
          // No guest cart to merge, just navigate
          this.cartService.loadCart();
          this.router.navigate(['/products']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}