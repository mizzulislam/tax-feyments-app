'use client';

import { useState, useRef, useEffect, Children, isValidElement } from 'react';
import { useTaxpayerStore } from '@/store/useTaxpayerStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatQuiz from '@/components/ChatQuiz';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useFetchChatSessions, useCreateChatSession } from '@/hooks/useChatSessions';
import { useCreateChatMessage, useFetchChatMessages } from '@/hooks/useChatMessages';
import { useAiTaxContext } from '@/hooks/useAiTaxContext';
import { supabase } from '@/lib/supabase';
import { useAlert } from '@/contexts/AlertContext';
import AIResponseWrapper from '@/components/AIResponseWrapper';

export default function TaxAssistantChat() {
  const router = useRouter();
  const pathname = usePathname();
  const { showAlert } = useAlert();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const profile = useTaxpayerStore((state) => state.profile);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { data: sessions, error: sessionsError } = useFetchChatSessions();
  const createSession = useCreateChatSession();
  const isChatTableMissing = sessionsError?.message.includes('chat_sessions') ?? false;
  
  // Set the latest session as active by default if opening
  useEffect(() => {
    if (isOpen && !activeSessionId && sessions && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [isOpen, sessions, activeSessionId]);

  const { data: dbMessages = [] } = useFetchChatMessages(activeSessionId);
  const createMessage = useCreateChatMessage();
  const { data: aiTaxContext } = useAiTaxContext();

  // Temporary local state for streaming UI
  const [tempMessage, setTempMessage] = useState<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dbMessages, tempMessage]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (isChatTableMissing) {
      await showAlert('Perhatian', 'Tabel chat Fase 6 belum dibuat. Buka halaman AI Assistant untuk melihat SQL migrasi.', 'warning');
      return;
    }

    const userMessageText = input.trim();
    setInput('');
    setIsLoading(true);
    setTempMessage('');

    try {
      // 1. Ensure we have a session
      let currentSessionId = activeSessionId;
      if (!currentSessionId) {
        const newSession = await createSession.mutateAsync(userMessageText.substring(0, 30));
        currentSessionId = newSession.id;
        setActiveSessionId(currentSessionId);
      } else if (dbMessages.length === 0) {
        // Update title if it's the first message
        await supabase.from('chat_sessions').update({ title: userMessageText.substring(0, 30) }).eq('id', currentSessionId);
      }

      // 2. Save User Message to DB
      await createMessage.mutateAsync({
        session_id: currentSessionId,
        role: 'user',
        content: userMessageText
      });

      // 3. Format history for API
      const historyForApi = dbMessages.slice(-10).map(m => ({
        role: m.role,
        text: m.content
      }));

      // 4. Fetch from API (Streaming)
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          message: userMessageText,
          context: profile,
          aiContext: aiTaxContext,
          sessionId: currentSessionId,
          persona: 'umum',
          tone: 'jelas',
          history: historyForApi
        }),
      });

      if (!res.ok) throw new Error('Gagal mendapatkan respon AI');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) throw new Error('Streaming tidak didukung');

      let aiResponseText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiResponseText += chunk;
        setTempMessage(aiResponseText);
      }

      // 5. Save AI Response to DB
      await createMessage.mutateAsync({
        session_id: currentSessionId,
        role: 'ai',
        content: aiResponseText,
        metadata: {
          isHighRisk: res.headers.get('X-High-Risk') === 'true',
          model: res.headers.get('X-Model-Used')
        }
      });

      setTempMessage('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal memproses jawaban AI.';
      await showAlert('Gagal', `Error: ${message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (pathname === '/dashboard/assistant' || pathname.startsWith('/dashboard/assistant/')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[400px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[70vh] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200">
          <div className="p-4 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">My Tax</h3>
                <p className="text-xs text-blue-400">Asisten Edukasi Pajak</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {dbMessages.length === 0 && !tempMessage && (
              <div className="text-center text-slate-400 text-sm mt-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                </div>
                <p>Halo! Saya adalah asisten edukasi pajak.</p>
                <p className="mt-1 opacity-80 leading-relaxed">Saya dapat membaca draf data Anda dan menjawab pertanyaan seputar regulasi pajak UU HPP terkini.</p>
                <Link 
                  href="/dashboard/assistant" 
                  onClick={() => setIsOpen(false)}
                  className="inline-block mt-4 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-4 py-2 rounded-lg transition-colors"
                >
                  Lihat Riwayat Obrolan &rarr;
                </Link>
              </div>
            )}
            
            {dbMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                  {msg.role === 'ai' ? (
                    <div className="prose prose-invert prose-xs md:prose-sm max-w-none prose-p:leading-[1.7] prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent">
                      <AIResponseWrapper isHighRisk={(msg as any).metadata?.isHighRisk}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          pre({ children }) {
                            const childrenArray = Children.toArray(children);
                            const isQuiz = childrenArray.some((child) => {
                              if (!isValidElement<{ className?: string; children?: React.ReactNode }>(child)) {
                                return false;
                              }
                              return (
                                child.props.className?.includes('language-quiz') ||
                                String(child.props.children || '').includes('"quizzes"')
                              );
                            });
                            if (isQuiz) {
                              return <>{children}</>;
                            }
                            return (
                              <pre className="my-4 overflow-x-auto rounded-2xl bg-slate-950 border border-slate-700 p-4 font-mono text-xs text-slate-300">
                                {children}
                              </pre>
                            );
                          },
                          hr() {
                            return <hr className="border-slate-800/30 my-6" />;
                          },
                          code({ className, children, ...props }) {
                            const match = /language-quiz/.exec(className || '');
                            const isQuiz = match || className?.includes('language-quiz') || String(children).includes('"quizzes"');
                            if (isQuiz) {
                              return <ChatQuiz content={String(children)} isGenerating={isLoading} />;
                            }
                            return (
                              <code className="bg-transparent px-0 py-0 rounded-none text-blue-400 font-sans font-bold text-[12px] sm:text-[13px] border-0" {...props}>
                                {children}
                              </code>
                            );
                          },
                          blockquote({ children }) {
                            return (
                              <div className="my-5 p-5 bg-gradient-to-br from-indigo-950/30 to-blue-950/20 border-l-4 border-blue-500 rounded-r-3xl text-slate-300 italic shadow-[inset_0_1px_3px_rgba(59,130,246,0.05)] relative overflow-hidden">
                                <span className="absolute -top-2 -left-1 text-6xl font-serif text-blue-500/10 select-none pointer-events-none">“</span>
                                <div className="relative z-10 text-[13px] sm:text-[14px] leading-[1.7]">{children}</div>
                              </div>
                            );
                          },
                          h3({ children }) {
                            return (
                              <div className="mt-6 mb-4 p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900/60 border border-blue-500/20 border-l-4 border-l-blue-500 text-white font-black text-xs sm:text-sm flex items-center gap-3 shadow-[0_4px_20px_rgba(59,130,246,0.05)] select-none">
                                {children}
                              </div>
                            );
                          },
                          h4({ children }) {
                            return <h4 className="text-xs font-black text-slate-300 mt-5 mb-2.5 uppercase tracking-wider">{children}</h4>;
                          },
                          strong({ children }) {
                            return (
                              <strong className="text-blue-400 font-black bg-transparent px-0 py-0 rounded-none border-0 inline">
                                {children}
                              </strong>
                            );
                          },
                          p({ children }) {
                            return <p className="text-[13px] sm:text-[14px] leading-[1.7] text-slate-300 mb-4 whitespace-normal break-words">{children}</p>;
                          },
                          ul({ children }) {
                            return <ul className="list-disc pl-5 space-y-2 mb-4 text-[13px] sm:text-[14px] text-slate-300 leading-[1.7]">{children}</ul>;
                          },
                          ol({ children }) {
                            return <ol className="list-decimal pl-5 space-y-2 mb-4 text-[13px] sm:text-[14px] text-slate-300 leading-[1.7]">{children}</ol>;
                          },
                          li({ children }) {
                            return <li className="leading-[1.7] hover:text-slate-200 transition-colors duration-150">{children}</li>;
                          },
                          table({ children }) {
                            return (
                              <div className="overflow-x-auto my-5 rounded-2xl border border-slate-700 bg-slate-950/40 backdrop-blur-sm shadow-xl max-w-full">
                                <table className="w-full text-left border-collapse text-xs sm:text-sm text-slate-300">
                                  {children}
                                </table>
                              </div>
                            );
                          },
                          thead({ children }) {
                            return <thead className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-b border-slate-700 text-white select-none">{children}</thead>;
                          },
                          th({ children }) {
                            return <th className="p-4 font-black border-r border-slate-700 last:border-r-0 tracking-wide uppercase text-[10px] text-slate-400 text-center">{children}</th>;
                          },
                          td({ children }) {
                            const text = Array.isArray(children) 
                              ? children.map(c => String(c)).join('').trim() 
                              : String(children).trim();
                            const pctMatch = /^(\d+(?:\.\d+)?)\s*%$/.exec(text);
                            if (pctMatch) {
                              const value = parseFloat(pctMatch[1]);
                              return (
                                <td className="p-4 border-r border-slate-700 last:border-r-0 border-b border-slate-700 last:border-b-0 font-extrabold text-blue-400">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-xs">{text}</span>
                                    <div className="w-12 h-1.5 bg-slate-950 rounded-full overflow-hidden hidden xs:block">
                                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${Math.min(100, value * 2)}%` }}></div>
                                    </div>
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td className="p-4 border-r border-slate-700 last:border-r-0 border-b border-slate-700 last:border-b-0 font-medium">
                                {children}
                              </td>
                            );
                          },
                          tr({ children }) {
                            return <tr className="hover:bg-blue-500/5 border-b border-slate-700 last:border-b-0 transition-colors duration-150">{children}</tr>;
                          },
                          a({ href, children }) {
                            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-bold transition-colors">{children}</a>;
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      </AIResponseWrapper>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {tempMessage && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-md bg-slate-800 text-slate-200 rounded-tl-sm">
                  <div className="prose prose-invert prose-xs md:prose-sm max-w-none prose-p:leading-[1.7] prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent">
                    <AIResponseWrapper>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        pre({ children }) {
                          const childrenArray = Children.toArray(children);
                          const isQuiz = childrenArray.some((child) => {
                            if (!isValidElement<{ className?: string; children?: React.ReactNode }>(child)) {
                              return false;
                            }
                            return (
                              child.props.className?.includes('language-quiz') ||
                              String(child.props.children || '').includes('"quizzes"')
                            );
                          });
                          if (isQuiz) {
                            return <>{children}</>;
                          }
                          return (
                            <pre className="my-4 overflow-x-auto rounded-2xl bg-slate-950 border border-slate-700 p-4 font-mono text-xs text-slate-300">
                              {children}
                            </pre>
                          );
                        },
                        hr() {
                          return <hr className="border-slate-800/30 my-6" />;
                        },
                        code({ className, children, ...props }) {
                          const match = /language-quiz/.exec(className || '');
                          const isQuiz = match || className?.includes('language-quiz') || String(children).includes('"quizzes"');
                          if (isQuiz) {
                            return <ChatQuiz content={String(children)} isGenerating={isLoading} />;
                          }
                          return (
                            <code className="bg-transparent px-0 py-0 rounded-none text-blue-400 font-sans font-bold text-[12px] sm:text-[13px] border-0" {...props}>
                              {children}
                            </code>
                          );
                        },
                        blockquote({ children }) {
                          return (
                            <div className="my-5 p-5 bg-gradient-to-br from-indigo-950/30 to-blue-950/20 border-l-4 border-blue-500 rounded-r-3xl text-slate-300 italic shadow-[inset_0_1px_3px_rgba(59,130,246,0.05)] relative overflow-hidden">
                              <span className="absolute -top-2 -left-1 text-6xl font-serif text-blue-500/10 select-none pointer-events-none">“</span>
                              <div className="relative z-10 text-[13px] sm:text-[14px] leading-[1.7]">{children}</div>
                            </div>
                          );
                        },
                        h3({ children }) {
                          return (
                            <div className="mt-6 mb-4 p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900/60 border border-blue-500/20 border-l-4 border-l-blue-500 text-white font-black text-xs sm:text-sm flex items-center gap-3 shadow-[0_4px_20px_rgba(59,130,246,0.05)] select-none">
                              {children}
                            </div>
                          );
                        },
                        h4({ children }) {
                          return <h4 className="text-xs font-black text-slate-300 mt-5 mb-2.5 uppercase tracking-wider">{children}</h4>;
                        },
                        strong({ children }) {
                          return (
                            <strong className="text-blue-400 font-black bg-transparent px-0 py-0 rounded-none border-0 inline">
                              {children}
                            </strong>
                          );
                        },
                        p({ children }) {
                          return <p className="text-[13px] sm:text-[14px] leading-[1.7] text-slate-300 mb-4 whitespace-normal break-words">{children}</p>;
                        },
                        ul({ children }) {
                          return <ul className="list-disc pl-5 space-y-2 mb-4 text-[13px] sm:text-[14px] text-slate-300 leading-[1.7]">{children}</ul>;
                        },
                        ol({ children }) {
                          return <ol className="list-decimal pl-5 space-y-2 mb-4 text-[13px] sm:text-[14px] text-slate-300 leading-[1.7]">{children}</ol>;
                        },
                        li({ children }) {
                          return <li className="leading-[1.7] hover:text-slate-200 transition-colors duration-150">{children}</li>;
                        },
                        table({ children }) {
                          return (
                            <div className="overflow-x-auto my-5 rounded-2xl border border-slate-700 bg-slate-950/40 backdrop-blur-sm shadow-xl max-w-full">
                              <table className="w-full text-left border-collapse text-xs sm:text-sm text-slate-300">
                                {children}
                              </table>
                            </div>
                          );
                        },
                        thead({ children }) {
                          return <thead className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-b border-slate-700 text-white select-none">{children}</thead>;
                        },
                        th({ children }) {
                          return <th className="p-4 font-black border-r border-slate-700 last:border-r-0 tracking-wide uppercase text-[10px] text-slate-400 text-center">{children}</th>;
                        },
                        td({ children }) {
                          const text = Array.isArray(children) 
                            ? children.map(c => String(c)).join('').trim() 
                            : String(children).trim();
                          const pctMatch = /^(\d+(?:\.\d+)?)\s*%$/.exec(text);
                          if (pctMatch) {
                            const value = parseFloat(pctMatch[1]);
                            return (
                              <td className="p-4 border-r border-slate-700 last:border-r-0 border-b border-slate-700 last:border-b-0 font-extrabold text-blue-400">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-xs">{text}</span>
                                  <div className="w-12 h-1.5 bg-slate-950 rounded-full overflow-hidden hidden xs:block">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${Math.min(100, value * 2)}%` }}></div>
                                  </div>
                                </div>
                              </td>
                            );
                          }
                          return (
                            <td className="p-4 border-r border-slate-700 last:border-r-0 border-b border-slate-700 last:border-b-0 font-medium">
                              {children}
                            </td>
                          );
                        },
                        tr({ children }) {
                          return <tr className="hover:bg-blue-500/5 border-b border-slate-700 last:border-b-0 transition-colors duration-150">{children}</tr>;
                        },
                        a({ href, children }) {
                          return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-bold transition-colors">{children}</a>;
                        },
                      }}
                    >
                      {tempMessage}
                    </ReactMarkdown>
                    </AIResponseWrapper>
                  </div>
                </div>
              </div>
            )}
            
            {isLoading && !tempMessage && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex gap-1.5 items-center shadow-md">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 bg-slate-800/50 border-t border-slate-700/50">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya seputar pajak..."
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-full pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 w-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
              >
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            router.push('/dashboard/assistant');
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center hover:scale-110 transition-transform focus:outline-none"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
        )}
      </button>
    </div>
  );
}
