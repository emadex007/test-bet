import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { adminListProjects, deleteProject, moveProject, toggleProject } from "~/lib/admin-api";
import { img, useSite } from "~/lib/ui";
import { isUnavailable, shortPrice } from "~/lib/features";
import { AdminPage, Badge, Btn, EmptyState, useAction } from "~/components/admin/kit";

export const Route = createFileRoute("/admin/projects/")({
  loader: () => adminListProjects(),
  component: ProjectsList,
});

function ProjectsList() {
  const { projects } = Route.useLoaderData();
  const s = useSite();
  const L = s.labels;
  const listing = s.features.listings;
  const router = useRouter();
  const { busy, run } = useAction();
  const refresh = () => router.invalidate();

  const add = (
    <Link to="/admin/projects/$id" params={{ id: "new" }} className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
      + New {L.item.toLowerCase()}
    </Link>
  );

  return (
    <AdminPage
      title={L.items}
      subtitle={listing ? "Your listings. Each property gets its own page with price, details and a photo gallery." : `Each ${L.item.toLowerCase()} gets its own page with a photo gallery.`}
      actions={add}
    >
      {projects.length === 0 ? (
        <EmptyState title={`No ${L.items.toLowerCase()} yet`} text={`Add your first ${L.item.toLowerCase()} with photos to show on the website.`} action={add} />
      ) : (
        <ul className="space-y-2">
          {projects.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 md:gap-4">
              <div className="flex flex-col">
                <button
                  aria-label="Move up"
                  disabled={busy || i === 0}
                  onClick={() => run(() => moveProject({ data: { id: p.id, dir: -1 } })).then(refresh)}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  aria-label="Move down"
                  disabled={busy || i === projects.length - 1}
                  onClick={() => run(() => moveProject({ data: { id: p.id, dir: 1 } })).then(refresh)}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <Link to="/admin/projects/$id" params={{ id: String(p.id) }} className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 md:h-20 md:w-28">
                {p.cover_image && <img src={img(p.cover_image, 300)} alt="" className="h-full w-full object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link to="/admin/projects/$id" params={{ id: String(p.id) }} className="block truncate font-medium hover:underline">
                  {p.title}
                </Link>
                <p className="truncate text-xs text-zinc-500">
                  {(listing ? [p.listing_type, shortPrice(s.listing.currency, p.price), p.category, p.location] : [p.category, p.location, p.year]).filter(Boolean).join(" · ")} ·{" "}
                  {p.photo_count} photo{p.photo_count === 1 ? "" : "s"}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge status={p.published ? "published" : "hidden"}>{p.published ? "Published" : "Hidden"}</Badge>
                  {p.featured ? <Badge status="featured">Featured on home</Badge> : null}
                  {listing && isUnavailable(s, p.status) ? <Badge status="hidden">{p.status}</Badge> : null}
                </div>
              </div>
              <div className="hidden flex-wrap justify-end gap-2 md:flex">
                <Btn size="sm" onClick={() => run(() => toggleProject({ data: { id: p.id, field: "published", value: !p.published } }), p.published ? "Hidden from the website" : "Published").then(refresh)}>
                  {p.published ? "Hide" : "Publish"}
                </Btn>
                <Btn size="sm" onClick={() => run(() => toggleProject({ data: { id: p.id, field: "featured", value: !p.featured } })).then(refresh)}>
                  {p.featured ? "Unfeature" : "Feature"}
                </Btn>
                {p.published ? (
                  <a href={`/portfolio/${p.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100">
                    View ↗
                  </a>
                ) : null}
                <Btn
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Delete "${p.title}" and all its photos? This can't be undone.`)) run(() => deleteProject({ data: p.id }), "Deleted").then(refresh);
                  }}
                >
                  Delete
                </Btn>
              </div>
              <Link to="/admin/projects/$id" params={{ id: String(p.id) }} className="rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 md:hidden">
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-zinc-500">Use ▲ ▼ to change the order projects appear on the website. "Featured" projects appear on the home page.</p>
    </AdminPage>
  );
}
