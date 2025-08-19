import { Suspense } from 'react';
import SearchParamsClient from '@/app/components/SearchParamsClient';
import TournamentsView from './TournamentsView';
export const dynamic = 'error';
export default function Page(){
  return (
    <Suspense fallback={null}>
      <SearchParamsClient render={(params)=>(
        <TournamentsView initialFilter={params.get('filter') ?? ''} />
      )}/>
    </Suspense>
  );
}
