import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ScheduleSlot, ServiceHours, Direction } from '../models/types';

const API_BASE = 'https://kmb-backend-production.up.railway.app/api';

@Injectable({ providedIn: 'root' })
export class FareDataService {
  constructor(private http: HttpClient) {}

  async getFullFare(company: 'kmb' | 'ctb', route: string, direction: Direction, serviceType: string): Promise<string | null> {
    try {
      const fares: any[] = await this.http.get<any[]>(`${API_BASE}/fares/${route}`, { params: { company } }).toPromise() || [];
      if (fares.length === 0) return null;
      const maxFare = Math.max(...fares.map(f => f.fare).filter(f => f && !isNaN(f)));
      return maxFare > 0 ? maxFare.toFixed(2) : null;
    } catch {
      return null;
    }
  }

  async getServiceHours(company: 'kmb' | 'ctb', route: string, direction: Direction, serviceType: string): Promise<ServiceHours | null> {
    try {
      const freqs: any[] = await this.http.get<any[]>(`${API_BASE}/service-hours/${route}`, { params: { company } }).toPromise() || [];
      if (freqs.length === 0) return null;
      
      // Filter by direction (O=outbound, I=inbound)
      const bound = direction === 'outbound' ? 'O' : 'I';
      const filtered = freqs.filter(f => f.bound === bound);
      
      if (filtered.length === 0) return null;
      
      // Extract times
      const times = filtered.map(f => f.start_time).filter(Boolean).sort();
      const endTimes = filtered.map(f => f.end_time).filter(Boolean).sort();
      
      return {
        firstBus: times[0] || '00:00',
        lastBus: endTimes[endTimes.length - 1] || '00:00',
      };
    } catch {
      return null;
    }
  }

  async getSchedule(company: 'kmb' | 'ctb', route: string, direction: Direction, serviceType: string): Promise<ScheduleSlot[]> {
    try {
      const freqs: any[] = await this.http.get<any[]>(`${API_BASE}/service-hours/${route}`, { params: { company } }).toPromise() || [];
      if (freqs.length === 0) return [];
      
      const bound = direction === 'outbound' ? 'O' : 'I';
      const filtered = freqs.filter(f => f.bound === bound);
      
      const slots: ScheduleSlot[] = filtered
        .filter(f => f.start_time && f.end_time && f.headway)
        .map(f => ({
          startTime: f.start_time,
          endTime: f.end_time,
          frequencyMin: Math.round(f.headway / 60),
        }))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      // Deduplicate by startTime
      const seen = new Set<string>();
      return slots.filter(slot => {
        if (seen.has(slot.startTime)) return false;
        seen.add(slot.startTime);
        return true;
      });
    } catch {
      return [];
    }
  }
}
