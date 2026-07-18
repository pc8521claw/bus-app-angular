import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { KmbApiService } from '../../services/kmb-api.service';

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
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            📢 公告
          </h1>
          <p class="text-stone-900 text-sm opacity-60">
            最新消息及服務通知
          </p>
        </div>

        <!-- Loading -->
        @if (loading) {
          <div class="flex flex-col items-center justify-center py-12">
            <div class="w-8 h-8 border-3 border-stone-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p class="mt-3 text-sm text-stone-900 opacity-60">載入中...</p>
          </div>
        }

        <!-- Error -->
        @if (error && !loading) {
          <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p class="text-red-600 text-sm">{{ error }}</p>
            <button 
              (click)="loadAnnouncements()"
              class="mt-3 px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
            >
              重試
            </button>
          </div>
        }

        <!-- Empty State -->
        @if (!loading && !error && announcements.length === 0) {
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
            <div class="text-4xl mb-3">📭</div>
            <p class="text-stone-900 text-sm">暫時沒有公告</p>
          </div>
        }

        <!-- Announcements List -->
        @if (!loading && !error && announcements.length > 0) {
          <div class="space-y-4">
            @for (a of announcements; track a.id) {
              <div 
                class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 transition-all hover:shadow-md"
                [class.border-l-4]="a.priority >= 5"
                [class.border-l-amber-400]="a.priority >= 5"
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <h3 class="font-bold text-stone-900 text-base leading-tight">
                    {{ a.title }}
                  </h3>
                  @if (a.priority >= 5) {
                    <span class="shrink-0 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                      置頂
                    </span>
                  }
                </div>
                <p class="text-stone-900 text-sm leading-relaxed whitespace-pre-wrap">
                  {{ a.content }}
                </p>
                <div class="mt-3 text-xs text-stone-900 opacity-50">
                  {{ formatDate(a.created_at) }}
                </div>
              </div>
            }
          </div>
        }

        <!-- Footer -->
        <div class="mt-8 text-center text-xs text-stone-900 opacity-50">
          <div>公告由 hk-bus-crawling 團隊更新</div>
        </div>
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
export class AnnouncementsComponent implements OnInit {
  announcements: Announcement[] = [];
  loading = true;
  error = '';

  constructor(
    private http: HttpClient,
    private api: KmbApiService
  ) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.loading = true;
    this.error = '';

    const apiUrl = this.api.getBackendUrl();
    this.http.get<Announcement[]>(`${apiUrl}/announcements`).subscribe({
      next: (data) => {
        this.announcements = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load announcements:', err);
        this.error = '無法載入公告，請稍後再試';
        this.loading = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
