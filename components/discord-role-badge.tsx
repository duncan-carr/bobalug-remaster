"use client";

import { cn } from "@/lib/utils";

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

// Convert Discord color integer to hex string
function discordColorToHex(color: number): string {
  if (color === 0) return "#99aab5"; // Default Discord grey for no color
  return `#${color.toString(16).padStart(6, "0")}`;
}

// Get a readable text color (black or white) based on background
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

interface DiscordRoleBadgeProps {
  role: DiscordRole;
  variant?: "default" | "compact" | "dot";
  className?: string;
}

export function DiscordRoleBadge({
  role,
  variant = "default",
  className,
}: DiscordRoleBadgeProps) {
  const bgColor = discordColorToHex(role.color);
  const textColor = getContrastColor(bgColor);

  if (variant === "dot") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div
          className="h-3 w-3 rounded-full ring-1 ring-border/50"
          style={{ backgroundColor: bgColor }}
        />
        <span className="text-sm">{role.name}</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
          className
        )}
        style={{
          backgroundColor: `${bgColor}20`,
          color: role.color === 0 ? undefined : bgColor,
          borderColor: bgColor,
          borderWidth: "1px",
        }}
      >
        {role.name}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
        className
      )}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {role.name}
    </span>
  );
}

interface DiscordRolesListProps {
  roles: DiscordRole[];
  variant?: "default" | "compact" | "dot";
  maxDisplay?: number;
  className?: string;
}

export function DiscordRolesList({
  roles,
  variant = "default",
  maxDisplay,
  className,
}: DiscordRolesListProps) {
  if (!roles || roles.length === 0) {
    return null;
  }

  // Sort by position (highest first) and optionally limit
  const sortedRoles = [...roles].sort((a, b) => b.position - a.position);
  const displayRoles = maxDisplay
    ? sortedRoles.slice(0, maxDisplay)
    : sortedRoles;
  const hiddenCount = maxDisplay ? Math.max(0, roles.length - maxDisplay) : 0;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {displayRoles.map((role) => (
        <DiscordRoleBadge key={role.id} role={role} variant={variant} />
      ))}
      {hiddenCount > 0 && (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
}

