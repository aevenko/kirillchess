'use client';
import { useMemo, useState } from 'react';
type Row = {date:string; name:string; city?:string; before:number; after:number};
const DATA: Row[] = [
  { date:'2025-07-20', name:'TOURNOI ÉLITE DE CHAMBLY (TEC) 2025', city:'Chambly', before:1253, after:1435 },
  { date:'2025-06-11', name:'Open Brossard', city:'Brossard', before:1450, after:1480 },
];
export default function TournamentsView({ initialFilter='' }: { initialFilter?: string }){
  const [filter, setFilter] = useState(initialFilter);
  const rows = useMemo(()=> DATA.filter(r => !filter || r.name.toLowerCase().includes(filter.toLowerCase()) || (r.city||'').toLowerCase().includes(filter.toLowerCase())), [filter]);
  return (<section className="card">
    <h1 style={{marginTop:0}}>Tournaments</h1>
    <input className="input" placeholder="Filter by name or city…" value={filter} onChange={e=>setFilter(e.target.value)} />
    <div style={{overflow:'auto', marginTop:12}}>
      <table className="table"><thead><tr>
        <th>Date</th><th>Tournament</th><th>City</th><th>Before</th><th>After</th>
      </tr></thead><tbody>
        {rows.map((r,i)=>(<tr key={i}><td>{r.date}</td><td>{r.name}</td><td>{r.city}</td><td>{r.before}</td><td><b>{r.after}</b></td></tr>))}
      </tbody></table>
    </div>
  </section>);
}
