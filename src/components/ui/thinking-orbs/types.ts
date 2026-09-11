import { ReactNode } from 'react';

export type ActivityState =
  | 'idle'
  | 'loading'
  | 'thinking'
  | 'searching'
  | 'solving'
  | 'composing'
  | 'listening'
  | 'success'
  | 'error';

export type OrbSize = 'sm' | 'md' | 'lg';

export interface ThinkingOrbsProps {
  /** The current activity or processing state */
  state: ActivityState;
  /** Size variant of the orb component */
  size?: OrbSize;
  /** Optional custom text label. If omitted, a localized default label is displayed */
  label?: ReactNode;
  /** Optional sub-label or secondary hint */
  subLabel?: ReactNode;
  /** Whether to show the text label alongside the orb (default: true) */
  showLabel?: boolean;
  /** Whether to show the state icon indicator inside/beside the orb (default: false for pure orb, true if compact) */
  showIcon?: boolean;
  /** Audio level (0 to 1) for real-time reactivity in 'listening' state */
  audioLevel?: number;
  /** Optional action button (e.g. Retry on error or Cancel during search) */
  action?: ReactNode;
  /** Whether the component should render as a compact inline element (e.g. inside buttons or input badges) */
  inline?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

export interface StateConfig {
  defaultLabelAr: string;
  defaultLabelEn: string;
  defaultSubLabelAr?: string;
  defaultSubLabelEn?: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  accentColor: string;
}
