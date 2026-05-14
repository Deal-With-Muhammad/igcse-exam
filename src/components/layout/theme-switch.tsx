"use client";

import { Button } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeSwitch() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button isIconOnly variant="light" size="sm" aria-label="theme" />;
  }

  const current = resolvedTheme ?? theme ?? "light";
  return (
    <Button
      isIconOnly
      variant="light"
      size="sm"
      aria-label="Toggle theme"
      onPress={() => setTheme(current === "dark" ? "light" : "dark")}
    >
      {current === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
