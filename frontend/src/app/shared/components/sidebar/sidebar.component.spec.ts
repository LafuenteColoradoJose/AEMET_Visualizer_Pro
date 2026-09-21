import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), provideAnimationsAsync(), provideHttpClient()]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should closeOnMobile', () => {
    component.sidenav = { close: vi.fn() } as any;
    component.isMobile.set(true);
    component.closeOnMobile();
    expect(component.sidenav.close).toHaveBeenCalled();

    (component.sidenav.close as any).mockClear();
    component.isMobile.set(false);
    component.closeOnMobile();
    expect(component.sidenav.close).not.toHaveBeenCalled();
  });
});
