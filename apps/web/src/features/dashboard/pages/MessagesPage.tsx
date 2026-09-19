import { ui } from '../../../components/ui';
import { Clock3, Download, ShieldCheck } from 'lucide-react';
import type { DashboardData } from '../useDashboard';
import { pageHeading } from '../pageTypes';
export function MessagesPage({ data }: { data: DashboardData | null }) {
  const analytics = data?.analytics;
  const notices = [
    {
      title: `${analytics?.pendingCount ?? 0} transactions need attention`,
      copy: 'Review pending activity and follow up before settlement.',
      icon: Clock3,
    },
    {
      title: 'Create a transaction report',
      copy: 'Use Export CSV on the Transactions page to create a tailored report.',
      icon: Download,
    },
    {
      title: 'Your workspace is protected',
      copy: 'Authentication sessions are revocable and expire automatically.',
      icon: ShieldCheck,
    },
  ];
  return (
    <div className="flex max-w-[920px] flex-col gap-[30px]">
      <div className={pageHeading}>
        <div>
          <p className={ui.eyebrow}>INBOX</p>
          <h2 className={`my-2 ${ui.pageHeading}`}>Messages</h2>
          <p className={ui.muted}>System insights and financial reminders.</p>
        </div>
      </div>
      <section className="rounded-[14px] bg-panel px-7">
        {notices.map(({ title, copy, icon: Icon }, index) => (
          <article
            key={title}
            className="grid min-h-[98px] grid-cols-[auto_1fr_auto] items-center gap-[17px] border-b border-[#30333b] last:border-0"
          >
            <span className="grid size-11 place-items-center rounded-[11px] bg-[#252a31] text-accent">
              <Icon size={20} />
            </span>
            <div>
              <h3 className="m-0 text-sm">{title}</h3>
              <p className="mt-1 text-xs text-[#9699a2]">{copy}</p>
            </div>
            {index === 0 && (
              <i className="rounded-full bg-accent px-2 py-1 text-[9px] font-bold not-italic text-[#112118]">
                New
              </i>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
