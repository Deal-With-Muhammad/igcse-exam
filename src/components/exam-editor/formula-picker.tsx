"use client";

import { Button, Input, Popover, PopoverContent, PopoverTrigger, Tab, Tabs } from "@heroui/react";
import { FunctionSquare, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { FORMULAS, searchFormulas, type Formula } from "@/lib/symbols/formulas";

interface Props {
  onInsert: (text: string) => void;
}

const CATEGORIES: Array<Formula["category"] | "all"> = ["all", "algebra", "geometry", "trig", "physics", "chemistry", "statistics", "calculus"];
const LABELS: Record<string, string> = { all: "All", algebra: "Algebra", geometry: "Geometry", trig: "Trig", physics: "Physics", chemistry: "Chem", statistics: "Stats", calculus: "Calc" };

export function FormulaPicker({ onInsert }: Props) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Formula["category"] | "all">("all");

  const filtered = useMemo(() => {
    let list = query.trim() ? searchFormulas(query) : FORMULAS;
    if (cat !== "all") list = list.filter((f) => f.category === cat);
    return list;
  }, [query, cat]);

  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <Button size="sm" variant="flat" startContent={<FunctionSquare size={14} />}>
          Formulas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-3 w-[560px] max-w-[calc(100vw-2rem)]">
        <div className="w-full space-y-3">
          <Input
            size="sm"
            placeholder="Search formulas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startContent={<Search size={14} />}
            autoFocus
          />
          <div className="w-full max-w-full overflow-x-auto">
            <Tabs
              size="sm"
              selectedKey={cat}
              onSelectionChange={(k) => setCat(k as Formula["category"] | "all")}
              variant="light"
              classNames={{ base: "w-max", tab: "w-auto flex-none" }}
            >
              {CATEGORIES.map((c) => <Tab key={c} title={LABELS[c]} />)}
            </Tabs>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {filtered.map((f, i) => (
              <button
                key={i}
                onClick={() => onInsert(f.template)}
                className="w-full text-left px-3 py-2 rounded hover:bg-default-100 dark:hover:bg-default-50 border border-default-200 transition-colors"
              >
                <div className="flex justify-between gap-2 items-baseline">
                  <span className="text-xs font-medium text-default-600">{f.name}</span>
                  <span className="text-[10px] uppercase text-default-400">{f.category}</span>
                </div>
                <span className="font-mono text-sm">{f.template}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center text-sm text-default-500 py-4">No matches</p>}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
