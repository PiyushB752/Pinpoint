"use client";

import type { Protocol } from "@/types";

interface ProtocolShortcutsProps {
  protocols: Protocol[];
}

export default function ProtocolShortcuts({
  protocols,
}: ProtocolShortcutsProps) {
  return (
    <div className="shortcut-section">
      <div className="shortcut-header">
        <span>Suggested topics</span>
      </div>

      <div className="shortcut-list">
        {protocols.map((protocol) => (
          <span
            key={protocol.id}
            className="shortcut-item"
          >
            {protocol.name}
          </span>
        ))}
      </div>
    </div>
  );
}