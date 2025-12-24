import { parseDirectives } from '../index';

describe('parseDirectives', () => {
  it('should parse @doc directive', () => {
    const result = parseDirectives('@doc What is this project?');
    expect(result.scope).toBe('doc');
    expect(result.fileSlugs).toEqual([]);
    expect(result.cleanQuery).toBe('What is this project?');
  });

  it('should parse @codebase directive', () => {
    const result = parseDirectives('@codebase How does the auth work?');
    expect(result.scope).toBe('codebase');
    expect(result.fileSlugs).toEqual([]);
    expect(result.cleanQuery).toBe('How does the auth work?');
  });

  it('should parse @both directive', () => {
    const result = parseDirectives('@both What is this project about?');
    expect(result.scope).toBe('both');
    expect(result.fileSlugs).toEqual([]);
    expect(result.cleanQuery).toBe('What is this project about?');
  });

  it('should parse file slug directives', () => {
    const result = parseDirectives('@auth.py How does login work?');
    expect(result.scope).toBe('file');
    expect(result.fileSlugs).toEqual(['auth.py']);
    expect(result.cleanQuery).toBe('How does login work?');
  });

  it('should parse multiple file slug directives', () => {
    const result = parseDirectives('@auth.py @utils.js What are these files?');
    expect(result.scope).toBe('file');
    expect(result.fileSlugs).toEqual(['auth.py', 'utils.js']);
    expect(result.cleanQuery).toBe('What are these files?');
  });

  it('should handle mixed directives (scope takes precedence)', () => {
    const result = parseDirectives('@doc @auth.py What is this?');
    expect(result.scope).toBe('doc');
    expect(result.fileSlugs).toEqual(['auth.py']);
    expect(result.cleanQuery).toBe('What is this?');
  });

  it('should handle input without directives', () => {
    const result = parseDirectives('Just a regular question');
    expect(result.scope).toBeUndefined();
    expect(result.fileSlugs).toEqual([]);
    expect(result.cleanQuery).toBe('Just a regular question');
  });

  it('should handle empty input', () => {
    const result = parseDirectives('');
    expect(result.scope).toBeUndefined();
    expect(result.fileSlugs).toEqual([]);
    expect(result.cleanQuery).toBe('');
  });
});
