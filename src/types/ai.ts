/**
 * Provider-Agnostic AI Architecture Contracts
 * 
 * ARCHITECTURAL PRINCIPLES:
 * 1. Khidmatik is currently 100% AI-free in production.
 * 2. This module defines purely structural TypeScript contracts and domain boundaries
 *    so that future AI providers (e.g. LXDS, OpenAI, Anthropic, Google, or custom endpoints)
 *    can be plugged in server-side without modifying core business logic.
 * 3. Strict Domain Separation: Primary business entities (Product, Service, Store, Order)
 *    remain the immutable source of truth and are never directly mutated by AI.
 * 4. Transient suggestions (descriptions, SEO improvements, keywords) are encapsulated
 *    in dedicated suggestion objects.
 */

// ==========================================
// 1. Generic AI Provider Abstraction
// ==========================================

export type AIProviderName = 'lxds' | 'openai' | 'anthropic' | 'google' | 'custom';

export interface AIProviderConfig {
  provider: AIProviderName;
  model: string;
  endpoint?: string;
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  signal?: AbortSignal;
}

/**
 * Universal interface for server-side AI providers.
 * Any future provider (e.g., LXDS, OpenAI) implements this contract.
 */
export interface IAIProvider {
  readonly providerName: AIProviderName;
  generateText(prompt: string, options?: AICompletionOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: any, options?: AICompletionOptions): Promise<T>;
}

// ==========================================
// 2. SEO Enhancement Contracts
// ==========================================

export interface SeoContext {
  entityType: 'store' | 'product' | 'service' | 'category' | 'location' | 'search';
  entityId?: string;
  name: string;
  category?: string;
  city?: string;
  wilayaCode?: string;
  currentDescription?: string;
  keywords?: string[];
  rawAttributes?: Record<string, any>;
}

export interface SeoOptimizationSuggestion {
  suggestedTitle?: string;
  suggestedDescription?: string;
  suggestedKeywords?: string[];
  suggestedInternalLinks?: Array<{ text: string; href: string }>;
  confidenceScore?: number;
}

/**
 * Interface for optional SEO enhancement providers.
 */
export interface ISeoEnhancementProvider {
  enhanceMetadata(context: SeoContext): Promise<SeoOptimizationSuggestion>;
}

// ==========================================
// 3. Content Assistance Contracts
// ==========================================

export interface ListingDescriptionContext {
  businessName: string;
  listingType: 'store' | 'professional' | 'freelancer';
  category: string;
  keywords?: string;
  city?: string;
}

export interface ProductDescriptionContext {
  productName: string;
  category: string;
  storeName?: string;
  features?: string[];
  brand?: string;
  price?: number;
}

export interface ContentSuggestion {
  draftText: string;
  suggestedTags?: string[];
  language?: 'ar' | 'fr' | 'en';
}

export interface IContentAssistanceProvider {
  suggestListingDescription(context: ListingDescriptionContext): Promise<ContentSuggestion>;
  suggestProductDescription(context: ProductDescriptionContext): Promise<ContentSuggestion>;
}

// ==========================================
// 4. Search & Query Refinement Contracts
// ==========================================

export interface SearchRefinementContext {
  query: string;
  category?: string;
  location?: string;
  resultCount: number;
}

export interface ISearchEnhancementProvider {
  suggestRefinements(context: SearchRefinementContext): Promise<string[]>;
}
