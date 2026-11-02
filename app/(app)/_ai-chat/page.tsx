'use client';

import { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Transaction } from '@/types';
import { toast } from 'sonner';
import {
  Send,
  Paperclip,
  Loader2,
  Bot,
  User,
  Check,
  Upload,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';

interface ParsedTransaction {
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  transactions?: ParsedTransaction[] | null;
  filename?: string;
  file?: string;
}

export default function AIChatPage() {
  const { importTransactions } = useFinanceStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I'm **Kharcha AI**. I can help you with:\n\n- **Upload documents** (CSV, Excel, PDF) to extract and import transactions\n- **Ask questions** about your spending patterns\n- **Get advice** on budgeting and saving\n\nTry uploading a bank statement or ask me anything about your finances!",
      transactions: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTxns, setSelectedTxns] = useState<Record<string, boolean[]>>({});
  const [importingId, setImportingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    const file = selectedFile;

    if (!text && !file) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: file ? `Uploaded: ${file.name}` : text,
      file: file?.name,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSelectedFile(null);
    setLoading(true);

    try {
      let res: Response;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        res = await fetch('/api/ai-chat', { method: 'POST', body: formData });
      } else {
        res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        transactions: data.transactions,
        filename: data.filename,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.transactions) {
        setSelectedTxns((prev) => ({
          ...prev,
          [assistantMsg.id]: data.transactions.map(() => true),
        }));
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          transactions: null,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function toggleTxn(msgId: string, index: number) {
    setSelectedTxns((prev) => ({
      ...prev,
      [msgId]: prev[msgId].map((v, i) => (i === index ? !v : v)),
    }));
  }

  function toggleAllTxns(msgId: string) {
    setSelectedTxns((prev) => {
      const all = prev[msgId].every(Boolean);
      return { ...prev, [msgId]: prev[msgId].map(() => !all) };
    });
  }

  async function handleImport(msgId: string, txns: ParsedTransaction[]) {
    const selection = selectedTxns[msgId] || [];
    const selected = txns.filter((_, i) => selection[i]);
    if (selected.length === 0) return;

    setImportingId(msgId);
    try {
      const mapped: Omit<Transaction, 'id'>[] = selected.map((t) => {
        const d = new Date(t.date);
        if (isNaN(d.getTime())) throw new Error(`Invalid date: "${t.date}"`);
        return {
          date: d.toISOString(),
          amount: Math.round(Number(t.amount)),
          type: t.type,
          category: t.category as Transaction['category'],
          description: t.description,
        };
      });

      await importTransactions(mapped);
      toast.success(`Imported ${selected.length} transactions`);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: m.content + `\n\n*${selected.length} transactions imported successfully.*`, transactions: null } : m
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImportingId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] max-w-3xl mx-auto">
      <div className="flex items-center gap-2 py-3 px-1">
        <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Kharcha AI</h1>
        <Badge variant="secondary" className="text-[10px]">Beta</Badge>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 px-1 pb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />
              </div>
            )}
            <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'items-end' : ''}`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 dark:bg-white/[0.1] dark:border dark:border-white/[0.12] text-white rounded-br-sm'
                    : 'bg-zinc-100 dark:bg-white/[0.05] dark:border dark:border-white/[0.08] dark:backdrop-blur-sm text-zinc-800 dark:text-white/85 rounded-bl-sm'
                }`}
              >
                {msg.role === 'user' && msg.file && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-zinc-300 dark:text-zinc-600">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-xs">{msg.file}</span>
                  </div>
                )}
                <div
                  className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-ul:my-1"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              </div>

              {msg.transactions && msg.transactions.length > 0 && (
                <TransactionReview
                  msgId={msg.id}
                  transactions={msg.transactions}
                  selected={selectedTxns[msg.id] || []}
                  onToggle={toggleTxn}
                  onToggleAll={toggleAllTxns}
                  onImport={handleImport}
                  importing={importingId === msg.id}
                />
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />
            </div>
            <div className="bg-zinc-100 dark:bg-white/[0.05] dark:border dark:border-white/[0.08] dark:backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400 dark:text-zinc-300" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 dark:border-white/[0.06] px-1 py-3">
        {selectedFile && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08]">
            <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />
            <span className="text-xs text-zinc-700 dark:text-zinc-200 truncate flex-1">{selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="h-9 w-9 shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setSelectedFile(file);
              e.target.value = '';
            }}
            className="hidden"
          />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedFile ? 'Press Enter to upload...' : 'Ask about your finances or upload a document...'}
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] dark:backdrop-blur-sm px-4 py-2.5 text-sm text-zinc-900 dark:text-white/85 placeholder:text-zinc-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={loading || (!input.trim() && !selectedFile)}
            className="h-9 w-9 shrink-0 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TransactionReview({
  msgId,
  transactions,
  selected,
  onToggle,
  onToggleAll,
  onImport,
  importing,
}: {
  msgId: string;
  transactions: ParsedTransaction[];
  selected: boolean[];
  onToggle: (msgId: string, i: number) => void;
  onToggleAll: (msgId: string) => void;
  onImport: (msgId: string, txns: ParsedTransaction[]) => void;
  importing: boolean;
}) {
  const count = selected.filter(Boolean).length;
  const income = transactions.filter((t, i) => selected[i] && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t, i) => selected[i] && t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] dark:backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>Selected: <strong className="text-zinc-700 dark:text-zinc-300">{count}</strong></span>
          <span>Income: <strong className="text-zinc-500 dark:text-zinc-300">{formatCurrency(income)}</strong></span>
          <span>Expense: <strong className="text-rose-600">{formatCurrency(expense)}</strong></span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onToggleAll(msgId)} className="h-6 text-[10px] text-zinc-500">
          {selected.every(Boolean) ? 'Deselect all' : 'Select all'}
        </Button>
      </div>
      <div className="max-h-[250px] overflow-y-auto divide-y divide-zinc-100 dark:divide-white/[0.05]">
        {transactions.map((t, i) => (
          <div
            key={i}
            onClick={() => onToggle(msgId, i)}
            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors ${
              !selected[i] ? 'opacity-40' : ''
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
              selected[i] ? 'border-zinc-700 bg-zinc-700 dark:border-zinc-300 dark:bg-zinc-300' : 'border-zinc-300 dark:border-white/20'
            }`}>
              {selected[i] && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-900 dark:text-zinc-100 truncate">{t.description}</span>
                <Badge variant="secondary" className="text-[9px] shrink-0">{t.category}</Badge>
              </div>
              <span className="text-[10px] text-zinc-400">
                {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <span className={`text-xs font-semibold tabular-nums shrink-0 ${
              t.type === 'income' ? 'text-zinc-500 dark:text-zinc-300' : 'text-zinc-900 dark:text-zinc-100'
            }`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </span>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-zinc-100 dark:border-white/[0.06]">
        <Button
          size="sm"
          onClick={() => onImport(msgId, transactions)}
          disabled={count === 0 || importing}
          className="w-full h-8 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white gap-1.5"
        >
          {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Import {count} transactions
        </Button>
      </div>
    </div>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="list-disc pl-4">$1</ul>')
    .replace(/<\/ul>\s*<ul[^>]*>/g, '')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
