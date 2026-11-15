import type { Locale } from '../../common/utils/locale';
import type { AiReply } from '../ai.types';
import type { CatalogToolsService } from '../tools/catalog-tools.service';

export interface AiProviderInput {
  messages: { role: 'user' | 'assistant'; content: string }[];
  locale: Locale;
  /** Short description of the customer's current cart, or null. */
  cartSummary: string | null;
}

/** A language-model backend for NUSKA AI; replaceable without touching the rest of the module. */
export interface AiProvider {
  readonly name: string;
  readonly model: string;
  chat(input: AiProviderInput, tools: CatalogToolsService): Promise<AiReply>;
}
