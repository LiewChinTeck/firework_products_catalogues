import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product } from '../../data/products';
import { CatalogueService } from '../../services/catalogue.service';

const blank = ():Omit<Product,'id'> => ({name:'',category:'adult',description:'',price:0,image:'',video:''});

@Component({selector:'app-manage',imports:[FormsModule,RouterLink,CurrencyPipe],templateUrl:'./manage.html',styleUrl:'./manage.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class Manage {
 readonly catalogue = inject(CatalogueService);
 readonly search = signal('');
 readonly category = signal('all');
 readonly error = signal('');
 readonly message = signal('');
 readonly editingId = signal<number|undefined>(undefined);
 readonly pendingDelete = signal<Product|null>(null);
 readonly confirmDialog = viewChild<ElementRef<HTMLDialogElement>>('confirmation');
 readonly form = viewChild<NgForm>('productForm');
 readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
 readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');
 readonly videoInput = viewChild<ElementRef<HTMLInputElement>>('videoInput');
 files:{image?:File;video?:File} = {};
 draft = blank();

 readonly filtered = computed(() => this.catalogue.products().filter(p =>
  (this.category() === 'all' || p.category === this.category())
  && p.name.toLocaleLowerCase().includes(this.search().trim().toLocaleLowerCase())
 ));

 edit(product:Product):void {
  if (this.catalogue.busy()) return;
  this.clearFiles(); this.editingId.set(product.id);
  const {id,...draft} = product;
  this.draft = {...draft}; this.form()?.resetForm(this.draft);
  this.error.set(''); this.message.set('');
  this.nameInput()?.nativeElement.focus();
 }

 reset():void {
  if (this.catalogue.busy()) return;
  this.clearFiles(); this.editingId.set(undefined); this.draft = blank();
  this.form()?.resetForm(this.draft); this.error.set('');
 }

 async save(form:NgForm):Promise<void> {
  if (this.catalogue.busy()) return;
  this.error.set(''); this.message.set('');
  if (form.invalid) {
   form.control.markAllAsTouched();
   this.error.set('Complete the required fields and check the price.');
   return;
  }
  const wasEditing = this.editingId() !== undefined;
  const error = await this.catalogue.save({...this.draft},this.editingId(),{...this.files});
  const saved = this.catalogue.savedProduct();
  if (saved) {
   this.editingId.set(saved.id);
   const {id,...draft} = saved;
   this.draft = {...draft};
  }
  if (error) { this.error.set(error); return; }
  this.reset(); this.message.set(wasEditing ? 'Product updated.' : 'Product added.');
 }

 selectFile(kind:'image'|'video',event:Event):void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  delete this.files[kind]; this.error.set('');
  if (!file) return;
  const limit = (kind === 'image' ? 10 : 100)*1024*1024;
  if (!file.size || file.size > limit) {
   input.value = '';
   this.error.set(`${kind === 'image' ? 'Image' : 'Video'} must be non-empty and no larger than ${kind === 'image' ? 10 : 100} MB.`);
   return;
  }
  this.files[kind] = file;
 }

 clearFiles():void {
  this.files = {};
  if (this.imageInput()) this.imageInput()!.nativeElement.value = '';
  if (this.videoInput()) this.videoInput()!.nativeElement.value = '';
 }

 requestDelete(product:Product):void {
  if (this.catalogue.busy()) return;
  this.message.set(''); this.error.set('');
  this.pendingDelete.set(product); this.confirmDialog()?.nativeElement.showModal();
 }

 cancelDelete():void {
  if (this.catalogue.busy()) return;
  this.confirmDialog()?.nativeElement.close(); this.pendingDelete.set(null);
 }

 async remove():Promise<void> {
  if (this.catalogue.busy()) return;
  const product = this.pendingDelete();
  if (!product) return;
  this.error.set(''); this.message.set('');
  const error = await this.catalogue.remove(product.id);
  if (error) { this.error.set(error); return; }
  this.cancelDelete();
  if (this.editingId() === product.id) this.reset();
  this.message.set('Product deleted.');
 }
}