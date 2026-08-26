import { useState } from 'react';

interface UseListQueryStateOptions<TSortField extends string> {
  defaultLimit: number;
  defaultSortBy: TSortField;
  defaultSortOrder?: 'asc' | 'desc';
}

export function useListQueryState<TSortField extends string>({ defaultLimit, defaultSortBy, defaultSortOrder = 'desc' }: UseListQueryStateOptions<TSortField>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [sortBy, setSortBy] = useState<TSortField>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleLimitChange(value: number) {
    setLimit(value);
    setPage(1);
  }

  function handleSortChange(field: TSortField) {
    setPage(1);
    if (sortBy === field) {
      setSortOrder((current) => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortBy(field);
    setSortOrder('asc');
  }

  return {
    search,
    page,
    limit,
    sortBy,
    sortOrder,
    setPage,
    handleSearchChange,
    handleLimitChange,
    handleSortChange,
  };
}
