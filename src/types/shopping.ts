export type ShoppingCategory =
  | 'Meyve & Sebze'
  | 'Süt & Kahvaltılık'
  | 'Temel Gıda & Bakliyat'
  | 'Et, Tavuk & Balık'
  | 'Fırın & Unlu Mamul'
  | 'İçecekler'
  | 'Atıştırmalık & Tatlı'
  | 'Temizlik & Ev'
  | 'Kişisel Bakım'
  | 'Diğer';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string; // e.g. "1 kg", "2 paket", "3 adet"
  category: ShoppingCategory;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface ShoppingList {
  id: string;
  title: string;
  items: ShoppingItem[];
  createdAt: string;
  updatedAt: string;
}
