'use client';

import type { FC, SVGProps } from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { cn } from '@/lib/utils';

type FlagComponent = FC<SVGProps<SVGSVGElement>>;

const FLAG_COMPONENTS = Flags as Record<string, FlagComponent>;

export type CountryCode = keyof typeof Flags;

type CountryFlagProps = {
  code: CountryCode | string;
  className?: string;
  title?: string;
};

export function CountryFlag({ code, className, title }: CountryFlagProps) {
  const Flag = FLAG_COMPONENTS[code];

  if (!Flag) return null;

  return (
    <Flag
      className={cn('inline-block shrink-0 overflow-hidden rounded-[3px]', className)}
      aria-hidden={!title}
      aria-label={title}
    />
  );
}
