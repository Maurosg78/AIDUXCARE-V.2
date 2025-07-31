import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style }) => {
  return (
    <div className={`bg-white border border-neutral/20 rounded-lg shadow-md ${className}`} style={style}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', style }) => {
  return (
    <div className={`px-6 py-4 border-b border-neutral/20 ${className}`} style={style}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', style }) => {
  return (
    <h3 className={`text-lg font-semibold text-primary ${className}`} style={style}>
      {children}
    </h3>
  );
};

export const CardContent: React.FC<CardContentProps> = ({ children, className = '', style }) => {
  return (
    <div className={`px-6 py-4 ${className}`} style={style}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', style }) => {
  return (
    <div className={`px-6 py-4 border-t border-neutral/20 ${className}`} style={style}>
      {children}
    </div>
  );
}; 