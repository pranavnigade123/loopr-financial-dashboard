export { DashboardPage } from './pages/DashboardPage';
export { TransactionsPage } from './pages/TransactionsPage';
export { AnalyticsPage } from './pages/AnalyticsPage';
export { WalletPage } from './pages/WalletPage';
export { PersonalPage } from './pages/PersonalPage';
export { MessagesPage } from './pages/MessagesPage';
export { SettingsPage } from './pages/SettingsPage';
import { Mail } from 'lucide-react';
export function EmptyState() {
  return (
    <div className="grid min-h-[55vh] place-content-center text-center">
      <Mail />
      <h2>Page unavailable</h2>
      <p>Choose a destination from the navigation.</p>
    </div>
  );
}
