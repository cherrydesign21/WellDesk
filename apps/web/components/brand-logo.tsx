export function BrandLogo({
  className = 'h-6 w-auto',
  invert = false,
}: {
  className?: string;
  /** Renders solid white — for placing the (otherwise dark-green/olive) mark on a dark background. */
  invert?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/welldesk-logo-full.svg"
      alt="WellDesk"
      className={invert ? `${className} brightness-0 invert` : className}
    />
  );
}
