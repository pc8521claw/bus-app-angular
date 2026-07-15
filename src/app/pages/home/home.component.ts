import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KmbApiService } from '../../services/kmb-api.service';
import { StorageService } from '../../services/storage.service';
import { FavoriteItem, RecentSearch, RouteSearchResult, Direction } from '../../models/types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="flex-1 flex flex-col items-center px-4 py-12 sm:py-16">
      <div class="w-full max-w-md">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            巴士路線搜尋
          </h1>
          <p class="text-stone-900 text-sm sm:text-base">
            巴士路線、車站及到站時間
          </p>
        </div>

        <!-- Search Form -->
        <form
          (ngSubmit)="onSubmit()"
          class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4"
        >
          <div>
            <label for="route" class="block text-sm font-medium text-stone-900 mb-1.5">
              路缐號碼
            </label>
            <div class="relative">
              <input
                type="text"
                id="route"
                [(ngModel)]="route"
                name="route"
                placeholder="例：58M"
                required
                autofocus
                (input)="onRouteChange()"
                class="w-full px-4 py-2.5 rounded-lg border outline-none text-base transition-colors"
                [class.border-red-500]="error"
                [class.focus:border-red-500]="error"
                [class.ring-2]="error"
                [class.ring-red-100]="error"
                [class.border-stone-300]="!error"
                [class.focus:border-blue-500]="!error"
                [class.focus:ring-2]="!error"
                [class.focus:ring-blue-100]="!error"
                [class.pr-10]="route"
              />
              @if (route) {
                <button
                  type="button"
                  (click)="clearRoute()"
                  title="清除"
                  class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-full text-stone-900 opacity-50 hover:opacity-100 hover:bg-stone-100 transition-all"
                >
                  ×
                </button>
              }
            </div>
            @if (error) {
              <div class="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
                <svg class="w-4 h-4 flex-shrink-0 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <span>{{ error }}</span>
              </div>
            }
          </div>

          <div>
            <label for="direction" class="block text-sm font-medium text-stone-900 mb-1.5">
              方向
            </label>
            <select
              id="direction"
              [(ngModel)]="direction"
              name="direction"
              class="w-full px-4 py-2.5 rounded-lg border border-stone-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-base bg-white transition-colors"
            >
              <option value="outbound">出市區 (Outbound)</option>
              <option value="inbound">入郊區 (Inbound)</option>
            </select>
          </div>

          <button
            type="submit"
            [disabled]="checking"
            class="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:bg-stone-400"
          >
            {{ checking ? '查詢中...' : '查詢路線' }}
          </button>
        </form>

        <!-- Search Results (Multi-company selection) -->
        @if (searchResults && searchResults.length > 0) {
          <div class="mt-6">
            <h2 class="text-sm font-medium text-stone-900 mb-3 text-center">
              撳你想查嘅路線
            </h2>
            <div class="space-y-2">
              @for (r of searchResults; track r.company + r.route) {
                <a
                  [href]="'/route/' + encode(r.route) + '/' + direction + '?company=' + r.company"
                  (click)="navigateToRoute($event, r)"
                  class="block bg-white rounded-xl border border-stone-200 p-4 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span
                          class="inline-block px-2 py-0.5 text-xs font-medium rounded"
                          [class.bg-amber-100]="r.company === 'KMB'"
                          [class.text-amber-800]="r.company === 'KMB'"
                          [class.bg-blue-100]="r.company === 'CTB'"
                          [class.text-blue-800]="r.company === 'CTB'"
                        >
                          {{ r.company }}
                        </span>
                        <span class="font-medium text-lg">{{ r.route }}</span>
                      </div>
                      <div class="text-sm text-stone-900">
                        {{ r.orig_tc }} → {{ r.dest_tc }}
                      </div>
                    </div>
                    <span class="text-stone-900 text-xl">→</span>
                  </div>
                </a>
              }
            </div>
          </div>
        }

        <!-- Favorites -->
        <div class="mt-8">
          <h2 class="text-sm font-medium text-stone-900 mb-3 text-center">
            常用路線
          </h2>
          @if (favorites.length === 0) {
            <p class="text-center text-xs text-stone-900 opacity-50">
              撳路線結果頁面嘅 ⭐ 加到常用路線
            </p>
          } @else {
            <div class="flex flex-wrap gap-2 justify-center">
              @for (f of favorites; track f.company + f.route) {
                <a
                  [href]="'/route/' + encode(f.route) + '/outbound?company=' + f.company"
                  (click)="navigateToRouteFav($event, f)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-white border border-stone-200 text-stone-900 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <span
                    class="inline-block w-1.5 h-1.5 rounded-full"
                    [style.background-color]="f.company === 'KMB' ? '#f59e0b' : f.company === 'CTB' ? '#3b82f6' : '#a8a29e'"
                  ></span>
                  <span>{{ f.route }}</span>
                </a>
              }
            </div>
          }
        </div>

        <!-- Recent Searches -->
        <div class="mt-6">
          <h2 class="text-sm font-medium text-stone-900 mb-3 text-center">
            最近搜尋
          </h2>
          @if (recent.length === 0) {
            <p class="text-center text-xs text-stone-900 opacity-50">
              搜尋過嘅路線會出現喺度
            </p>
          } @else {
            <div class="flex flex-wrap gap-2 justify-center">
              @for (entry of recent; track entry.company + entry.route + entry.direction + entry.timestamp) {
                <a
                  [href]="'/route/' + encode(entry.route) + '/' + entry.direction + '?company=' + entry.company"
                  (click)="navigateToRouteRecent($event, entry)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-white border border-stone-200 text-stone-900 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  [title]="entry.company + ' · ' + (entry.direction === 'outbound' ? '出市區' : '入郊區')"
                >
                  <span
                    class="inline-block w-1.5 h-1.5 rounded-full"
                    [style.background-color]="entry.company === 'KMB' ? '#f59e0b' : entry.company === 'CTB' ? '#3b82f6' : '#a8a29e'"
                  ></span>
                  <span>{{ entry.route }}</span>
                  <span class="text-xs text-stone-900 opacity-60">
                    {{ entry.direction === 'outbound' ? '出' : '入' }}
                  </span>
                </a>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="mt-12 text-center text-xs text-stone-900 opacity-50 space-y-0.5">
          <div>即時班次：九巴開放數據 / 城巴開放數據</div>
          <div>車費及服務時間：hk-bus-crawling</div>
          <div class="mt-2">
            <a href="https://kmb-backend-production.up.railway.app/admin" target="_blank" class="underline hover:text-blue-600">🔧 Backend Admin</a>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class HomeComponent implements OnInit {
  route = '';
  direction: Direction = 'outbound';
  favorites: FavoriteItem[] = [];
  recent: RecentSearch[] = [];
  error = '';
  checking = false;
  searchResults: RouteSearchResult[] | null = null;

  encode = encodeURIComponent;

  constructor(
    private router: Router,
    private api: KmbApiService,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    this.favorites = this.storage.getFavorites();
    this.recent = this.storage.getRecent();
  }

  onRouteChange(): void {
    this.route = this.route.toUpperCase();
    if (this.error) this.error = '';
  }

  clearRoute(): void {
    this.route = '';
    this.error = '';
  }

  onSubmit(): void {
    const trimmed = this.route.trim();
    if (!trimmed) {
      this.error = '請輸入路線號碼';
      return;
    }

    this.error = '';
    this.checking = true;
    this.searchResults = null;

    this.api.checkRoute(trimmed, this.direction).subscribe({
      next: (results) => {
        if (results.length === 0) {
          this.error = '搵唔到呢條路線（KMB / Citybus 都冇）';
          this.checking = false;
          return;
        }

        if (results.length === 1) {
          const r = results[0];
          const url = `/route/${encodeURIComponent(trimmed)}/${this.direction}?company=${r.company}`;
          window.location.href = window.location.origin + url;
        } else if (results.length > 1) {
          // Prefer KMB over CTB when both exist
          const r = results.find(x => x.company === 'KMB') || results[0];
          const url = `/route/${encodeURIComponent(trimmed)}/${this.direction}?company=${r.company}`;
          window.location.href = window.location.origin + url;
        }
        this.searchResults = results;
        this.checking = false;
      },
      error: (err) => {
        // Network error
        this.error = '網絡錯誤，請稍後再試';
        this.checking = false;
      }
    });
  }

  navigateToRoute(event: Event, r: RouteSearchResult): void {
    event.preventDefault();
    const url = `/route/${encodeURIComponent(r.route)}/${this.direction}?company=${r.company}`;
    window.location.href = window.location.origin + url;
  }

  navigateToRouteFav(event: Event, f: FavoriteItem): void {
    event.preventDefault();
    const url = `/route/${encodeURIComponent(f.route)}/outbound?company=${f.company}`;
    window.location.href = window.location.origin + url;
  }

  navigateToRouteRecent(event: Event, entry: RecentSearch): void {
    event.preventDefault();
    const url = `/route/${encodeURIComponent(entry.route)}/${entry.direction}?company=${entry.company}`;
    window.location.href = window.location.origin + url;
  }
}
