"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, CalendarCheck } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

type Message = { from: "bot" | "user"; text: string; action?: "book" };

const FAQ_EN = [
  {
    keywords: ["ai", "know", "patient", "speaking", "notice", "real"],
    answer:
      "Mosaed uses natural Arabic conversation. Most patients won't notice. We recommend a brief intro like \"You're speaking with Mosaed, the clinic's assistant\" to build trust.",
  },
  {
    keywords: ["phone", "number", "existing", "change", "current"],
    answer:
      "Yes! Mosaed connects to your current clinic number through call forwarding. No number change needed.",
  },
  {
    keywords: ["scheduling", "system", "integrate", "software", "compatible"],
    answer:
      "We integrate with most major clinic management systems in Saudi Arabia. Our team ensures compatibility during setup.",
  },
  {
    keywords: ["setup", "long", "time", "how long", "start", "live"],
    answer:
      "Most clinics go live within 48 hours. No technical expertise required from your side.",
  },
  {
    keywords: ["handle", "emergency", "cannot", "transfer", "human"],
    answer:
      "If a call needs human attention — emergencies or complex medical questions — Mosaed transfers to your staff or takes a message for immediate callback.",
  },
  {
    keywords: ["cost", "price", "pricing", "how much", "pay", "plan"],
    answer:
      "We offer plans based on clinic size and call volume. Book a free demo and we'll provide a custom quote.",
  },
  {
    keywords: ["book", "demo", "appointment", "try", "start", "get started"],
    answer:
      "Great! I'd love to set you up with a free demo. Click the button below to book your slot.",
    action: "book" as const,
  },
  {
    keywords: ["arabic", "language", "saudi", "speak"],
    answer:
      "Mosaed speaks Saudi Arabic fluently. Patients feel like they're talking to a real receptionist, not a machine.",
  },
  {
    keywords: ["missed", "call", "after hours", "24/7", "night", "weekend"],
    answer:
      "Mosaed answers every call — 11 PM, Friday prayer, Eid, weekends. Your clinic never misses a patient call again.",
  },
  {
    keywords: ["reminder", "no-show", "sms", "whatsapp", "cancel"],
    answer:
      "Automated SMS and WhatsApp reminders reduce no-shows by up to 35%. Patients can confirm, cancel, or reschedule automatically.",
  },
];

const FAQ_AR = [
  {
    keywords: ["ذكاء", "اصطناعي", "يعرفون", "مرضى", "حقيقي"],
    answer:
      "مساعد يستخدم محادثة عربية طبيعية. أغلب المرضى ما بيلاحظون. ننصح بمقدمة بسيطة مثل \"أنت تتكلم مع مساعد\" لبناء الثقة.",
  },
  {
    keywords: ["رقم", "هاتف", "حالي", "تغيير"],
    answer: "نعم! مساعد يتصل برقم عيادتك الحالي عن طريق تحويل المكالمات. ما تحتاج تغير رقمك.",
  },
  {
    keywords: ["نظام", "أنظمة", "تكامل", "برنامج"],
    answer: "نتكامل مع أغلب أنظمة إدارة العيادات في السعودية. فريقنا يتأكد من التوافق خلال التفعيل.",
  },
  {
    keywords: ["تفعيل", "وقت", "كم", "يأخذ", "بداية"],
    answer: "أغلب العيادات تبدأ خلال ٤٨ ساعة. ما تحتاج أي خبرة تقنية.",
  },
  {
    keywords: ["تكلفة", "سعر", "كم", "خطة", "أسعار"],
    answer: "نقدم خطط حسب حجم العيادة وعدد الاتصالات. احجز عرض مجاني ونعطيك عرض سعر مخصص.",
    action: "book" as const,
  },
  {
    keywords: ["حجز", "عرض", "موعد", "تجربة", "أبدأ"],
    answer: "ممتاز! خلني أساعدك تحجز عرض مجاني. اضغط الزر تحت لحجز موعدك.",
    action: "book" as const,
  },
];

function findAnswer(
  text: string,
  locale: "ar" | "en"
): { answer: string; action?: "book" } | null {
  const lower = text.toLowerCase();
  const faq = locale === "ar" ? FAQ_AR : FAQ_EN;
  let best: (typeof faq)[number] | null = null;
  let bestScore = 0;
  for (const item of faq) {
    const score = item.keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  if (best && bestScore > 0) {
    return { answer: best.answer, action: best.action };
  }
  return null;
}

const SUGGESTIONS_EN = [
  "How does it work?",
  "How much does it cost?",
  "Book a demo",
  "Does it speak Arabic?",
];
const SUGGESTIONS_AR = [
  "كيف يشتغل؟",
  "كم التكلفة؟",
  "أبي أحجز عرض",
  "يتكلم عربي؟",
];

export default function ChatBubble({
  locale,
}: {
  locale: "ar" | "en";
  dict: Dictionary;
}) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => {
      setExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 300);
    };
    window.addEventListener("open-chat", handler);
    return () => window.removeEventListener("open-chat", handler);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const addBotReply = useCallback(
    (text: string, action?: "book") => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [...prev, { from: "bot", text, action }]);
      }, 800 + Math.random() * 600);
    },
    []
  );

  const handleSend = useCallback(
    (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed) return;
      setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
      if (!text) setInput("");

      const match = findAnswer(trimmed, locale);
      if (match) {
        addBotReply(match.answer, match.action);
      } else {
        addBotReply(
          locale === "ar"
            ? "شكراً لسؤالك! فريقنا بيتواصل معك قريباً. تقدر تحجز عرض مجاني مباشرة من هنا."
            : "Great question! Our team will follow up shortly. You can also book a free demo right away.",
          "book"
        );
      }
    },
    [input, locale, addBotReply]
  );

  const suggestions = locale === "ar" ? SUGGESTIONS_AR : SUGGESTIONS_EN;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-5 pointer-events-none transition-all duration-500 ${
        expanded ? "pb-0" : ""
      }`}
    >
      <div
        className={`pointer-events-auto w-full max-w-2xl transition-all duration-500 ease-out ${
          expanded ? "max-w-2xl" : ""
        }`}
      >
        {/* Expanded chat panel */}
        <div
          className={`transition-all duration-500 ease-out overflow-hidden ${
            expanded
              ? "max-h-[480px] opacity-100 mb-0"
              : "max-h-0 opacity-0 mb-0"
          }`}
        >
          <div className="chat-bar-panel rounded-t-2xl overflow-hidden flex flex-col" style={{ height: expanded ? "420px" : "0" }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border/20 bg-white/50 backdrop-blur-sm shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">Mosaed AI</div>
                <div className="text-[11px] text-muted flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  {locale === "ar" ? "متصل الآن · اسألني أي شيء" : "Online · Ask me anything"}
                </div>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="w-7 h-7 rounded-full hover:bg-border/20 flex items-center justify-center transition-colors"
                aria-label="Close chat"
              >
                <X size={14} className="text-muted" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && !typing && (
                <div className="text-center py-6">
                  <Sparkles size={28} className="text-primary/30 mx-auto mb-3" />
                  <p className="text-sm text-muted mb-4">
                    {locale === "ar"
                      ? "مرحباً! اسألني عن مساعد أو احجز عرض مجاني"
                      : "Ask me anything about Mosaed or book a free demo"}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="px-3 py-1.5 text-xs rounded-full border border-border/40 text-foreground/70 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all duration-200"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex flex-col gap-2 max-w-[80%]">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.from === "user"
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-border/15 text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.action === "book" && msg.from === "bot" && (
                      <a
                        href="#final-cta"
                        onClick={() => setExpanded(false)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors w-fit"
                      >
                        <CalendarCheck size={14} />
                        {locale === "ar" ? "احجز عرض مجاني" : "Book a Free Demo"}
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-border/15 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>
        </div>

        {/* Bottom input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!expanded) {
              setExpanded(true);
              setTimeout(() => inputRef.current?.focus(), 300);
              return;
            }
            handleSend();
          }}
          className={`chat-bar-glow relative flex items-center gap-3 px-5 py-3 ${
            expanded ? "rounded-b-2xl" : "rounded-2xl"
          }`}
        >
          <div className="flex items-center gap-2 text-primary/50">
            <MessageCircle size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              if (!expanded) setExpanded(true);
            }}
            placeholder={
              locale === "ar"
                ? "اسأل عن مساعد... مثلاً: كم التكلفة؟"
                : "Ask about Mosaed... e.g. How does it work?"
            }
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/60 outline-none"
          />
          <button
            type="submit"
            className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors shrink-0"
            aria-label="Send message"
          >
            <Send size={15} className="text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
