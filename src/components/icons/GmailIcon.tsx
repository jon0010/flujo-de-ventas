type Props = {
  size?: number;
  className?: string;
};

/** Logo estilo Gmail (sobre + colores de marca). */
export function GmailIcon({ size = 18, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden
    >
      <path
        fill="#4caf50"
        d="M45,16.18v21.82c0,2.21-1.79,4-4,4H7c-2.21,0-4-1.79-4-4V16.18L25.35,28.54c0.79,0.59,1.87,0.59,2.66,0L45,16.18z"
      />
      <path
        fill="#1e88e5"
        d="M41,8H7c-2.21,0-4,1.79-4,4v4.18l22.35,12.36c0.79,0.59,1.87,0.59,2.66,0L49,16.18V12C49,9.79,47.21,8,45,8z"
      />
      <path
        fill="#e53935"
        d="M3,12v1.18l22.35,12.36c0.79,0.59,1.87,0.59,2.66,0L49,13.18V12c0-2.21-1.79-4-4-4H7C4.79,8,3,9.79,3,12z"
      />
      <path
        fill="#c62828"
        d="M3,12v1.18l22.35,12.36c0.79,0.59,1.87,0.59,2.66,0L49,13.18V12c0-2.21-1.79-4-4-4H7C4.79,8,3,9.79,3,12z"
        opacity="0.2"
      />
      <path
        fill="#fbc02d"
        d="M25.35,28.54L3,16.18V12c0-2.21,1.79-4,4-4h38c2.21,0,4,1.79,4,4v4.18L25.35,28.54z"
      />
    </svg>
  );
}
