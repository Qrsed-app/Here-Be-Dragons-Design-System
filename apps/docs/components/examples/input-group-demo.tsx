"use client";

import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/registry/new-york/input-group/input-group";

export function InputGroupPasswordDemo() {
  const [visible, setVisible] = React.useState(false);

  return (
    <InputGroup className="max-w-sm">
      <InputGroupInput
        type={visible ? "text" : "password"}
        placeholder="••••••••"
        aria-label="Password"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
