import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  userGuid: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userGuid: string;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient) {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
    }
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    const user: User = {
      userGuid: response.userGuid,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName
    };

    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', response.token);

    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

logout(): void {
  // Clear auth only
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  this.currentUser.set(null);
  this.isAuthenticated.set(false);

  // DO NOT call CartService or initialize cart here
}


  getUserGuid(): string | null {
    return this.currentUser()?.userGuid || null;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}
