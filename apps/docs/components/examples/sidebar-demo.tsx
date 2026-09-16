"use client";

import * as React from "react";
import {
  BookOpenIcon,
  CompassIcon,
  MapIcon,
  ScrollTextIcon,
  SearchIcon,
  ShieldIcon,
  SwordsIcon,
  UserIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/registry/new-york/sidebar/sidebar";

const voyage = [
  { title: "Atlas", icon: MapIcon, badge: "12" },
  { title: "Bestiary", icon: SwordsIcon },
  { title: "Spellbook", icon: BookOpenIcon, badge: "3" },
];

const quarters = [
  { title: "Crew", icon: UserIcon },
  { title: "Armoury", icon: ShieldIcon },
];

export function SidebarDemo() {
  const [active, setActive] = React.useState("Atlas");

  return (
    <SidebarProvider className="min-h-[26rem] w-full overflow-hidden rounded-md border border-border-subtle">
      <Sidebar collapsible="none" className="h-auto border-r border-sidebar-border">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1 font-display text-[1.0625rem] font-bold tracking-[0.02em]">
            <CompassIcon className="size-4" />
            Here Be Dragons
          </div>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <SidebarInput
              placeholder="Search the charts"
              className="pl-7"
              aria-label="Search the charts"
            />
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Voyage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {voyage.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active === item.title}
                      onClick={() => setActive(item.title)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                    {item.title === "Atlas" && active === "Atlas" ? (
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton href="#northern-seas" isActive>
                            Northern Seas
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton href="#kraken-trench">
                            Kraken Trench
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Quarters</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quarters.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active === item.title}
                      onClick={() => setActive(item.title)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <ScrollTextIcon />
                <span>Captain&apos;s log</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="gap-4 p-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <span className="font-display text-[0.8125rem] font-bold tracking-[0.2em] uppercase">
            {active}
          </span>
        </div>
        <p className="m-0 font-serif text-[1.0625rem] leading-[1.7] text-foreground-secondary">
          Chart the uncharted edges where the cartographers warned: here be dragons.
        </p>
      </SidebarInset>
    </SidebarProvider>
  );
}
