"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  image?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}

function getInitials(name?: string | null, email?: string | null) {
  const base = (name || email || "U").trim();

  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function UserAvatar({
  image,
  name,
  email,
  size = 40,
  className,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  const sharedStyles = {
    width: size,
    height: size,
  };

  if (image && !imageFailed) {
    return (
      <Image
        src={image}
        alt={name || "User"}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-xl object-cover ring-2 ring-border", className)}
        style={sharedStyles}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      aria-label={name || email || "User"}
      className={cn("flex shrink-0 items-center justify-center rounded-xl font-semibold text-white ring-2 ring-border", className)}
      style={{
        ...sharedStyles,
        fontSize: size * 0.36,
        background: "linear-gradient(135deg, #8B7BF0, #F06CA5)",
      }}
    >
      {getInitials(name, email)}
    </div>
  );
}
