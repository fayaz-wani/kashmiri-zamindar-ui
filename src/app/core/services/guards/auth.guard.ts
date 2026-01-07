// src/app/core/services/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const token = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    console.log('--- AuthGuard Check ---');
    console.log('Token:', token);
    console.log('CurrentUser:', currentUser);

    // ✅ FIX: Check localStorage directly since signals might not be initialized yet
    if (token && currentUser) {
      try {
        const user = JSON.parse(currentUser);
        // Update the auth service state if needed
        if (!this.authService.isAuthenticated()) {
          this.authService.currentUser.set(user);
          this.authService.isAuthenticated.set(true);
        }
        console.log('AuthGuard: Access granted ✅');
        return true;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    console.log('AuthGuard: Not logged in, redirecting to /login ❌');
    this.router.navigate(['/login']);
    return false;
  }
}