"use client";

import { Button } from "@heroui/react";
import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  small?: boolean;
}

export function SingleImageUploader({ value, onChange, label = "Image", small }: Props) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await supabase.storage.from("question-images").upload(path, file, { upsert: true });
      if (error) { toast.error(error.message); return; }
      const { data } = supabase.storage.from("question-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const sizeClass = small ? "w-20 h-20" : "w-32 h-32";

  return (
    <div className="flex items-start gap-3">
      {value ? (
        <div className="relative">
          <Image src={value} alt={label} width={small ? 80 : 128} height={small ? 80 : 128} className={`${sizeClass} object-cover rounded border border-default-200`} unoptimized />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-1 -right-1 bg-danger text-white rounded-full p-1 shadow"
            aria-label="Remove image"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ) : (
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <div className={`${sizeClass} flex flex-col items-center justify-center border-2 border-dashed border-default-300 rounded hover:border-primary transition-colors`}>
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            ) : (
              <>
                <ImagePlus size={20} className="text-default-400" />
                <span className="text-xs text-default-500 mt-1">{label}</span>
              </>
            )}
          </div>
        </label>
      )}
    </div>
  );
}

export function MultiImageUploader({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false);

  const upload = async (files: FileList) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const path = `ref/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const { error } = await supabase.storage.from("question-images").upload(path, file, { upsert: true });
        if (error) { toast.error(error.message); continue; }
        const { data } = supabase.storage.from("question-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      onChange([...value, ...urls]);
    } finally {
      setUploading(false);
    }
  };

  const remove = (i: number) => {
    const arr = [...value];
    arr.splice(i, 1);
    onChange(arr);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={url + i} className="relative">
            <Image src={url} alt={`ref ${i + 1}`} width={80} height={80} className="w-20 h-20 object-cover rounded border border-default-200" unoptimized />
            <button type="button" onClick={() => remove(i)} className="absolute -top-1 -right-1 bg-danger text-white rounded-full p-1 shadow" aria-label="Remove">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <label className="cursor-pointer">
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
          <div className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-default-300 rounded hover:border-primary transition-colors">
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            ) : (
              <>
                <ImagePlus size={18} className="text-default-400" />
                <span className="text-[10px] text-default-500 mt-1">Add</span>
              </>
            )}
          </div>
        </label>
      </div>
      <p className="text-xs text-default-500 mt-2">Reference images appear at the top of the exam paper</p>
    </div>
  );
}
