import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { NormalizedRouteInfo, NormalizedStop, Direction } from '../models/types';

@Injectable({ providedIn: 'root' })
export class KmbApiService {
  private readonly KMB_BASE = 'https://data.etabus.gov.hk/v1/transport/kmb';
  private readonly CTB_BASE = 'https://rt.data.gov.hk/v2/transport/citybus';

  constructor(private http: HttpClient) {}

  // KMB Route Info
  fetchKmbRouteInfo(route: string, direction: Direction): Observable<NormalizedRouteInfo | null> {
    const bound = direction === 'outbound' ? 'O' : 'I';
    const url = `${this.KMB_BASE}/route/${route}/${bound}/1`;
    return this.http.get<any>(url).pipe(
      map(json => {
        if (!json.data || Object.keys(json.data).length === 0) return null;
        const d = json.data;
        return {
          route: d.route,
          bound: d.bound as 'I' | 'O',
          orig_tc: d.orig_tc,
          orig_en: d.orig_en,
          dest_tc: d.dest_tc,
          dest_en: d.dest_en,
          service_type: d.service_type,
        };
      })
    );
  }

  // KMB Route Stops
  fetchKmbRouteStops(route: string, direction: Direction): Observable<any[]> {
    const bound = direction === 'outbound' ? 'O' : 'I';
    const url = `${this.KMB_BASE}/route-stop/${route}/${bound}/1`;
    return this.http.get<any>(url).pipe(map(json => json.data || []));
  }

  // KMB Stop Info
  fetchKmbStopInfo(stopId: string): Observable<any> {
    const url = `${this.KMB_BASE}/stop/${stopId}`;
    return this.http.get<any>(url).pipe(map(json => json.data));
  }

  // KMB Stops with Names
  fetchKmbStopsWithNames(route: string, direction: Direction): Observable<NormalizedStop[]> {
    const bound: 'O' | 'I' = direction === 'outbound' ? 'O' : 'I';
    return this.fetchKmbRouteStops(route, direction).pipe(
      map(stops => stops.map((s: any): NormalizedStop => ({
        route,
        bound,
        service_type: '1',
        seq: String(s.seq),
        stop: s.stop,
        name_tc: '',
        name_en: '',
        lat: '',
        long: '',
      })))
    );
  }

  // KMB ETA
  fetchKmbEta(stopId: string, route: string, serviceType: number = 1): Observable<any[]> {
    const url = `${this.KMB_BASE}/eta/${stopId}/${route}/${serviceType}`;
    return this.http.get<any>(url).pipe(map(json => json.data || []));
  }

  // CTB Route Info
  fetchCtbRouteInfo(route: string): Observable<any | null> {
    const url = `${this.CTB_BASE}/route/CTB/${route}`;
    return this.http.get<any>(url).pipe(
      map(json => {
        const data = json.data;
        if (!data || data.length === 0) return null;
        return data[0];
      })
    );
  }

  // CTB Route Stops
  fetchCtbRouteStops(route: string, direction: Direction): Observable<any[]> {
    const dir = direction === 'outbound' ? 'O' : 'I';
    const url = `${this.CTB_BASE}/route-stop/CTB/${route}/${dir}`;
    return this.http.get<any>(url).pipe(map(json => json.data || []));
  }

  // CTB Stop Info
  fetchCtbStopInfo(stopId: string): Observable<any> {
    const url = `${this.CTB_BASE}/stop/${stopId}`;
    return this.http.get<any>(url).pipe(map(json => json.data));
  }

  // CTB Stops with Names
  fetchCtbStopsWithNames(route: string, direction: Direction): Observable<NormalizedStop[]> {
    const bound: 'O' | 'I' = direction === 'outbound' ? 'O' : 'I';
    return this.fetchCtbRouteStops(route, direction).pipe(
      map(stops => stops.map((s: any): NormalizedStop => ({
        route,
        bound,
        service_type: '1',
        seq: String(s.seq),
        stop: s.stop,
        name_tc: '',
        name_en: '',
        lat: '',
        long: '',
      })))
    );
  }

  // CTB ETA
  fetchCtbEta(stopId: string, route: string, serviceType: number = 1): Observable<any[]> {
    const url = `${this.CTB_BASE}/eta/CTB/${stopId}/${route}`;
    return this.http.get<any>(url).pipe(map(json => json.data || []));
  }

  // Check Route exists (KMB + CTB parallel)
  checkRoute(route: string, direction: Direction): Observable<{ company: 'KMB' | 'CTB'; route: string; orig_tc: string; dest_tc: string }[]> {
    const results: { company: 'KMB' | 'CTB'; route: string; orig_tc: string; dest_tc: string }[] = [];

    return new Observable(observer => {
      let completed = 0;
      const checkDone = () => {
        completed++;
        if (completed === 2) {
          observer.next(results);
          observer.complete();
        }
      };

      this.fetchKmbRouteInfo(route, direction).subscribe({
        next: data => {
          if (data) results.push({ company: 'KMB', route, orig_tc: data.orig_tc, dest_tc: data.dest_tc });
          checkDone();
        },
        error: () => checkDone(),
      });

      this.fetchCtbRouteInfo(route).subscribe({
        next: data => {
          if (data) results.push({ company: 'CTB', route, orig_tc: data.orig_tc, dest_tc: data.dest_tc });
          checkDone();
        },
        error: () => checkDone(),
      });
    });
  }
}
