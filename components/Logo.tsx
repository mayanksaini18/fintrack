export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <span
      className="shrink-0 inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white font-bold tracking-tight select-none"
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      K
    </span>
  );
}
