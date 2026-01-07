// features/products/checkout/checkout.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CheckoutService } from '../../../core/services/checkout.service';
import { PaymentService } from '../../../core/services/payment.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartItem } from '../../../shared/models/cart.model';

import { 
  CheckoutRequest, 
  OrderItem, 
  ContactInfo, 
  ShippingAddress, 
  ShippingMethod, 
  PaymentInfo,
  AdditionalFields
} from '../../../shared/models/checkout.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class CheckoutComponent implements OnInit {
  orderItems: OrderItem[] = [];
  
  subtotal = 0;
  tax = 0;
  shipping = 0;
  total = 0;

  // ✅ Check if user is logged in
  isGuest = true;

  contactInfo: ContactInfo = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subscribeMarketing: false,
    orderNotes: ''
  };

  shippingAddress: ShippingAddress = {
    firstName: '',
    lastName: '',
    country: 'India',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    phone: ''
  };

  shippingMethod: ShippingMethod = {
    shippingMethodId: 1,
    name: 'Standard Delivery',
    cost: 50,
    estimatedDelivery: '3-5 business days'
  };

  paymentInfo: PaymentInfo = {
    paymentType: 'COD',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
    nameOnCard: '',
    billingAddress: {
      firstName: '',
      lastName: '',
      country: 'India',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      phone: ''
    }
  };

  additionalFields: AdditionalFields = {
    gstNumber: '',
    deliveryInstructions: '',
    alternatePhone: '',
    preferredDeliveryTime: ''
  };

  isProcessing = false;
  errorMessage = '';

  constructor(
    private checkoutService: CheckoutService,
    private paymentService: PaymentService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // ✅ Check if user is logged in
    this.isGuest = !this.authService.isAuthenticated();

    // ✅ Pre-fill user info if logged in
    if (!this.isGuest) {
      const user = this.authService.currentUser();
      if (user) {
        this.contactInfo.firstName = user.firstName;
        this.contactInfo.lastName = user.lastName;
        this.contactInfo.email = user.email;
      }
    }

    const checkoutItems = this.checkoutService.getCheckoutItems();

    if (checkoutItems.length > 0) {
      this.orderItems = checkoutItems;
      this.calculateTotals();
      return;
    }

    const cart = this.cartService.cartSignal();

    if (cart.items.length > 0) {
      this.orderItems = cart.items.map((item: CartItem): OrderItem => ({
        productGuid: item.productGuid,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl || ''
      }));

      this.calculateTotals();
      return;
    }

    alert('No items in checkout. Please add products first.');
    this.router.navigate(['/products']);
  }

  calculateTotals(): void {
    const totals = this.checkoutService.calculateTotals(this.orderItems);
    this.subtotal = totals.subtotal;
    this.tax = totals.tax;
    this.shipping = totals.shipping;
    this.total = totals.total;
  }

  validateForm(): boolean {
    if (!this.contactInfo.firstName || !this.contactInfo.lastName) {
      this.errorMessage = 'Please enter your full name';
      return false;
    }
    if (!this.contactInfo.email || !this.validateEmail(this.contactInfo.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }
    if (!this.contactInfo.phone || this.contactInfo.phone.length < 10) {
      this.errorMessage = 'Please enter a valid phone number';
      return false;
    }
    if (!this.shippingAddress.address1) {
      this.errorMessage = 'Please enter your address';
      return false;
    }
    if (!this.shippingAddress.city) {
      this.errorMessage = 'Please enter your city';
      return false;
    }
    if (!this.shippingAddress.state) {
      this.errorMessage = 'Please enter your state';
      return false;
    }
    if (!this.shippingAddress.zip) {
      this.errorMessage = 'Please enter your zip code';
      return false;
    }

    return true;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async placeOrder(): Promise<void> {
    this.errorMessage = '';

    if (!this.validateForm()) {
      return;
    }

    if (!this.shippingAddress.firstName) {
      this.shippingAddress.firstName = this.contactInfo.firstName;
    }
    if (!this.shippingAddress.lastName) {
      this.shippingAddress.lastName = this.contactInfo.lastName;
    }
    if (!this.shippingAddress.phone) {
      this.shippingAddress.phone = this.contactInfo.phone;
    }

    this.paymentInfo.billingAddress = { ...this.shippingAddress };

    // Clear card details for COD and UPI
    if (this.paymentInfo.paymentType === 'COD' || this.paymentInfo.paymentType === 'UPI') {
      this.paymentInfo.cardNumber = undefined;
      this.paymentInfo.cardExpiry = undefined;
      this.paymentInfo.cardCVV = undefined;
      this.paymentInfo.nameOnCard = undefined;
    }

    const checkoutRequest: CheckoutRequest = {
      contactInfo: this.contactInfo,
      shippingAddress: this.shippingAddress,
      shippingMethod: this.shippingMethod,
      paymentInfo: this.paymentInfo,
      orderItems: this.orderItems,
      subtotal: this.subtotal,
      tax: this.tax,
      shipping: this.shipping,
      total: this.total,
      additionalFields: this.additionalFields,
      // ✅ Send sessionId for guest checkout
      sessionId: this.cartService.getSessionId(),
      userGuid: this.isGuest ? null : this.authService.getUserGuid()
    };

    console.log('📦 Submitting order:', checkoutRequest);
    this.isProcessing = true;

    this.checkoutService.buyNow(checkoutRequest).subscribe({
      next: (response: any) => {
        console.log('✅ Checkout response:', response);

        if (response.requiresPayment && response.paymentDetails) {
          this.handleOnlinePayment(response);
        } else {
          this.handleCODOrder(response);
        }
      },
      error: (error) => {
        console.error('❌ Checkout error:', error);
        this.isProcessing = false;
        this.errorMessage = error.error?.message || 'Failed to place order. Please try again.';
      }
    });
  }

  private handleOnlinePayment(response: any): void {
    console.log('💳 Opening Razorpay checkout...');
    
    this.paymentService.openRazorpayCheckout(
      response.paymentDetails,
      (razorpayResponse: any) => {
        console.log('💰 Payment completed, verifying...');
        this.verifyPayment(response.orderId, razorpayResponse);
      },
      (error: any) => {
        this.isProcessing = false;
        this.errorMessage = error.message || 'Payment failed or cancelled. Please try again.';
        console.error('Payment error:', error);
      }
    );
  }

  private verifyPayment(orderId: number, razorpayResponse: any): void {
    const verifyRequest = {
      orderId: orderId,
      razorpayOrderId: razorpayResponse.razorpay_order_id,
      razorpayPaymentId: razorpayResponse.razorpay_payment_id,
      razorpaySignature: razorpayResponse.razorpay_signature
    };

    console.log('🔍 Verifying payment...', verifyRequest);

    this.paymentService.verifyPayment(verifyRequest).subscribe({
      next: (verificationResponse) => {
        this.isProcessing = false;

        if (verificationResponse.isValid) {
          console.log('✅ Payment verified successfully!');
          this.checkoutService.clearCheckoutData();
          this.cartService.clearCart().subscribe(() => {
            this.showSuccessMessage(verificationResponse.orderGuid, verificationResponse.amountPaid);
          });
        } else {
          this.errorMessage = 'Payment verification failed. Please contact support.';
        }
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = 'Payment verification error. Please contact support with your payment details.';
        console.error('Verification error:', error);
      }
    });
  }

  private handleCODOrder(response: any): void {
    this.isProcessing = false;
    this.checkoutService.clearCheckoutData();
    
    // ✅ Clear cart after successful order
    this.cartService.clearCart().subscribe(() => {
      alert(`✅ Order #${response.orderGuid.substring(0, 8)} placed successfully!\n\nPay ₹${this.formatPrice(this.total)} on delivery.`);
      
      // ✅ Show order tracking info for guests
      if (this.isGuest) {
        alert(`📧 Order confirmation sent to ${this.contactInfo.email}\n\nNote: Create an account to track your orders!`);
      }
      
      this.router.navigate(['/products']);
    });
  }

  private showSuccessMessage(orderGuid: string, amount: number): void {
    alert(`✅ Payment Successful!\n\nOrder #${orderGuid.substring(0, 8)}\nAmount Paid: ${this.formatPrice(amount)}\n\nThank you for your purchase!`);
    
    // ✅ Suggest account creation for guests
    if (this.isGuest) {
      const createAccount = confirm('Would you like to create an account to track your orders?');
      if (createAccount) {
        this.router.navigate(['/register'], { 
          queryParams: { 
            email: this.contactInfo.email,
            returnUrl: '/orders' 
          }
        });
        return;
      }
    }
    
    this.router.navigate(['/products']);
  }

  backToCart(): void {
    this.router.navigate(['/cart']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(price);
  }

  getProductImage(item: OrderItem): string {
    if (item.imageUrl) {
      return item.imageUrl.startsWith('/') 
        ? `https://localhost:7293${item.imageUrl}`
        : item.imageUrl;
    }
    return 'https://via.placeholder.com/80x80/F5F5F5/999?text=Product';
  }
}