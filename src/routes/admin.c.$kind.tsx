import { useMemo, useState } from "react";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { adminListItems, deleteItem, moveItem, saveItem, toggleItem, type ItemInput } from "~/lib/admin-api";
import { collectionOf } from "~/lib/pack";
import type { CollectionDef, FieldDef, Item } from "~/packs/collections";
import { cn, img } from "~/lib/ui";
import { AdminPage, Badge, Btn, EmptyState, ImageField, Label, Modal, SelectInput, TextArea, TextInput, Toggle, useAction } from "~/components/admin/kit";

/**
 * One dashboard page for every industry collection (matches, games, coins, menu items, causes…).
 * The fields come from the collection's definition in the active pack (src/packs/<id>.ts).
 */
export const Route = createFileRoute("/admin/c/$kind")({
  loader: async ({ params }) => {
    if (!collectionOf(params.kind)) throw notFound();
    return adminListItems({ data: params.kind });
  },
  component: CollectionAdmin,
});

const blank = (c: CollectionDef): ItemInput => ({
  kind: c.kind,
  title: "",
  grp: c.group?.options?.[0] ?? "",
  image: "",
  featured: 0,
  active: 1,
  data: Object.fromEntries(c.fields.map((f) => [f.k, f.type === "toggle" ? false : f.type === "select" ? f.options?.[0] ?? "" : ""])),
});

const fill = (tpl: string, i: Item) =>
  tpl.replace(/\{(\w+)\}/g, (_m, k: string) => {
    const v = k === "grp" ? i.grp : i.data?.[k];
    return v === undefined || v === "" ? "–" : String(v);
  });

function CollectionAdmin() {
  const { kind } = Route.useParams();
  const c = collectionOf(kind)!;
  const items = Route.useLoaderData();
  const router = useRouter();
  const { busy, run } = useAction();
  const [edit, setEdit] = useState<ItemInput | null>(null);
  const [q, setQ] = useState("");
  const [grp, setGrp] = useState("");
  const refresh = () => router.invalidate();

  const groups = useMemo(() => [...new Set([...(c.group?.options ?? []), ...items.map((i) => i.grp).filter(Boolean)])], [items, c]);
  const shown = items.filter((i) => (!grp || i.grp === grp) && (!q || `${i.title} ${i.grp} ${JSON.stringify(i.data)}`.toLowerCase().includes(q.toLowerCase())));

  async function save() {
    if (!edit) return;
    const r = await run(() => saveItem({ data: edit }), `${c.one} saved`);
    if (r && r.ok) {
      setEdit(null);
      refresh();
    }
  }

  const add = <Btn variant="primary" onClick={() => setEdit(blank(c))}>+ New {c.one.toLowerCase()}</Btn>;

  return (
    <AdminPage title={c.label} subtitle={c.description} actions={add}>
      {items.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900" />
          {groups.length > 1 && (
            <select value={grp} onChange={(e) => setGrp(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
              <option value="">All {c.group?.label.toLowerCase() ?? "groups"}</option>
              {groups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          )}
          <span className="text-xs text-zinc-500">{shown.length} of {items.length}</span>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState title={`No ${c.label.toLowerCase()} yet`} text={c.description} action={add} />
      ) : (
        <ul className="space-y-2">
          {shown.map((i) => {
            const pos = items.indexOf(i);
            return (
              <li key={i.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3">
                {!q && !grp && (
                  <div className="flex flex-col">
                    <button aria-label="Move up" disabled={busy || pos === 0} onClick={() => run(() => moveItem({ data: { id: i.id, kind, dir: -1 } })).then(refresh)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30">▲</button>
                    <button aria-label="Move down" disabled={busy || pos === items.length - 1} onClick={() => run(() => moveItem({ data: { id: i.id, kind, dir: 1 } })).then(refresh)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30">▼</button>
                  </div>
                )}
                {c.image && (
                  <span className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100">{i.image && <img src={img(i.image, 200)} alt="" className="h-full w-full object-cover" />}</span>
                )}
                <button type="button" onClick={() => setEdit({ ...i, data: { ...i.data } })} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-medium hover:underline">{i.title}</span>
                  <span className="block truncate text-xs text-zinc-500">{[i.grp, c.summary ? fill(c.summary, i) : ""].filter(Boolean).join(" · ")}</span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {!i.active && <Badge status="hidden">Hidden</Badge>}
                    {!!i.featured && c.featuredLabel && <Badge status="featured">{c.featuredLabel}</Badge>}
                  </span>
                </button>
                <div className="hidden gap-2 md:flex">
                  {c.featuredLabel && (
                    <Btn size="sm" onClick={() => run(() => toggleItem({ data: { id: i.id, field: "featured", value: !i.featured } })).then(refresh)}>
                      {i.featured ? `Unmark` : c.featuredLabel}
                    </Btn>
                  )}
                  <Btn size="sm" onClick={() => run(() => toggleItem({ data: { id: i.id, field: "active", value: !i.active } })).then(refresh)}>{i.active ? "Hide" : "Show"}</Btn>
                  <Btn size="sm" onClick={() => setEdit({ ...i, id: undefined, title: `${i.title} (copy)`, data: { ...i.data } })}>Copy</Btn>
                  <Btn size="sm" variant="danger" onClick={() => confirm(`Delete "${i.title}"?`) && run(() => deleteItem({ data: i.id }), "Deleted").then(refresh)}>Delete</Btn>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={!!edit}
        wide
        title={edit?.id ? `Edit ${c.one.toLowerCase()}` : `New ${c.one.toLowerCase()}`}
        onClose={() => setEdit(null)}
        footer={
          <>
            {edit?.id ? (
              <Btn variant="danger" className="mr-auto md:hidden" onClick={() => edit.id && confirm("Delete this?") && run(() => deleteItem({ data: edit.id! }), "Deleted").then(() => (setEdit(null), refresh()))}>
                Delete
              </Btn>
            ) : null}
            <Btn onClick={() => setEdit(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Btn>
          </>
        }
      >
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput className="sm:col-span-2" label={`${c.titleLabel ?? "Title"} *`} value={edit.title} onChange={(v) => setEdit({ ...edit, title: v })} />
            {c.group && (
              <Label label={c.group.label}>
                <input
                  list={`grp-${c.kind}`}
                  value={edit.grp}
                  onChange={(e) => setEdit({ ...edit, grp: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                />
                <datalist id={`grp-${c.kind}`}>
                  {groups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </Label>
            )}
            {c.fields.map((f) => (
              <ItemField
                key={f.k}
                f={f}
                value={edit.data[f.k]}
                onChange={(v) => setEdit({ ...edit, data: { ...edit.data, [f.k]: v } })}
              />
            ))}
            {c.image && (
              <div className="sm:col-span-2">
                <ImageField label="Photo" value={edit.image} onChange={(v) => setEdit({ ...edit, image: v })} />
              </div>
            )}
            <div className="flex flex-col gap-3 sm:col-span-2">
              <Toggle label="Show on website" checked={!!edit.active} onChange={(v) => setEdit({ ...edit, active: v ? 1 : 0 })} />
              {c.featuredLabel && <Toggle label={c.featuredLabel} checked={!!edit.featured} onChange={(v) => setEdit({ ...edit, featured: v ? 1 : 0 })} />}
            </div>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
}

function ItemField({ f, value, onChange }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const cls = cn(f.wide || f.type === "textarea" || f.type === "image" ? "sm:col-span-2" : "");
  const str = value === undefined || value === null ? "" : String(value);
  switch (f.type) {
    case "textarea":
      return <TextArea className={cls} label={f.label} hint={f.hint} rows={4} value={str} onChange={onChange} />;
    case "toggle":
      return (
        <div className={cls}>
          <Toggle label={f.label} hint={f.hint} checked={value === true || value === 1 || value === "true"} onChange={onChange} />
        </div>
      );
    case "select":
      return <SelectInput className={cls} label={f.label} hint={f.hint} value={str} onChange={onChange} options={(f.options ?? []).map((o) => ({ value: o, label: o }))} />;
    case "image":
      return (
        <div className={cls}>
          <ImageField label={f.label} hint={f.hint} value={str} onChange={onChange} />
        </div>
      );
    case "number":
      return (
        <TextInput
          className={cls}
          label={f.label}
          hint={f.hint}
          inputMode="decimal"
          placeholder={f.placeholder}
          value={str}
          onChange={(v) => onChange(v === "" ? "" : v.replace(/[^\d.\-]/g, ""))}
        />
      );
    case "datetime":
      return <TextInput className={cls} label={f.label} hint={f.hint} type="datetime-local" value={str} onChange={onChange} />;
    default:
      return <TextInput className={cls} label={f.label} hint={f.hint} placeholder={f.placeholder} value={str} onChange={onChange} />;
  }
}
