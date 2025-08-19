import { Suspense } from 'react';
import SearchParamsClient from '@/app/components/SearchParamsClient';
import View from './View';
export const dynamic = 'error';
export default function Page(){
  return (
    <Suspense fallback={null}>
      <SearchParamsClient render={(p)=>(
        <View title="Kirill — Road to 1900" note={p.get('note') ?? ''} />
      )}/>
    </Suspense>
  )
}
