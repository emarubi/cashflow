import { useQuery } from "@apollo/client";
import { GET_DEBTOR_TIMELINE } from "@/graphql/queries/customerTimeline";

export function useDebtorTimeline(debtorId: string) {
  const { data, loading, error, fetchMore } = useQuery(GET_DEBTOR_TIMELINE, {
    variables: { debtorId, first: 20 },
    skip: !debtorId,
    fetchPolicy: "cache-and-network",
  });

  const connection = data?.actionEvents;
  const edges = connection?.edges ?? [];
  const pageInfo = connection?.pageInfo;
  const totalCount = connection?.totalCount ?? 0;

  function loadMore() {
    if (!pageInfo?.hasNextPage) return;
    fetchMore({ variables: { after: pageInfo.endCursor } });
  }

  return {
    events: edges.map((e: { node: unknown }) => e.node),
    loading,
    error,
    totalCount,
    hasMore: pageInfo?.hasNextPage ?? false,
    loadMore,
  };
}
