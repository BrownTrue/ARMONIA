import type { Profile } from "@/lib/types";

export type OnboardingFields={firstName:string;lastName:string;profession:string;studio:string};
export type OnboardingErrors=Partial<Record<keyof OnboardingFields,string>>;

export function validateOnboarding(input:OnboardingFields):OnboardingErrors{
  const errors:OnboardingErrors={};
  if(!input.firstName.trim())errors.firstName="Inserisci il nome.";
  if(!input.lastName.trim())errors.lastName="Inserisci il cognome.";
  if(!input.profession.trim())errors.profession="Inserisci la professione.";
  return errors;
}

export function completedOnboardingProfile(profile:Profile,input:OnboardingFields,completedAt:string):Profile{
  return {...profile,firstName:input.firstName.trim(),lastName:input.lastName.trim(),profession:input.profession.trim(),studio:input.studio.trim(),onboardingCompletedAt:completedAt};
}
