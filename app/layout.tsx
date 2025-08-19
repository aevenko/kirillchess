import './globals.css';

export const metadata = {
  title: 'KirillChess',
  description: 'Kirill — young chess player from Québec. Progress, tournaments, goals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <nav className="nav">
            <div className="brand">♟️ KirillChess</div>
            <div style={{display:'flex', gap:12}}>
              <a href="/">Home</a>
              <a href="/tournaments/">Tournaments</a>
              <a href="/goals/">Goals</a>
              <a href="/ratings/">Ratings</a>
              <a href="/about/">About</a>
              <a href="/contacts/">Contact</a>
            </div>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
