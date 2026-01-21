import React from "react";
import * as LucideIcons from "lucide-react";

interface IconBackgroundProps {
  icon: keyof typeof LucideIcons;
  color: string;
  text: string;
}

export function IconBackground({ icon, color, text }: IconBackgroundProps) {
  const IconComponent = LucideIcons[icon] as React.ComponentType<{
    size: number;
    style: React.CSSProperties;
  }>;

  if (!IconComponent) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center w-7 h-7 rounded-md"
        style={{ backgroundColor: `${color}1A` }}
      >
        <IconComponent size={16} style={{ color }} />
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
