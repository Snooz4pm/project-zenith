import Fuse from 'fuse.js';
import type { Token } from '@/types/token';
import { localTokens } from './localTokens';

export function smartTokenSearch(query: string, tokens: Token[]): Token[] {
  if (!query) return [];
  const fuse = new Fuse(tokens.length ? tokens : localTokens, {
    keys: ['symbol', 'name', 'address'],
    threshold: 0.3,
  });
  return fuse.search(query).map(r => r.item);
}
