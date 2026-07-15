import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { KmbApiService } from '../../services/kmb-api.service';
import { FareDataService } from '../../services/fare-data.service';
import { StorageService } from '../../services/storage.service';
import { StopListComponent } from '../../components/stop-list/stop-list.component';
import { NormalizedRouteInfo, NormalizedStop, Company, Direction, ScheduleSlot, ServiceHours } from '../../models/types';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-route',
  standalone: true,
  imports: [CommonModule, RouterLink, StopListComponent],
  template: `
    <main class="flex-1 flex flex-col px-4 py-6 sm:py-8">
      <div class="w-full max-w-2xl mx-auto">
        <!-- Back link -->
        <a
          routerLink="/"
          class="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-white border border-stone-300 text-stone-700 text-sm font-medium rounded-lg shadow-sm hover:border-blue-400 hover:text-blue-600 hover:shadow transition-all"
        >
          <span>←</span>
          <span>返回搜尋</span>
        </a>

        @if (loading) {
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6 mb-4 text-center">
            <p class="text-stone-900">載入中...</p>
          </div>
        } @else if (notFound) {
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6 mb-4 text-center">
            <h1 class="text-2xl font-bold mb-3">搵唔到路線 {{ route }}</h1>
            <p class="text-stone-900 mb-6">請檢查路線號碼，或者試下其他方向。</p>
            <a
              routerLink="/"
              class="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回搜尋
            </a>
          </div>
        } @else if (routeInfo) {
          <!-- Debug (hidden) -->
          <!-- <button (click)="loadFareData()" class="hidden"></button> -->
          <!-- Route Header -->
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6 mb-4">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <span
                    class="inline-block px-2.5 py-1 text-xs font-medium rounded"
                    [class.bg-amber-100]="company === 'KMB'"
                    [class.text-amber-800]="company === 'KMB'"
                    [class.bg-blue-100]="company === 'CTB'"
                    [class.text-blue-700]="company === 'CTB'"
                  >
                    {{ company }}
                  </span>
                  <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">
                    路缐 {{ routeInfo.route }}
                  </h1>
                  <button
                    (click)="toggleFavorite()"
                    class="inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all text-xl"
                    [class.bg-yellow-300]="isFavorite"
                    [class.text-yellow-900]="isFavorite"
                    [class.hover-bg-yellow-400]="isFavorite"
                    [class.ring-2]="isFavorite"
                    [class.ring-yellow-400]="isFavorite"
                    [class.shadow-sm]="isFavorite"
                    [class.bg-stone-100]="!isFavorite"
                    [class.text-stone-400]="!isFavorite"
                    [class.hover-bg-stone-200]="!isFavorite"
                    [class.hover-text-yellow-500]="!isFavorite"
                  >
                    {{ isFavorite ? '★' : '☆' }}
                  </button>
                </div>
                <div class="flex items-center gap-2">
                  <span class="inline-block px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded">
                    {{ dirText }} · {{ dirEn }}
                  </span>
                  <a
                    [href]="'/route/' + routeInfo.route + '/' + (routeInfo.bound === 'O' ? 'inbound' : 'outbound') + '?company=' + company"
                    (click)="changeDirection($event)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded hover:bg-red-100 transition-colors"
                  >
                    <span>↔</span>
                    <span>改變方向</span>
                  </a>
                </div>
              </div>
              <div class="text-right text-sm">
                <div class="text-stone-900">服務類型</div>
                <div class="font-medium">
                  {{ routeInfo.service_type === '1' ? '常規' : '特別' }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div class="flex items-start gap-2">
                <span class="text-stone-900 shrink-0">起點</span>
                <div>
                  <div class="font-medium">{{ routeInfo.orig_tc }}</div>
                  <div class="text-stone-900 text-xs">{{ routeInfo.orig_en }}</div>
                </div>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-stone-900 shrink-0">終點</span>
                <div>
                  <div class="font-medium">{{ routeInfo.dest_tc }}</div>
                  <div class="text-stone-900 text-xs">{{ routeInfo.dest_en }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Fare & Schedule Section -->
          @if (fullFare || schedule) {
            <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6 mb-4">
              <h2 class="text-base font-semibold mb-4 flex items-center gap-2">
                <span>💰</span>
                <span>車費及服務時間</span>
              </h2>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <!-- Full Fare -->
                <div class="bg-stone-50 rounded-lg p-4">
                  <div class="text-stone-900 text-xs mb-1">全程車費</div>
                  @if (fullFare) {
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs text-stone-900">HK$</span>
                      <span class="text-2xl font-bold">{{ fullFare }}</span>
                    </div>
                  } @else {
                    <div class="text-stone-900 text-sm">暫無車費資料</div>
                  }
                  <div class="text-xs text-stone-900 mt-1">
                    八達通 / 現金 · 不設找續
                  </div>
                </div>

                <!-- Service Hours -->
                <div class="bg-stone-50 rounded-lg p-4">
                  <div class="text-stone-900 text-xs mb-1">服務時間</div>
                  @if (serviceHours) {
                    <div class="flex items-baseline gap-2">
                      <span class="text-base font-medium">{{ serviceHours.firstBus }}</span>
                      <span class="text-stone-900 text-xs">至</span>
                      <span class="text-base font-medium">{{ serviceHours.lastBus }}</span>
                    </div>
                  } @else {
                    <div class="text-stone-900 text-sm">暫無資料</div>
                  }
                  <div class="text-xs text-stone-900 mt-1">首班車 → 尾班車</div>
                </div>
              </div>

              <!-- Schedule Table -->
              @if (schedule && schedule.length > 0) {
                <details class="mt-4">
                  <summary class="text-sm font-medium cursor-pointer text-stone-700 hover:text-blue-600 select-none">
                    📅 詳細班次表 ({{ schedule.length }} 個時段)
                  </summary>
                  <div class="mt-3 max-h-64 overflow-y-auto border border-stone-200 rounded-lg">
                    <table class="w-full text-sm">
                      <thead class="bg-stone-100 sticky top-0">
                        <tr>
                          <th class="text-left px-3 py-2 font-medium text-stone-700">由</th>
                          <th class="text-left px-3 py-2 font-medium text-stone-700">至</th>
                          <th class="text-right px-3 py-2 font-medium text-stone-700">班次</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (slot of schedule; track slot.startTime) {
                          <tr class="border-t border-stone-100">
                            <td class="px-3 py-2 font-mono">{{ slot.startTime }}</td>
                            <td class="px-3 py-2 font-mono">{{ slot.endTime }}</td>
                            <td class="px-3 py-2 text-right">每 {{ slot.frequencyMin }} 分鐘</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </details>
              }
            </div>
          }

          <!-- Stops Section -->
          <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6">
            <h2 class="text-base font-semibold mb-4 flex items-center gap-2">
              <span>途經站點</span>
              <span class="text-xs text-stone-900 font-normal">({{ stops.length }} 站)</span>
            </h2>

            @if (stops.length === 0) {
              <p class="text-stone-900 text-sm text-center py-8">
                此路線暫無站點資料
              </p>
            } @else {
              <app-stop-list
                [stops]="stops"
                [route]="routeInfo.route"
                [serviceType]="routeInfo.service_type === '2' ? 2 : 1"
                [company]="company"
                (toggleFavorite)="toggleFavorite()"
              ></app-stop-list>
            }
          </div>

          <!-- Footer -->
          <div class="mt-8 text-center text-xs text-stone-900 opacity-50 space-y-0.5">
            <div>即時班次：{{ company === 'KMB' ? '九巴開放數據 API' : '城巴開放數據 API' }}</div>
            <div>車費及服務時間：hk-bus-crawling</div>
          </div>
        }
      </div>
    </main>
  `
})
export class RouteComponent implements OnInit, OnDestroy {
  route = '';
  direction: Direction = 'outbound';
  company: Company = 'KMB';
  routeInfo: NormalizedRouteInfo | null = null;
  stops: NormalizedStop[] = [];
  loading = true;
  notFound = false;
  isFavorite = false;
  fullFare: string | null = null;
  schedule: ScheduleSlot[] = [];
  serviceHours: ServiceHours | null = null;
  dirText = '';
  dirEn = '';

  private sub: Subscription | null = null;

  constructor(
    private routeAct: ActivatedRoute,
    private router: Router,
    private api: KmbApiService,
    private fareData: FareDataService,
    private storage: StorageService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    this.sub = this.routeAct.params.subscribe(async params => {
      this.route = params['route'];
      this.direction = params['direction'] as Direction;
      this.company = ((this.routeAct.snapshot.queryParams['company'] as string) || 'KMB').toUpperCase() as Company;
      this.fullFare = null;
      this.schedule = [];
      this.serviceHours = null;

      // Validate direction
      if (this.direction !== 'inbound' && this.direction !== 'outbound') {
        this.notFound = true;
        this.loading = false;
        return;
      }

      // Check favorite status
      this.isFavorite = this.storage.isFavorite(this.company, this.route);

      // Add to recent
      this.storage.addRecent(this.company, this.route, this.direction);

      // Fetch route info and stops
      this.loadRoute();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadRoute(): void {
    this.loading = true;
    this.notFound = false;


    if (this.company === 'KMB') {
      this.api.fetchKmbRouteInfo(this.route, this.direction).pipe(
        switchMap(routeInfo => {
          if (!routeInfo) {
            this.notFound = true;
            this.loading = false;
            return of(null);
          }
          this.routeInfo = routeInfo;
          this.updateDirectionText();
          return this.api.fetchKmbStopsWithNames(this.route, this.direction).pipe(
            switchMap(stops => {
              this.stops = stops || [];
              // Fetch stop names
              if (this.stops.length === 0) {
                return of([]);
              }
              const stopNameRequests = this.stops.map(stop =>
                this.api.fetchKmbStopInfo(stop.stop).pipe(
                  catchError(() => of(null))
                )
              );
              return forkJoin(stopNameRequests);
            })
          );
        })
      ).subscribe({
        next: (stopInfos) => {

          // Run outside Angular zone to avoid triggering change detection on every forEach iteration
          this.zone.runOutsideAngular(() => {
            if (stopInfos && this.stops.length > 0) {
              stopInfos.forEach((info: any, i: number) => {
                if (info) {
                  this.stops[i].name_tc = info.name_tc || info.name?.zh || '';
                  this.stops[i].name_en = info.name_en || info.name?.en || '';
                  this.stops[i].lat = info.lat || '';
                  this.stops[i].long = info.long || '';
                }
              });
            }
            // Re-enter zone to trigger change detection
            this.zone.run(async () => {
              await this.loadFareData();
              this.loading = false;
              this.cdr.detectChanges();

            });
          });
        },
        error: (err) => {

          this.zone.run(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      // CTB
      this.api.fetchCtbRouteInfo(this.route).pipe(
        switchMap(ctbInfo => {
          if (!ctbInfo) {
            this.notFound = true;
            this.loading = false;
            this.cdr.detectChanges();
            return of(null);
          }
          const isInbound = this.direction === 'inbound';
          this.routeInfo = {
            route: ctbInfo.route,
            bound: isInbound ? 'I' : 'O',
            orig_tc: isInbound ? ctbInfo.dest_tc : ctbInfo.orig_tc,
            orig_en: isInbound ? ctbInfo.dest_en : ctbInfo.orig_en,
            dest_tc: isInbound ? ctbInfo.orig_tc : ctbInfo.dest_tc,
            dest_en: isInbound ? ctbInfo.orig_en : ctbInfo.dest_en,
            service_type: '1',
          };
          this.updateDirectionText();
          return this.api.fetchCtbStopsWithNames(this.route, this.direction);
        })
      ).subscribe({
        next: async (stops) => {
          this.stops = stops || [];
          if (this.stops.length === 0) {
            await this.loadFareData();
            this.loading = false;
            this.cdr.detectChanges();
            return;
          }
          const stopNameRequests = this.stops.map(stop =>
            this.api.fetchCtbStopInfo(stop.stop).pipe(
              catchError(() => of(null))
            )
          );
          if (stopNameRequests.length > 0) {
            forkJoin(stopNameRequests).subscribe(async (stopInfos: any[]) => {
              stopInfos.forEach((info, i) => {
                if (info) {
                  this.stops[i].name_tc = info.name_tc || '';
                  this.stops[i].name_en = info.name_en || '';
                  this.stops[i].lat = info.lat || '';
                  this.stops[i].long = info.long || '';
                }
              });
              await this.loadFareData();
              this.loading = false;
              this.cdr.detectChanges();
            });
          } else {
            await this.loadFareData();
            this.loading = false;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {

          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private fareRetryCount = 0;
  private maxFareRetries = 3;

  async loadFareData(): Promise<void> {
    if (!this.routeInfo) return;
    
    const fareCompany = this.company.toLowerCase() as 'kmb' | 'ctb';
    const route = this.route;
    const direction = this.direction;
    const serviceType = this.routeInfo?.service_type || '1';
    
    try {
      const [fullFare, schedule, serviceHours] = await Promise.all([
        this.fareData.getFullFare(fareCompany, route, direction, serviceType),
        this.fareData.getSchedule(fareCompany, route, direction, serviceType),
        this.fareData.getServiceHours(fareCompany, route, direction, serviceType)
      ]);
      
      this.fullFare = fullFare;
      this.schedule = schedule;
      this.serviceHours = serviceHours;
      this.fareRetryCount = 0;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Fare load error:', err);
      this.fareRetryCount++;
      if (this.fareRetryCount < this.maxFareRetries) {
        setTimeout(() => this.loadFareData(), 1000 * this.fareRetryCount);
      }
    }
  }

  updateDirectionText(): void {
    if (!this.routeInfo) return;
    if (this.routeInfo.bound === 'O') {
      this.dirText = '出市區';
      this.dirEn = 'Outbound';
    } else {
      this.dirText = '入郊區';
      this.dirEn = 'Inbound';
    }
  }

  toggleFavorite(): void {
    this.storage.toggleFavorite(this.company, this.route);
    this.isFavorite = !this.isFavorite;
  }

  changeDirection(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/route', this.routeInfo!.route, this.routeInfo!.bound === 'O' ? 'inbound' : 'outbound'], {
      queryParams: { company: this.company }
    });
  }
}
