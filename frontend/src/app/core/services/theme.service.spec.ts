import { describe, it, expect, beforeEach, afterEach, vitest } from "vitest";
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-mode');
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vitest.fn().mockImplementation(query => ({
        matches: false,
      })),
    });
  });

  afterEach(() => {
    vitest.restoreAllMocks();
  });

  it('should be created in light mode by default if no localStorage and no matchMedia', () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(false);
  });

  it('should load dark mode if localStorage has dark', () => {
    localStorage.setItem('theme', 'dark');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(true);
    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });

  it('should load dark mode if prefers-color-scheme is dark', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vitest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
      })),
    });
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(true);
  });

  it('should toggle theme', () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(false);
    service.toggleTheme();
    expect(service.isDark()).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    
    service.toggleTheme();
    expect(service.isDark()).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  it('should not throw if not in browser', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
    service = TestBed.inject(ThemeService);
    expect(service.isDark()).toBe(false);
    service.toggleTheme(); // Should run without crashing and not touch DOM/localStorage
    expect(service.isDark()).toBe(true);
  });
});
