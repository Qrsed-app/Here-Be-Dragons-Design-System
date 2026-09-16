"use client";

import { Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/new-york/alert-dialog/alert-dialog";
import { Button } from "@/registry/new-york/button/button";

export function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary">Delete chart</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this chart?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The chart and every sounding on it will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="secondary">Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AlertDialogSmallDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary">Abandon voyage</Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Abandon the voyage?</AlertDialogTitle>
          <AlertDialogDescription>The crew will return to port.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay the course</AlertDialogCancel>
          <AlertDialogAction>Abandon</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AlertDialogMediaDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary">Burn the map</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Burn the map?</AlertDialogTitle>
          <AlertDialogDescription>
            Nobody will find the treasure again, including you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="secondary">Keep it</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Burn</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
