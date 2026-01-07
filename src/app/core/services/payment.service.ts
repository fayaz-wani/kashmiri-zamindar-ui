// core/services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  RazorpayOrderResponse, 
  VerifyPaymentRequest, 
  PaymentVerificationResponse,
  CreatePaymentOrderRequest
} from '../../shared/models/payment.model';

declare var Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payment`;

  constructor(private http: HttpClient) {}

  createPaymentOrder(request: CreatePaymentOrderRequest): Observable<RazorpayOrderResponse> {
    return this.http.post<RazorpayOrderResponse>(`${this.apiUrl}/create-order`, request);
  }

  verifyPayment(request: VerifyPaymentRequest): Observable<PaymentVerificationResponse> {
    return this.http.post<PaymentVerificationResponse>(`${this.apiUrl}/verify`, request);
  }

  getPaymentStatus(orderId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/status/${orderId}`);
  }

openRazorpayCheckout(
  razorpayOrder: RazorpayOrderResponse,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
): void {
  if (typeof Razorpay === 'undefined') {
    console.error('❌ Razorpay SDK not loaded');
    onFailure({ message: 'Payment system not available. Please refresh the page.' });
    return;
  }

  // Debugging: Log the order details
  console.log('💳 Razorpay Order Received:', razorpayOrder);

  const amountPaise = Math.round(razorpayOrder.amount * 100);
  if (amountPaise <= 0) {
    console.error('❌ Invalid payment amount:', razorpayOrder.amount);
    onFailure({ message: 'Invalid payment amount.' });
    return;
  }

  if (!razorpayOrder.currency || razorpayOrder.currency.toUpperCase() !== 'INR') {
    console.warn('⚠️ Razorpay Checkout requires INR currency for card payments.');
    onFailure({ message: 'Currency not supported for card payment.' });
    return;
  }

  if (!razorpayOrder.razorpayOrderId) {
    console.error('❌ Missing Razorpay order ID');
    onFailure({ message: 'Order ID missing. Cannot proceed with payment.' });
    return;
  }

  const options: any = {
    key: razorpayOrder.razorpayKeyId,
    amount: amountPaise,
    currency: razorpayOrder.currency,
    name: 'Kashmiri Zamindar',
    description: `Order #${razorpayOrder.orderGuid.substring(0, 8)}`,
    image: '/assets/logo.png',
    order_id: razorpayOrder.razorpayOrderId,
    prefill: {
      name: razorpayOrder.customerName,
      email: razorpayOrder.customerEmail,
      contact: razorpayOrder.customerPhone
    },
    notes: { order_guid: razorpayOrder.orderGuid },
    theme: { color: '#8B4513' },
    handler: (response: any) => {
      console.log('✅ Payment Successful:', response);
      onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        console.log('❌ Payment cancelled by user');
        onFailure({ message: 'Payment cancelled' });
      },
      escape: false,
      backdropclose: false
    }
  };

  try {
    console.log('💳 Opening Razorpay Checkout with options:', options);
    const razorpayCheckout = new Razorpay(options);

    razorpayCheckout.on('payment.failed', (response: any) => {
      console.error('❌ Payment Failed:', response.error);
      onFailure({
        message: response.error.description || 'Payment failed',
        code: response.error.code,
        reason: response.error.reason
      });
    });

    razorpayCheckout.open();
  } catch (error) {
    console.error('❌ Error opening Razorpay:', error);
    onFailure({ message: 'Failed to open payment gateway' });
  }
}


}