export function LogoMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 674 674"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path fill="currentColor" d="M0 0h313v70H70v245H0z" />
      <rect fill="currentColor" x="221" y="221" width="232" height="232" />
      <path fill="currentColor" d="M674 674H361v-70h243V361h70z" />
    </svg>
  );
}
