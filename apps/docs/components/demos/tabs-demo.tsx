"use client";

// Tabs is a Radix-backed client component (its source carries 'use client'),
// but it relies on roving tabindex / selection state that runs on the client.
// These thin wrappers host the examples so everything hydrates correctly and
// keeps the controlled example's useState out of the server-rendered MDX.

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/registry/new-york/tabs/tabs";

const panelStyle: React.CSSProperties = {
  marginBlockStart: "var(--hbd-space-3, 0.75rem)",
};

/** Default horizontal tabs — uncontrolled via defaultValue. */
export function TabsBasicDemo() {
  return (
    <Tabs defaultValue="map" label="Voyage sections" style={{ width: "100%", maxWidth: "34rem" }}>
      <TabsList>
        <TabsTrigger value="map">Map</TabsTrigger>
        <TabsTrigger value="crew">Crew</TabsTrigger>
        <TabsTrigger value="log">Captain&apos;s log</TabsTrigger>
      </TabsList>
      <TabsContent value="map" style={panelStyle}>
        Chart the uncharted edges where the cartographers warned: here be dragons.
      </TabsContent>
      <TabsContent value="crew" style={panelStyle}>
        Twelve hands aboard, each with a watch to keep through the long night.
      </TabsContent>
      <TabsContent value="log" style={panelStyle}>
        Day 14 — fair winds from the east, the compass holds steady north.
      </TabsContent>
    </Tabs>
  );
}

/** Triggers can carry a count badge after the label. */
export function TabsBadgeDemo() {
  return (
    <Tabs defaultValue="inbox" label="Mailboxes" style={{ width: "100%", maxWidth: "34rem" }}>
      <TabsList>
        <TabsTrigger value="inbox" badge={8}>
          Inbox
        </TabsTrigger>
        <TabsTrigger value="sent">Sent</TabsTrigger>
        <TabsTrigger value="drafts" badge={2}>
          Drafts
        </TabsTrigger>
      </TabsList>
      <TabsContent value="inbox" style={panelStyle}>
        Eight unread dispatches from ports across the archipelago.
      </TabsContent>
      <TabsContent value="sent" style={panelStyle}>
        Every letter you&apos;ve sent down the trade routes.
      </TabsContent>
      <TabsContent value="drafts" style={panelStyle}>
        Two messages still waiting on a fair wind to send.
      </TabsContent>
    </Tabs>
  );
}

/** Vertical orientation — the tab column sits to the left of the panels. */
export function TabsVerticalDemo() {
  return (
    <Tabs
      orientation="vertical"
      defaultValue="north"
      label="Compass headings"
      style={{ width: "100%", maxWidth: "34rem" }}
    >
      <TabsList>
        <TabsTrigger value="north">North</TabsTrigger>
        <TabsTrigger value="east">East</TabsTrigger>
        <TabsTrigger value="south">South</TabsTrigger>
        <TabsTrigger value="west">West</TabsTrigger>
      </TabsList>
      <TabsContent value="north" style={panelStyle}>
        Hold the bearing toward the pole star and the steady cold.
      </TabsContent>
      <TabsContent value="east" style={panelStyle}>
        Toward the rising sun and the spice-laden ports.
      </TabsContent>
      <TabsContent value="south" style={panelStyle}>
        Into warmer seas where the maps run thin.
      </TabsContent>
      <TabsContent value="west" style={panelStyle}>
        Past the sunset edge that no chart has yet drawn.
      </TabsContent>
    </Tabs>
  );
}

/** A disabled trigger is dimmed, non-interactive, and skipped by Arrow keys. */
export function TabsDisabledDemo() {
  return (
    <Tabs
      defaultValue="overview"
      label="Chart sections"
      style={{ width: "100%", maxWidth: "34rem" }}
    >
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="soundings" disabled>
          Soundings
        </TabsTrigger>
        <TabsTrigger value="hazards">Hazards</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" style={panelStyle}>
        The lie of the coastline and the safe approaches to harbour.
      </TabsContent>
      <TabsContent value="soundings" style={panelStyle}>
        Depth readings — not yet surveyed for this stretch of water.
      </TabsContent>
      <TabsContent value="hazards" style={panelStyle}>
        Reefs, shoals, and the rocks that have claimed three ships.
      </TabsContent>
    </Tabs>
  );
}

/** Controlled — the active value lives in React and updates live. */
export function TabsControlledDemo() {
  const [value, setValue] = React.useState("overview");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--hbd-space-3, 0.75rem)",
        width: "100%",
        maxWidth: "34rem",
      }}
    >
      <Tabs value={value} onValueChange={(detail) => setValue(detail.value)} label="Account tabs">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" style={panelStyle}>
          A summary of the voyage so far.
        </TabsContent>
        <TabsContent value="activity" style={panelStyle}>
          The running log of every port and every storm.
        </TabsContent>
        <TabsContent value="settings" style={panelStyle}>
          Adjust the watch rotation and the rationing.
        </TabsContent>
      </Tabs>
      <p style={{ margin: 0 }}>
        Active tab: <strong>{value}</strong>
      </p>
    </div>
  );
}
