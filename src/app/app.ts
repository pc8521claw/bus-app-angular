import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="min-h-screen bg-stone-50 flex flex-col">
      <!-- Header -->
      <header class="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div class="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <a routerLink="/" class="text-lg font-bold text-stone-900">
            🚌 巴士搜尋
          </a>
          
          <!-- Tab Switcher -->
          <div class="flex items-center bg-stone-100 rounded-lg p-1">
            <a 
              routerLink="/" 
              routerLinkActive="bg-white shadow-sm text-stone-900" 
              [routerLinkActiveOptions]="{exact: true}"
              class="px-3 py-1.5 text-sm font-medium rounded-md transition-all text-stone-600 hover:text-stone-900"
            >
              搜尋
            </a>
            <a 
              routerLink="/announcements" 
              routerLinkActive="bg-white shadow-sm text-stone-900"
              class="px-3 py-1.5 text-sm font-medium rounded-md transition-all text-stone-600 hover:text-stone-900"
            >
              公告
            </a>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class App {}
