import * as onboardRepo from '../repositories/onboard.repository';

interface CandidateHiredPayload {
  applicationId: string;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    skills?: string[] | null;
    experience?: unknown;
  };
  job: {
    title?: string | null;
    type?: string | null;
  };
}

export async function handleCandidateHired(payload: CandidateHiredPayload) {
  const { applicationId, candidate, job } = payload;

  if (!candidate?.email) {
    console.error(`[job-portal-sync] candidate_hired payload missing candidate.email (applicationId=${applicationId})`);
    return;
  }

  const name = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ').trim();
  const role = job?.type === 'INTERNSHIP' ? 'intern' : 'employee';

  await onboardRepo.upsertDraftFromExternalSource({
    name,
    email: candidate.email,
    phone: candidate.phone,
    linkedin_url: candidate.linkedinUrl,
    github_url: candidate.githubUrl,
    designation: job?.title,
    tech_stack: candidate.skills,
    previous_experience: candidate.experience ? JSON.stringify(candidate.experience) : null,
    role,
    source: 'job_portal',
    source_application_id: applicationId,
  });

  console.log(`[job-portal-sync] Drafted onboarding profile for ${name} <${candidate.email}> from application ${applicationId}`);
}
