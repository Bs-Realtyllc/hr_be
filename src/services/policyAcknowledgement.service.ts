import * as policyRepo from '../repositories/policy.repository';
import * as policyAckRepo from '../repositories/policyAcknowledgement.repository';
import AppError from '../pkg/AppError';
import { notifyRejection } from './policyAcknowledgementService';

export async function submitAcknowledgement(policyId: string, employeeId: number, signedFilePath: string) {
  const policy = await policyRepo.findById(policyId);
  if (!policy) throw new AppError('Policy not found', 404);

  await policyAckRepo.upsertSubmission({ policyId, employeeId, signedFilePath });
}

export async function myAcknowledgements(employeeId: number) {
  return policyAckRepo.listForEmployee(employeeId);
}

export async function listForEmployeeAdmin(employeeId: string) {
  return policyAckRepo.listForEmployee(employeeId);
}

export async function listSubmissions(policyId: string) {
  return policyAckRepo.listForPolicy(policyId);
}

export async function reviewSubmission(
  ackId: string,
  status: 'approved' | 'rejected',
  rejectionReason: string | null,
  reviewedBy: number
) {
  const ack: any = await policyAckRepo.findById(ackId);
  if (!ack) throw new AppError('Submission not found', 404);

  await policyAckRepo.review(ack.id, { status, rejectionReason, reviewedBy });

  if (status === 'rejected') {
    notifyRejection(ack, rejectionReason as string).catch((err: any) =>
      console.error('[policy-ack] Failed to send rejection email:', err.message)
    );
  }
}
