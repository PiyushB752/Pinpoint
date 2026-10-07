"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Protocol } from "@/types";

interface SidebarProps {
  protocols: Protocol[];
}

export default function Sidebar({
  protocols,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">P</div>

        <div>
          <div className="brand-name">
            Pinpoint
          </div>

          <div className="brand-subtitle">
            Runbook assistant
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <span className="sidebar-label">
            Workspace
          </span>

          <Link
            href="/"
            className={`nav-item ${
              pathname === "/" ? "active" : ""
            }`}
          >
            <span>Search</span>
          </Link>

          <Link
            href="/"
            className="nav-item"
          >
            <span>History</span>
          </Link>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-label">
            Protocols
          </span>

          <div className="protocol-list">
            {protocols.map((protocol) => (
              <button
                key={protocol.id}
                type="button"
                className="protocol-item"
              >
                {protocol.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="sidebar-bottom">
        <div className="index-status">
          <span className="status-dot" />

          <div>
            <strong>Knowledge base</strong>
            <span>Up to date</span>
          </div>
        </div>

        <Link
          href="/admin"
          className={`nav-item ${
            pathname === "/admin"
              ? "active"
              : ""
          }`}
        >
          <span>Administration</span>
        </Link>
      </div>
    </aside>
  );
}