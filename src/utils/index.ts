
/**
 * Convert a string `fooBAR baz_160054''"1]"` into a slug: `foobar-baz-1600541`
 */
export const stringToSlug = (text: string) =>
    (text || '')
        .trim()
        .toLowerCase()
        .replace(/[\-_+ ]/g, '-')
        .replace(/[^a-z0-9\-]/g, '');

