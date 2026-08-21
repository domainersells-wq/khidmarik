import * as React from 'react';

export const AspectRatio = ({ children, ratio, className, ...props }: any) => {
  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: `${(1 / (ratio || 1)) * 100}%` }} className={className}>
      <div style={{ position: 'absolute', inset: 0 }} {...props}>
        {children}
      </div>
    </div>
  );
};
