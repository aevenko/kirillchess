'use client';
import { useSearchParams } from 'next/navigation';

export default function SearchParamsClient({ render }: { render: (params: URLSearchParams) => JSX.Element }) {
  const sp = useSearchParams();
  const q = new URLSearchParams(sp?.toString());
  return render(q);
}
