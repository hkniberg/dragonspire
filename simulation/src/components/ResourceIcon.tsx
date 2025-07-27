import React from "react";
import { ResourceType } from "../lib/types";

interface ResourceIconProps {
  resource: ResourceType;
  size?: "s" | "m" | "l";
  border?: boolean;
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({ resource, size = "m", border = true }) => {
  const resourceImages = {
    food: "/resources/food.png",
    wood: "/resources/wood.png",
    ore: "/resources/ore.png",
    gold: "/resources/gold.png",
  };

  const sizeMap = {
    s: 16,
    m: 24,
    l: 32,
  };

  const imageSrc = resourceImages[resource];
  const pixelSize = sizeMap[size];

  if (!imageSrc) {
    console.warn(`No image found for resource: ${resource}`);
    return <span>?</span>;
  }

  return (
    <img
      src={imageSrc}
      alt={resource}
      style={{
        width: pixelSize,
        height: pixelSize,
        objectFit: "contain",
        border: border ? "1px solid rgba(0, 0, 0, 0.3)" : "none",
        borderRadius: border ? "3px" : "0",
        backgroundColor: border ? "rgba(255, 255, 255, 0.9)" : "transparent",
        boxShadow: border ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "none",
        padding: border ? "1px" : "0",
      }}
    />
  );
};

// Helper function to get resource image path (for cases where you just need the path)
export const getResourceImagePath = (resource: ResourceType): string => {
  const resourceImages = {
    food: "/resources/food.png",
    wood: "/resources/wood.png",
    ore: "/resources/ore.png",
    gold: "/resources/gold.png",
  };

  return resourceImages[resource] || "";
};
