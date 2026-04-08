import { useTranslation } from "react-i18next";
import { useDebtorPayments } from "@/hooks/useDebtorPayments";

const STATUS_STYLES: Record<string, string> = {
  success: "text-green-700 bg-green-50",
  pending: "text-yellow-700 bg-yellow-50",
  failed: "text-red-600 bg-red-50",
  refunded: "text-gray-600 bg-gray-100",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

interface PaymentsTabProps {
  debtorId: string;
}

export default function PaymentsTab({ debtorId }: PaymentsTabProps) {
  const { t } = useTranslation();
  const {
    payments,
    loading,
    totalCount,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
  } = useDebtorPayments(debtorId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {t("customer.tab_payments")}
        </h3>
        <button className="text-xs text-blue-600 hover:underline">
          {t("customer.view_all_payments")}
        </button>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">
                {t("customer.payment_reference")}
              </th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">
                {t("customer.payment_type")}
              </th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">
                {t("customer.payment_ext_status")}
              </th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">
                {t("customer.payment_received")}
              </th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">
                Method
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-gray-400 text-xs"
                >
                  {t("common.loading")}
                </td>
              </tr>
            )}
            {!loading && payments.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-gray-400 text-xs"
                >
                  {t("customer.no_payments")}
                </td>
              </tr>
            )}
            {payments.map(
              (p: {
                id: string;
                reference: string;
                status: string;
                method: string | null;
                receivedAt: string;
                invoice: { number: string } | null;
              }) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-2 py-2.5 font-mono text-xs text-gray-800">
                    {p.reference}
                  </td>
                  <td className="px-2 py-2.5 text-xs text-gray-600">Payment</td>
                  <td className="px-2 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${STATUS_STYLES[p.status] ?? "text-gray-600 bg-gray-100"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-gray-600">
                    {formatDate(p.receivedAt)}
                  </td>
                  <td className="px-2 py-2.5 text-xs text-gray-600">
                    {p.method ? p.method.replace("_", " ") : "—"}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 0 && (
        <p className="mt-2 text-xs text-gray-500">{totalCount} payments</p>
      )}

      {totalCount > 10 && (
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <button
            onClick={prevPage}
            disabled={!hasPrevPage}
            className="hover:text-gray-700 disabled:opacity-40"
          >
            ‹
          </button>
          <button
            onClick={nextPage}
            disabled={!hasNextPage}
            className="hover:text-gray-700 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
