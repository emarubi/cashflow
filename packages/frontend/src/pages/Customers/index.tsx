import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebtors } from "@/hooks/useDebtors";
import CustomersTable from "./CustomersTable";
import CustomersToolbar from "./CustomersToolbar";

function useDebounce(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  const handler = useCallback(
    (v: string) => {
      const timer = setTimeout(() => setDebounced(v), delay);
      return () => clearTimeout(timer);
    },
    [delay],
  );
  return { debounced, handler };
}

export default function CustomersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { debounced: debouncedSearch, handler: handleSearchChange } =
    useDebounce(search);

  function onSearch(v: string) {
    setSearch(v);
    handleSearchChange(v);
  }

  const {
    debtors,
    loading,
    error,
    totalCount,
    from,
    to,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
  } = useDebtors(debouncedSearch ? { search: debouncedSearch } : undefined);

  const totalOutstanding = debtors.reduce(
    (sum: number, d: { outstandingAmount: number }) =>
      sum + (d.outstandingAmount ?? 0),
    0,
  );

  const formattedTotal = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(totalOutstanding);

  return (
    <div className="p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {t("nav.customers")}
        </h1>
      </div>

      {/* Toolbar */}
      <CustomersToolbar search={search} onSearch={onSearch} />

      {/* Table */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-40 text-sm text-gray-500">
            {t("common.loading")}
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-40 text-sm text-red-500">
            {t("common.error")}
          </div>
        )}

        {!loading && !error && <CustomersTable debtors={debtors} />}
      </div>

      {/* Footer: pagination + total */}
      {!loading && !error && (
        <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <button
              onClick={prevPage}
              disabled={!hasPrevPage}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            <span>
              {t("customers.pagination", { from, to, total: totalCount })}
            </span>
            <button
              onClick={nextPage}
              disabled={!hasNextPage}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>

          <div className="text-gray-700 font-medium">
            {t("customers.total_outstanding")}{" "}
            <span className="text-gray-900">{formattedTotal}</span>
          </div>
        </div>
      )}
    </div>
  );
}
