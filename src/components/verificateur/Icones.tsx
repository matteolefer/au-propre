/**
 * Icônes de l'interface, en SVG inline. Toujours accompagnées d'un texte :
 * elles ne portent jamais seules une information.
 */
import type { Gravite } from '../../checker/types';

interface ProprietesIcone {
  className?: string;
}

function Svg({ className, children }: ProprietesIcone & { children: React.ReactNode }) {
  return (
    <svg
      className={className ?? 'v-icone'}
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconeErreur(props: ProprietesIcone) {
  return (
    <Svg {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M7.25 7.25l5.5 5.5M12.75 7.25l-5.5 5.5" />
    </Svg>
  );
}

export function IconeAvertissement(props: ProprietesIcone) {
  return (
    <Svg {...props}>
      <path d="M10 2.75L18 16.75H2L10 2.75z" />
      <path d="M10 8v4" />
      <path d="M10 14.25v.01" strokeWidth="2.25" />
    </Svg>
  );
}

export function IconeConforme(props: ProprietesIcone) {
  return (
    <Svg {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M6.75 10.25l2.25 2.25 4.25-4.75" />
    </Svg>
  );
}

export function IconeInfo(props: ProprietesIcone) {
  return (
    <Svg {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v4.5" />
      <path d="M10 6.25v.01" strokeWidth="2.25" />
    </Svg>
  );
}

export function IconeFichier(props: ProprietesIcone) {
  return (
    <Svg {...props}>
      <path d="M11.5 2.5H5.75a1.25 1.25 0 00-1.25 1.25v12.5a1.25 1.25 0 001.25 1.25h8.5a1.25 1.25 0 001.25-1.25V6.5l-4-4z" />
      <path d="M11.5 2.5v4h4" />
    </Svg>
  );
}

export function IconeGravite({ gravite, className }: ProprietesIcone & { gravite: Gravite }) {
  const props = className === undefined ? {} : { className };
  switch (gravite) {
    case 'bloquant':
    case 'erreur':
      return <IconeErreur {...props} />;
    case 'avertissement':
      return <IconeAvertissement {...props} />;
    case 'conforme':
      return <IconeConforme {...props} />;
    case 'info':
      return <IconeInfo {...props} />;
  }
}
