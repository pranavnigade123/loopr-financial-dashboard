import { ui } from '../../../components/ui';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Clock3, WalletCards } from 'lucide-react';
import { pageStack, pageHeading, type PageProps } from '../pageTypes';
import { money } from '../format';
export function WalletPage({ data, loading, onNavigate }: PageProps) {
  const analytics = data?.analytics;
  return (
    <div className={pageStack}>
      <div className={pageHeading}>
        <div>
          <p className={ui.eyebrow}>CASH POSITION</p>
          <h2 className={`my-2 ${ui.pageHeading}`}>Wallet</h2>
          <p className={ui.muted}>A clear view of realized and pending company funds.</p>
        </div>
      </div>
      <section className="flex min-h-[190px] items-center justify-between overflow-hidden rounded-[17px] bg-linear-to-r from-[#163e27] to-accent px-[23px] py-7 text-white sm:min-h-[220px] sm:px-[42px] sm:py-9">
        <div>
          <span className="block text-[13px] opacity-80">Available net cash flow</span>
          <strong className="my-2 block text-[clamp(32px,5vw,54px)] tracking-[-2px]">
            {loading || !analytics ? '—' : money(analytics.netCashFlowMinor)}
          </strong>
          <small className="block opacity-70">Paid revenue minus paid expenses</small>
        </div>
        <WalletCards className="hidden opacity-25 sm:block" size={54} />
      </section>
      <div className="grid grid-cols-1 gap-[22px] xl:grid-cols-3">
        <article className={`${ui.panel} flex items-center gap-[18px]`}>
          <span className="grid size-[49px] shrink-0 place-items-center rounded-xl bg-[#292d35] text-accent">
            <ArrowDownLeft />
          </span>
          <div>
            <small className="block text-[11px] text-[#9497a0]">Total received</small>
            <strong className="my-1 block text-xl">
              {analytics ? money(analytics.paidRevenueMinor) : '—'}
            </strong>
            <p className="m-0 text-[11px] text-[#9497a0]">Settled revenue</p>
          </div>
        </article>
        <article className={`${ui.panel} flex items-center gap-[18px]`}>
          <span className="grid size-[49px] shrink-0 place-items-center rounded-xl bg-[#292d35] text-expense">
            <ArrowUpRight />
          </span>
          <div>
            <small className="block text-[11px] text-[#9497a0]">Total spent</small>
            <strong className="my-1 block text-xl">
              {analytics ? money(analytics.paidExpenseMinor) : '—'}
            </strong>
            <p className="m-0 text-[11px] text-[#9497a0]">Settled expenses</p>
          </div>
        </article>
        <article className={`${ui.panel} flex items-center gap-[18px]`}>
          <span className="grid size-[49px] shrink-0 place-items-center rounded-xl bg-[#292d35] text-[#b7bac2]">
            <Clock3 />
          </span>
          <div>
            <small className="block text-[11px] text-[#9497a0]">Awaiting settlement</small>
            <strong className="my-1 block text-xl">{analytics?.pendingCount ?? '—'}</strong>
            <p className="m-0 text-[11px] text-[#9497a0]">Pending transactions</p>
          </div>
        </article>
      </div>
      <button className={`${ui.secondary} self-start`} onClick={() => onNavigate('/transactions')}>
        Review transaction ledger <ChevronRight size={16} />
      </button>
    </div>
  );
}
