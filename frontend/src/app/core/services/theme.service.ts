import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Servicio encargado de la gestión del Tema de la aplicación (Claro/Oscuro).
 * Sincroniza el estado mediante un Signal y persiste la selección del usuario en el localStorage.
 * Por defecto, delega a las preferencias del sistema (`prefers-color-scheme`).
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  /** Signal reactivo que emite `true` si el modo oscuro está activo, y `false` en caso contrario. */
  isDark = signal<boolean>(false);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        this.setDarkTheme(true);
      }
    }
  }

  /**
   * Alterna el tema actual de la aplicación entre Claro y Oscuro.
   */
  toggleTheme() {
    this.setDarkTheme(!this.isDark());
  }

  private setDarkTheme(dark: boolean) {
    this.isDark.set(dark);
    if (this.isBrowser) {
      if (dark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
    }
  }
}
