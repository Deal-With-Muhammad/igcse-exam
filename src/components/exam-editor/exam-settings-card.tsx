"use client";

import { Card, CardBody, CardHeader, Divider, Input, Switch, Slider } from "@heroui/react";
import { Clock, ShieldAlert } from "lucide-react";

export interface ExamSettings {
  hasTimer: boolean;
  time_limit_minutes: number | null;
  terminate_on_switch: boolean;
  max_warnings: number;
}

export function ExamSettingsCard({ settings, onChange }: { settings: ExamSettings; onChange: (s: ExamSettings) => void }) {
  const set = <K extends keyof ExamSettings>(k: K, v: ExamSettings[K]) => onChange({ ...settings, [k]: v });

  return (
    <Card>
      <CardHeader><h2 className="font-semibold">Exam Settings</h2></CardHeader>
      <Divider />
      <CardBody className="space-y-6">
        {/* Timer */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium flex items-center gap-1"><Clock size={14} /> Overall time limit</p>
              <p className="text-xs text-default-500">When off, students have unlimited time</p>
            </div>
            <Switch
              isSelected={settings.hasTimer}
              onValueChange={(v) => {
                if (v && settings.time_limit_minutes == null) {
                  onChange({ ...settings, hasTimer: true, time_limit_minutes: 60 });
                } else {
                  set("hasTimer", v);
                }
              }}
            />
          </div>
          {settings.hasTimer && (
            <Input
              type="number"
              label="Minutes"
              min={1}
              max={600}
              value={String(settings.time_limit_minutes ?? 60)}
              onChange={(e) => set("time_limit_minutes", Math.max(1, Number.parseInt(e.target.value) || 60))}
              className="max-w-[180px]"
              size="sm"
            />
          )}
        </div>

        <Divider />

        {/* Termination */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium flex items-center gap-1"><ShieldAlert size={14} /> Auto-terminate on tab-switching</p>
              <p className="text-xs text-default-500">When off, switches are still logged for the teacher but the exam never ends early</p>
            </div>
            <Switch isSelected={settings.terminate_on_switch} onValueChange={(v) => set("terminate_on_switch", v)} />
          </div>

          {settings.terminate_on_switch && (
            <div className="space-y-2 mt-3">
              <p className="text-xs text-default-500">Allow up to <strong>{settings.max_warnings}</strong> warning{settings.max_warnings === 1 ? "" : "s"} before terminating</p>
              <Slider
                size="sm"
                step={1}
                minValue={1}
                maxValue={10}
                value={settings.max_warnings}
                onChange={(v) => set("max_warnings", Array.isArray(v) ? v[0] : v)}
                showSteps
                marks={[{ value: 1, label: "1" }, { value: 3, label: "3" }, { value: 5, label: "5" }, { value: 10, label: "10" }]}
                className="max-w-md"
                aria-label="Max warnings"
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
