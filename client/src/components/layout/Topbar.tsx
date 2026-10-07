export default function Topbar() {
  return (
    <header className="topbar">
      <div>
        <span className="breadcrumb">NOC / WORKSPACE</span>
        <h1>Document Retrieval</h1>
      </div>

      <div className="topbar-status">
        <span className="status-dot" />
        SYSTEM OPERATIONAL
      </div>
    </header>
  );
}