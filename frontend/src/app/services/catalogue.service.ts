import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../data/products';

export function validMediaUrl(value:string):boolean {
 if (!value) return true;
 if (/^https?:\/\//i.test(value)) {
  try { const url = new URL(value); return !!url.hostname && !url.username && !url.password; }
  catch { return false; }
 }
 return !/[\s\\:]/.test(value) && !value.startsWith('//') && !/^[?#]/.test(value);
}

export function validProduct(value:unknown):value is Product {
 if (!value || typeof value !== 'object') return false;
 const p = value as Partial<Product>;
 return Number.isSafeInteger(p.id) && p.id! > 0
  && typeof p.name === 'string' && !!p.name.trim() && p.name.length <= 100
  && (p.category === 'adult' || p.category === 'kid')
  && typeof p.description === 'string' && p.description.length <= 1000
  && typeof p.price === 'number' && Number.isFinite(p.price) && p.price >= 0
  && typeof p.image === 'string' && validMediaUrl(p.image)
  && (p.video === undefined || typeof p.video === 'string' && validMediaUrl(p.video));
}

@Injectable({providedIn:'root'})
export class CatalogueService {
 private readonly state = signal<Product[]>([]);
 readonly products = this.state.asReadonly();
 readonly loading = signal(false);
 readonly saving = signal(false);
 readonly busy = computed(() => this.loading() || this.saving());
 readonly warning = signal('');
 readonly status = signal('');
 readonly savedProduct = signal<Product|null>(null);

 constructor() { void this.reload(); }

 private async request(url:string,method='GET',body?:unknown,timeout=15000):Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(),timeout);
  try {
   const response = await fetch(url,{
    method,signal:controller.signal,cache:'no-store',
    headers:body === undefined || body instanceof FormData ? {} : {'Content-Type':'application/json'},
    body:body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body)
   });
   const data:unknown = await response.json();
   if (!response.ok) throw new Error(
    data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
     ? data.error : `Request failed (${response.status}).`
   );
   return data;
  } catch (error) {
   if (controller.signal.aborted) throw new Error('Request timed out. Refresh products before retrying; your change may have been saved.');
   if (error instanceof TypeError) throw new Error('Cannot reach the backend. Check both servers and the proxy.');
   if (error instanceof SyntaxError) throw new Error('The API returned invalid JSON. Check the Angular proxy.');
   throw error;
  } finally { clearTimeout(timer); }
 }

 private message(error:unknown):string {
  return error instanceof Error ? error.message : 'Request failed.';
 }

 async reload():Promise<void> {
  if (this.busy()) return;
  this.loading.set(true); this.warning.set('');
  try {
   const data = await this.request('/api/products');
   if (!Array.isArray(data) || !data.every(validProduct)) throw new Error('The API returned invalid product data.');
   this.state.set(data);
  } catch (error) { this.warning.set(this.message(error)); }
  finally { this.loading.set(false); }
 }

 async save(draft:Omit<Product,'id'>,id?:number,files:{image?:File;video?:File}={}):Promise<string|null> {
  if (this.busy()) return 'Please wait for the current request.';
  this.savedProduct.set(null); this.saving.set(true); this.status.set('Saving product…');
  try {
   const saved = await this.request(
    id === undefined ? '/api/products' : `/api/products/${id}`,
    id === undefined ? 'POST' : 'PUT',draft
   );
   this.accept(saved);
   for (const kind of ['image','video'] as const) {
    const file = files[kind];
    if (!file) continue;
    this.status.set(`Uploading and converting ${kind}… Please keep this page open.`);
    const form = new FormData();
    form.append('file',file);
    this.accept(await this.request(`/api/products/${this.savedProduct()!.id}/${kind}`,'POST',form,600000));
   }
   return null;
  } catch (error) {
   return `${this.savedProduct() ? 'Product saved, but media upload failed. Retry Save changes. ' : ''}${this.message(error)}`;
  } finally {
   this.saving.set(false); this.status.set('');
  }
 }

 private accept(value:unknown):void {
  if (!validProduct(value)) throw new Error('Unexpected save response. Refresh products before retrying.');
  this.savedProduct.set(value);
  this.state.update(items => [value,...items.filter(p => p.id !== value.id)].sort((a,b) => b.id-a.id));
 }

 async remove(id:number):Promise<string|null> {
  if (this.busy()) return 'Please wait for the current request.';
  this.saving.set(true);
  try {
   await this.request(`/api/products/${id}`,'DELETE');
   this.state.update(items => items.filter(p => p.id !== id));
   return null;
  } catch (error) { return this.message(error); }
  finally { this.saving.set(false); }
 }
}