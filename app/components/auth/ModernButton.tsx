'use client';

import { Button } from '@heroui/react';

interface ModernButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const ModernButton = ({ 
  children, 
  onClick, 
  type = 'button',
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
  className = ''
}: ModernButtonProps) => {
  const getVariantProps = () => {
    switch (variant) {
      case 'primary':
        return {
          variant: "solid" as const,
          color: "primary" as const,
          className: "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-purple-500/25"
        };
      case 'secondary':
        return {
          variant: "solid" as const,
          color: "default" as const,
          className: "bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
        };
      case 'outline':
        return {
          variant: "bordered" as const,
          color: "primary" as const,
          className: "border-purple-200 text-purple-700 font-semibold hover:bg-purple-50 hover:border-purple-300"
        };
      default:
        return {
          variant: "solid" as const,
          color: "primary" as const,
          className: "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-purple-500/25"
        };
    }
  };

  const variantProps = getVariantProps();

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      startContent={icon}
      variant={variantProps.variant}
      color={variantProps.color}
      size={size}
      isLoading={loading}
      className={`w-full rounded-full font-semibold transition-all duration-200 ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${variantProps.className}`}
    >
      {children}
    </Button>
  );
};

export default ModernButton;