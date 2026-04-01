import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/dashboard', fetcher, {
    refreshInterval: 60000, 
    revalidateOnFocus: true
  });

  return {
    data,
    isLoading,
    isError: error,
    mutate
  };
}
