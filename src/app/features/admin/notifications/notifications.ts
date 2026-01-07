// src/app/features/admin/notifications/notificatios.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { 
  EmailService, 
  EmailNotification, 
  EmailStatistics, 
  EmailTemplate,
  CreateEmailNotification,
  SaveEmailTemplate,
  SendTestEmail
} from  '../../../core/services/email.service';
import { FormBuilder, FormGroup, Validators ,FormsModule, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-notifications',
   standalone: true,
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
    imports: [
     CommonModule,
  FormsModule,
  ReactiveFormsModule
   
  ]
})
export class NotificationsComponent implements OnInit {
  // Tab Management
  activeTab: 'history' | 'statistics' | 'templates' | 'send' = 'history';

  // History
  notifications: EmailNotification[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;
  loading = false;
  
  // Filters
  filterDays = 30;
  filterStatus = '';
  filterType = '';

  // Statistics
  statistics: EmailStatistics | null = null;
  statsDays = 30;

  // Templates
  templates: EmailTemplate[] = [];
  selectedTemplate: EmailTemplate | null = null;
  editingTemplate = false;

  // Forms
  sendEmailForm: FormGroup;
  templateForm: FormGroup;
  testEmailForm: FormGroup;

  // Notification Types
  notificationTypes = [
    'OrderConfirmation',
    'OrderShipped',
    'OrderDelivered',
    'LowStockAlert',
    'Custom'
  ];

  statusList = ['Pending', 'Sent', 'Failed'];
  priorityList = ['Low', 'Normal', 'High'];

  constructor(
    private emailService: EmailService,
    private fb: FormBuilder,
     private route: ActivatedRoute
  ) {
    this.sendEmailForm = this.fb.group({
      recipientEmail: ['', [Validators.required, Validators.email]],
      recipientName: [''],
      subject: ['', Validators.required],
      body: ['', Validators.required],
      notificationType: ['Custom', Validators.required],
      priority: ['Normal', Validators.required],
      scheduledAt: ['']
    });

    this.templateForm = this.fb.group({
      templateName: ['', Validators.required],
      subject: ['', Validators.required],
      bodyTemplate: ['', Validators.required],
      description: ['']
    });

    this.testEmailForm = this.fb.group({
      recipientEmail: ['', [Validators.required, Validators.email]],
      templateName: ['', Validators.required]
    });
  }

 // notifications.component.ts - Update ngOnInit
ngOnInit(): void {
  this.loadHistory();
  this.loadStatistics();
  this.loadTemplates();
  
  // Handle query params from customer page
  this.route.queryParams.subscribe(params => {
    if (params['recipientEmail']) {
      this.activeTab = 'send';
      this.sendEmailForm.patchValue({
        recipientEmail: params['recipientEmail'],
        recipientName: params['recipientName'] || ''
      });
    }
  });
}

  // ==================== HISTORY ====================

  loadHistory(): void {
    this.loading = true;
    this.emailService.getEmailHistory(
      this.filterDays,
      this.filterStatus,
      this.filterType,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response) => {
        this.notifications = response.notifications;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadHistory();
  }

  clearFilters(): void {
    this.filterDays = 30;
    this.filterStatus = '';
    this.filterType = '';
    this.currentPage = 1;
    this.loadHistory();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadHistory();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  // ==================== STATISTICS ====================

  loadStatistics(): void {
    this.emailService.getStatistics(this.statsDays).subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
      }
    });
  }

  updateStatsDays(): void {
    this.loadStatistics();
  }

  // ==================== TEMPLATES ====================

  loadTemplates(): void {
    this.emailService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
      },
      error: (err) => {
        console.error('Error loading templates:', err);
      }
    });
  }

  selectTemplate(template: EmailTemplate): void {
    this.selectedTemplate = template;
    this.editingTemplate = false;
    this.templateForm.patchValue({
      templateName: template.templateName,
      subject: template.subject,
      bodyTemplate: template.bodyTemplate,
      description: template.description
    });
  }

  editTemplate(): void {
    this.editingTemplate = true;
  }

  createNewTemplate(): void {
    this.selectedTemplate = null;
    this.editingTemplate = true;
    this.templateForm.reset();
  }

  saveTemplate(): void {
    if (this.templateForm.invalid) return;

    const template: SaveEmailTemplate = this.templateForm.value;
    this.emailService.saveTemplate(template).subscribe({
      next: () => {
        alert('Template saved successfully!');
        this.loadTemplates();
        this.editingTemplate = false;
      },
      error: (err) => {
        console.error('Error saving template:', err);
        alert('Failed to save template');
      }
    });
  }

  cancelEdit(): void {
    this.editingTemplate = false;
    if (this.selectedTemplate) {
      this.selectTemplate(this.selectedTemplate);
    }
  }

  // ==================== SEND EMAIL ====================

 // notifications.component.ts - Fix sendEmail method

sendEmail(): void {
  if (this.sendEmailForm.invalid) return;

  const formValue = this.sendEmailForm.value;
  
  // FIX: Convert empty scheduledAt to null
  const notification: CreateEmailNotification = {
    ...formValue,
    scheduledAt: formValue.scheduledAt ? new Date(formValue.scheduledAt) : null
  };

  this.emailService.createNotification(notification).subscribe({
    next: () => {
      alert('Email queued successfully!');
      this.sendEmailForm.reset({ 
        priority: 'Normal', 
        notificationType: 'Custom',
        scheduledAt: null  // Reset to null
      });
      this.loadHistory();
    },
    error: (err) => {
      console.error('Error sending email:', err);
      alert('Failed to send email: ' + (err.error?.title || 'Unknown error'));
    }
  });
}

  sendTestEmail(): void {
    if (this.testEmailForm.invalid) return;

    const testEmail: SendTestEmail = {
      ...this.testEmailForm.value,
      templateData: {}
    };

    this.emailService.sendTestEmail(testEmail).subscribe({
      next: () => {
        alert('Test email sent successfully!');
      },
      error: (err) => {
        console.error('Error sending test email:', err);
        alert('Failed to send test email');
      }
    });
  }

  processPendingEmails(): void {
    if (!confirm('Process all pending emails now?')) return;

    this.emailService.processPendingEmails().subscribe({
      next: () => {
        alert('Pending emails are being processed!');
        setTimeout(() => this.loadHistory(), 2000);
      },
      error: (err) => {
        console.error('Error processing emails:', err);
        alert('Failed to process emails');
      }
    });
  }

  // ==================== HELPERS ====================

  getStatusClass(status: string): string {
    switch (status) {
      case 'Sent': return 'status-success';
      case 'Failed': return 'status-error';
      case 'Pending': return 'status-pending';
      default: return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Normal': return 'priority-normal';
      case 'Low': return 'priority-low';
      default: return '';
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }

  // notifications.component.ts - Add template selection handler

// Add this property
selectedTemplateName = '';

// Add this method
onTemplateSelect(event: any): void {
  const templateName = event.target.value;
  if (!templateName) return;

  // Find the selected template
  const template = this.templates.find(t => t.templateName === templateName);
  if (!template) return;

  // Auto-fill subject and body
  this.sendEmailForm.patchValue({
    subject: template.subject,
    body: template.bodyTemplate,
    notificationType: templateName
  });

  this.selectedTemplateName = templateName;
}
}