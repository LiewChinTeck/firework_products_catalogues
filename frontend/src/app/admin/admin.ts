import {ChangeDetectionStrategy,Component,computed,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {categories,Product} from '../data/products';
import {CatalogueService,validImage} from '../data/catalogue.service';
import {youtubeId} from '../utils/youtube';
import {imageUrl} from '../utils/image';
@Component({selector:'app-admin',imports:[FormsModule,RouterLink],templateUrl:'./admin.html',styleUrl:'./admin.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class Admin{
 readonly store=inject(CatalogueService);readonly categories=categories;readonly query=signal('');readonly error=signal('');readonly message=signal('');readonly pendingDelete=signal<number|null>(null);readonly editing=signal<number|null>(null);readonly brokenImage=signal(false);
 readonly visible=computed(()=>this.store.products().filter(p=>(p.name+' '+p.code).toLocaleLowerCase().includes(this.query().trim().toLocaleLowerCase())));
 form=this.empty();
 private empty():Product{return {id:0,code:'',name:'',category:'consumer',image:'',youtubeUrl:'',diameter:'',height:'',shots:''};}
 preview():string{return imageUrl(this.form.image);}
 edit(p:Product):void{this.form={...p};this.editing.set(p.id);this.error.set('');this.message.set('');this.brokenImage.set(false);document.getElementById('product-name')?.focus();}
 reset():void{this.form=this.empty();this.editing.set(null);this.error.set('');this.brokenImage.set(false);}
 save():void{this.error.set('');this.message.set('');const data={...this.form,name:this.form.name.trim(),code:this.form.code.trim(),image:this.form.image.trim(),youtubeUrl:this.form.youtubeUrl.trim()};if(!data.name){this.error.set('Enter a product name.');return;}if(!validImage(data.image)){this.error.set('Enter a full HTTPS image link, or leave it empty.');return;}if(data.youtubeUrl&&!youtubeId(data.youtubeUrl)){this.error.set('Enter a valid YouTube link or video ID, or leave it empty.');return;}data.id=this.editing()??Math.max(0,...this.store.products().map(p=>p.id))+1;try{this.store.save(data);this.reset();this.message.set('Saved in this browser. Export products.ts to publish your changes.');}catch(e){this.error.set(e instanceof Error?e.message:'Could not save product.');}}
 remove(id:number):void{try{this.store.remove(id);if(this.editing()===id)this.reset();this.pendingDelete.set(null);this.message.set('Removed in this browser. Export to publish this change.');}catch(e){this.error.set(e instanceof Error?e.message:'Could not remove product.');}}
 export():void{const url=URL.createObjectURL(new Blob([this.store.exportSource()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='products.ts';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.message.set('Replace frontend/src/app/data/products.ts with the downloaded file, then commit and redeploy.');}
}