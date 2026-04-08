import { GET_DEBTOR } from "@/graphql/queries/customer";
import { useQuery } from "@apollo/client";

export function useDebtor(id: string) {
  const { data, loading, error } = useQuery(GET_DEBTOR, {
    variables: { id },
    skip: !id,
  });

  return {
    debtor: data?.debtor ?? null,
    loading,
    error,
  };
}
