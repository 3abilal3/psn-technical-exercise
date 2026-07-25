import { useEffect, useMemo, useRef, useState } from 'react';
import type { AssistantContext } from '../types';
import { answerQuestion, getSuggestedQuestions } from '../data/askData';
import {
  formatReportForClipboard,
  generateEditorReport,
} from '../data/editorReport';
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ClipboardCopy,
  Lightbulb,
  MessageSquare,
  Minus,
  Send,
  Sparkles,
  Target,
} from 'lucide-react';
import './EditorAssistant.css';

interface EditorAssistantProps {
  context: AssistantContext;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function EditorAssistant({ context }: EditorAssistantProps) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => getSuggestedQuestions(), []);
  const contextKey = useMemo(
    () =>
      [
        context.filters.account,
        context.filters.videoType,
        context.filters.dateFrom,
        context.filters.dateTo,
        context.searchQuery,
        context.kpis.totalViews,
        context.kpis.videoCount,
      ].join('|'),
    [context],
  );

  const report = useMemo(() => generateEditorReport(context), [context, contextKey]);

  useEffect(() => {
    setGenerating(true);
    setMessages([]);
    const timer = window.setTimeout(() => setGenerating(false), 700);
    return () => window.clearTimeout(timer);
  }, [contextKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleAsk = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const reply = answerQuestion(trimmed, context);
    const stamp = Date.now();

    setQuestion('');
    setMessages((prev) => [
      ...prev,
      { id: `${stamp}-user`, role: 'user', text: trimmed },
      { id: `${stamp}-assistant`, role: 'assistant', text: reply },
    ]);
  };

  const handleCopy = async () => {
    const text = formatReportForClipboard(report, context);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const MomentumIcon =
    report.momentum?.direction === 'up'
      ? ArrowUpRight
      : report.momentum?.direction === 'down'
        ? ArrowDownRight
        : Minus;

  return (
    <section className="editor-assistant" aria-labelledby="editor-assistant-title">
      <div className="assistant-shell">
        <div className="assistant-top">
          <div className="assistant-brand">
            <span className="assistant-badge">
              <Sparkles size={14} />
              AI editorial brief
            </span>
            <h2 id="editor-assistant-title">What your data is telling the team</h2>
            <p>
              Auto-generated from your current filters — summary, actions, and natural-language Q&amp;A.
            </p>
          </div>

          <button type="button" className="assistant-copy-btn" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <ClipboardCopy size={16} />}
            {copied ? 'Copied' : 'Copy brief'}
          </button>
        </div>

        <div className="assistant-headline-row">
          {generating ? (
            <p className="assistant-headline shimmer">Analysing {context.kpis.videoCount.toLocaleString('en-GB')} videos…</p>
          ) : (
            <>
              <p key={contextKey} className="assistant-headline">{report.headline}</p>
              {report.momentum && (
                <span className={`momentum-pill momentum-${report.momentum.direction}`}>
                  <MomentumIcon size={14} />
                  {report.momentum.label}
                </span>
              )}
            </>
          )}
        </div>

        <div className="assistant-body">
          <div className="assistant-column assistant-summary">
            <span className="assistant-label">Summary</span>
            {generating ? (
              <div className="assistant-skeleton">
                <span />
                <span />
                <span />
              </div>
            ) : (
              <div className="assistant-copy">
                {report.summary.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            )}

            <span className="assistant-label assistant-label-spaced">Recommended actions</span>
            <div className="assistant-actions">
              {report.recommendations.map((item) => (
                <article key={item.id} className={`action-card priority-${item.priority}`}>
                  <div className="action-icon">
                    <Lightbulb size={16} />
                  </div>
                  <div>
                    <span className="action-priority">{item.priority}</span>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="assistant-column assistant-side">
            <span className="assistant-label">28-day watch list</span>
            <ul className="watch-list">
              {report.watchList.length === 0 ? (
                <li className="watch-empty">No standouts in the last 28 days for these filters.</li>
              ) : (
                report.watchList.map((item) => (
                  <li key={item.rank}>
                    <span className="watch-rank">{item.rank}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <span className="watch-meta">
                        {item.channel} · {item.views.toLocaleString('en-GB')} views
                      </span>
                      <p>{item.reason}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>

            <span className="assistant-label assistant-label-spaced">Ask the data</span>
            <form
              className="assistant-form"
              onSubmit={(event) => {
                event.preventDefault();
                handleAsk(question);
              }}
            >
              <MessageSquare size={16} />
              <input
                type="text"
                value={question}
                placeholder="e.g. What should we publish next?"
                onChange={(event) => setQuestion(event.target.value)}
              />
              <button type="submit" aria-label="Ask">
                <Send size={16} />
              </button>
            </form>

            <div className="assistant-suggestions">
              {suggestions.map((item) => (
                <button key={item} type="button" onClick={() => handleAsk(item)}>
                  {item}
                </button>
              ))}
            </div>

            {messages.length > 0 && (
              <div className="assistant-thread">
                {messages.map((message) => (
                  <div key={message.id} className={`thread-bubble thread-${message.role}`}>
                    {message.role === 'assistant' && (
                      <span className="thread-label">
                        <Target size={12} />
                        Answer
                      </span>
                    )}
                    <p>{message.text}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
