"use client";

import * as React from "react";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/registry/new-york/breadcrumb/breadcrumb";

const middle = [
  { label: "Northern Seas", href: "#" },
  { label: "Frostbite Strait", href: "#" },
  { label: "Glacier Bay", href: "#" },
];

export function BreadcrumbTruncatedDemo() {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Atlas</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {expanded ? (
          middle.map((crumb) => (
            <React.Fragment key={crumb.label}>
              <BreadcrumbItem>
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          ))
        ) : (
          <>
            <BreadcrumbItem>
              <button
                type="button"
                aria-label="Show the full path"
                onClick={() => setExpanded(true)}
                className="cursor-pointer border-none bg-transparent p-0 outline-none hover:[&>span]:text-foreground focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <BreadcrumbEllipsis />
              </button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage>Kraken Trench</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
