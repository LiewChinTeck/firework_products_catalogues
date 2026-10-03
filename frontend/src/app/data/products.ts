export interface Collection { id:string; name:string; image:string; }
export const categories = [
 {id:'adult',name:'Adult collection',image:'collections/adult/cover.webp'},
 {id:'kid',name:'Kid collection',image:'collections/kid/cover.webp'}
] as const satisfies readonly Collection[];

export type CategoryId = typeof categories[number]['id'];
export interface Product { id:number; name:string; category:CategoryId; description:string; price:number; image:string; video?:string; }
export type ProductInput = Pick<Product,'id'|'name'|'category'> & Partial<Omit<Product,'id'|'name'|'category'>>;

export function createProduct(input:ProductInput):Product {
 const folder = `products/${String(input.id).padStart(3,'0')}`;
 return {description:'',price:0,...input,image:input.image ?? `${folder}/image.webp`,video:input.video ?? `${folder}/video.mp4`};
}

export const products:Product[] = [
 createProduct({id:1,name:'Adult Product 1',category:'adult',description:'Example adult product.',price:29.99}),
 createProduct({id:2,name:'Adult Product 2',category:'adult',description:'Example adult product.',price:39.99}),
 createProduct({id:3,name:'Kid Product 1',category:'kid',description:'Example kid product.',price:19.99}),
 createProduct({id:4,name:'Kid Product 2',category:'kid',description:'Example kid product.',price:24.99})
];