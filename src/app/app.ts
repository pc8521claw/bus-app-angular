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
          <a routerLink="/" class="text-xl font-bold text-stone-900">
            🚌 巴士搜尋
          </a>
          
          <!-- Tab Switcher -->
          <div class="flex items-center bg-blue-100 rounded-lg p-1">
            <a 
              routerLink="/" 
              routerLinkActive="bg-blue-600 text-white shadow-sm" 
              [routerLinkActiveOptions]="{exact: true}"
              class="px-4 py-2 text-base font-medium rounded-md transition-all text-blue-600 hover:text-blue-800"
              [class.bg-blue-600]="true"
              [class.text-white]="true"
              [class.hover:text-white]="true"
            >
              搜尋
            </a>
            <a 
              routerLink="/announcements" 
              routerLinkActive="bg-blue-600 text-white shadow-sm"
              class="px-4 py-2 text-base font-medium rounded-md transition-all text-blue-600 hover:text-blue-800"
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
