'use client';

import { useEffect, useMemo, useState } from 'react';

import type { Flashcard, FlashcardDeck, FlashcardRating } from '@/lib/types';

interface FlashcardsPanelProps {
  userId?: string;
}

interface FlashcardQueuePayload {
  sessionId: string;
  mode: string;
  total: number;
  items: Flashcard[];
}

export function FlashcardsPanel({ userId }: FlashcardsPanelProps) {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [queue, setQueue] = useState<FlashcardQueuePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const cards = useMemo(() => queue?.items ?? [], [queue]);
  const currentCard = cards[currentIndex] ?? null;

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      setFeedback(null);

      const [decksResponse, queueResponse] = await Promise.all([
        fetch('/api/flashcards/decks?macroArea=fundamentos'),
        fetch(`/api/flashcards/queue?mode=today&limit=50${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`),
      ]);

      if (decksResponse.ok) {
        const payload = (await decksResponse.json()) as { items: FlashcardDeck[] };
        setDecks(Array.isArray(payload.items) ? payload.items : []);
      } else {
        setDecks([]);
      }

      if (queueResponse.ok) {
        const payload = (await queueResponse.json()) as FlashcardQueuePayload;
        setQueue(payload);
      } else {
        setQueue({ sessionId: '', mode: 'today', total: 0, items: [] });
      }

      setCurrentIndex(0);
      setSessionDone(false);
      setRevealed(false);
      setLoading(false);
    }

    void loadContent();
  }, [userId]);

  function revealAnswer() {
    if (!currentCard || sessionDone) return;
    setRevealed(true);
  }

  async function rateCard(rating: FlashcardRating) {
    if (!currentCard || sessionDone) return;

    if (userId) {
      const response = await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          flashcardId: currentCard.id,
          rating,
          sessionId: queue?.sessionId,
        }),
      });

      if (!response.ok) {
        setFeedback('Não foi possível registrar sua avaliação agora.');
        return;
      }
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= cards.length) {
      setFeedback('Sessão concluída. Volte amanhã para novas revisões.');
      setRevealed(false);
      setSessionDone(true);
      setCurrentIndex(cards.length);
      return;
    }

    setCurrentIndex(nextIndex);
    setRevealed(false);
    setFeedback(null);
  }

  return (
    <section className="section-card" aria-label="Sessão de flashcards">
      <header>
        <h2 className="text-xl font-bold">Flashcards</h2>
        <p className="mt-1 text-sm text-slate-600">
          Spaced repetition com avaliação por dificuldade para reforçar memorização.
        </p>
      </header>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Carregando fila de revisão...</p>
      ) : (
        <div className="mt-4 space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white">
            {!currentCard || sessionDone ? (
              <p className="text-sm text-white/80">Sem cartões para revisar neste momento.</p>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wide text-white/60">
                  Cartão {Math.min(currentIndex + 1, cards.length)} de {cards.length}
                </p>
                <h3 className="mt-2 text-xl font-bold">{revealed ? currentCard.back : currentCard.front}</h3>
                {revealed ? <p className="mt-2 text-sm text-white/70">{currentCard.explanation}</p> : null}

                {!revealed ? (
                  <button
                    type="button"
                    className="sim-action-btn sim-action-btn-primary mt-4"
                    onClick={revealAnswer}
                  >
                    Ver resposta
                  </button>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" className="sim-action-btn sim-action-btn-tertiary" onClick={() => void rateCard('again')}>Errei</button>
                    <button type="button" className="sim-action-btn sim-action-btn-tertiary" onClick={() => void rateCard('hard')}>Difícil</button>
                    <button type="button" className="sim-action-btn sim-action-btn-secondary" onClick={() => void rateCard('good')}>Bom</button>
                    <button type="button" className="sim-action-btn sim-action-btn-primary" onClick={() => void rateCard('easy')}>Fácil</button>
                  </div>
                )}
              </>
            )}
          </article>

          {feedback ? <p className="text-sm text-slate-700">{feedback}</p> : null}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Todos os decks</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {decks.map((deck, index) => (
                <article key={deck.id} className={`rounded-xl border p-4 ${index === 0 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {index === 0 ? 'Free' : 'Premium'}
                  </div>
                  <h4 className="mt-1 text-sm font-semibold text-slate-900">{deck.title}</h4>
                  <p className="mt-1 text-xs text-slate-600">{deck.cardsCount} cartões</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
