export const ui = {
  panel: 'rounded-[14px] bg-panel p-5 md:p-7',
  primary:
    'inline-flex items-center justify-center gap-2.5 rounded-[9px] bg-accent px-[17px] py-3 text-[13px] font-bold text-[#102018] transition-colors hover:bg-[#3cdc70] disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-[#414650] bg-[#292d35] px-3 py-2.5 text-xs text-[#e3e5e9] transition-colors hover:bg-[#343943] disabled:cursor-not-allowed disabled:opacity-50',
  input:
    'w-full rounded-[9px] border border-[#3c414c] bg-canvas px-3 py-[11px] text-[13px] text-[#f0f1f3] placeholder:text-muted focus:outline-2 focus:outline-offset-2 focus:outline-accent',
  avatar:
    'inline-grid size-[42px] shrink-0 place-items-center rounded-[10px] bg-linear-to-br from-[#394b78] to-[#222b42] text-[11px] font-bold text-[#cde4ff]',
  eyebrow: 'text-[11px] font-bold tracking-[2px] text-accent',
  muted: 'text-[13px] leading-relaxed text-muted',
  pageHeading: 'text-[30px] font-semibold tracking-[-0.7px] text-[#f4f5f7]',
} as const;
