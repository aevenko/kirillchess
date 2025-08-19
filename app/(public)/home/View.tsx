'use client';
export default function View({ title, note }: { title:string; note?:string }){
  return (<section className="card">
    <h1 style={{marginTop:0}}>{title}</h1>
    <p>Live tracker of ratings, events and milestones.</p>
    {note ? <p style={{opacity:.8}}>{note}</p> : null}
  </section>);
}
