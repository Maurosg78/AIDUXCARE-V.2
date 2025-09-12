import { useState, useEffect } from 'react';
import { CreditSystem } from '../core/credits/CreditSystem';

export const useCredits = (userId?: string) => {
  const [credits, setCredits] = useState(150); // Mock inicial
  const [plan, setPlan] = useState('STARTER');
  
  const consumeCredits = (amount: number): boolean => {
    if (credits >= amount) {
      setCredits(prev => prev - amount);
      // TODO: Actualizar en Firebase
      console.log(`💳 Consumidos ${amount} créditos. Restantes: ${credits - amount}`);
      return true;
    }
    return false;
  };
  
  const addCredits = (pack: 'SMALL' | 'LARGE') => {
    const packData = CreditSystem.PACKS[pack];
    setCredits(prev => prev + packData.credits);
    console.log(`💳 Añadidos ${packData.credits} créditos por ${packData.price} CAD`);
  };
  
  return {
    credits,
    plan,
    consumeCredits,
    addCredits
  };
};
