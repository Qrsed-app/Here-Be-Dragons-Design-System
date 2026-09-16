"use client";

import {
  Codeblock,
  CodeblockCode,
  CodeblockContent,
  CodeblockCopyButton,
  CodeblockHeader,
  CodeblockLanguage,
} from "@/registry/new-york/codeblock/codeblock";

// In .mdx the newlines between these spans would be rewritten as markdown soft
// breaks, which show up inside the whitespace-pre <code>.
export function CodeblockHighlightDemo() {
  const source = `const hoard = 12000;\n// count the gold twice\nconsole.log("Smaug");\n.lair { color: crimson }`;

  return (
    <Codeblock className="w-full max-w-md">
      <CodeblockHeader>
        <CodeblockLanguage>TypeScript</CodeblockLanguage>
      </CodeblockHeader>
      <CodeblockContent>
        <CodeblockCode>
          <span className="tok-keyword">const</span> hoard <span className="tok-operator">=</span>{" "}
          <span className="tok-number">12000</span>;{"\n"}
          <span className="tok-comment">{"// count the gold twice"}</span>
          {"\n"}
          <span className="tok-function">console</span>.log(
          <span className="tok-string">&quot;Smaug&quot;</span>);{"\n"}
          <span className="tok-selector">.lair</span> {"{"}{" "}
          <span className="tok-property">color</span>: <span className="tok-value">crimson</span>{" "}
          {"}"}
        </CodeblockCode>
        <CodeblockCopyButton value={source} />
      </CodeblockContent>
    </Codeblock>
  );
}
