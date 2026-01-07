// shared/models/product.model.ts
export interface ProductImage {
  imageUrl: string;
  isPrimary: boolean;
}

export interface RatingDistribution {
  rating5Count: number;
  rating4Count: number;
  rating3Count: number;
  rating2Count: number;
  rating1Count: number;
}

export interface ProductReview {
  reviewId: number;
  customerName: string;
  rating: number;
  reviewTitle: string;
  reviewText: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface RelatedProduct {
  productGuid: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  imageUrl?: string;
}

// ✅ Main Product interface for detail view
export interface Product {
  productGuid: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  
  // Optional properties for detail view
  images?: ProductImage[];
  totalReviews?: number;
  averageRating?: number;
  ratingDistribution?: RatingDistribution;
  relatedProducts?: RelatedProduct[];
}

// ✅ Add Review interface
export interface AddReview {
  customerId?: number;
  customerName: string;
  customerEmail: string;
  rating: number;
  reviewTitle: string;
  reviewText: string;
}