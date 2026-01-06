import dynamic from 'next/dynamic';

const UnlockValueClient = dynamic(() => import('../../components/UnlockValue/UnlockValueClient'), { ssr: false });

export default function Page() {
  return <UnlockValueClient />;
}
