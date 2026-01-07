// src/app/app.ts
import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartIconComponent } from './shared/components/cart-icon/cart-icon';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, CartIconComponent],
  template: `
    <header class="main-header">
      <div class="header-container">
        <a routerLink="/" class="brand">
          <span class="brand-icon">🏔️</span>
          <span class="brand-name">Kashmiri Zamindar</span>
        </a>

        <div class="header-actions">
          <app-cart-icon></app-cart-icon>

          <!-- LOGGED IN USER -->
          <div *ngIf="authService.isAuthenticated(); else guestUser" class="user-menu">
            <button class="profile-button" (click)="toggleDropdown()">
              <span class="user-avatar">{{ getInitials() }}</span>
              <span class="user-name-desktop">{{ authService.currentUser()?.firstName }}</span>
              <svg class="chevron" [class.rotated]="dropdownOpen" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <!-- Backdrop for mobile -->
            <div class="dropdown-backdrop" [class.active]="dropdownOpen" (click)="closeDropdown()"></div>

            <div class="dropdown-menu" [class.active]="dropdownOpen">
              <div class="dropdown-header">
                <div class="user-avatar-large">{{ getInitials() }}</div>
                <div class="user-info">
                  <div class="user-full-name">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</div>
                  <div class="user-email">{{ authService.currentUser()?.email }}</div>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <a routerLink="/orders" class="dropdown-item" (click)="closeDropdown()">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span>My Orders</span>
              </a>

              <a routerLink="/profile" class="dropdown-item" (click)="closeDropdown()">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Profile</span>
              </a>

              <div class="dropdown-divider"></div>

              <button (click)="logout()" class="dropdown-item logout-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>

          <!-- GUEST USER -->
          <ng-template #guestUser>
            <a routerLink="/login" class="btn-login">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              <span class="login-text">Login</span>
            </a>
          </ng-template>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <footer class="main-footer">
      <div class="footer-container">
        <p>&copy; 2025 Kashmiri Zamindar. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    /* ================= HEADER ================= */
    .main-header {
      background: linear-gradient(135deg, #8b5a3c 0%, #6d4428 100%);
      color: white;
      padding: 16px 0;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      position: sticky;
      top: 0;
      z-index: 1000;
      backdrop-filter: blur(10px);
    }

    .header-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: white;
      font-size: 1.4rem;
      font-weight: 700;
      transition: transform 0.2s;
    }

    .brand:hover {
      transform: scale(1.02);
    }

    .brand-icon {
      font-size: 2rem;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    .brand-name {
      display: none;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* ================= USER MENU ================= */
    .user-menu {
      position: relative;
    }

    .profile-button {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 8px 14px;
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .profile-button:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .user-name-desktop {
      display: none;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chevron {
      transition: transform 0.3s;
    }

    .chevron.rotated {
      transform: rotate(180deg);
    }

    /* ================= DROPDOWN ================= */
    .dropdown-backdrop {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 999;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .dropdown-backdrop.active {
      display: block;
      opacity: 1;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      background: white;
      color: #333;
      min-width: 280px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .dropdown-menu.active {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-header {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar-large {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
      border: 2px solid rgba(255, 255, 255, 0.5);
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-full-name {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 13px;
      opacity: 0.9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dropdown-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 8px 0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      text-decoration: none;
      color: #374151;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 15px;
    }

    .dropdown-item:hover {
      background: #f3f4f6;
    }

    .dropdown-item svg {
      flex-shrink: 0;
      opacity: 0.7;
    }

    .dropdown-item:hover svg {
      opacity: 1;
    }

    .logout-item {
      color: #dc2626;
      font-weight: 500;
    }

    .logout-item:hover {
      background: #fef2f2;
    }

    /* ================= LOGIN BUTTON ================= */
    .btn-login {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: white;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 500;
      transition: all 0.3s;
      font-size: 15px;
    }

    .btn-login:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .btn-login svg {
      width: 18px;
      height: 18px;
    }

    .login-text {
      display: none;
    }

    /* ================= FOOTER ================= */
    .main-content {
      min-height: calc(100vh - 160px);
    }

    .main-footer {
      background: #1f2937;
      color: white;
      padding: 24px 0;
      text-align: center;
      margin-top: 60px;
    }

    .footer-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* ================= DESKTOP (768px+) ================= */
    @media (min-width: 768px) {
      .brand-name {
        display: block;
      }

      .user-name-desktop {
        display: block;
      }

      .login-text {
        display: inline;
      }

      .dropdown-backdrop {
        display: none !important;
      }

      .dropdown-menu {
        top: calc(100% + 8px);
      }
    }

    /* ================= MOBILE (<768px) ================= */
    @media (max-width: 767px) {
      .header-container {
        padding: 0 16px;
      }

      .brand {
        font-size: 1.2rem;
      }

      .brand-icon {
        font-size: 1.6rem;
      }

      .header-actions {
        gap: 12px;
      }

      .profile-button {
        padding: 6px 10px;
        gap: 8px;
      }

      .user-avatar {
        width: 28px;
        height: 28px;
        font-size: 12px;
      }

      /* Mobile drawer style */
      .dropdown-menu {
        position: fixed;
        top: auto;
        bottom: 0;
        left: 0;
        right: 0;
        min-width: 100%;
        border-radius: 20px 20px 0 0;
        transform: translateY(100%);
        max-height: 80vh;
        overflow-y: auto;
      }

      .dropdown-menu.active {
        transform: translateY(0);
      }

      .dropdown-header {
        padding: 24px 20px;
      }

      .user-avatar-large {
        width: 56px;
        height: 56px;
        font-size: 24px;
      }

      .dropdown-item {
        padding: 16px 20px;
        font-size: 16px;
      }

      .btn-login {
        padding: 8px 16px;
      }
    }

    /* ================= SMALL MOBILE (<400px) ================= */
    @media (max-width: 399px) {
      .brand {
        font-size: 1rem;
      }

      .brand-icon {
        font-size: 1.4rem;
      }
    }
  `]
})
export class AppComponent {
  dropdownOpen = false;

  constructor(
    public authService: AuthService,
    private cartService: CartService
  ) {}

  // Close dropdown when clicking outside (for desktop hover override)
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu') && this.dropdownOpen) {
      this.dropdownOpen = false;
    }
  }

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.cartService.loadCart();
    this.closeDropdown();
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
  }
}