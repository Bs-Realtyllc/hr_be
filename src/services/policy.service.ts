import * as policyRepo from '../repositories/policy.repository';
import AppError from '../pkg/AppError';

export async function listPolicies(category?: string) {
  return policyRepo.listActive(category);
}

export async function uploadPolicy(
  { type, title, category }: { type: string; title: string; category: string },
  filename: string,
  uploadedBy: number
) {
  const previous: any = await policyRepo.findActiveByType(type);
  const version = previous ? previous.version + 1 : 1;

  await policyRepo.deactivateByType(type);
  const id = await policyRepo.create({
    type,
    title,
    filePath: filename,
    version,
    uploadedBy,
    category,
  });

  return { id, version };
}

export async function removePolicy(id: string) {
  const policy: any = await policyRepo.findById(id);
  if (!policy) throw new AppError('Policy not found', 404);
  await policyRepo.remove(id);
  return policy;
}

export async function setPinned(id: string, pinned: boolean) {
  const policy: any = await policyRepo.findById(id);
  if (!policy) throw new AppError('Policy not found', 404);
  await policyRepo.setPinned(id, pinned);
}
