import { ui } from '../../../components/ui';
import { ShieldCheck } from 'lucide-react';
import { pageHeading } from '../pageTypes';
export function SettingsPage() {
  return (
    <div className="flex max-w-[920px] flex-col gap-[30px]">
      <div className={pageHeading}>
        <div>
          <p className={ui.eyebrow}>PREFERENCES</p>
          <h2 className={`my-2 ${ui.pageHeading}`}>Settings</h2>
          <p className={ui.muted}>Workspace display and reporting defaults.</p>
        </div>
      </div>
      <section className={ui.panel}>
        <h3 className="mb-[15px] text-lg">Display</h3>
        <div className="flex min-h-[72px] items-center justify-between gap-6 border-t border-[#30333b] text-[13px]">
          <span>
            <b className="block font-medium text-[#e9eaec]">Currency</b>
            <small className="mt-1 block text-[#8c8f98]">
              Reporting currency for transaction amounts
            </small>
          </span>
          <strong className="font-medium text-[#e9eaec]">USD</strong>
        </div>
        <div className="flex min-h-[72px] items-center justify-between gap-6 border-t border-[#30333b] text-[13px]">
          <span>
            <b className="block font-medium text-[#e9eaec]">Date handling</b>
            <small className="mt-1 block text-[#8c8f98]">
              Consistent across charts, filters and exports
            </small>
          </span>
          <strong className="font-medium text-[#e9eaec]">UTC</strong>
        </div>
        <div className="flex min-h-[72px] items-center justify-between gap-6 border-t border-[#30333b] text-[13px]">
          <span>
            <b className="block font-medium text-[#e9eaec]">Theme</b>
            <small className="mt-1 block text-[#8c8f98]">
              Dark appearance across your workspace
            </small>
          </span>
          <strong className="font-medium text-[#e9eaec]">Dark</strong>
        </div>
      </section>
      <section className="flex gap-3 rounded-xl border border-[#34513d] bg-[#1d3124] p-[17px] text-xs text-[#aeeabd]">
        <ShieldCheck size={20} />
        <p className="m-0 leading-relaxed">
          Contact your workspace administrator to change account access or reporting defaults.
        </p>
      </section>
    </div>
  );
}
