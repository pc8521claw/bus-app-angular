import { Injectable } from '@angular/core';
import { FavoriteItem, RecentSearch, Company, Direction } from '../models/types';

const FAVORITES_KEY = 'kmb_favorites';
const RECENT_KEY = 'kmb_recent';

@Injectable({ providedIn: 'root' })
export class StorageService {
  getFavorites(): FavoriteItem[] {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Handle old format migration
      if (Array.isArray(parsed)) {
        // Old format: ['58M', '80X'], convert to new
        const newFormat: Record<string, boolean> = {};
        parsed.forEach((r: string) => { newFormat[`KMB-${r}`] = true; });
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFormat));
        return Object.entries(newFormat).map(([key]) => {
          const [company, route] = key.split('-');
          return { company: company as Company, route };
        });
      }
      return Object.entries(parsed as Record<string, boolean>).map(([key]) => {
        const [company, route] = key.split('-');
        return { company: company as Company, route };
      });
    } catch {
      return [];
    }
  }

  toggleFavorite(company: Company, route: string): void {
    const key = `${company}-${route}`;
    const favorites = this.getFavorites();
    const index = favorites.findIndex(f => f.company === company && f.route === route);
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push({ company, route });
    }
    const obj: Record<string, boolean> = {};
    favorites.forEach(f => { obj[`${f.company}-${f.route}`] = true; });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(obj));
  }

  isFavorite(company: Company, route: string): boolean {
    return this.getFavorites().some(f => f.company === company && f.route === route);
  }

  getRecent(): RecentSearch[] {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Handle old format migration
      if (Array.isArray(parsed)) {
        const newFormat: Record<string, RecentSearch> = {};
        parsed.forEach((r: string) => { newFormat[`KMB-${r}-${Date.now()}`] = { company: 'KMB', route: r, direction: 'outbound', timestamp: Date.now() }; });
        localStorage.setItem(RECENT_KEY, JSON.stringify(newFormat));
        return Object.values(newFormat).sort((a, b) => b.timestamp - a.timestamp);
      }
      return Object.values(parsed as Record<string, RecentSearch>).sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  addRecent(company: Company, route: string, direction: Direction): void {
    const key = `${company}-${route}-${direction}`;
    const recent = this.getRecent();
    // Remove existing entry for same route+direction
    const filtered = recent.filter(r => !(r.company === company && r.route === route && r.direction === direction));
    // Add new entry
    filtered.unshift({ company, route, direction, timestamp: Date.now() });
    // Keep only 12 most recent
    const trimmed = filtered.slice(0, 12);
    const obj: Record<string, RecentSearch> = {};
    trimmed.forEach(r => { obj[`${r.company}-${r.route}-${r.direction}`] = r; });
    localStorage.setItem(RECENT_KEY, JSON.stringify(obj));
  }
}
