export const challengeCategories = ['body', 'character', 'community', 'creativity'] as const;

export type ChallengeCategory = (typeof challengeCategories)[number];
