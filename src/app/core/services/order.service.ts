// src/app/core/services/order.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserOrder {
  orderGuid: string;
  orderId: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentType: string;
  createdAt: Date;
  shippingAddress: string;
  itemCount: number;
}

export interface UserOrderDetail {
  orderGuid: string;
  orderId: number;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  billingAddress: string;
  paymentType: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

export interface OrderItem {
  orderItemId: number;
  productGuid: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  imageUrl: string;
}

export interface UserOrdersResponse {
  orders: UserOrder[];
  totalOrders: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/user/orders`;

  constructor(private http: HttpClient) {}

  getUserOrders(userGuid: string, page: number = 1, pageSize: number = 10): Observable<UserOrdersResponse> {
    const params = new HttpParams()
      .set('userGuid', userGuid)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<UserOrdersResponse>(this.apiUrl, { params });
  }

  getOrderDetails(orderGuid: string, userGuid: string): Observable<UserOrderDetail> {
    const params = new HttpParams().set('userGuid', userGuid);
    return this.http.get<UserOrderDetail>(`${this.apiUrl}/${orderGuid}`, { params });
  }
}