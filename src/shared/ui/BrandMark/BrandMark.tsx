import './BrandMark.scss';

interface BrandMarkProps {
  className?: string | undefined;
}

// The app's mark: four squares in a 2×2 grid in the current colour, one of them terracotta. It is
// always decorative, so assistive technology skips it. 24px unless CSS sizes it otherwise.
function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      className={className ? `brand-mark ${className}` : 'brand-mark'}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      focusable="false"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
      <rect x="13.75" y="3.75" width="6.5" height="6.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3.75" y="13.75" width="6.5" height="6.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect className="brand-mark__warm" x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

export default BrandMark;
