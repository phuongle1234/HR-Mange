import {
  Box,
  Pagination as MuiPagination,
  PaginationItem,
  Typography,
} from '@mui/material';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  showSummary?: boolean;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  itemLabel = 'items',
  showSummary = true,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const start = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const end = total === 0 ? 0 : Math.min(safePage * limit, total);

  if (total === 0) {
    return (
      <Box className="border-t border-slate-100 px-4 py-4">
        <Typography
          variant="body2"
          className="!text-center !text-slate-500 sm:!text-left"
        >
          {showSummary ? `No ${itemLabel} found.` : 'No records found.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      className="
        flex flex-col items-center justify-between
        gap-4 border-t border-slate-100
        px-4 py-4
        sm:flex-row
      "
    >
      {showSummary && (
        <Typography
          variant="body2"
          className="!whitespace-nowrap !text-slate-500"
        >
          Showing{' '}
          <span className="font-semibold text-slate-700"> {start}-{end} </span>{' '} of{' '}
          <span className="font-semibold text-slate-700">{total}</span>{' '}
          {itemLabel}
        </Typography>
      )}
        <MuiPagination
          page={safePage}
          count={safeTotalPages}
          onChange={(_, value) => onPageChange(value )}
          color="primary"
          shape="rounded"
          size="medium"
          siblingCount={1}
          boundaryCount={1}
          renderItem={(item) => (
            <PaginationItem
              {...item}
              className="
                !font-medium
                !text-slate-600
                hover:!bg-slate-100
                [&.Mui-selected]:!bg-blue-600
                [&.Mui-selected]:!text-white
                [&.Mui-selected]:hover:!bg-blue-700
              "
            />
          )}
        />
      
    </Box>
  );
}