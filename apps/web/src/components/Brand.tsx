import { Link } from 'react-router-dom';

export function Brand() {
  return (
    <Link
      className="inline-flex items-center gap-2 text-[31px] font-bold tracking-[-1.8px] text-[#f7f7f8] no-underline"
      to="/dashboard"
      aria-label="Penta home"
    >
      <span
        className="grid h-[39px] w-[35px] place-items-center rounded-[9px] border-[3px] border-accent border-t-expense text-lg text-accent"
        aria-hidden="true"
      >
        P
      </span>
      Penta<span className="-ml-2 text-accent">.</span>
    </Link>
  );
}
