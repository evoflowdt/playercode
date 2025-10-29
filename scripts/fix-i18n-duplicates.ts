import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filePath = join(process.cwd(), 'client/src/lib/i18n.ts');
const content = readFileSync(filePath, 'utf-8');

// Extract EN and IT sections
const enMatch = content.match(/en: \{([^}]*(?:\{[^}]*\}[^}]*)*)\s*\},\s*it: \{/s);
const itMatch = content.match(/it: \{([^}]*(?:\{[^}]*\}[^}]*)*)\s*\}\s*\}/s);

if (!enMatch || !itMatch) {
  console.error('Could not parse i18n.ts structure');
  process.exit(1);
}

const enSection = enMatch[1];
const itSection = itMatch[1];

function deduplicate(section: string): string {
  const lines = section.split('\n');
  const seen = new Map<string, string>();
  const result: string[] = [];
  
  for (const line of lines) {
    const keyMatch = line.match(/^\s+(\w+):/);
    if (keyMatch) {
      const key = keyMatch[1];
      // Keep last occurrence (overwrite if duplicate)
      seen.set(key, line);
    } else {
      // Keep comments and empty lines
      result.push(line);
    }
  }
  
  // Rebuild section with deduped keys
  const dedupedLines: string[] = [];
  let currentComment: string[] = [];
  
  for (const line of lines) {
    const keyMatch = line.match(/^\s+(\w+):/);
    if (keyMatch) {
      const key = keyMatch[1];
      // Only add this key if it's the one we kept in seen
      if (seen.get(key) === line) {
        // Add accumulated comments
        dedupedLines.push(...currentComment);
        currentComment = [];
        dedupedLines.push(line);
      }
    } else {
      // Accumulate comments
      if (line.trim().startsWith('//') || line.trim() === '') {
        currentComment.push(line);
      }
    }
  }
  
  return dedupedLines.join('\n');
}

const dedupedEn = deduplicate(enSection);
const dedupedIt = deduplicate(itSection);

const newContent = `export type Language = 'en' | 'it';

export const translations = {
  en: {
${dedupedEn}
  },
  it: {
${dedupedIt}
  }
};

export function getTranslation(lang: Language, key: string): string {
  return translations[lang][key as keyof typeof translations['en']] || key;
}
`;

writeFileSync(filePath, newContent, 'utf-8');
console.log('✅ Deduplication complete!');
console.log(`EN keys: ${dedupedEn.split('\n').filter(l => l.match(/^\s+\w+:/)).length}`);
console.log(`IT keys: ${dedupedIt.split('\n').filter(l => l.match(/^\s+\w+:/)).length});
