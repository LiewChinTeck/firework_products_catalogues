import {Injectable,signal} from '@angular/core';
import {categories,Product,products} from './products';
import {youtubeId} from '../utils/youtube';
const KEY='pakatan-catalogue-products-v1';
export function validImage(value:string):boolean{if(!value)return true;try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}}
export function validProduct(p:unknown):p is Product{if(!p||typeof p!=='object')return false;const v=p as Product;return Number.isSafeInteger(v.id)&&v.id>0&&typeof v.name==='string'&&!!v.name.trim()&&categories.some(c=>c.id===v.category)&&['code','image','youtubeUrl','diameter','height'].every(k=>typeof (v as unknown as Record<string,unknown>)[k]==='string')&&validImage(v.image)&&(!v.youtubeUrl||!!youtubeId(v.youtubeUrl))&&(v.shots===''||(Number.isInteger(v.shots)&&v.shots>=0));}
@Injectable({providedIn:'root'})
export class CatalogueService{
 private readonly state=signal<readonly Product[]>(products);
 readonly products=this.state.asReadonly();readonly warning=signal('');
 constructor(){try{const raw=localStorage.getItem(KEY);if(raw){const data:unknown=JSON.parse(raw);if(!Array.isArray(data)||!data.every(validProduct)||new Set(data.map(p=>p.id)).size!==data.length)throw Error();this.state.set(data);}}catch{this.warning.set('Saved browser data could not be loaded. The published catalogue is displayed.');}}
 save(product:Product):void{if(!validProduct(product))throw Error('Check the product name, collection and links.');if(this.state().some(p=>p.id!==product.id&&p.name.trim().toLocaleLowerCase()===product.name.trim().toLocaleLowerCase()))throw Error('A product with this name already exists.');const exists=this.state().some(p=>p.id===product.id);this.commit(exists?this.state().map(p=>p.id===product.id?product:p):[...this.state(),product]);}
 remove(id:number):void{this.commit(this.state().filter(p=>p.id!==id));}
 private commit(next:readonly Product[]):void{try{localStorage.setItem(KEY,JSON.stringify(next));}catch{throw Error('Browser storage is unavailable or full. This change was not saved.');}this.state.set(next);this.warning.set('');}
 exportSource():string{return `export interface Collection{id:string;name:string;image:string;}\nexport const categories=${JSON.stringify(categories,null,1)} as const satisfies readonly Collection[];\nexport type CategoryId=typeof categories[number]['id'];\nexport interface Product{id:number;code:string;name:string;category:CategoryId;image:string;youtubeUrl:string;diameter:string;height:string;shots:number|'';}\nexport const products:readonly Product[]=${JSON.stringify(this.state(),null,1)};\n`;}
}