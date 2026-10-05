import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import {
  addProjectPhotos,
  adminGetProject,
  adminListProjects,
  deletePhoto,
  deleteProject,
  reorderPhotos,
  saveProject,
  updatePhoto,
  type AdminProject,
  type ProjectInput,
} from "~/lib/admin-api";
import { cn, img, useSite } from "~/lib/ui";
import { formatPrice } from "~/lib/features";
import { AdminPage, Btn, Card, ImageField, TextArea, TextInput, Toggle, uploadImage, useAction, useToast } from "~/components/admin/kit";
import { UploadIcon } from "~/components/Icons";

export const Route = createFileRoute("/admin/projects/$id")({
  loader: async ({ params }) => {
    const { categories } = await adminListProjects();
    if (params.id === "new") return { project: null, categories };
    const project = await adminGetProject({ data: Number(params.id) });
    if (!project) throw notFound();
    return { project, categories };
  },
  component: ProjectEditor,
});

const EMPTY: ProjectInput = {
  title: "",
  slug: "",
  category: "",
  location: "",
  year: String(new Date().getFullYear()),
  duration: "",
  scope: "",
  summary: "",
  description: "",
  cover_image: "",
  featured: 0,
  published: 1,
  listing_type: "",
  price: 0,
  price_note: "",
  bedrooms: 0,
  bathrooms: 0,
  area: "",
  status: "",
  amenities: "",
};

const PRICE_NOTES = ["outright", "per year", "per month", "per night", "per plot", "per sqm"];

const DEFAULT_CATEGORIES = ["Residential", "Commercial", "Hospitality", "Office"];
const SELECT = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900";

function ProjectEditor() {
  const { project, categories } = Route.useLoaderData();
  const site = useSite();
  const L = site.labels;
  const listing = site.features.listings;
  const router = useRouter();
  const navigate = useNavigate();
  const { busy, run } = useAction();
  const fresh = (): ProjectInput =>
    listing ? { ...EMPTY, listing_type: site.listing.types[0] ?? "", status: site.listing.statuses[0] ?? "" } : { ...EMPTY };
  const [f, setF] = useState<ProjectInput>(() => (project ? { ...project } : fresh()));
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setF(project ? { ...project } : fresh());
    setDirty(false);
  }, [project?.id]);

  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };

  async function save() {
    const res = await run(() => saveProject({ data: { ...f, id: project?.id } }), project ? "Saved" : "Created. Now add photos.");
    if (!res || !res.ok) return;
    setDirty(false);
    if (!project) navigate({ to: "/admin/projects/$id", params: { id: String(res.id) } });
    else router.invalidate();
  }

  const allCategories = [...new Set([...(listing ? site.listing.propertyTypes : DEFAULT_CATEGORIES), ...categories])];

  return (
    <AdminPage
      title={project ? project.title : `New ${L.item.toLowerCase()}`}
      subtitle={project ? `/portfolio/${project.slug}` : "Fill in the details, save, then add photos."}
      actions={
        <>
          <Link to="/admin/projects" className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100">
            ← All {L.items.toLowerCase()}
          </Link>
          {project?.published ? (
            <a href={`/portfolio/${project.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50">
              View on site ↗
            </a>
          ) : null}
          <Btn variant="primary" onClick={save} disabled={busy}>
            {busy ? "Saving…" : project ? (dirty ? "Save changes" : "Saved") : `Create ${L.item.toLowerCase()}`}
          </Btn>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title={`${L.item} details`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                className="sm:col-span-2"
                label="Title *"
                value={f.title}
                onChange={(v) => set("title", v)}
                placeholder={listing ? "e.g. 4-Bedroom Detached Duplex with BQ" : "e.g. Modern Family Living Room"}
              />
              <Label2 label={listing ? "Property type" : "Category"}>
                <input list="project-categories" value={f.category} onChange={(e) => set("category", e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900" />
                <datalist id="project-categories">
                  {allCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Label2>
              <TextInput label="Location" value={f.location} onChange={(v) => set("location", v)} placeholder={listing ? "e.g. Gwarinpa, Abuja" : "e.g. Abuja"} />
              {!listing && (
                <>
                  <TextInput label="Year" value={f.year} onChange={(v) => set("year", v)} />
                  <TextInput label="Duration" value={f.duration} onChange={(v) => set("duration", v)} placeholder="e.g. 6 weeks" />
                  <TextInput className="sm:col-span-2" label="Scope of work" value={f.scope} onChange={(v) => set("scope", v)} placeholder="e.g. Living room redesign, custom sofa, lighting" />
                </>
              )}
              <TextArea className="sm:col-span-2" label="Short summary" hint={`Shown on the ${L.item.toLowerCase()} card and at the top of its page.`} rows={2} value={f.summary} onChange={(v) => set("summary", v)} />
              <TextArea className="sm:col-span-2" label="Full description" hint="Leave a blank line between paragraphs." rows={8} value={f.description} onChange={(v) => set("description", v)} />
            </div>
          </Card>

          {listing && (
            <Card title="Listing details" description="Price, rooms and status shown on the property card and page.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Label2 label="Listing type">
                  <select value={f.listing_type} onChange={(e) => set("listing_type", e.target.value)} className={SELECT}>
                    <option value="">Not set</option>
                    {[...new Set([...site.listing.types, f.listing_type].filter(Boolean))].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Label2>
                <Label2 label="Status">
                  <select value={f.status} onChange={(e) => set("status", e.target.value)} className={SELECT}>
                    <option value="">Not set</option>
                    {[...new Set([...site.listing.statuses, f.status].filter(Boolean))].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Label2>
                <Label2 label={`Price (${site.listing.currency}, numbers only)`}>
                  <input
                    inputMode="numeric"
                    value={f.price ? String(f.price) : ""}
                    onChange={(e) => set("price", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)}
                    placeholder="e.g. 85000000"
                    className={SELECT}
                  />
                  <span className="mt-1 block text-xs text-zinc-500">{f.price ? formatPrice(site.listing.currency, f.price) : "Leave empty to show “Price on request”."}</span>
                </Label2>
                <Label2 label="Price note">
                  <input list="price-notes" value={f.price_note} onChange={(e) => set("price_note", e.target.value)} placeholder="e.g. per year" className={SELECT} />
                  <datalist id="price-notes">
                    {PRICE_NOTES.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </Label2>
                <div className="grid grid-cols-2 gap-4">
                  <Label2 label="Bedrooms">
                    <input type="number" min={0} max={50} value={f.bedrooms || ""} onChange={(e) => set("bedrooms", Math.max(0, Number(e.target.value) || 0))} className={SELECT} />
                  </Label2>
                  <Label2 label="Bathrooms">
                    <input type="number" min={0} max={50} value={f.bathrooms || ""} onChange={(e) => set("bathrooms", Math.max(0, Number(e.target.value) || 0))} className={SELECT} />
                  </Label2>
                </div>
                <TextInput label="Size" value={f.area} onChange={(v) => set("area", v)} placeholder="e.g. 450 sqm, 1 plot" />
                <TextArea
                  className="sm:col-span-2"
                  label="Features & amenities"
                  hint="One per line, e.g. Boys' quarters, Swimming pool, 24/7 security, Fitted kitchen."
                  rows={5}
                  value={f.amenities}
                  onChange={(v) => set("amenities", v)}
                />
              </div>
            </Card>
          )}

          {project ? (
            <PhotoManager project={project} onCover={(url) => set("cover_image", url)} cover={f.cover_image} />
          ) : (
            <Card title="Photos">
              <p className="text-sm text-zinc-500">Create the {L.item.toLowerCase()} first, then you can upload its photos here.</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <div className="space-y-3">
              <Toggle label="Published" hint="Show it on the website." checked={!!f.published} onChange={(v) => set("published", v ? 1 : 0)} />
              <Toggle label="Featured" hint="Show it on the home page." checked={!!f.featured} onChange={(v) => set("featured", v ? 1 : 0)} />
            </div>
          </Card>
          <Card title="Cover image" description="The main photo. Click 'Set as cover' on any photo, or upload one here.">
            <ImageField label="Cover" value={f.cover_image} onChange={(v) => set("cover_image", v)} aspect="aspect-[4/5]" />
          </Card>
          <Card title="Web address">
            <TextInput label="Slug" hint="Leave as is unless you need a custom link. Letters, numbers and dashes." value={f.slug ?? ""} onChange={(v) => set("slug", v)} />
          </Card>
          {project && (
            <Card title="Danger zone">
              <Btn
                variant="danger"
                onClick={async () => {
                  if (!confirm(`Delete "${project.title}" and all its photos? This can't be undone.`)) return;
                  const r = await run(() => deleteProject({ data: project.id }), "Deleted");
                  if (r) navigate({ to: "/admin/projects" });
                }}
              >
                Delete {L.item.toLowerCase()}
              </Btn>
            </Card>
          )}
        </div>
      </div>
    </AdminPage>
  );
}

function Label2({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

function PhotoManager({ project, cover, onCover }: { project: AdminProject; cover: string; onCover: (url: string) => void }) {
  const router = useRouter();
  const toast = useToast();
  const { run } = useAction();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(project.photos);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  useEffect(() => setPhotos(project.photos), [project.photos]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading({ done: 0, total: list.length });
    const urls: string[] = [];
    for (const file of list) {
      try {
        urls.push(await uploadImage(file));
      } catch (e) {
        toast(`${file.name}: ${(e as Error).message}`, "error");
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    if (urls.length) {
      await run(() => addProjectPhotos({ data: { projectId: project.id, urls } }), `${urls.length} photo${urls.length === 1 ? "" : "s"} added`);
      if (!cover) onCover(urls[0]);
      await router.invalidate();
    }
    setUploading(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function persistOrder(next: typeof photos) {
    setPhotos(next);
    await run(() => reorderPhotos({ data: { projectId: project.id, ids: next.map((p) => p.id) } }));
  }

  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    persistOrder(next);
  }

  function onDrop(targetId: number) {
    if (dragId === null || dragId === targetId) return;
    const from = photos.findIndex((p) => p.id === dragId);
    const to = photos.findIndex((p) => p.id === targetId);
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    persistOrder(next);
  }

  return (
    <Card
      title={`Photos (${photos.length})`}
      description="Drag to reorder. These show in the project gallery in this order."
      actions={
        <Btn variant="primary" size="sm" onClick={() => fileRef.current?.click()} disabled={!!uploading}>
          <UploadIcon size={14} /> {uploading ? `Uploading ${uploading.done}/${uploading.total}…` : "Upload photos"}
        </Btn>
      }
    >
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      {photos.length === 0 ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-14 text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-800"
        >
          <UploadIcon size={28} />
          Click to upload photos (you can select many at once)
        </button>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((ph, i) => (
            <li
              key={ph.id}
              draggable
              onDragStart={() => setDragId(ph.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(ph.id)}
              className={cn("group overflow-hidden rounded-lg border bg-white", dragId === ph.id ? "border-zinc-900 opacity-50" : "border-zinc-200", cover === ph.url && "ring-2 ring-amber-500")}
            >
              <div className="relative aspect-[4/3] cursor-move bg-zinc-100">
                <img src={img(ph.url, 500)} alt="" className="h-full w-full object-cover" draggable={false} />
                <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">{i + 1}</span>
                {cover === ph.url && <span className="absolute right-2 top-2 rounded bg-amber-500 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">Cover</span>}
              </div>
              <div className="space-y-2 p-2">
                <input
                  defaultValue={ph.caption}
                  placeholder="Caption (optional)"
                  onBlur={(e) => {
                    if (e.target.value !== ph.caption) run(() => updatePhoto({ data: { id: ph.id, caption: e.target.value } }), "Caption saved");
                  }}
                  className="w-full rounded border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                />
                <div className="flex items-center justify-between gap-1">
                  <div className="flex">
                    <button aria-label="Move left" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-1.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">
                      ◀
                    </button>
                    <button aria-label="Move right" onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="rounded px-1.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">
                      ▶
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {cover !== ph.url && (
                      <button
                        onClick={() => {
                          onCover(ph.url);
                          toast("Cover set. Click 'Save changes' to keep it.");
                        }}
                        className="rounded px-1.5 py-1 text-[0.7rem] font-medium text-zinc-600 hover:bg-zinc-100"
                      >
                        Set as cover
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this photo?")) return;
                        setPhotos((p) => p.filter((x) => x.id !== ph.id));
                        await run(() => deletePhoto({ data: ph.id }), "Photo deleted");
                        router.invalidate();
                      }}
                      className="rounded px-1.5 py-1 text-[0.7rem] font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
