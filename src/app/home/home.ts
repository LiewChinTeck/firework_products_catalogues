import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categories, CategoryId } from '../data/products';
import { CatalogueService } from '../services/catalogue.service';

@Component({selector:'app-home',imports:[RouterLink],templateUrl:'./home.html',styleUrl:'./home.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class Home {
 readonly catalogue = inject(CatalogueService);
 readonly categories = categories;
 readonly failedImages = signal<ReadonlySet<CategoryId>>(new Set());
 readonly counts = computed(() => {
  const counts:Partial<Record<CategoryId,number>> = {};
  for (const product of this.catalogue.products()) counts[product.category] = (counts[product.category] ?? 0) + 1;
  return counts;
 });
 imageFailed(id:CategoryId):void { this.failedImages.update(ids => new Set([...ids,id])); }
}