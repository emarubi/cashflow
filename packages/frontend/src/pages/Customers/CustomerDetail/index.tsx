import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useDebtor } from "@/hooks/useDebtor";
import CustomerDetailHeader from "./CustomerDetailHeader";
import CustomerDetailTabs from "./CustomerDetailTabs";
import CustomerInfoCard from "./CustomerInfoCard";
import GroupEntitiesCard from "./GroupEntitiesCard";
import PaymentMethodCard from "./PaymentMethodCard";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { debtor, loading, error } = useDebtor(id ?? "");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        {t("common.loading")}
      </div>
    );
  }

  if (error || !debtor) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500">
        {t("common.error")}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <CustomerDetailHeader name={debtor.name} />

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — scrollable */}
        <div className="w-2/5 flex-shrink-0 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <CustomerInfoCard debtor={debtor} />
          <GroupEntitiesCard />
          <PaymentMethodCard hasPaymentMethod={debtor.hasPaymentMethod} />
        </div>

        {/* Right panel — tabs */}
        <div className="w-3/5 min-w-120 overflow-hidden flex flex-col p-4 bg-gray-50">
          <CustomerDetailTabs debtorId={debtor.id} debtorEmail={debtor.email} />
        </div>
      </div>
    </div>
  );
}
