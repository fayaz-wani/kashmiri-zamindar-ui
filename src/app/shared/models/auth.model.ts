// src/app/shared/models/auth.model.ts

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