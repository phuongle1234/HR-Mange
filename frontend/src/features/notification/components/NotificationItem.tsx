import type { NotificationItem as NotificationItemType } from '../types/notification.types';

interface NotificationItemProps {
  item: NotificationItemType;
  onClick: (item: NotificationItemType) => void;
}

export function NotificationItem({ item, onClick }: NotificationItemProps) {
  return (
    <button type="button" onClick={() => onClick(item)} className={`w-full rounded-xl border p-3 text-left ${item.isRead ? 'border-slate-200 bg-white' : 'border-brand-200 bg-brand-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-900">{item.title}</p>
          <p className="mt-1 text-xs text-slate-600">{item.message}</p>
        </div>
        {!item.isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
    </button>
  );
}
