import { useMemo, useRef, useState } from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../../../shared/hooks/useClickOutside';
import { useNotificationsQuery } from '../hooks/useNotificationsQuery';
import { useMarkAllNotificationsReadMutation } from '../hooks/useMarkAllNotificationsReadMutation';
import { useMarkNotificationReadMutation } from '../hooks/useMarkNotificationReadMutation';
import type { NotificationItem } from '../types/notification.types';
import { NotificationItem as NotificationRow } from './NotificationItem';

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const notificationsQuery = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const unreadCount = useMemo(() => notificationsQuery.data?.meta.unreadCount ?? 0, [notificationsQuery.data]);
  const items = notificationsQuery.data?.items ?? [];

  useClickOutside(containerRef, () => setOpen(false), open);

  async function handleItemClick(item: NotificationItem) {
    if (!item.referenceId) {
      await markReadMutation.mutateAsync(item.id);
      setOpen(false);
      return;
    }

    await markReadMutation.mutateAsync(item.id);
    setOpen(false);
    navigate(`/workflow-requests/${encodeURIComponent(item.referenceId)}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50" aria-label="Open notifications">
        <Badge badgeContent={unreadCount > 0 ? unreadCount : 0} color="error" overlap="circular">
          <NotificationsIcon fontSize="small" />
        </Badge>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[360px] rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-slate-900">Notifications</p>
            <button type="button" onClick={() => markAllReadMutation.mutate()} className="text-xs font-bold text-brand-700">
              Mark all read
            </button>
          </div>

          <div className="max-h-80 space-y-2 overflow-auto">
            {items.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No notifications.</p>}
            {items.map((item) => (
              <NotificationRow key={item.id} item={item} onClick={handleItemClick} />
            ))}
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3 text-center">
            <button type="button" onClick={() => navigate('/workflow-requests/inbox')} className="text-sm font-black text-brand-700">
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
