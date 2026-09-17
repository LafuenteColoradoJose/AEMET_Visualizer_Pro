import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YearlyPage } from './yearly-page';

describe('YearlyPage', () => {
  let component: YearlyPage;
  let fixture: ComponentFixture<YearlyPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YearlyPage],
    }).compileComponents();

    fixture = TestBed.createComponent(YearlyPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
