import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: number;
  active: number;
  created_at: string;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="flex-1 flex flex-col items-center px-4 py-8">
      <div class="w-full max-w-md">
        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            📢 公告
          </h1>
        </div>

        <!-- Loading -->
        @if (loading && announcements.length === 0) {
          <div class="flex flex-col items-center justify-center py-12">
            <div class="w-8 h-8 border-3 border-stone-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p class="mt-3 text-sm text-stone-600">載入中...</p>
            <p class="mt-1 text-xs text-stone-400">API: {{ apiUrl }}/announcements</p>
          </div>
        }

        <!-- Error -->
        @if (showError && !loading) {
          <div class="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <div class="text-3xl mb-3">⚠️</div>
            <p class="text-red-700 font-medium">{{ errorMessage }}</p>
            <p class="text-stone-600 text-xs mt-2 mb-4">API: {{ apiUrl }}/announcements</p>
            <button 
              (click)="loadAnnouncements()"
              class="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors"
            >
              重試
            </button>
          </div>
        }

        <!-- Empty State -->
        @if (!loading && !showError && announcements.length === 0) {
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
            <div class="text-4xl mb-3">📭</div>
            <p class="text-stone-600">暫時沒有公告</p>
          </div>
        }

        <!-- Announcements List -->
        @if (announcements.length > 0) {
          <div class="space-y-4">
            @for (a of announcements; track a.id) {
              <div 
                class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 transition-all hover:shadow-md"
                [class.border-l-4]="a.priority === 10"
                [class.border-l-red-500]="a.priority === 10"
              >
                <div class="flex items-start justify-between gap-3 mb-3">
                  <h3 class="font-bold text-stone-900 text-base leading-tight flex-1">
                    {{ a.title }}
                  </h3>
                  
                  <!-- Priority Badge -->
                  @if (a.priority === 10) {
                    <span style="background-color: #ef4444; color: white;" class="shrink-0 px-3 py-1 text-sm font-bold rounded-lg">
                      高
                    </span>
                  } @else if (a.priority === 5) {
                    <span style="background-color: #facc15; color: #713f12;" class="shrink-0 px-3 py-1 text-sm font-bold rounded-lg">
                      中
                    </span>
                  } @else {
                    <span style="background-color: #22c55e; color: white;" class="shrink-0 px-3 py-1 text-sm font-bold rounded-lg">
                      一般
                    </span>
                  }
                </div>
                
                <p class="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                  {{ a.content }}
                </p>
                
                <div class="text-xs text-stone-400">
                  {{ formatDate(a.created_at) }}
                </div>
              </div>
            }
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: block;
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class AnnouncementsComponent implements OnInit, OnDestroy {
  announcements: Announcement[] = [];
  loading = true;
  showError = false;
  errorMessage = '';
  apiUrl = '';
  private reloadSubscription?: Subscription;

  constructor(
    private http: HttpClient
  ) {
    this.apiUrl = 'https://kmb-backend-production.up.railway.app/api';
  }

  ngOnInit(): void {
    console.log('AnnouncementsComponent ngOnInit called');
    this.loadAnnouncements();
  }

  ngOnDestroy(): void {
    this.reloadSubscription?.unsubscribe();
  }

  loadAnnouncements(): void {
    this.loading = true;
    this.showError = false;
    this.errorMessage = '';

    const url = `${this.apiUrl}/announcements`;
    console.log('Fetching:', url);

    this.http.get<Announcement[]>(url).subscribe({
      next: (data) => {
        console.log('Success, count:', data?.length || 0);
        this.announcements = data || [];
        this.loading = false;
        this.showError = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error:', err);
        this.loading = false;
        this.showError = true;
        this.errorMessage = err.status === 0 
          ? '網絡連線失敗' 
          : err.status === 404 
            ? 'API 找不到 (404)'
            : `伺服器錯誤 (${err.status})`;
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const timestamp = parseInt(dateStr) * 1000;
      if (isNaN(timestamp)) return dateStr;
      const date = new Date(timestamp);
      return date.toLocaleDateString('zh-HK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
