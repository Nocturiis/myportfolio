import React, { useEffect, useMemo, useState } from "react";
import { fetchProjects, updateProject, fetchProject, sendContact } from "../lib/api";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { Search, Save, RefreshCw } from "lucide-react";

function Editor({ row, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: row.name || "",
    description: row.description || "",
    language: row.language || "",
    topics: (row.topics || []).join(", "),
    featured: !!row.featured,
    story: row.details?.story || "",
    startedAt: row.details?.startedAt ? row.details.startedAt.substring(0,10) : "",
    completedAt: row.details?.completedAt ? row.details.completedAt.substring(0,10) : "",
    role: row.details?.role || "",
    impact: row.details?.impact || "",
    repoTree: JSON.stringify(row.repoTree || [], null, 2)
  });

  const updateField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSave = async () => {
    setSaving(true);
    try {
      let parsedTree = [];
      try {
        parsedTree = JSON.parse(form.repoTree || "[]");
        if (!Array.isArray(parsedTree)) throw new Error("repoTree doit être un tableau");
      } catch (e) {
        toast({ title: "JSON invalide", description: e.message || "Vérifiez repoTree." });
        setSaving(false);
        return;
      }
      const payload = {
        name: form.name,
        description: form.description,
        language: form.language,
        topics: form.topics.split(",").map(t => t.trim()).filter(Boolean),
        featured: !!form.featured,
        details: {
          story: form.story,
          role: form.role,
          impact: form.impact,
          startedAt: form.startedAt ? new Date(form.startedAt).toISOString() : undefined,
          completedAt: form.completedAt ? new Date(form.completedAt).toISOString() : undefined,
        },
        repoTree: parsedTree,
      };
      await updateProject(row.id, payload);
      const refreshed = await fetchProject(row.id);
      onSaved(refreshed);
      toast({ title: "Enregistré", description: `Projet “${form.name}” mis à jour.` });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nom</label>
            <Input value={form.name} onChange={updateField("name")} />
          </div>
          <div>
            <label className="block text-sm mb-1">Langage</label>
            <Input value={form.language} onChange={updateField("language")} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <Textarea rows={3} value={form.description} onChange={updateField("description")} />
        </div>
        <div>
          <label className="block text-sm mb-1">Topics (séparés par des virgules)</label>
          <Input value={form.topics} onChange={updateField("topics")} placeholder="react, api, tooling" />
          <div className="mt-2 flex flex-wrap gap-2">
            {form.topics.split(",").map((t) => t.trim()).filter(Boolean).map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
        </div>
        <Separator />
        <div>
          <label className="block text-sm mb-1">Récit</label>
          <Textarea rows={6} value={form.story} onChange={updateField("story")} placeholder="Pourquoi, quand, utilité, enseignements..." />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Début</label>
            <Input type="date" value={form.startedAt} onChange={updateField("startedAt")} />
          </div>
          <div>
            <label className="block text-sm mb-1">Fin</label>
            <Input type="date" value={form.completedAt} onChange={updateField("completedAt")} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Rôle</label>
            <Input value={form.role} onChange={updateField("role")} placeholder="Auteur, Maintainer..." />
          </div>
          <div>
            <label className="block text-sm mb-1">Impact</label>
            <Input value={form.impact} onChange={updateField("impact")} placeholder="Résultats, adoption..." />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Projet en vedette</div>
            <div className="text-xs text-muted-foreground">Affiché sur l'accueil</div>
          </div>
          <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
        </div>
        <div>
          <label className="block text-sm mb-1">Aperçu du dépôt (JSON)</label>
          <Textarea rows={10} value={form.repoTree} onChange={updateField("repoTree")} />
        </div>
        <div>
          <Button onClick={onSave} disabled={saving} className="inline-flex items-center gap-2"><Save size={16}/> {saving ? "Enregistrement..." : "Enregistrer"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProjects() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchProjects({ q });
      setRows(list);
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de charger les projets." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [q]);

  const onSaved = (p) => {
    setRows((prev) => prev.map((r) => (r.id === p.id ? p : r)));
  };

  return (
    <section className="section">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">Admin • Projets</h2>
          <Button variant="secondary" onClick={load} className="inline-flex items-center gap-2"><RefreshCw size={16}/> Rafraîchir</Button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher..." className="pl-8 w-64" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="text-xs text-muted-foreground">Cliquer sur une ligne pour éditer</div>
        </div>

        <div className="grid gap-4">
          {loading && <div className="text-sm text-muted-foreground">Chargement...</div>}
          {!loading && rows.length === 0 && <div className="text-sm text-muted-foreground">Aucun projet trouvé.</div>}
          {rows.map((r) => (
            <Card key={r.id} className="card-hover">
              <CardHeader onClick={() => setExpanded((e)=> ({...e, [r.id]: !e[r.id]}))} className="cursor-pointer">
                <CardTitle className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${r.featured ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                    <div className="truncate font-semibold">{r.name}</div>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-4">
                    <span className="hidden sm:inline">{r.language}</span>
                    <span className="hidden sm:inline">{new Date(r.updatedAt).toLocaleDateString('fr-FR')}</span>
                    <div className="flex flex-wrap gap-1 max-w-[40ch] justify-end">
                      {r.topics.slice(0,4).map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              {expanded[r.id] && (
                <CardContent>
                  <Editor row={r} onSaved={onSaved} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}