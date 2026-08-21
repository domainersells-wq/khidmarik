import * as React from 'react';

export const Carousel = ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>;
export const CarouselContent = ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>;
export const CarouselItem = ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>;
export const CarouselNext = ({ className, ...props }: any) => null;
export const CarouselPrevious = ({ className, ...props }: any) => null;
