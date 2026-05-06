"use client";

import { useEffect, useMemo, useState } from "react";

type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 text-[#c9a45c]">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="text-base">
          {star <= Math.round(rating) ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadReviews() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/reviews", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load reviews.");
      }

      setReviews(data.reviews);
      setAverageRating(Number(data.averageRating || 0));
      setTotalReviews(Number(data.totalReviews || 0));
    } catch (err: any) {
      setError(err?.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const value = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesSearch = value
        ? review.id.toLowerCase().includes(value) ||
          review.name.toLowerCase().includes(value) ||
          review.comment.toLowerCase().includes(value)
        : true;

      const matchesRating = ratingFilter
        ? review.rating === Number(ratingFilter)
        : true;

      return matchesSearch && matchesRating;
    });
  }, [reviews, search, ratingFilter]);

  const allFilteredSelected =
    filteredReviews.length > 0 &&
    filteredReviews.every((review) => selectedIds.includes(review.id));

  function toggleSelectReview(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  }

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredReviews.some((review) => review.id === id))
      );
      return;
    }

    const ids = filteredReviews.map((review) => review.id);
    setSelectedIds((current) => Array.from(new Set([...current, ...ids])));
  }

  async function deleteReview(id: string) {
    const confirmed = window.confirm("Delete this review?");
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete review.");
      }

      setMessage("Review deleted.");
      await loadReviews();
    } catch (err: any) {
      setError(err?.message || "Failed to delete review.");
    } finally {
      setSaving(false);
    }
  }

  async function bulkDeleteReviews() {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected review(s)? This cannot be undone.`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete selected reviews.");
      }

      setSelectedIds([]);
      setMessage("Selected reviews deleted.");
      await loadReviews();
    } catch (err: any) {
      setError(err?.message || "Bulk delete failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <section className="border-b border-[#ddcfba] bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            Admin / Reviews
          </p>

          <h1 className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
            Customer Reviews
          </h1>

          <p className="mt-2 text-sm text-[#7b6255]">
            Moderate customer feedback and monitor restaurant rating.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {message && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
              Average
            </p>
            <p className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
              {averageRating.toFixed(1)}
            </p>
            <div className="mt-2">
              <Stars rating={averageRating} />
            </div>
          </div>

          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
              Total Reviews
            </p>
            <p className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
              {totalReviews}
            </p>
          </div>

          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
              Selected
            </p>
            <p className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
              {selectedIds.length}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-2xl font-black text-[#3b1f18]">
                Reviews
              </h2>
              <p className="mt-1 text-sm text-[#7b6255]">
                {filteredReviews.length} review
                {filteredReviews.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or comment..."
                className="rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              />

              <select
                value={ratingFilter}
                onChange={(event) => setRatingFilter(event.target.value)}
                className="rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              >
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} star
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex items-center gap-3 text-sm font-black text-[#3b1f18]">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                />
                Select all filtered
              </label>

              <button
                type="button"
                onClick={bulkDeleteReviews}
                disabled={saving || selectedIds.length === 0}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600 disabled:opacity-50"
              >
                Delete Selected
              </button>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-[#7b6255]">Loading reviews...</p>
          ) : filteredReviews.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-10 text-center text-sm text-[#7b6255]">
              No reviews found.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredReviews.map((review) => {
                const selected = selectedIds.includes(review.id);

                return (
                  <article
                    key={review.id}
                    className={`rounded-2xl border bg-[#fffaf3] p-4 transition ${
                      selected ? "border-[#3b1f18]" : "border-[#eadfce]"
                    }`}
                  >
                    <div className="flex gap-4">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelectReview(review.id)}
                        className="mt-2"
                      />

                      <div className="min-w-0 flex-1">
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

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => deleteReview(review.id)}
                            disabled={saving}
                            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}