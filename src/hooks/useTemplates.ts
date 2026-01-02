"use client";

import * as React from "react";
import type { InvoiceTemplate } from "@/lib/schema";
import { templatesRepo } from "@/lib/storage/templatesRepo";

const STORAGE_KEY = "qbilling_templates_v1";

export function useTemplates() {
  const [templates, setTemplates] = React.useState<InvoiceTemplate[]>([]);

  const refresh = React.useCallback(() => {
    templatesRepo.seedDefaultsIfEmpty();
    setTemplates(templatesRepo.list());
  }, []);

  React.useEffect(() => {
    refresh();

    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  const createTemplate = React.useCallback((name: string) => {
    const tpl = templatesRepo.create({ name });
    refresh();
    return tpl;
  }, [refresh]);

  const updateTemplate = React.useCallback(
    (id: string, patch: Partial<Pick<InvoiceTemplate, "name" | "description" | "blocks" | "previewData">>) => {
      const tpl = templatesRepo.update(id, patch);
      refresh();
      return tpl;
    },
    [refresh]
  );

  const removeTemplate = React.useCallback((id: string) => {
    templatesRepo.remove(id);
    refresh();
  }, [refresh]);

  const getTemplateById = React.useCallback((id: string) => {
    return templatesRepo.getById(id);
  }, []);

  return { templates, refresh, createTemplate, updateTemplate, removeTemplate, getTemplateById };
}
