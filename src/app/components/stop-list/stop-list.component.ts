import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KmbApiService } from '../../services/kmb-api.service';
import { NormalizedStop, Company } from '../../models/types';

interface StopETA {
  stopId: string;
  route: string;
  serviceType: number;
  eta: string | null;
  eta_seq: number;
}

@Component({
  selector: 'app-stop-list',
  standalone: true,
  imports: [CommonModule],
  template: `
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
                class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                {{ isLoadingEta(stop.stop) ? '載入中...' : '到站時間' }}
              </button>
              @if (stop.lat && stop.long) {
                <a
                  [href]="getMapUrl(stop.lat, stop.long, stop.name_tc)"
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
              @if (etaMap[stop.stop].length === 0) {
                <p class="text-sm text-stone-900 opacity-70">而家冇班車 (可能服務時間外)</p>
              } @else {
                <div class="space-y-1.5">
                  @for (eta of etaMap[stop.stop]; track eta.eta_seq) {
                    <div class="flex items-center gap-2 text-sm">
                      <span class="text-stone-900 font-medium">{{ eta.eta }}</span>
                      @if (eta.eta_seq > 1) {
                        <span class="text-xs text-stone-900 opacity-60">(第 {{ eta.eta_seq }} 班)</span>
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
  @Output() toggleFavorite = new EventEmitter<void>();

  etaMap: Record<string, StopETA[]> = {};
  loadingStops: Set<string> = new Set();
  private refreshInterval: any;

  constructor(private api: KmbApiService) {}

  ngOnInit(): void {
    // Auto-refresh ETAs every 30 seconds
    this.refreshInterval = setInterval(() => this.refreshAllEtas(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  isLoadingEta(stopId: string): boolean {
    return this.loadingStops.has(stopId);
  }

  fetchEta(stop: NormalizedStop): void {
    this.loadingStops.add(stop.stop);
    this.etaMap[stop.stop] = [];

    const eta$ = this.company === 'KMB'
      ? this.api.fetchKmbEta(stop.stop, stop.route, this.serviceType)
      : this.api.fetchCtbEta(stop.stop, stop.route, this.serviceType);

    eta$.subscribe({
      next: (etas: any[]) => {
        const mapped: StopETA[] = etas.map((e: any) => ({
          stopId: stop.stop,
          route: stop.route,
          serviceType: this.serviceType,
          eta: e.eta || e.eta_t || null,
          eta_seq: e.eta_seq || 1,
        })).filter((e: StopETA) => e.eta);
        this.etaMap[stop.stop] = mapped;
        this.loadingStops.delete(stop.stop);
      },
      error: () => {
        this.etaMap[stop.stop] = [];
        this.loadingStops.delete(stop.stop);
      }
    });
  }

  refreshAllEtas(): void {
    this.stops.forEach(stop => {
      if (this.etaMap[stop.stop]) {
        this.fetchEta(stop);
      }
    });
  }

  getMapUrl(lat: string, long: string, name: string): string {
    // Use Google Maps for web
    return `https://www.google.com/maps?q=${lat},${long}`;
  }
}
