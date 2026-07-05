import { Injectable } from '@angular/core';
import { ScheduleSlot, ServiceHours, Direction } from '../models/types';

interface FareData {
  holidays: string[];
  routeList: Record<string, any>;
  serviceDayMap: Record<string, string[]>;
  stopList: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class FareDataService {
  private data: FareData | null = null;

  async loadData(): Promise<void> {
    if (this.data) return;
    try {
      const response = await fetch('/assets/data/routeFareList.min.json');
      this.data = await response.json();
    } catch (e) {
      console.error('Failed to load fare data', e);
    }
  }

  getFullFare(company: 'kmb' | 'ctb', route: string, direction: Direction, serviceType: string): string | null {
    if (!this.data) return null;
    const bound = direction === 'outbound' ? 'O' : 'I';
    const entry = this.findEntry(company, route, bound, serviceType);
    if (!entry || !entry.fares || entry.fares.length === 0) return null;
    const maxFare = Math.max(...entry.fares.filter((f: string) => f).map((f: string) => parseFloat(f)));
    return isNaN(maxFare) ? null : maxFare.toFixed(2);
  }

  getServiceHours(company: 'kmb' | 'ctb', route: string, direction: Direction, serviceType: string): ServiceHours | null {
    const schedule = this.getSchedule(company, route, direction, serviceType);
    if (!schedule || schedule.length === 0) return null;
    return {
      firstBus: schedule[0].startTime,
      lastBus: schedule[schedule.length - 1].endTime,
    };
  }

  getSchedule(company: 'kmb' | 'ctb', route: string, direction: Direction, serviceType: string): ScheduleSlot[] {
    if (!this.data) return [];
    const bound = direction === 'outbound' ? 'O' : 'I';
    const entry = this.findEntry(company, route, bound, serviceType);
    if (!entry || !entry.freq) return [];

    const slots: ScheduleSlot[] = [];
    for (const serviceDayId of Object.keys(entry.freq)) {
      const serviceDayFreq = entry.freq[serviceDayId];
      for (const startTime of Object.keys(serviceDayFreq)) {
        const value = serviceDayFreq[startTime];
        // Handle null values
        if (!value || !Array.isArray(value) || value.length !== 2) continue;
        const [endTime, freq] = value;
        if (typeof endTime !== 'string') continue;
        const freqSec = typeof freq === 'number' ? freq : (typeof freq === 'string' ? parseInt(freq, 10) : NaN);
        if (isNaN(freqSec)) continue;
        slots.push({
          startTime,
          endTime,
          frequencyMin: Math.round(freqSec / 60),
        });
      }
    }

    // Sort by start time
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Deduplicate by startTime
    const seen = new Set<string>();
    return slots.filter(slot => {
      if (seen.has(slot.startTime)) return false;
      seen.add(slot.startTime);
      return true;
    });
  }

  private findEntry(company: 'kmb' | 'ctb', route: string, bound: 'O' | 'I', serviceType: string) {
    if (!this.data) return null;
    for (const entry of Object.values(this.data.routeList)) {
      if (
        entry.route === route &&
        entry.co?.includes(company) &&
        entry.bound?.[company] === bound &&
        String(entry.serviceType) === String(serviceType)
      ) {
        return entry;
      }
    }
    return null;
  }
}
