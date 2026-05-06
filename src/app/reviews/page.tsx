"use client";

import { useEffect, useMemo, useState } from "react";

type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type RatingBreakdown = {
  star: number;
  count: number;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 text-[#c9a45c]">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="text-lg">
          {star <= Math.round(rating) ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingBreakdown, setRatingBreakdown] = useState<RatingBreakdown[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [selectedRating, setSelectedRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadReviews() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reviews", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load reviews.");
      }

      setReviews(data.reviews);
      setAverageRating(Number(data.averageRating || 0));
      setTotalReviews(Number(data.totalReviews || 0));
      setRatingBreakdown(data.ratingBreakdown || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  const ratingText = useMemo(() => {
    if (totalReviews === 0) return "No reviews yet";
    return `${averageRating.toFixed(1)} out of 5`;
  }, [averageRating, totalReviews]);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          comment: formData.get("comment"),
          rating: selectedRating,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit review.");
      }

      setMessage("Thank you. Your review has been submitted.");
      form.reset();
      setSelectedRating(5);
      await loadReviews();
    } catch (err: any) {
      setError(err?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4eee4]">
      <section className="bg-[#1b0e0a] px-4 py-16 text-center text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#d7b875] sm:text-xs">
          Ravintola Sinet
        </p>

        <h1 className="mt-4 font-script text-[78px] leading-none sm:text-[112px]">
          Reviews
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
          Share your experience and see what customers say about Ravintola Sinet.
        </p>
      </section>

      <section className="sinet-container grid gap-8 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:py-14">
        <aside className="space-y-6">
          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
              Customer Rating
            </p>

            <h2 className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
              {averageRating.toFixed(1)}
            </h2>

            <div className="mt-2">
              <Stars rating={averageRating} />
            </div>

            <p className="mt-3 text-sm font-bold text-[#7b6255]">
              {ratingText} · {totalReviews} review
              {totalReviews === 1 ? "" : "s"}
            </p>

            <div className="mt-6 space-y-3">
              {ratingBreakdown.map((row) => {
                const percent =
                  totalReviews > 0 ? (row.count / totalReviews) * 100 : 0;

                return (
                  <div key={row.star} className="grid grid-cols-[52px_1fr_32px] items-center gap-3">
                    <span className="text-sm font-black text-[#3b1f18]">
                      {row.star} ★
                    </span>

                    <div className="h-3 overflow-hidden rounded-full bg-[#eadfce]">
                      <div
                        className="h-full rounded-full bg-[#c9a45c]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <span className="text-right text-xs font-bold text-[#7b6255]">
                      {row.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
              Write Review
            </p>

            <h2 className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
              Rate your experience
            </h2>

            <form onSubmit={submitReview} className="mt-6 space-y-5">
              <input
                name="name"
                required
                placeholder="Your name"
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              />

              <div>
                <label className="mb-3 block text-sm font-black text-[#3b1f18]">
                  Your rating
                </label>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className={`flex h-12 w-12 items-center justify-center rounded-full border text-xl font-black transition ${
                        selectedRating >= star
                          ? "border-[#c9a45c] bg-[#c9a45c] text-[#3b1f18]"
                          : "border-[#d8c9ac] bg-[#fffaf3] text-[#9c806b]"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                name="comment"
                required
                placeholder="Write your review..."
                className="min-h-32 w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              />

              <button
                type="submit"
                disabled={submitting}
                className="sinet-gold-button w-full disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>

              {message && (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}
            </form>
          </div>
        </aside>

        <section className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
                Reviews
              </p>

              <h2 className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
                Customer Feedback
              </h2>
            </div>

            <div className="hidden sm:block">
              <Stars rating={averageRating} />
            </div>
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-[#7b6255]">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-10 text-center text-sm text-[#7b6255]">
              No reviews yet. Be the first to review Ravintola Sinet.
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-display text-xl font-black text-[#3b1f18]">
                        {review.name}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-[#9c806b]">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>

                    <Stars rating={review.rating} />
                  </div>

                  <p className="mt-4 text-sm leading-7 text-[#7b6255]">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}