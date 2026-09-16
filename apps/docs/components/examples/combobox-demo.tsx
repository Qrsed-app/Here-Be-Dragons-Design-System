"use client";

import * as React from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/registry/new-york/badge/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/registry/new-york/command/command";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/new-york/field/field";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/new-york/popover/popover";
import { Spinner } from "@/registry/new-york/spinner/spinner";

const fieldClass =
  "flex min-h-11 w-64 flex-wrap items-center gap-1 rounded-md border border-border-strong bg-background px-3 py-1 font-sans text-[1.0625rem] text-foreground has-focus-visible:border-input-focus has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring has-focus-visible:outline-solid has-aria-invalid:border-error-border has-disabled:cursor-not-allowed has-disabled:bg-surface-subtle has-disabled:opacity-50";
const triggerClass =
  "min-h-[calc(1.7em+0.5rem)] min-w-30 flex-1 truncate py-1 text-left outline-none aria-invalid:text-foreground-emphasis disabled:cursor-not-allowed";
const clearClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm p-1 text-muted-foreground outline-none hover:text-foreground-emphasis";
const panelClass = "w-(--radix-popover-trigger-width) max-w-none min-w-0 gap-0 rounded-md p-0";

const ports = [
  { value: "lisbon", label: "Lisbon" },
  { value: "cadiz", label: "Cádiz" },
  { value: "tangier", label: "Tangier" },
  { value: "valletta", label: "Valletta" },
  { value: "constantinople", label: "Constantinople" },
];

export function ComboboxDemo() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const selected = ports.find((p) => p.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={fieldClass}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              className={cn(triggerClass, !selected && "text-muted-foreground")}
            >
              {selected?.label ?? "Search a port…"}
            </button>
          </PopoverTrigger>
          {selected && (
            <button
              type="button"
              aria-label="Clear selection"
              className={clearClass}
              onClick={() => setValue("")}
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" sideOffset={4} showArrow={false} className={panelClass}>
        <Command>
          <CommandInput placeholder="Search a port…" />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup>
              {ports.map((port) => (
                <CommandItem
                  key={port.value}
                  value={port.label}
                  data-checked={value === port.value}
                  onSelect={() => {
                    setValue(value === port.value ? "" : port.value);
                    setOpen(false);
                  }}
                >
                  {port.label}
                  <CheckIcon
                    className={cn(
                      "ml-auto size-3 text-foreground-gold",
                      value !== port.value && "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const provisions = [
  { value: "hardtack", label: "Hardtack" },
  { value: "rum", label: "Rum" },
  { value: "limes", label: "Limes" },
  { value: "salt-pork", label: "Salt pork" },
  { value: "gunpowder", label: "Gunpowder" },
];

export function ComboboxMultipleDemo() {
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<string[]>(["rum"]);
  const toggle = (v: string) =>
    setValues((current) =>
      current.includes(v) ? current.filter((x) => x !== v) : [...current, v],
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn(fieldClass, "w-72")}>
          {values.map((v) => {
            const label = provisions.find((p) => p.value === v)?.label ?? v;
            return (
              <Badge
                key={v}
                variant="outline"
                className="h-6 max-w-[200px] gap-1 border-border-ink bg-surface-raised px-2 text-[0.8125rem] leading-[1.7] font-normal"
              >
                <span className="truncate">{label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full leading-none text-muted-foreground outline-none hover:text-foreground-emphasis"
                  onClick={() => toggle(v)}
                >
                  <XIcon className="size-2.5" />
                </button>
              </Badge>
            );
          })}
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              className={cn(triggerClass, "text-muted-foreground")}
            >
              {values.length === 0 ? "Add provisions…" : null}
            </button>
          </PopoverTrigger>
          {values.length > 0 && (
            <button
              type="button"
              aria-label="Clear selection"
              className={clearClass}
              onClick={() => setValues([])}
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" sideOffset={4} showArrow={false} className={panelClass}>
        <Command>
          <CommandInput placeholder="Search provisions…" />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup>
              {provisions.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  data-checked={values.includes(item.value)}
                  onSelect={() => toggle(item.value)}
                >
                  {item.label}
                  <CheckIcon
                    className={cn(
                      "ml-auto size-3 text-foreground-gold",
                      !values.includes(item.value) && "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const harbours = [
  "Alexandria",
  "Antioch",
  "Barcelona",
  "Cádiz",
  "Genoa",
  "Lisbon",
  "Marseille",
  "Naples",
  "Tangier",
  "Tunis",
  "Valletta",
  "Venice",
];

function searchHarbours(query: string) {
  return new Promise<string[]>((resolve) =>
    setTimeout(
      () => resolve(harbours.filter((h) => h.toLowerCase().includes(query.toLowerCase()))),
      600,
    ),
  );
}

export function ComboboxAsyncDemo() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const found = await searchHarbours(query);
      if (!cancelled) {
        setResults(found);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={fieldClass}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              className={cn(triggerClass, !value && "text-muted-foreground")}
            >
              {value || "Search the harbour master…"}
            </button>
          </PopoverTrigger>
          {value && (
            <button
              type="button"
              aria-label="Clear selection"
              className={clearClass}
              onClick={() => setValue("")}
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" sideOffset={4} showArrow={false} className={panelClass}>
        <Command shouldFilter={false}>
          <CommandInput placeholder="Type a harbour…" value={query} onValueChange={setQuery} />
          <CommandList>
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-3 font-sans text-[0.8125rem] text-muted-foreground">
                <Spinner size="sm" />
                Searching…
              </div>
            ) : (
              <>
                <CommandEmpty>No results</CommandEmpty>
                <CommandGroup>
                  {results.map((h) => (
                    <CommandItem
                      key={h}
                      value={h}
                      data-checked={value === h}
                      onSelect={() => {
                        setValue(h);
                        setOpen(false);
                      }}
                    >
                      {h}
                      <CheckIcon
                        className={cn(
                          "ml-auto size-3 text-foreground-gold",
                          value !== h && "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const vessels = [
  { value: "caravel", label: "Caravel" },
  { value: "carrack", label: "Carrack" },
  { value: "galley", label: "Galley" },
];

function VesselCombobox({ id, invalid }: { id: string; invalid?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const selected = vessels.find((v) => v.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn(fieldClass, "w-full")}>
          <PopoverTrigger asChild>
            <button
              id={id}
              type="button"
              role="combobox"
              aria-expanded={open}
              aria-invalid={invalid || undefined}
              className={cn(triggerClass, !selected && "text-muted-foreground")}
            >
              {selected?.label ?? "Pick a class…"}
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" sideOffset={4} showArrow={false} className={panelClass}>
        <Command>
          <CommandInput placeholder="Search classes…" />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup>
              {vessels.map((v) => (
                <CommandItem
                  key={v.value}
                  value={v.label}
                  data-checked={value === v.value}
                  onSelect={() => {
                    setValue(v.value);
                    setOpen(false);
                  }}
                >
                  {v.label}
                  <CheckIcon
                    className={cn(
                      "ml-auto size-3 text-foreground-gold",
                      value !== v.value && "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ComboboxFieldDemo() {
  return (
    <div className="flex w-64 flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="vessel">Vessel class</FieldLabel>
        <VesselCombobox id="vessel" />
        <FieldDescription>Must match a listed class.</FieldDescription>
      </Field>
      <Field data-invalid>
        <FieldLabel htmlFor="flagship">Flagship class</FieldLabel>
        <VesselCombobox id="flagship" invalid />
        <FieldError>Choose a class before setting sail.</FieldError>
      </Field>
    </div>
  );
}
