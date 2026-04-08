import { GET_DEBTOR_PAYMENTS } from "@/graphql/queries/customerPayments";
import { useQuery } from "@apollo/client";
import { useState } from "react";

const PAGE_SIZE = 10;

export function useDebtorPayments(debtorId: string) {
  const [cursors, setCursors] = useState<string[]>([]);

  const after = cursors.length > 0 ? cursors[cursors.length - 1] : undefined;

  const { data, loading, error } = useQuery(GET_DEBTOR_PAYMENTS, {
    variables: { debtorId, first: PAGE_SIZE, after },
    skip: !debtorId,
    fetchPolicy: "cache-and-network",
  });

  const connection = data?.payments;
  const edges = connection?.edges ?? [];
  const pageInfo = connection?.pageInfo;
  const totalCount = connection?.totalCount ?? 0;

  function nextPage() {
    if (pageInfo?.endCursor)
      setCursors((prev) => [...prev, pageInfo.endCursor]);
  }

  function prevPage() {
    setCursors((prev) => prev.slice(0, -1));
  }

  return {
    payments: edges.map((e: { node: unknown }) => e.node),
    loading,
    error,
    totalCount,
    hasNextPage: pageInfo?.hasNextPage ?? false,
    hasPrevPage: cursors.length > 0,
    nextPage,
    prevPage,
  };
}
