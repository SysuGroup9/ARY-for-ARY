import { useState } from "react";
import type { FeedbackThread } from "../types";

interface FeedbackPanelProps {
  threads: FeedbackThread[];
  onSend: (content: string, threadId?: string) => void;
  canResolve?: boolean;
  onResolve?: (threadId: string, content: string, markResolved: boolean) => void;
}

export function FeedbackPanel({
  threads,
  onSend,
  canResolve = false,
  onResolve,
}: FeedbackPanelProps) {
  return (
    <div className="feedback-panel">
      {threads.length === 0 ? (
        <div className="empty-panel">
          <strong>暂无反馈</strong>
          <p>Rider 发起问题后，会在这里展示消息线程。</p>
        </div>
      ) : null}

      {threads.map((thread) => (
        <FeedbackThreadView
          key={thread.id}
          thread={thread}
          onSend={onSend}
          canResolve={canResolve}
          onResolve={onResolve}
        />
      ))}
    </div>
  );
}

interface FeedbackThreadViewProps {
  thread: FeedbackThread;
  onSend: (content: string, threadId?: string) => void;
  canResolve: boolean;
  onResolve?: (threadId: string, content: string, markResolved: boolean) => void;
}

function FeedbackThreadView({
  thread,
  onSend,
  canResolve,
  onResolve,
}: FeedbackThreadViewProps) {
  return (
    <details className="thread-card" open>
      <summary>
        <span>线程 {thread.id.slice(-4)}</span>
        <span className={`thread-status thread-status--${thread.status}`}>
          {thread.status}
        </span>
      </summary>
      <div className="thread-body">
        {thread.messages.map((message) => (
          <div
            className={`message-bubble message-bubble--${message.authorRole}`}
            key={message.id}
          >
            <strong>{message.authorRole === "organizer" ? "Organizer" : "Rider"}</strong>
            <p>{message.content}</p>
          </div>
        ))}
        {canResolve && onResolve ? (
          <ReplyBox
            placeholder="回复队伍问题，并可直接标记为 resolved"
            submitLabel="回复"
            onSubmit={(content) => onResolve(thread.id, content, false)}
            secondaryLabel="回复并解决"
            onSecondarySubmit={(content) => onResolve(thread.id, content, true)}
          />
        ) : null}
        {!canResolve ? (
          <ReplyBox
            placeholder="补充问题或回应 Organizer"
            submitLabel="继续发送"
            onSubmit={(content) => onSend(content, thread.id)}
          />
        ) : null}
      </div>
    </details>
  );
}

interface ReplyBoxProps {
  placeholder: string;
  submitLabel: string;
  onSubmit: (content: string) => void;
  secondaryLabel?: string;
  onSecondarySubmit?: (content: string) => void;
}

function ReplyBox({
  placeholder,
  submitLabel,
  onSubmit,
  secondaryLabel,
  onSecondarySubmit,
}: ReplyBoxProps) {
  const [value, setValue] = useState("");

  return (
    <form
      className="reply-box"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) {
          return;
        }
        onSubmit(trimmed);
        setValue("");
      }}
    >
      <textarea
        name="content"
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        rows={3}
        value={value}
      />
      <div className="reply-box__actions">
        <button type="submit">{submitLabel}</button>
        {secondaryLabel && onSecondarySubmit ? (
          <button
            className="button-ghost"
            type="button"
            onClick={() => {
              const trimmed = value.trim();
              if (!trimmed) {
                return;
              }
              onSecondarySubmit(trimmed);
              setValue("");
            }}
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
