import { Injectable, signal, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Cart,
  CartItem,
  AddToCartRequest
} from '../../shared/models/cart.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;

  cartSignal = signal<Cart>({
    sessionId: '',
    userGuid: null,
    items: [],
    subtotal: 0,
    totalItems: 0
  });

  constructor(private http: HttpClient, private authService: AuthService) {
    // Watch logout to reinitialize guest cart
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      if (!isAuth) {
        this.initializeCart(); // Guest user
      }
    });

    this.initializeCart();
  }

  // -------------------------
  // Initialize / guest session
  // -------------------------
  initializeCart(): void {
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      sessionId =
        'guest_' +
        Date.now() +
        '_' +
        Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guestSessionId', sessionId);
    }
    this.loadCart();
  }

  getSessionId(): string {
    return localStorage.getItem('guestSessionId') || '';
  }

  getUserGuid(): string | null {
    return this.authService.getUserGuid();
  }

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  getCart(): Observable<Cart> {
    let params = new HttpParams().set('sessionId', this.getSessionId());
    const userGuid = this.getUserGuid();
    if (userGuid) params = params.set('userGuid', userGuid);

    return this.http.get<Cart>(this.apiUrl, { params }).pipe(
      tap(cart => this.cartSignal.set(cart))
    );
  }

  loadCart(): void {
    this.getCart().subscribe({
      next: cart => this.cartSignal.set(cart),
      error: (err: any) => console.error('Error loading cart:', err)
    });
  }

  addToCart(productGuid: string, quantity: number = 1): Observable<CartItem> {
    const request: AddToCartRequest = {
      sessionId: this.getSessionId(),
      userGuid: this.getUserGuid(),
      productGuid,
      quantity
    };

    return this.http.post<CartItem>(this.apiUrl, request).pipe(
      tap(() => this.loadCart())
    );
  }

  updateQuantity(cartItemId: number, quantity: number): Observable<any> {
    const cart = this.cartSignal();
    const items = cart.items.map(item =>
      item.cartItemId === cartItemId
        ? { ...item, quantity, itemTotal: quantity * item.price }
        : item
    );

    this.cartSignal.set({
      ...cart,
      items,
      totalItems: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.itemTotal, 0)
    });

    let params = new HttpParams().set('sessionId', this.getSessionId());
    const userGuid = this.getUserGuid();
    if (userGuid) params = params.set('userGuid', userGuid);

    return this.http.put(`${this.apiUrl}/items/${cartItemId}`, { quantity }, { params }).pipe(
      tap(() => this.loadCart())
    );
  }

  removeItem(cartItemId: number): Observable<any> {
    const cart = this.cartSignal();
    const items = cart.items.filter(i => i.cartItemId !== cartItemId);

    this.cartSignal.set({
      ...cart,
      items,
      totalItems: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.itemTotal, 0)
    });

    let params = new HttpParams().set('sessionId', this.getSessionId());
    const userGuid = this.getUserGuid();
    if (userGuid) params = params.set('userGuid', userGuid);

    return this.http.delete(`${this.apiUrl}/items/${cartItemId}`, { params }).pipe(
      tap(() => this.loadCart())
    );
  }

  clearCart(): Observable<any> {
    let params = new HttpParams().set('sessionId', this.getSessionId());
    const userGuid = this.getUserGuid();
    if (userGuid) params = params.set('userGuid', userGuid);

    return this.http.delete(this.apiUrl, { params }).pipe(
      tap(() => this.loadCart())
    );
  }

  getCartItemCount(): number {
    return this.cartSignal().totalItems;
  }

  // ✅ Merge guest cart after login/register
  mergeGuestCart(): Observable<any> {
    const guestSessionId = this.getSessionId();
    const userGuid = this.getUserGuid();

    if (!guestSessionId || !userGuid) {
      throw new Error('Cannot merge cart without guest session and user GUID');
    }

    return this.http.post(`${this.apiUrl}/merge`, { guestSessionId, userGuid }).pipe(
      tap(() => {
        localStorage.removeItem('guestSessionId');
        this.initializeCart();
      })
    );
  }
}
