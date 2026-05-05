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

  const totalCards = cards.length;
  const currentLabel = totalCards > 0 ? Math.min(currentIndex + 1, totalCards) : 0;
  const progressPct = totalCards > 0 ? (currentLabel / totalCards) * 100 : 0;

  function deckTopicTone(index: number) {
    if (index === 0) return 'var(--em)';
    if (index === 1) return 'var(--sap)';
    return 'var(--n300)';
  }

  return (
    <section aria-label="Sessão de flashcards">
      <div className="page-header">
        <div>
          <h2 className="page-title">Flashcards</h2>
          <p className="page-sub">
            Spaced repetition · revise no ritmo certo · nunca esqueça o que estudou.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="page-sub" style={{ marginTop: '1rem' }}>
          Carregando fila de revisão...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.2rem' }}>
          <article className="flash-review-card">
            {!currentCard || sessionDone ? (
              <p style={{ position: 'relative', color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                Sem cartões para revisar neste momento.
              </p>
            ) : (
              <>
                <div className="flash-review-top">
                  <div>
                    <p className="flash-review-meta">
                      Cartão {currentLabel} de {totalCards}
                    </p>
                    <p className="flash-review-question">
                      {revealed ? currentCard.back : currentCard.front}
                    </p>
                  </div>
                  <span className="flash-review-tag">Spaced repetition</span>
                </div>

                <div className="flash-review-counter">
                  <span className="flash-rc-num tabular">
                    {currentLabel}/{totalCards}
                  </span>
                  <span className="flash-rc-bar-bg">
                    <span
                      className="flash-rc-bar-fill"
                      style={{ width: `${progressPct}%` }}
                    />
                  </span>
                </div>

                <div
                  className={`flash-review-answer ${revealed ? 'is-revealed' : ''}`}
                  onClick={revealed ? undefined : revealAnswer}
                  role={revealed ? undefined : 'button'}
                  tabIndex={revealed ? undefined : 0}
                  onKeyDown={(event) => {
                    if (revealed) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      revealAnswer();
                    }
                  }}
                >
                  {revealed ? (
                    <span className="flash-review-answer-text">{currentCard.explanation}</span>
                  ) : (
                    <span className="flash-review-answer-hint">Clique para ver a resposta…</span>
                  )}
                </div>

                <div className="flash-review-actions">
                  {!revealed ? (
                    <button type="button" className="flash-btn-flip" onClick={revealAnswer}>
                      Ver resposta
                    </button>
                  ) : (
                    <div className="flash-srs-row">
                      <button
                        type="button"
                        className="flash-srs-btn again"
                        onClick={() => void rateCard('again')}
                      >
                        Errei
                      </button>
                      <button
                        type="button"
                        className="flash-srs-btn hard"
                        onClick={() => void rateCard('hard')}
                      >
                        Difícil
                      </button>
                      <button
                        type="button"
                        className="flash-srs-btn good"
                        onClick={() => void rateCard('good')}
                      >
                        Bom
                      </button>
                      <button
                        type="button"
                        className="flash-srs-btn easy"
                        onClick={() => void rateCard('easy')}
                      >
                        Fácil
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </article>

          {feedback ? <p className="page-sub">{feedback}</p> : null}

          <section>
            <p className="eyebrow" style={{ marginBottom: '0.7rem' }}>
              Todos os decks
            </p>
            <div className="flash-deck-grid">
              {decks.map((deck, index) => {
                const isFree = index === 0;
                return (
                  <article
                    key={deck.id}
                    className={`flash-deck-card ${isFree ? 'is-selected' : 'is-locked'}`}
                  >
                    <div
                      className="flash-deck-topic"
                      style={{ background: deckTopicTone(index) }}
                    >
                      {deck.title.slice(0, 2).toUpperCase()}
                    </div>
                    <h4 className="flash-deck-name">{deck.title}</h4>
                    <p className="flash-deck-count">
                      <span className="tabular">{deck.cardsCount}</span> cartões · {isFree ? 'Free' : 'Premium'}
                    </p>
                    <div className="flash-deck-prog-bg">
                      <div
                        className="flash-deck-prog-fill"
                        style={{ width: isFree ? '12%' : '0%' }}
                      />
                    </div>
                    <div className="flash-deck-prog-label">
                      <span>{isFree ? 'Em revisão' : 'Bloqueado'}</span>
                      <span>{isFree ? '—' : '—'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
