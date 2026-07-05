import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KmbApiService } from '../../services/kmb-api.service';
import { NormalizedStop, Company } from '../../models/types';

interface StopETA {
  stopId: string;
  route: string;
  serviceType: number;
  eta: string | null;
  eta_seq: number;
  rmk_tc?: string;
}

interface EtaState {
  loading: boolean;
  data: StopETA[] | null;
  lastUpdated: number | null;
}

@Component({
  selector: 'app-stop-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <!-- Auto-refresh status bar -->
      @if (hasAnyEta) {
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-1.5 text-xs text-stone-900">
            <span
              class="inline-block w-2 h-2 rounded-full"
              [class.bg-blue-500]="isRefreshing"
              [class.animate-pulse]="isRefreshing"
              [class.bg-green-500]="!isRefreshing"
              [class.bg-stone-200]="false"
            ></span>
            <span>{{ isRefreshing ? '更新中...' : '每 30 秒自動更新' }}</span>
          </div>
          <button
            (click)="manualRefresh()"
            [disabled]="isRefreshing"
            class="text-xs text-blue-600 hover:text-blue-700 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors"
          >
            {{ isRefreshing ? '更新中...' : '立即更新' }}
          </button>
        </div>
      }

      <div class="space-y-3">
        @for (stop of stops; track stop.seq) {
          <div class="border border-stone-200 rounded-lg p-3 sm:p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <!-- Seq Badge -->
                <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                  {{ stop.seq }}
                </span>
                <!-- Stop Info -->
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-stone-900">{{ stop.name_tc || stop.stop }}</div>
                  <div class="text-xs text-stone-900 opacity-70">{{ stop.name_en }}</div>
                </div>
              </div>
              <!-- Action Buttons -->
              <div class="flex flex-col gap-2 shrink-0">
                <button
                  (click)="fetchEta(stop)"
                  [disabled]="isLoadingEta(stop.stop)"
                  class="px-3 py-1.5 text-xs font-medium rounded transition-colors"
                  [class.bg-blue-600]="!isLoadingEta(stop.stop)"
                  [class.text-white]="!isLoadingEta(stop.stop)"
                  [class.hover:bg-blue-700]="!isLoadingEta(stop.stop)"
                  [class.bg-stone-100]="isLoadingEta(stop.stop)"
                  [class.text-stone-900]="isLoadingEta(stop.stop)"
                  [class.cursor-not-allowed]="isLoadingEta(stop.stop)"
                >
                  {{ isLoadingEta(stop.stop) ? '...' : '到站時間' }}
                </button>
                @if (stop.lat && stop.long) {
                  <a
                    [href]="getMapUrl(stop.lat, stop.long)"
                    target="_blank"
                    rel="noopener"
                    class="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded hover:bg-amber-200 transition-colors text-center"
                  >
                    車站位置
                  </a>
                }
              </div>
            </div>

            <!-- ETA Display -->
            @if (etaMap[stop.stop]) {
              <div class="mt-3 pt-3 border-t border-stone-100">
                @if (etaMap[stop.stop]!.loading && !etaMap[stop.stop]!.data) {
                  <p class="text-sm text-stone-900 text-xs">查詢中...</p>
                } @else if (etaMap[stop.stop]!.data && etaMap[stop.stop]!.data!.length === 0) {
                  <p class="text-sm text-stone-900 text-xs">而家冇班車 (可能服務時間外)</p>
                } @else if (etaMap[stop.stop]!.data && etaMap[stop.stop]!.data!.length > 0) {
                  <div class="space-y-1.5">
                    @for (eta of etaMap[stop.stop]!.data!; track $index) {
                      <div class="flex items-center gap-2 text-sm">
                        <span class="text-green-600 font-medium">🚌 {{ formatEta(eta.eta!) }}</span>
                        <span class="text-xs text-stone-900">({{ formatTime(eta.eta!) }})</span>
                        @if (eta.rmk_tc) {
                          <span class="text-xs text-stone-900">{{ eta.rmk_tc }}</span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StopListComponent implements OnInit, OnDestroy {
  @Input() stops: NormalizedStop[] = [];
  @Input() route = '';
  @Input() serviceType = 1;
  @Input() company: Company = 'KMB';

  etaMap: Record<string, EtaState> = {};
  isRefreshing = false;
  private refreshInterval: any;
  private etaMapRef: Record<string, EtaState> = {};

  get hasAnyEta(): boolean {
    return Object.values(this.etaMap).some(s => s.lastUpdated !== null);
  }

  constructor(private api: KmbApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.etaMapRef = this.etaMap;
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => this.refreshAllEtas(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  isLoadingEta(stopId: string): boolean {
    return this.etaMap[stopId]?.loading || false;
  }

  formatEta(etaIso: string): string {
    const eta = new Date(etaIso);
    const now = new Date();
    const diffMs = eta.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return '即將到站';
    return `${diffMin} 分鐘後`;
  }

  formatTime(etaIso: string): string {
    const eta = new Date(etaIso);
    return eta.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' });
  }

  fetchEta(stop: NormalizedStop): void {
    // Update loading state immediately
    this.etaMap = Object.assign({}, this.etaMap, {
      [stop.stop]: { loading: true, data: this.etaMap[stop.stop]?.data || null, lastUpdated: this.etaMap[stop.stop]?.lastUpdated || null }
    });
    this.etaMapRef = this.etaMap;
    this.cdr.detectChanges();

    const eta$ = this.company === 'KMB'
      ? this.api.fetchKmbEta(stop.stop, this.route, this.serviceType)
      : this.api.fetchCtbEta(stop.stop, this.route, this.serviceType);

    eta$.subscribe({
      next: (etas: any[]) => {
        const validEtas: StopETA[] = etas
          .filter((e: any) => e.eta && e.eta.trim() !== '')
          .map((e: any) => ({
            stopId: stop.stop,
            route: this.route,
            serviceType: this.serviceType,
            eta: e.eta || null,
            eta_seq: e.eta_seq || 1,
            rmk_tc: e.rmk_tc || '',
          }))
          .sort((a, b) => new Date(a.eta!).getTime() - new Date(b.eta!).getTime());

        this.etaMap = Object.assign({}, this.etaMap, {
          [stop.stop]: { loading: false, data: validEtas, lastUpdated: Date.now() }
        });
        this.etaMapRef = this.etaMap;
        this.cdr.detectChanges();
      },
      error: () => {
        this.etaMap = Object.assign({}, this.etaMap, {
          [stop.stop]: { loading: false, data: [], lastUpdated: null }
        });
        this.etaMapRef = this.etaMap;
        this.cdr.detectChanges();
      }
    });
  }

  refreshAllEtas(): void {
    const activeIds = Object.entries(this.etaMapRef)
      .filter(([_, state]) => state.data !== null && !state.loading)
      .map(([id]) => id);
    if (activeIds.length === 0) return;

    this.isRefreshing = true;
    this.cdr.detectChanges();

    const refreshPromises = activeIds.map(stopId => {
      const stop = this.stops.find(s => s.stop === stopId);
      if (!stop) return Promise.resolve();

      const eta$ = this.company === 'KMB'
        ? this.api.fetchKmbEta(stopId, this.route, this.serviceType)
        : this.api.fetchCtbEta(stopId, this.route, this.serviceType);

      return new Promise<void>(resolve => {
        eta$.subscribe({
          next: (etas: any[]) => {
            const validEtas: StopETA[] = etas
              .filter((e: any) => e.eta && e.eta.trim() !== '')
              .map((e: any) => ({
                stopId,
                route: this.route,
                serviceType: this.serviceType,
                eta: e.eta || null,
                eta_seq: e.eta_seq || 1,
                rmk_tc: e.rmk_tc || '',
              }))
              .sort((a, b) => new Date(a.eta!).getTime() - new Date(b.eta!).getTime());

            this.etaMap = Object.assign({}, this.etaMap, {
              [stopId]: { loading: false, data: validEtas, lastUpdated: Date.now() }
            });
            this.etaMapRef = this.etaMap;
            resolve();
          },
          error: () => resolve()
        });
      });
    });

    Promise.all(refreshPromises).then(() => {
      this.isRefreshing = false;
      this.cdr.detectChanges();
    });
  }

  manualRefresh(): void {
    this.refreshAllEtas();
  }

  getMapUrl(lat: string, long: string): string {
    // Use Google Maps for web
    return `https://www.google.com/maps?q=${lat},${long}`;
  }
}
