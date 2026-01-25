"use client";
export const dynamic = "force-dynamic";
import dynamicImport from 'next/dynamic';

const UnlockValueClient = dynamicImport(() => import('../../components/UnlockValue/UnlockValueClient'), { ssr: false });

export default function Page() {
  return <UnlockValueClient />;
}
