"use client";

import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york/tabs/tabs";

export function TabsControlledDemo() {
  const [value, setValue] = React.useState("overview");

  return (
    <div className="flex w-full max-w-[34rem] flex-col gap-3">
      <Tabs value={value} onValueChange={setValue}>
        <TabsList aria-label="Voyage">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">A summary of the voyage so far.</TabsContent>
        <TabsContent value="activity">The running log of every port and every storm.</TabsContent>
        <TabsContent value="settings">Adjust the watch rotation and the rationing.</TabsContent>
      </Tabs>
      <p className="m-0 font-sans text-sm text-muted-foreground">
        Active tab: <strong className="text-foreground">{value}</strong>
      </p>
    </div>
  );
}
