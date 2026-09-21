import { Component, inject, OnInit } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { StationService } from '../../../core/services/station.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-station-selector',
  standalone: true,
  imports: [MatSelectModule, MatFormFieldModule, FormsModule],
  template: `
    <mat-form-field appearance="outline" class="station-field">
      <mat-select [ngModel]="stationService.selectedStation().id" (ngModelChange)="stationService.setStation($event)">
        @for (station of stationService.stations(); track station.id) {
          <mat-option [value]="station.id">{{ station.nombre }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: [`
    .station-field {
      width: 250px;
      margin-left: 16px;
      max-width: calc(100vw - 80px); /* Evitar que empuje otros elementos fuera de la pantalla en móvil */
    }
    
    /* Make the form field look cleaner in a toolbar */
    ::ng-deep .station-field .mdc-text-field--outlined {
      height: 48px;
    }
    ::ng-deep .station-field .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `]
})
export class StationSelectorComponent implements OnInit {
  stationService = inject(StationService);

  ngOnInit() {
    this.stationService.loadStations();
  }
}
