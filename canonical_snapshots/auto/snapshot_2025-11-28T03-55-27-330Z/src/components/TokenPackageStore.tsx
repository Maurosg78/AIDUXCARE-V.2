/**
 * Token Package Store Component
 * 
 * Displays available token packages and allows users to purchase them.
 * 
 * Sprint 2A - Day 2: Token Tracking Foundation
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react';
import type { TokenPackage } from '../services/tokenPackageService';
import { TokenPackageService } from '../services/tokenPackageService';
import type { TokenUsage } from '../services/tokenTrackingService';
import { SpendCapService } from '../services/spendCapService';
import { useAuth } from '../hooks/useAuth';

export interface TokenPackageStoreProps {
  packages: TokenPackage[];
  currentUsage: TokenUsage | null;
  spendCap?: number;
  onPurchase: (packageType: string) => void;
  className?: string;
}

export const TokenPackageStore: React.FC<TokenPackageStoreProps> = ({
  packages,
  currentUsage,
  spendCap,
  onPurchase,
  className = ''
}) => {
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const handlePurchase = async (packageType: 'small' | 'medium' | 'large') => {
    if (!user?.uid) {
      setPurchaseError('User not authenticated');
      return;
    }

    setPurchasing(packageType);
    setPurchaseError(null);
    setPurchaseSuccess(null);

    try {
      // Check spend cap
      const pkg = packages.find(p => p.type === packageType);
      if (pkg && spendCap) {
        const wouldExceed = await SpendCapService.wouldExceedSpendCap(user.uid, pkg.priceCAD);
        if (wouldExceed) {
          setPurchaseError(`Purchase would exceed your monthly spend cap of $${spendCap.toFixed(2)} CAD`);
          setPurchasing(null);
          return;
        }
      }

      // Execute purchase
      const result = await TokenPackageService.purchasePackage(user.uid, packageType);

      if (result.success) {
        setPurchaseSuccess(`Successfully purchased ${result.tokensAdded} tokens!`);
        onPurchase(packageType);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setPurchaseSuccess(null);
        }, 3000);
      } else {
        setPurchaseError(result.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('[TokenPackageStore] Purchase error:', error);
      setPurchaseError(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const getRecommendedPackage = () => {
    if (!currentUsage) return null;
    
    const projectedUsage = currentUsage.projectedMonthlyUsage;
    const baseTokens = 1200;

    if (projectedUsage <= baseTokens * 1.1) return 'small';
    if (projectedUsage <= baseTokens * 1.5) return 'medium';
    return 'large';
  };

  const recommended = getRecommendedPackage();

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 font-apple">
          Purchase Token Packages
        </h3>
        {currentUsage && currentUsage.baseTokensRemaining < 240 && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span>Low on tokens</span>
          </div>
        )}
      </div>

      {purchaseError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 font-apple">Purchase Failed</p>
            <p className="text-xs text-red-700 mt-1 font-apple">{purchaseError}</p>
          </div>
        </div>
      )}

      {purchaseSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800 font-apple">Purchase Successful</p>
            <p className="text-xs text-emerald-700 mt-1 font-apple">{purchaseSuccess}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {packages.map((pkg) => {
          const isRecommended = recommended === pkg.type;
          const isPurchasing = purchasing === pkg.type;

          return (
            <div
              key={pkg.type}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isRecommended
                  ? 'border-primary-blue bg-primary-blue/5'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {isRecommended && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-primary-blue text-white text-xs font-medium rounded-full font-apple">
                    Recommended
                  </span>
                </div>
              )}

              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-slate-600" />
                  <h4 className="text-sm font-semibold text-slate-800 font-apple capitalize">
                    {pkg.type} Package
                  </h4>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-slate-900 font-apple">
                    {pkg.tokens.toLocaleString()} tokens
                  </p>
                  <p className="text-lg font-semibold text-primary-blue font-apple">
                    ${pkg.priceCAD.toFixed(2)} CAD
                  </p>
                  <p className="text-xs text-slate-500 font-apple">
                    ${pkg.pricePerToken.toFixed(3)} per token
                  </p>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(pkg.type)}
                disabled={isPurchasing || purchasing !== null}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all font-apple ${
                  isRecommended
                    ? 'bg-primary-blue text-white hover:bg-primary-blue-hover'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {isPurchasing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Purchasing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Purchase
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 mt-2 text-center font-apple">
                Tokens rollover for 12 months
              </p>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-600 font-apple">
          <strong>Note:</strong> Purchased tokens rollover for 12 months and are used after base tokens are exhausted. Base tokens (1,200/month) expire at the end of each billing cycle.
        </p>
      </div>
    </div>
  );
};

