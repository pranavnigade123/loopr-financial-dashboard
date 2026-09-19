import type { DashboardData } from './useDashboard';
export const pageStack = 'mx-auto flex max-w-[1540px] flex-col gap-[30px]';
export const pageHeading =
  'flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end';
export const panelTitle = 'mb-6 flex items-center justify-between gap-[18px]';
export const tableWrap = 'w-full overflow-x-auto';

interface QueryActions {
  params: URLSearchParams;
  update: (key: string, value: string) => void;
  clear: () => void;
  sort: (column: string) => void;
}

export interface PageProps {
  data: DashboardData | null;
  loading: boolean;
  query: QueryActions;
  onNavigate: (path: string) => void;
  onExport: () => void;
}
