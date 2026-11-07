export const SUPPORTED_AGES = ['3', '4', '5', '6', '7', '8'] as const;

export type SupportedAge = (typeof SUPPORTED_AGES)[number];

export function normalizeAge(value: unknown): SupportedAge | null {
    const age = String(value ?? '').trim();
    return (SUPPORTED_AGES as readonly string[]).includes(age)
        ? age as SupportedAge
        : null;
}
