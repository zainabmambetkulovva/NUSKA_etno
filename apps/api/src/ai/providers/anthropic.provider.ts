import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '@nestjs/common';

import type { GiftSetItemDto } from '../../gift-sets/dto/gift-sets.dto';
import type { ProductCard } from '../../products/product.mapper';
import type { AiReply, SetQuote } from '../ai.types';
import { SYSTEM_PROMPT } from '../prompts/system-prompt';
import { CatalogToolsService } from '../tools/catalog-tools.service';

import type { AiProvider, AiProviderInput } from './ai-provider';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ITERATIONS = 6;
type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

const setItems = {
  type: 'array',
  maxItems: 30,
  items: {
    type: 'object',
    properties: {
      product_id: { type: 'string', description: 'product_id from a tool result' },
      quantity: { type: 'integer', minimum: 1, maximum: 99 },
    },
    required: ['product_id', 'quantity'],
    additionalProperties: false,
  },
} as const;

/** Catalog tools offered to the model (strict schemas). */
const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'search_products',
    description:
      'Search the NUSKA_etno catalog by product name or words from its description. Returns products with id, name, price in som and availability.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Product name or keywords' } },
      required: ['query'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'list_catalog',
    description: 'List every product currently sold, with prices and availability.',
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: 'get_product',
    description:
      'Details the company entered for one product: description, ingredients, storage, characteristics, sizes. Missing fields mean the information is not available.',
    input_schema: {
      type: 'object',
      properties: { product_id: { type: 'string' } },
      required: ['product_id'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'build_set',
    description:
      'Put together a set of products in stock, one of each, within an optional budget in som, for a family dastorkon or a gift. Returns the priced set.',
    input_schema: {
      type: 'object',
      properties: {
        budget_som: { type: ['integer', 'null'], description: 'Maximum total in som, or null' },
        purpose: { type: 'string', enum: ['dastorkon', 'gift', 'any'] },
      },
      required: ['budget_som', 'purpose'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'quote_set',
    description: 'Calculate the current price of a set of products (and check availability).',
    input_schema: {
      type: 'object',
      properties: { items: setItems },
      required: ['items'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'propose_cart',
    description:
      'Show the customer a set of products with an "Add to cart" button. Nothing is added until the customer presses it. Use once per answer, with the final set.',
    input_schema: {
      type: 'object',
      properties: { items: setItems },
      required: ['items'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'pickup_info',
    description: 'Active pickup points (name, address, opening hours, phone) and how pickup works.',
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
];

/** Claude (Anthropic API) as the NUSKA AI language model. */
export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    readonly model: string,
    private readonly effort: Effort
  ) {
    this.client = new Anthropic({ apiKey, timeout: 45_000, maxRetries: 1 });
  }

  async chat(input: AiProviderInput, tools: CatalogToolsService): Promise<AiReply> {
    const { locale } = input;
    const shown = new Map<string, ProductCard>();
    let proposal: SetQuote | null = null;

    const history = input.messages.slice(0, -1);
    const question = input.messages[input.messages.length - 1].content;
    const context = `Context: language=${locale}; cart=${input.cartSummary ?? 'empty'}`;
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      {
        role: 'user',
        content: [
          { type: 'text', text: context },
          { type: 'text', text: question },
        ],
      },
    ];

    const toItems = (raw: unknown): GiftSetItemDto[] => {
      if (!Array.isArray(raw)) throw new Error('items must be an array');
      return raw.slice(0, 30).map((i: { product_id?: unknown; quantity?: unknown }) => {
        if (typeof i.product_id !== 'string' || !UUID.test(i.product_id))
          throw new Error('unknown product_id; use ids from search results');
        const quantity = Number(i.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99)
          throw new Error('quantity must be 1..99');
        return { productId: i.product_id, quantity };
      });
    };
    const priced = (q: SetQuote) => ({
      items: q.items.map((l) => ({
        product_id: l.product.id,
        name: l.product.name,
        quantity: l.quantity,
        line_total_som: l.lineTotal.amount / 100,
        not_enough_stock: l.issue === 'INSUFFICIENT_STOCK',
      })),
      unavailable_product_ids: q.unavailable,
      total_som: q.total.amount / 100,
    });

    const run = async (name: string, args: Record<string, unknown>): Promise<unknown> => {
      switch (name) {
        case 'search_products': {
          const found = await tools.search(String(args.query ?? ''), locale);
          found.slice(0, 6).forEach((p) => shown.set(p.id, p));
          return found.map(CatalogToolsService.brief);
        }
        case 'list_catalog':
          return (await tools.allProducts(locale)).map(CatalogToolsService.brief);
        case 'get_product': {
          const id = String(args.product_id ?? '');
          const details = UUID.test(id) ? await tools.details(id, locale) : null;
          if (!details) throw new Error('product not found');
          shown.set(details.card.id, details.card);
          return { ...CatalogToolsService.brief(details.card), ...details, card: undefined };
        }
        case 'build_set': {
          const budget = args.budget_som === null ? null : Number(args.budget_som);
          const purpose = ['dastorkon', 'gift', 'any'].includes(String(args.purpose))
            ? (args.purpose as 'dastorkon' | 'gift' | 'any')
            : 'any';
          return priced(await tools.buildSet(budget, purpose, locale));
        }
        case 'quote_set':
          return priced(await tools.quote(toItems(args.items), locale));
        case 'propose_cart': {
          const quote = await tools.quote(toItems(args.items), locale);
          if (quote.items.length === 0) throw new Error('no available products in the set');
          proposal = quote;
          return { shown_to_customer: true, ...priced(quote) };
        }
        case 'pickup_info':
          return {
            points: await tools.pickup(),
            how_it_works:
              'Order on the site (cart → sign in → choose a pickup point → confirm). The status is shown in the account; come when it is "Ready for pickup".',
          };
        default:
          throw new Error(`unknown tool ${name}`);
      }
    };

    let text = '';
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: 16000,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        tools: TOOLS,
        messages,
        output_config: { effort: this.effort },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });

      if (response.stop_reason === 'refusal') {
        this.logger.warn(`Refusal: ${response.stop_details?.category ?? 'unknown'}`);
        text = '';
        break;
      }
      messages.push({ role: 'assistant', content: response.content });
      text = response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();

      if (response.stop_reason === 'pause_turn') continue;
      if (response.stop_reason !== 'tool_use') break;

      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        try {
          const output = await run(block.name, (block.input ?? {}) as Record<string, unknown>);
          results.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(output),
          });
        } catch (error) {
          results.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: (error as Error).message,
            is_error: true,
          });
        }
      }
      messages.push({ role: 'user', content: results });
    }

    const finalProposal = proposal as SetQuote | null;
    const proposed = new Set(finalProposal?.items.map((l) => l.product.id) ?? []);
    return {
      mode: 'ai',
      reply: text,
      products: [...shown.values()].filter((p) => !proposed.has(p.id)).slice(0, 6),
      proposal: finalProposal,
      suggestions: [],
    };
  }
}
