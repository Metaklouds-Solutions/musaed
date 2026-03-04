/**
 * Ticket chat thread. Messages with author and timestamp.
 */

import { useRef, useEffect } from 'react';
import type { TicketMessage } from '../../../shared/types/entities';

interface MessageWithAuthor extends TicketMessage {
  authorName: string;
}

interface TicketChatThreadProps {
  messages: MessageWithAuthor[];
  currentUserId?: string;
  onReply?: (body: string) => void;
  isReplyLoading?: boolean;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function TicketChatThread({
  messages,
  currentUserId,
  onReply,
  isReplyLoading,
}: TicketChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((m) => {
          const isOwn = m.authorId === currentUserId || m.authorId === 'admin';
          return (
            <div
              key={m.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                  isOwn
                    ? 'bg-[var(--ds-primary)] text-white'
                    : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)]'
                }`}
              >
                <p className="text-xs font-medium opacity-90 mb-0.5">{m.authorName}</p>
                <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'opacity-80' : 'text-[var(--text-muted)]'}`}>
                  {formatDateTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {onReply && (
        <form
          className="shrink-0 p-4 border-t border-[var(--border-subtle)]"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.querySelector<HTMLTextAreaElement>('textarea');
            const body = input?.value?.trim();
            if (body) {
              onReply(body);
              input.value = '';
            }
          }}
        >
          <div className="flex gap-2">
            <textarea
              name="reply"
              placeholder="Type your reply…"
              rows={2}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm resize-none"
              disabled={isReplyLoading}
            />
            <button
              type="submit"
              disabled={isReplyLoading}
              className="shrink-0 px-4 py-2.5 rounded-lg bg-[var(--ds-primary)] text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isReplyLoading ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
