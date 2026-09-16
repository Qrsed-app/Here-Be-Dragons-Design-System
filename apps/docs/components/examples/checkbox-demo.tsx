"use client";

import * as React from "react";

import { Checkbox } from "@/registry/new-york/checkbox/checkbox";
import { Field, FieldLabel } from "@/registry/new-york/field/field";

const instruments = ["Compass", "Astrolabe", "Sextant"];

export function CheckboxSelectAllDemo() {
  const [packed, setPacked] = React.useState<string[]>(["Compass"]);
  const all = packed.length === instruments.length;

  return (
    <div className="flex flex-col gap-7">
      <Field orientation="horizontal" className="items-start gap-2 py-3">
        <Checkbox
          id="pack-all"
          checked={all ? true : packed.length > 0 ? "indeterminate" : false}
          onCheckedChange={(checked) => setPacked(checked === true ? [...instruments] : [])}
        />
        <FieldLabel htmlFor="pack-all" className="text-[1.0625rem] font-normal">
          Pack all instruments
        </FieldLabel>
      </Field>
      <div className="flex flex-col gap-5 ps-6">
        {instruments.map((item) => (
          <Field key={item} orientation="horizontal" className="items-start gap-2 py-3">
            <Checkbox
              id={`pack-${item}`}
              checked={packed.includes(item)}
              onCheckedChange={(checked) =>
                setPacked((prev) =>
                  checked === true ? [...prev, item] : prev.filter((i) => i !== item),
                )
              }
            />
            <FieldLabel htmlFor={`pack-${item}`} className="text-[1.0625rem] font-normal">
              {item}
            </FieldLabel>
          </Field>
        ))}
      </div>
    </div>
  );
}
