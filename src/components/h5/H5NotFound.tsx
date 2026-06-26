export default function H5NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>功能开发中</div>
      <div style={{ fontSize: 13, color: '#7B89B8' }}>敬请期待...</div>
    </div>
  );
}
