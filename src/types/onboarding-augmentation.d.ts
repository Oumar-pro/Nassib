import '../../src/components/Auth/OnboardingModal';

declare module '../components/Auth/OnboardingModal' {
  interface OnboardingData {
    professionCategory?: string;
    bodyType?: string;
    preferredAgeRange?: string;
  }
}
