'use client'

import { useTransition } from 'react'
import { toggleUserActive } from '../_actions/toggle-active'
import { deleteUser } from '../_actions/delete-user'
import type { AdminUser } from '@/lib/api/admin'

export function UsersClient({ users }: { users: AdminUser[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b text-left">
            <th className="py-3 px-4 font-medium">Email</th>
            <th className="py-3 px-4 font-medium">Clerk ID</th>
            <th className="py-3 px-4 font-medium">Role</th>
            <th className="py-3 px-4 font-medium">Profile</th>
            <th className="py-3 px-4 font-medium">Status</th>
            <th className="py-3 px-4 font-medium">Joined</th>
            <th className="py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <UserRow key={u.id} user={u} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UserRow({ user }: { user: AdminUser }) {
  const [togglePending, startToggle] = useTransition()
  const [deletePending, startDelete] = useTransition()
  const pending = togglePending || deletePending

  const handleDelete = () => {
    if (!confirm(`Permanently delete ${user.email} and all their data? This cannot be undone.`)) return
    startDelete(() => deleteUser(user.id))
  }

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="py-3 px-4">{user.email}</td>
      <td className="py-3 px-4 font-mono text-xs text-muted-foreground max-w-[160px] truncate" title={user.clerk_id ?? ''}>
        {user.clerk_id ?? <span className="italic text-red-400">no clerk id</span>}
      </td>
      <td className="py-3 px-4 capitalize">{user.role}</td>
      <td className="py-3 px-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.has_profile ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {user.has_profile ? 'Complete' : 'Pending'}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {user.is_active ? 'Active' : 'Suspended'}
        </span>
      </td>
      <td className="py-3 px-4">{new Date(user.created_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
      <td className="py-3 px-4 flex items-center gap-2">
        <button
          disabled={pending}
          onClick={() => startToggle(() => toggleUserActive(user.id))}
          className="text-xs px-3 py-1 rounded border hover:bg-muted transition-colors disabled:opacity-50"
        >
          {togglePending ? '...' : user.is_active ? 'Suspend' : 'Unsuspend'}
        </button>
        <button
          disabled={pending}
          onClick={handleDelete}
          className="text-xs px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deletePending ? '...' : 'Delete'}
        </button>
      </td>
    </tr>
  )
}
