import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Returns a Lucide icon component by name, or a fallback icon if not found.
 */
export function getIconComponent(name: string): LucideIcon {
  const Icon = (Lucide as any)[name];
  if (Icon) return Icon;

  // Fallbacks for similar terms
  if (name === 'BriefcaseIcon' || name === 'Briefcase') return Lucide.Briefcase;
  if (name === 'TruckIcon' || name === 'Truck') return Lucide.Truck;
  if (name === 'Utensils') return Lucide.Utensils;

  return Lucide.Package; // Default fallback
}
