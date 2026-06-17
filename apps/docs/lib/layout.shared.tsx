import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Here Be Dragons",
    },
    // 3-way light / dark / high-contrast switcher replaces the built-in toggle.
    themeSwitch: {
      component: <ThemeSwitcher />,
    },
  };
}
