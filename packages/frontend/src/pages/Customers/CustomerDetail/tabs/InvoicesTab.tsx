import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebtorInvoices } from "@/hooks/useDebtorInvoices";

const STATUS_STYLES: Record<string, string> = {
  overdue: "text-red-600 bg-red-50",
  due: "text-yellow-700 bg-yellow-50",
  paid: "text-green-600 bg-green-50",
  in_dispute: "text-purple-600 bg-purple-50",
  draft: "text-gray-500 bg-gray-100",
};

function formatCurrency(n: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

interface InvoicesTabProps {
  debtorId: string;
}

export default function InvoicesTab({ debtorId }: InvoicesTabProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const {
    invoices,
    loading,
    totalCount,
    from,
    to,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
  } = useDebtorInvoices(debtorId);

  const filtered = search
    ? invoices.filter((inv: { number: string }) =>
        inv.number.toLowerCase().includes(search.toLowerCase()),
      )
    : invoices;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {t("customer.tab_invoices")}
        </h3>
        <button className="text-xs text-blue-600 hover:underline">
          {t("customer.view_all_invoices")}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">
                {t("customer.invoice_number")}
              </th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">
                {t("customer.invoice_status")}
              </th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">
                {t("customer.invoice_due_date")}
              </th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-right">
                {t("customer.invoice_outstanding")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-6 text-gray-400 text-xs"
                >
                  {t("common.loading")}
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-6 text-gray-400 text-xs"
                >
                  {t("customer.no_invoices")}
                </td>
              </tr>
            )}
            {filtered.map(
              (inv: {
                id: string;
                number: string;
                status: string;
                dueDate: string;
                outstanding: number;
                currency: string;
              }) => (
                <tr
                  key={inv.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-2 py-2.5 font-mono text-xs text-gray-800">
                    {inv.number}
                  </td>
                  <td className="px-2 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${STATUS_STYLES[inv.status] ?? "text-gray-600 bg-gray-100"}`}
                    >
                      {inv.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-gray-600 text-xs">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="px-2 py-2.5 text-right font-medium text-gray-900 text-xs">
                    {formatCurrency(inv.outstanding, inv.currency)}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={!hasPrevPage}
              className="hover:text-gray-700 disabled:opacity-40"
            >
              ‹
            </button>
            <span>
              {from}–{to} out of {totalCount}
            </span>
            <button
              onClick={nextPage}
              disabled={!hasNextPage}
              className="hover:text-gray-700 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
