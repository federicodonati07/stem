'use client';

import { useState } from 'react';
import { Input } from '@heroui/react';
import { Eye, EyeOff } from 'lucide-react';

interface ModernInputProps {
  type?: 'text' | 'email' | 'password';
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  required?: boolean;
}

const ModernInput = ({ 
  type = 'text', 
  label, 
  placeholder, 
  value, 
  onChange, 
  icon, 
  required = false
}: ModernInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <Input
      type={inputType}
      label={label}
      placeholder={placeholder}
      value={value}
      onValueChange={onChange}
      startContent={icon}
      endContent={
        type === 'password' ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-purple-600 transition-colors duration-200 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null
      }
      required={required}
      variant="bordered"
      size="lg"
      className="w-full"
    />
  );
};

export default ModernInput;