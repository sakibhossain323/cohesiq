'use client'

import { useTransition } from 'react'
import { deleteReview } from '../_actions/delete-review'
import type { AdminReview } from '@/lib/api/admin'

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

export function ReviewsClient({ reviews }: { reviews: AdminReview[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b text-left">
            <th className="py-3 px-4 font-medium">Rating</th>
            <th className="py-3 px-4 font-medium">Review</th>
            <th className="py-3 px-4 font-medium">Public</th>
            <th className="py-3 px-4 font-medium">Date</th>
            <th className="py-3 px-4 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <ReviewRow key={r.id} review={r} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReviewRow({ review }: { review: AdminReview }) {
  const [pending, startTransition] = useTransition()

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="py-3 px-4 text-yellow-500 tracking-tighter">{stars(review.rating)}</td>
      <td className="py-3 px-4 max-w-64 truncate text-muted-foreground">
        {review.review_text ?? <span className="italic">No text</span>}
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${review.is_public ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
          {review.is_public ? 'Public' : 'Private'}
        </span>
      </td>
      <td className="py-3 px-4">{new Date(review.created_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
      <td className="py-3 px-4">
        <button
          disabled={pending}
          onClick={() => startTransition(() => deleteReview(review.id))}
          className="text-xs px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {pending ? '...' : 'Delete'}
        </button>
      </td>
    </tr>
  )
}
