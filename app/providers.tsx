'use client';

import { FC, ReactNode } from 'react';
import React from 'react';
import { WalletProvider } from '@/lib/wallet/WalletContext';

export const Providers: FC<{ children: ReactNode }> = ({ children }) => {
  return <WalletProvider>{children}</WalletProvider>;
};
