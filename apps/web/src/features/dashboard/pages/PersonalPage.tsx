import { ui } from '../../../components/ui';
import { ShieldCheck } from 'lucide-react';
import type { SessionUser } from '@loopr/contracts';
import { pageHeading } from '../pageTypes';
export function PersonalPage({ user }: { user: SessionUser }) {
  return (
    <div className="flex max-w-[920px] flex-col gap-[30px]">
      <div className={pageHeading}>
        <div>
          <p className={ui.eyebrow}>YOUR ACCOUNT</p>
          <h2 className={`my-2 ${ui.pageHeading}`}>Personal</h2>
          <p className={ui.muted}>Profile and workspace identity.</p>
        </div>
      </div>
      <section
        className={`${ui.panel} flex flex-col items-start gap-[22px] sm:flex-row sm:items-center`}
      >
        <span className="grid size-[82px] place-items-center rounded-[20px] bg-linear-to-br from-[#3b548d] to-[#253354] text-[22px] font-bold text-[#dce9ff]">
          {user.name
            .split(/\s+/)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <div>
          <h3 className="m-0 text-[22px]">{user.name}</h3>
          <p className="mt-1 text-[#a2a5ad]">{user.email}</p>
          <span className="mt-2.5 inline-block rounded-full bg-[#194c2d] px-2.5 py-[5px] text-[11px] text-[#5de784]">
            Financial analyst
          </span>
        </div>
      </section>
      <section className={ui.panel}>
        <h3 className="mb-[15px] text-lg">Account details</h3>
        <div className="flex min-h-[62px] flex-col items-start justify-center gap-1 border-t border-[#30333b] text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span>Workspace role</span>
          <strong className="font-medium text-[#e9eaec]">Analyst</strong>
        </div>
        <div className="flex min-h-[62px] flex-col items-start justify-center gap-1 border-t border-[#30333b] text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span>Data access</span>
          <strong className="font-medium text-[#e9eaec]">Company transactions</strong>
        </div>
        <div className="flex min-h-[62px] flex-col items-start justify-center gap-1 border-t border-[#30333b] text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span>Display timezone</span>
          <strong className="font-medium text-[#e9eaec]">UTC</strong>
        </div>
        <div className="flex min-h-[62px] flex-col items-start justify-center gap-1 border-t border-[#30333b] text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span>Session security</span>
          <strong className="flex items-center gap-2 font-medium text-[#43de70]">
            <ShieldCheck size={16} />
            Protected
          </strong>
        </div>
      </section>
    </div>
  );
}
