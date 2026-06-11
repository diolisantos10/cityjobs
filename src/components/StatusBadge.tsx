import type { JobStatus } from '@prisma/client';
import { STATUS_LABELS } from '@/lib/constants';

const STATUS_STYLES: Record<JobStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  AWAITING_PAYMENT: 'bg-amber-100 text-amber-800',
  PAID: 'bg-blue-100 text-blue-800',
  IN_REVIEW: 'bg-indigo-100 text-indigo-800',
  APPROVED: 'bg-brand-100 text-brand-800',
  REJECTED: 'bg-red-100 text-red-800',
  PUBLISHED: 'bg-brand-600 text-white',
  ARCHIVED: 'bg-gray-200 text-gray-600',
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
