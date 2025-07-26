import React from "react";
import { ResourceType } from "../lib/types";
import { ResourceIcon } from "./ResourceIcon";

interface ResourceDisplayProps {
  resources: Record<string, number> | undefined;
}

export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({ resources }) => {
  if (!resources) return <span>None</span>;

  const entries = Object.entries(resources).filter(([_, amount]) => amount > 0);

  if (entries.length === 0) return <span>None</span>;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      {entries.map(([type, amount]) => (
        <span
          key={type}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          {amount}
          <ResourceIcon resource={type as ResourceType} size="s" border={false} />
        </span>
      ))}
    </span>
  );
};
