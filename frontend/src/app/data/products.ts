export interface Collection {
  id: string;
  name: string;
  image: string;
}

export const categories = [
  { id: 'adult', name: 'Adult collection', image: 'collections/adult/cover.svg' },
  { id: 'kid', name: 'Kid collection', image: 'collections/kid/cover.svg' },
  { id: 'consumer', name: 'Consumer Fireworks', image: '' }
] as const satisfies readonly Collection[];

export type CategoryId = typeof categories[number]['id'];

export interface Product {
  id: number;
  code: string;
  name: string;
  category: CategoryId;
  image: string;
  youtubeUrl: string;
  diameter: string;
  height: string;
  shots: number | '';
}

// Image paths and YouTube links remain empty until configured.
// Specifications are metadata; product cards still display only the name.
export const products: readonly Product[] = [
  {
    id: 1616, code: '1616',
    name: 'Assorted Celebration Cake Repeater — 蝶舞焰火',
    category: 'consumer', image: '', youtubeUrl: '',
    diameter: '1.5″', height: '9″', shots: 138
  },
  {
    id: 9138, code: 'JT9138',
    name: 'Shoot Cake — Bird Nest 鸟巢',
    category: 'consumer', image: '', youtubeUrl: '',
    diameter: '1.5″', height: '9″', shots: 138
  },
  {
    id: 1528, code: '1528',
    name: 'Shoot Cake — 海洋之舞',
    category: 'consumer', image: '', youtubeUrl: '',
    diameter: '1.2″', height: '12″', shots: 528
  },
  {
    id: 9208, code: '9208',
    name: 'Shoot Cake — 扬帆起航',
    category: 'consumer', image: '', youtubeUrl: '',
    diameter: '1.2″', height: '9″', shots: 208
  },
  {
    id: 8228, code: '8228',
    name: 'Shoot Cake — 鲜衣策马',
    category: 'consumer', image: '', youtubeUrl: '',
    diameter: '1.2″', height: '8″', shots: 228
  },
  {
    id: 7333, code: '7333',
    name: 'Shoot Cake — 星河传说',
    category: 'consumer', image: '', youtubeUrl: '',
    diameter: '1.2″', height: '7″', shots: 333
  }
];