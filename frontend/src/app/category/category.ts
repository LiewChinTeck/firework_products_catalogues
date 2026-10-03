import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { categories, Product } from '../data/products';
import { CatalogueService } from '../services/catalogue.service';
@Component({selector:'app-category',imports:[RouterLink],templateUrl:'./category.html',styleUrl:'./category.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class Category {
 readonly catalogue = inject(CatalogueService);
 private readonly document = inject(DOCUMENT);
 private readonly route = inject(ActivatedRoute);
 private readonly params = toSignal(this.route.paramMap,{initialValue:this.route.snapshot.paramMap});
 readonly collection = computed(() => categories.find(c => c.id === this.params().get('category')));
 readonly query = signal('');
 readonly sort = signal('name');
 readonly page = signal(1);
 readonly pageSize = 10;
 readonly selected = signal<Product | null>(null);
 readonly videoError = signal(false);
 readonly playbackBlocked = signal(false);
 readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('playerDialog');
 readonly player = viewChild.required<ElementRef<HTMLVideoElement>>('player');
 private restoreScroll: (() => void) | null = null;
 readonly filtered = computed(() => {
  const query = this.query().trim().toLocaleLowerCase();
  return this.catalogue.products().filter(p => p.category === this.collection()?.id && p.name.toLocaleLowerCase().includes(query)).sort((a,b) => this.sort() === 'name-desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
 });
 readonly pages = computed(() => Math.max(1,Math.ceil(this.filtered().length / this.pageSize)));
 readonly currentPage = computed(() => Math.min(this.page(),this.pages()));
 readonly visible = computed(() => this.filtered().slice((this.currentPage()-1)*this.pageSize,this.currentPage()*this.pageSize));
 constructor() { inject(DestroyRef).onDestroy(() => { this.player()?.nativeElement.pause(); this.unlockScroll(); }); }
 search(value: string): void { this.query.set(value); this.page.set(1); }
 open(product: Product): void {
  this.selected.set(product); this.videoError.set(false); this.playbackBlocked.set(false);
  const video = this.player().nativeElement;
  video.pause(); video.muted = false;
  if (product.video) video.src = product.video; else video.removeAttribute('src');
  video.load(); this.lockScroll(); this.dialog().nativeElement.showModal();
  if (product.video) this.play();
 }
 play(): void {
  const video = this.player().nativeElement; const product = this.selected();
  this.playbackBlocked.set(false);
  void video.play().catch((error: unknown) => {
   if (this.selected() !== product || !this.dialog().nativeElement.open || !(error instanceof DOMException) || error.name !== 'NotAllowedError') return;
   // Mobile browsers may allow immediate muted playback when sound autoplay is blocked.
   video.muted = true;
   void video.play().catch(() => { if (this.selected() === product && this.dialog().nativeElement.open) this.playbackBlocked.set(true); });
  });
 }
 close(): void { this.player().nativeElement.pause(); this.dialog().nativeElement.close(); this.cleanup(); }
 cleanup(): void {
  if (this.dialog().nativeElement.open) return;
  const video = this.player().nativeElement; video.pause(); video.removeAttribute('src'); video.load();
  this.selected.set(null); this.videoError.set(false); this.playbackBlocked.set(false); this.unlockScroll();
 }
 private lockScroll(): void {
  if (this.restoreScroll) return;
  const body = this.document.body; const root = this.document.documentElement; const win = this.document.defaultView;
  const x = win?.scrollX ?? 0; const y = win?.scrollY ?? 0; const original = body.getAttribute('style'); const overflow = root.style.overflow;
  body.style.position = 'fixed'; body.style.top = `-${y}px`; body.style.left = `-${x}px`; body.style.width = '100%'; body.style.overflow = 'hidden'; root.style.overflow = 'hidden';
  this.restoreScroll = () => { if (original === null) body.removeAttribute('style'); else body.setAttribute('style',original); root.style.overflow = overflow; win?.scrollTo(x,y); };
 }
 private unlockScroll(): void { this.restoreScroll?.(); this.restoreScroll = null; }
}
