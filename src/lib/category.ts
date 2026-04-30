import { categoryRules } from './intel/categoryRegistry';

export type ProductCategory = 'electronics' | 'apparel' | 'home' | 'beauty' | 'books' | 'supplements' | 'tools' | 'digital' | 'unknown';

export function detectCategory(title: string | null, url: string): ProductCategory {
  const titleLower = (title || '').toLowerCase();
  const urlLower = url.toLowerCase();
  const combined = titleLower + ' ' + urlLower;

  for (const rule of categoryRules) {
    if (rule.detectionPatterns.some((p) => combined.includes(p))) {
      return rule.category as ProductCategory;
    }
  }

  return 'unknown';
}

export function getCategoryAdjustments(category: ProductCategory) {
  const rule = categoryRules.find((r) => r.category === category);
  return rule ? rule.adjustments : [];
}
