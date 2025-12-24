import type { ParsedDirectives, DirectiveScope } from '@vng-qa/shared';

/**
 * Parses directives from user input to determine scope and file references
 * Currently only parses, does not perform any retrieval
 */
export function parseDirectives(input: string): ParsedDirectives {
  const fileSlugs: string[] = [];
  let scope: DirectiveScope | undefined;
  let cleanQuery = input;

  // Match @doc, @codebase, @file_slug patterns
  const directiveRegex = /@(\w+)(?:\s|$)/g;
  let match;

  while ((match = directiveRegex.exec(input)) !== null) {
    const directive = match[1];

    if (directive === 'doc') {
      scope = 'doc';
    } else if (directive === 'codebase') {
      scope = 'codebase';
    } else if (directive === 'both') {
      scope = 'both';
    } else {
      // Assume it's a file slug
      fileSlugs.push(directive);
      scope = 'file';
    }

    // Remove the directive from clean query
    cleanQuery = cleanQuery.replace(match[0], '').trim();
  }

  return {
    scope,
    fileSlugs,
    cleanQuery,
  };
}
