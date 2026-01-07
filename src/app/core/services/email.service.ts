// src/app/features/admin/services/email.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmailNotification {
  notificationGuid: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body?: string;
  notificationType: string;
  status: string;
  priority: string;
  scheduledAt?: Date;
  sentAt?: Date;
  failureReason?: string;
  retryCount: number;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: Date;
}

export interface EmailNotificationListResponse {
  notifications: EmailNotification[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface EmailStatistics {
  overview: {
    totalNotifications: number;
    sentCount: number;
    failedCount: number;
    pendingCount: number;
    successRate: number;
    avgDeliveryTimeSeconds: number;
  };
  byType: Array<{
    notificationType: string;
    totalCount: number;
    sentCount: number;
    failedCount: number;
    pendingCount: number;
  }>;
  dailyTrend: Array<{
    date: Date;
    totalCount: number;
    sentCount: number;
    failedCount: number;
  }>;
}

export interface EmailTemplate {
  templateGuid: string;
  templateName: string;
  subject: string;
  bodyTemplate: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailNotification {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  notificationType: string;
  priority: string;
  scheduledAt?: Date;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface SaveEmailTemplate {
  templateName: string;
  subject: string;
  bodyTemplate: string;
  description?: string;
}

export interface SendTestEmail {
  recipientEmail: string;
  templateName: string;
  templateData: { [key: string]: string };
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = `${environment.apiUrl}/admin/notifications`;

  constructor(private http: HttpClient) {}

  getEmailHistory(
    days: number = 30,
    status?: string,
    notificationType?: string,
    page: number = 1,
    pageSize: number = 50
  ): Observable<EmailNotificationListResponse> {
    let params = new HttpParams()
      .set('days', days.toString())
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (status) params = params.set('status', status);
    if (notificationType) params = params.set('notificationType', notificationType);

    return this.http.get<EmailNotificationListResponse>(`${this.apiUrl}/history`, { params });
  }

  getStatistics(days: number = 30): Observable<EmailStatistics> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<EmailStatistics>(`${this.apiUrl}/statistics`, { params });
  }

  createNotification(notification: CreateEmailNotification): Observable<any> {
    return this.http.post(`${this.apiUrl}/send`, notification);
  }

  processPendingEmails(): Observable<any> {
    return this.http.post(`${this.apiUrl}/process`, {});
  }

  getTemplates(): Observable<EmailTemplate[]> {
    return this.http.get<EmailTemplate[]>(`${this.apiUrl}/templates`);
  }

  saveTemplate(template: SaveEmailTemplate): Observable<any> {
    return this.http.post(`${this.apiUrl}/templates`, template);
  }

  sendTestEmail(testEmail: SendTestEmail): Observable<any> {
    return this.http.post(`${this.apiUrl}/test`, testEmail);
  }

  sendOrderConfirmation(orderId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/order-confirmation/${orderId}`, {});
  }
}