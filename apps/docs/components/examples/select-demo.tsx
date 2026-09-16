"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/registry/new-york/select/select";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/new-york/field/field";

export function SelectDemo() {
  return (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Choose a port…" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectLabel>Ports of call</SelectLabel>
          <SelectItem value="lisbon">Lisbon</SelectItem>
          <SelectItem value="cadiz">Cádiz</SelectItem>
          <SelectItem value="tangier">Tangier</SelectItem>
          <SelectItem value="valletta">Valletta</SelectItem>
          <SelectItem value="constantinople">Constantinople</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function SelectClearableDemo() {
  const [port, setPort] = React.useState("lisbon");
  return (
    <div className="flex flex-col gap-3">
      <Select value={port} onValueChange={setPort}>
        <SelectTrigger className="w-64" onClear={() => setPort("")}>
          <SelectValue placeholder="Choose a port…" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="lisbon">Lisbon</SelectItem>
          <SelectItem value="cadiz">Cádiz</SelectItem>
          <SelectItem value="tangier">Tangier</SelectItem>
        </SelectContent>
      </Select>
      <span className="font-sans text-sm text-muted-foreground">Value: {port || "(empty)"}</span>
    </div>
  );
}

export function SelectGroupsDemo() {
  return (
    <Select defaultValue="caravel">
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Pick a class…" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectLabel>Sail</SelectLabel>
          <SelectItem value="caravel">Caravel</SelectItem>
          <SelectItem value="carrack">Carrack</SelectItem>
          <SelectItem value="galleon">Galleon</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Oar</SelectLabel>
          <SelectItem value="galley">Galley</SelectItem>
          <SelectItem value="longship" disabled>
            Longship (unavailable)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

const winds = (
  <SelectContent position="popper">
    <SelectItem value="trade">Trade wind</SelectItem>
    <SelectItem value="monsoon">Monsoon</SelectItem>
    <SelectItem value="gale">Gale</SelectItem>
  </SelectContent>
);

export function SelectSizesDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Select>
        <SelectTrigger size="sm" className="w-64">
          <SelectValue placeholder="Small" />
        </SelectTrigger>
        {winds}
      </Select>
      <Select>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Default" />
        </SelectTrigger>
        {winds}
      </Select>
      <Select>
        <SelectTrigger size="lg" className="w-64">
          <SelectValue placeholder="Large" />
        </SelectTrigger>
        {winds}
      </Select>
    </div>
  );
}

export function SelectFieldDemo() {
  return (
    <div className="flex w-64 flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="cargo">Cargo hold</FieldLabel>
        <Select>
          <SelectTrigger id="cargo" className="w-full">
            <SelectValue placeholder="Select cargo…" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="spices">Spices</SelectItem>
            <SelectItem value="silk">Silk</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>Heavier cargo slows the ship.</FieldDescription>
      </Field>
      <Field data-invalid>
        <FieldLabel htmlFor="destination">
          Destination
          <span aria-hidden="true">*</span>
        </FieldLabel>
        <Select required>
          <SelectTrigger id="destination" className="w-full" aria-invalid>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="indies">The Indies</SelectItem>
            <SelectItem value="cathay">Cathay</SelectItem>
          </SelectContent>
        </Select>
        <FieldError>Choose a destination before setting sail.</FieldError>
      </Field>
    </div>
  );
}

export function SelectDisabledDemo() {
  return (
    <Select disabled defaultValue="indies">
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value="indies">The Indies</SelectItem>
        <SelectItem value="cathay">Cathay</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function SelectScrollableDemo() {
  return (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Choose a creature…" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectLabel>Dragons</SelectLabel>
          <SelectItem value="red">Red dragon</SelectItem>
          <SelectItem value="blue">Blue dragon</SelectItem>
          <SelectItem value="green">Green dragon</SelectItem>
          <SelectItem value="black">Black dragon</SelectItem>
          <SelectItem value="white">White dragon</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Giants</SelectLabel>
          <SelectItem value="hill">Hill giant</SelectItem>
          <SelectItem value="stone">Stone giant</SelectItem>
          <SelectItem value="frost">Frost giant</SelectItem>
          <SelectItem value="fire">Fire giant</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function SelectItemAlignedDemo() {
  return (
    <Select defaultValue="tangier">
      <SelectTrigger className="w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="lisbon">Lisbon</SelectItem>
        <SelectItem value="cadiz">Cádiz</SelectItem>
        <SelectItem value="tangier">Tangier</SelectItem>
        <SelectItem value="valletta">Valletta</SelectItem>
      </SelectContent>
    </Select>
  );
}
