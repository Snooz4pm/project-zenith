export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a12', color: 'white', flexDirection: 'column' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>404 – Page Not Found</h1>
      <p style={{ color: '#aaa' }}>Sorry, the page you are looking for does not exist.</p>
    </div>
  );
}
