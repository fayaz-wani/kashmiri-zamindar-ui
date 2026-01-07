// core/services/checkout.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CheckoutRequest, CheckoutResponse, OrderItem } from '../../shared/models/checkout.model';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private apiUrl = `${environment.apiUrl}/checkout`;
  
  private checkoutDataSubject = new BehaviorSubject<OrderItem[]>([]);
  checkoutData$ = this.checkoutDataSubject.asObservable();

  constructor(private http: HttpClient) {}

  setCheckoutItems(items: OrderItem[]): void {
    this.checkoutDataSubject.next(items);
  }

  getCheckoutItems(): OrderItem[] {
    return this.checkoutDataSubject.value;
  }

  clearCheckoutData(): void {
    this.checkoutDataSubject.next([]);
  }

  // ✅ FIX: Changed endpoint from /buyNow to /process
  buyNow(checkoutData: CheckoutRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/process`, checkoutData);
  }

  calculateTotals(items: OrderItem[]): { subtotal: number; tax: number; shipping: number; total: number } {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const shipping = subtotal > 999 ? 0 : 50;
    const total = subtotal + tax + shipping;
    
    return { subtotal, tax, shipping, total };
  }
}