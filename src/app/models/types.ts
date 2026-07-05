export type Company = 'KMB' | 'CTB';
export type Direction = 'outbound' | 'inbound';

export interface RouteSearchResult {
  company: Company;
  route: string;
  orig_tc: string;
  dest_tc: string;
}

export interface NormalizedRouteInfo {
  route: string;
  bound: 'I' | 'O';
  orig_tc: string;
  orig_en: string;
  dest_tc: string;
  dest_en: string;
  service_type: string;
}

export interface NormalizedStop {
  route: string;
  bound: 'I' | 'O';
  service_type: string;
  seq: string;
  stop: string;
  name_tc: string;
  name_en: string;
  lat: string;
  long: string;
}

export interface StopETA {
  company: Company;
  stopId: string;
  route: string;
  serviceType: number;
  eta: string | null;
  eta_seq: number;
}

export interface FavoriteItem {
  company: Company;
  route: string;
}

export interface RecentSearch {
  company: Company;
  route: string;
  direction: Direction;
  timestamp: number;
}

export interface ScheduleSlot {
  startTime: string;
  endTime: string;
  frequencyMin: number;
}

export interface ServiceHours {
  firstBus: string;
  lastBus: string;
}
