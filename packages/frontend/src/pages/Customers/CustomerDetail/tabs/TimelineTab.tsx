import { useTranslation } from "react-i18next";
import { useDebtorTimeline } from "@/hooks/useDebtorTimeline";

const CHANNEL_ICONS: Record<string, string> = {
  email: "✉",
  call: "📞",
  letter: "📄",
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatCurrency(n: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

interface TimelineTabProps {
  debtorId: string;
}

export default function TimelineTab({ debtorId }: TimelineTabProps) {
  const { t } = useTranslation();
  const { events, loading, hasMore, loadMore } = useDebtorTimeline(debtorId);

  return (
    <div>
      {/* Top controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          {t("customer.tab_timeline")}
        </h3>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 rounded text-gray-600 hover:bg-gray-50">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            {t("customer.timeline_summarize")}
          </button>
          <button className="px-2.5 py-1 text-xs border border-gray-200 rounded text-gray-600 hover:bg-gray-50">
            {t("customer.timeline_add_note")}
          </button>
        </div>
      </div>

      {/* Events */}
      <div className="space-y-4">
        {loading && (
          <p className="text-xs text-gray-400 text-center py-4">
            {t("common.loading")}
          </p>
        )}

        {!loading && events.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            {t("customer.no_timeline")}
          </p>
        )}

        {events.map(
          (ev: {
            id: string;
            triggeredAt: string;
            result: string;
            action: { channel: string } | null;
            execution: {
              invoice: {
                id: string;
                number: string;
                amount: number;
                currency: string;
              };
            } | null;
          }) => (
            <div key={ev.id} className="flex gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                {ev.action ? (CHANNEL_ICONS[ev.action.channel] ?? "•") : "•"}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-800 font-medium capitalize">
                      {ev.action?.channel ?? "Event"}
                    </p>
                    {ev.execution?.invoice && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Invoice {ev.execution.invoice.number} —{" "}
                        {formatCurrency(
                          ev.execution.invoice.amount,
                          ev.execution.invoice.currency,
                        )}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded ${
                      ev.result === "sent"
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ev.result}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDateTime(ev.triggeredAt)}
                </p>
              </div>
            </div>
          ),
        )}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          className="mt-4 w-full text-xs text-blue-600 hover:underline py-2"
        >
          Load more
        </button>
      )}
    </div>
  );
}
