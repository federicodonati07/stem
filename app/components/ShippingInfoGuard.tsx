"use client";

import { useAccount } from "./AccountContext";

export default function ShippingInfoGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useAccount();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-500 text-lg">Caricamento...</span>
      </div>
    );
  }

  return <>{children}</>;
}
