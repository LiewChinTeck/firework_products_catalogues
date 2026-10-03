import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogueService } from '../services/catalogue.service';
@Component({selector:'app-admin',imports:[RouterLink],templateUrl:'./admin.html',styleUrl:'./admin.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class Admin {
 readonly catalogue = inject(CatalogueService);
 readonly adultCount = computed(() => this.catalogue.products().filter(p => p.category === 'adult').length);
 readonly kidCount = computed(() => this.catalogue.products().filter(p => p.category === 'kid').length);
}
