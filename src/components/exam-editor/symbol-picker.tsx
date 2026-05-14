"use client";

import { Button, Input, Popover, PopoverContent, PopoverTrigger, Tab, Tabs } from "@heroui/react";
import { Sigma, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { CATEGORY_LABELS, SYMBOLS, searchSymbols, type Symbol as Sym, type SymbolCategory } from "@/lib/symbols/data";

interface Props {
  onInsert: (text: string) => void;
}

export function SymbolPicker({ onInsert }: Props) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<SymbolCategory | "all">("all");

  const filtered = useMemo(() => {
    let list: Sym[] = query.trim() ? searchSymbols(query) : SYMBOLS;
    if (cat !== "all") list = list.filter((s) => s.category === cat);
    return list;
  }, [query, cat]);

  const categories: Array<SymbolCategory | "all"> = ["all", ...Object.keys(CATEGORY_LABELS) as SymbolCategory[]];

  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <Button size="sm" variant="flat" startContent={<Sigma size={14} />}>
          Symbols
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-3 w-[480px] max-w-[calc(100vw-2rem)]">
        <div className="w-full space-y-3">
          <Input
            size="sm"
            placeholder="Search by name or symbol..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startContent={<Search size={14} />}
            autoFocus
          />
          <Tabs size="sm" selectedKey={cat} onSelectionChange={(k) => setCat(k as SymbolCategory | "all")} variant="light" classNames={{ tabList: "overflow-x-auto" }}>
            {categories.map((c) => (
              <Tab key={c} title={c === "all" ? "All" : CATEGORY_LABELS[c]} />
            ))}
          </Tabs>
          <div className="max-h-72 overflow-y-auto grid grid-cols-8 gap-1">
            {filtered.map((s, i) => (
              <button
                key={`${s.char}-${i}`}
                onClick={() => onInsert(s.char)}
                title={s.name}
                className="symbol-btn w-10 h-10 flex items-center justify-center rounded hover:bg-default-100 dark:hover:bg-default-50 border border-default-200 text-base"
              >
                {s.char}
              </button>
            ))}
            {filtered.length === 0 && <p className="col-span-8 text-center text-sm text-default-500 py-4">No matches</p>}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
