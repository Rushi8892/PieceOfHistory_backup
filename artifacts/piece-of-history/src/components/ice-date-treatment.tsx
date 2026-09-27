import type { ReactNode } from 'react';
import { FrostAsset } from '@/components/site';

type IceDateLabelProps = {
  children: ReactNode;
  size?: 'compact' | 'regular';
  className?: string;
};

export function IceDateLabel({
  children,
  size = 'compact',
  className = '',
}: IceDateLabelProps) {
  return (
    <span className={`ice-date-label ice-date-label--${size} ${className}`}>
      <FrostAsset
        name="crystal"
        size={size === 'compact' ? 12 : 14}
        className="ice-date-label__icon frost-asset-plain"
      />
      <span className="ice-date-label__text">{children}</span>
    </span>
  );
}

type IceDateHeadingProps = {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  size?: 'display' | 'card';
  className?: string;
};

export function IceDateHeading({
  children,
  as = 'h1',
  size = 'display',
  className = '',
}: IceDateHeadingProps) {
  const Heading = as;

  return (
    <div className={`ice-date-heading ice-date-heading--${size} ${className}`}>
      <span className="ice-date-heading__accent" aria-hidden="true">
        <FrostAsset
          name="crystal"
          size={size === 'display' ? 20 : 15}
          className="frost-asset-plain"
        />
      </span>
      <Heading className="ice-date-heading__text">{children}</Heading>
    </div>
  );
}