// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/services/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/products',
    pathMatch: 'full'
  },
  
  // ===== PUBLIC ROUTES (Guest Shopping Enabled) =====
  {
    path: 'products',
    loadComponent: () => 
      import('./features/products/product-list/product-list').then(
        m => m.ProductListComponent
      )
  },
  {
    path: 'products/:id',
    loadComponent: () => 
      import('./features/products/product-detail/product-detail').then(
        m => m.ProductDetailComponent
      )
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/shopping-cart/shopping-cart').then(
        m => m.ShoppingCartComponent
      )
    // ✅ NO AUTH - Guests can view cart
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/products/checkout/checkout').then(
        m => m.CheckoutComponent
      )
    // ✅ NO AUTH - Guests can checkout and pay!
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(
        m => m.LoginComponent
      )
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then(
        m => m.RegisterComponent
      )
  },
  
  // ===== PROTECTED ROUTES (Auth Required) =====
  {
    path: 'orders',
    loadComponent: () =>
      import('./features/orders/order-list').then(
        m => m.OrderListComponent
      ),
    canActivate: [AuthGuard] // ✅ Must login to view order history
  },
  // {
  //   path: 'orders/:id',
  //   loadComponent: () =>
  //     import('./features/orders/order-detail').then(
  //       m => m.OrderDetailComponent
  //     ),
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'profile',
  //   loadComponent: () =>
  //     import('./features/user/profile').then(
  //       m => m.ProfileComponent
  //     ),
  //   canActivate: [AuthGuard]
  // },

  // ===== ADMIN ROUTES =====
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/admin-login').then(
        m => m.AdminLoginComponent
      )
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./features/admin/dashboard/admin-dashboard').then(
        m => m.AdminDashboardComponent
      )
  },
  {
    path: 'admin/products',
    loadComponent: () =>
      import('./features/admin/products/product-management').then(
        m => m.ProductManagementComponent
      )
  },
  {
    path: 'admin/inventory',
    loadComponent: () =>
      import('./features/admin/inventory/inventory-management').then(
        m => m.InventoryManagementComponent
      )
  },
  {
    path: 'admin/orders',
    loadComponent: () =>
      import('./features/admin/orders/orders-management').then(
        m => m.OrdersManagementComponent
      )
  },
  {
    path: 'admin/customers',
    loadComponent: () =>
      import('./features/admin/customers/customer-management').then(
        m => m.CustomerManagementComponent
      )
  },
  {
    path: 'admin/analytics',
    loadComponent: () =>
      import('./features/admin/analytics/analytics').then(
        m => m.AnalyticsComponent
      )
  },
  {
    path: 'admin/notifications',
    loadComponent: () =>
      import('./features/admin/notifications/notifications').then(
        m => m.NotificationsComponent
      )
  },
  {
    path: 'admin',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/products'
  }
];