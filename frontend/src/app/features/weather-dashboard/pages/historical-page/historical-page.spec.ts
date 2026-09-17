import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoricalPage } from './historical-page';

describe('HistoricalPage', () => {
  let component: HistoricalPage;
  let fixture: ComponentFixture<HistoricalPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalPage],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoricalPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
