"use client";

import React from "react";
import type { TemplateBlock } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Eye, EyeOff, Lock, Unlock, Copy, Pencil } from "lucide-react";

export function LayersPanel(props: {
  blocks: TemplateBlock[];
  selectedId: string | null;
  selectedIds?: Record<string, boolean>;
  onSelectAction: (id: string) => void;
  onSelectWithMetaAction?: (input: { id: string; metaKey: boolean; shiftKey: boolean }) => void;
  onMoveAction: (id: string, dir: "up" | "down") => void;
  onToggleLockAction: (id: string) => void;
  onToggleHiddenAction: (id: string) => void;
  onDuplicateAction?: (id: string) => void;
  onDuplicateSelectedAction?: () => void;
  onRenameAction?: (id: string, name: string) => void;
  onReorderAction?: (input: { fromId: string; toId: string }) => void;
}) {
  const sorted = React.useMemo(
    () => [...props.blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [props.blocks]
  );

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState<string>("");

  React.useEffect(() => {
    if (!editingId) return;
    const blk = props.blocks.find((b) => b.id === editingId);
    setDraftName(blk?.name ?? "");
  }, [editingId, props.blocks]);

  const commitRename = React.useCallback(() => {
    if (!editingId) return;
    props.onRenameAction?.(editingId, draftName);
    setEditingId(null);
  }, [draftName, editingId, props]);

  const activeCount = React.useMemo(() => {
    if (!props.selectedIds) return props.selectedId ? 1 : 0;
    return Object.keys(props.selectedIds).filter((k) => props.selectedIds?.[k]).length;
  }, [props.selectedId, props.selectedIds]);

  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);

  const canReorder = !!props.onReorderAction;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Layers</div>
        {props.onDuplicateSelectedAction && activeCount > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            className="h-8"
            title="Duplicate selected"
            onClick={() => props.onDuplicateSelectedAction?.()}
          >
            <Copy className="w-3.5 h-3.5 mr-2" />
            Duplicate ({activeCount})
          </Button>
        ) : null}
      </div>

      {sorted.length === 0 ? (
        <div className="text-sm text-muted-foreground">No blocks yet.</div>
      ) : (
        <div className="space-y-2">
          {sorted
            .slice()
            .reverse()
            .map((b) => {
              const active = b.id === props.selectedId;
              const multiActive = props.selectedIds ? !!props.selectedIds[b.id] : active;

              return (
                <div
                  key={b.id}
                  className={
                    "flex items-center gap-2 rounded-xl border p-2 bg-background/40 " +
                    (multiActive ? "border-primary/50" : "border-border/40") +
                    (dropTargetId === b.id ? " ring-2 ring-primary/20" : "")
                  }
                  onDragOver={(e) => {
                    if (!canReorder || !draggingId) return;
                    e.preventDefault();
                    setDropTargetId(b.id);
                  }}
                  onDragLeave={() => {
                    if (!canReorder) return;
                    setDropTargetId((cur) => (cur === b.id ? null : cur));
                  }}
                  onDrop={(e) => {
                    if (!canReorder) return;
                    e.preventDefault();
                    const fromId = e.dataTransfer.getData("application/qbilling-layer") || draggingId;
                    if (!fromId) return;
                    props.onReorderAction?.({ fromId, toId: b.id });
                    setDraggingId(null);
                    setDropTargetId(null);
                  }}
                >
                  {canReorder ? (
                    <div
                      className="cursor-grab select-none px-1 text-muted-foreground"
                      title="Drag to reorder"
                      draggable
                      onDragStart={(e) => {
                        setDraggingId(b.id);
                        setDropTargetId(null);
                        e.dataTransfer.setData("application/qbilling-layer", b.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTargetId(null);
                      }}
                    >
                      
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={(e) => {
                      if (props.onSelectWithMetaAction) {
                        props.onSelectWithMetaAction({ id: b.id, metaKey: e.metaKey || e.ctrlKey, shiftKey: e.shiftKey });
                      } else {
                        props.onSelectAction(b.id);
                      }
                    }}
                    className="flex-1 text-left min-w-0"
                    title="Click: select  Ctrl/Cmd: multi-select  Shift: range"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={active ? "default" : "secondary"}>{b.type}</Badge>

                      {editingId === b.id ? (
                        <Input
                          autoFocus
                          className="h-7 text-xs"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                      ) : (
                        <span className="text-xs font-semibold truncate">{b.name || "(unnamed)"}</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono opacity-60 truncate">{b.id}</div>
                  </button>

                  {props.onRenameAction ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Rename"
                      onClick={() => {
                        setEditingId(b.id);
                        setDraftName(b.name ?? "");
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  ) : null}

                  {props.onDuplicateAction ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Duplicate"
                      onClick={() => props.onDuplicateAction?.(b.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  ) : null}

                  <Button
                    variant="ghost"
                    size="icon"
                    title={b.hidden ? "Show" : "Hide"}
                    onClick={() => props.onToggleHiddenAction(b.id)}
                  >
                    {b.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    title={b.locked ? "Unlock" : "Lock"}
                    onClick={() => props.onToggleLockAction(b.id)}
                  >
                    {b.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </Button>

                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Move up"
                      onClick={() => props.onMoveAction(b.id, "up")}
                      className="h-7 w-7"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Move down"
                      onClick={() => props.onMoveAction(b.id, "down")}
                      className="h-7 w-7"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <div className="text-[10px] text-muted-foreground">
        Top items render last (on top). Hidden layers won’t show on canvas.
      </div>
    </div>
  );
}
