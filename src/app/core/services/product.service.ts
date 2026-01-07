// core/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductReview, RelatedProduct, AddReview } from '../../shared/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProduct(guid: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${guid}`);
  }

  // ✅ Get Product Reviews
  getProductReviews(guid: string, pageNumber: number = 1, pageSize: number = 10): Observable<ProductReview[]> {
    return this.http.get<ProductReview[]>(
      `${this.apiUrl}/${guid}/reviews?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
  }

  // ✅ Add Product Review
  addProductReview(guid: string, review: AddReview): Observable<any> {
    return this.http.post(`${this.apiUrl}/${guid}/reviews`, review);
  }

  // ✅ Get Related Products
  getRelatedProducts(guid: string): Observable<RelatedProduct[]> {
    return this.http.get<RelatedProduct[]>(`${this.apiUrl}/${guid}/related`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(guid: string, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${guid}`, product);
  }

  deleteProduct(guid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${guid}`);
  }
}