import type { GiftSetsService } from '../gift-sets/gift-sets.service';
import type { ProductCard } from '../products/product.mapper';

export type SetQuote = Awaited<ReturnType<GiftSetsService['quote']>>;

/**
 * Answer of NUSKA AI. `proposal` is a set of products the user may add to the
 * cart with a button — the assistant never changes the cart by itself.
 */
export interface AiReply {
  /** "ai": a language model answered; "catalog": the built-in catalog assistant (no AI provider). */
  mode: 'ai' | 'catalog';
  reply: string;
  products: ProductCard[];
  proposal: SetQuote | null;
  suggestions: string[];
}
