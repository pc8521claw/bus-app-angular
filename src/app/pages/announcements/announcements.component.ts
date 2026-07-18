import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
        @if (loading) {
          <div class="flex flex-col items-center justify-center py-12">
            <div class="w-8 h-8 border-3 border-stone-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p class="mt-3 text-sm text-stone-600">載入中...</p>
          </div>
        }

        <!-- Error -->
        @if (showError) {
          <div class="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <div class="text-3xl mb-3">⚠️</div>
            <p class="text-red-700 font-medium">{{ errorMessage }}</p>
            <button 
              (click)="loadAnnouncements()"
              class="mt-4 px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors"
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
        @if (!loading && !showError && announcements.length > 0) {
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
export class AnnouncementsComponent implements OnInit {
  announcements: Announcement[] = [];
  loading = true;
  showError = false;
  errorMessage = '';

  private readonly API_URL = 'https://kmb-backend-production.up.railway.app/api';

  constructor(private http: HttpClient) {}

  async ngOnInit(): Promise<void> {
    await this.loadAnnouncements();
  }

  async loadAnnouncements(): Promise<void> {
    this.loading = true;
    this.showError = false;
    this.errorMessage = '';

    try {
      const data = await firstValueFrom(
        this.http.get<Announcement[]>(`${this.API_URL}/announcements`)
      );
      this.announcements = data || [];
    } catch (err: any) {
      this.showError = true;
      this.errorMessage = err?.message || '無法載入公告';
    } finally {
      this.loading = false;
    }
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
