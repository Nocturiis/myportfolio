import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProject, updateProject } from "../lib/api";
import { projects as mockProjects } from "../mock";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ExternalLink, Star, GitBranch, Folder, FileText, ArrowLeft, Pencil, Save } from "lucide-react";

function RepoTree({ nodes = [], level = 0 }) {
  if (!nodes || nodes.length === 0) return (
    <div className="text-sm text-muted-foreground">Aucun aperçu fourni.</div>
  );
  return (
    <ul className="space-y-1">
      {nodes.map((n, idx) => (
        <li key={`${n.name}-${idx}`} className="flex items-start gap-2">
          {n.type === 'dir' ? <Folder size={16} className="mt-1 text-primary"/> : <FileText size={16} className="mt-1 text-muted-foreground"/>}
          <div className="flex-1">
            <div className="text-sm font-medium">{n.name}</div>
            {n.children && n.children.length > 0 && (
              <div className="ml-4 border-l pl-3 mt-1">
                <RepoTree nodes={n.children} level={level+1} />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [proj, setProj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ story: "", startedAt: "", completedAt: "", role: "", impact: "", repoTree: "[]" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchProject(id);
        if (mounted) {
          setProj(data);
          const d = data.details || {};
          setForm({
            story: d.story || "",
            startedAt: d.startedAt ? d.startedAt.substring(0,10) : "",
            completedAt: d.completedAt ? d.completedAt.substring(0,10) : "",
            role: d.role || "",
            impact: d.impact || "",
            repoTree: JSON.stringify(data.repoTree || [], null, 2),
          });
        }
      } catch (e) {
        const fallback = mockProjects.find(p => String(p.id) === id) || mockProjects.find(p => encodeURIComponent(p.name) === id || p.name === decodeURIComponent(id || ""));
        if (mounted) setProj(fallback || null);
        toast({ title: "Mode dégradé", description: "Détails chargés depuis le mock ou indisponibles." });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [id]);

  const repoNodes = useMemo(() => proj?.repoTree || [], [proj]);

  const onSave = async () => {
    if (!proj?.id) {
      toast({ title: "Édition indisponible", description: "Ce projet n'existe pas côté API." });
      return;
    }
    let parsedTree = [];
    try {
      parsedTree = JSON.parse(form.repoTree || "[]");
      if (!Array.isArray(parsedTree)) throw new Error("repoTree doit être un tableau");
    } catch (e) {
      toast({ title: "JSON invalide", description: e.message || "Vérifiez le champ repoTree." });
      return;
    }
    const details = {
      story: form.story,
      role: form.role,
      impact: form.impact,
      startedAt: form.startedAt ? new Date(form.startedAt).toISOString() : undefined,
      completedAt: form.completedAt ? new Date(form.completedAt).toISOString() : undefined,
    };
    try {
      await updateProject(proj.id, { details, repoTree: parsedTree });
      const refreshed = await fetchProject(proj.id);
      setProj(refreshed);
      setEditing(false);
      toast({ title: "Enregistré", description: "Les détails du projet ont été mis à jour." });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer les modifications." });
    }
  };

  if (loading) {
    return (
      <section className="section">
        <div className="container mx-auto px-6">
          <div className="h-6 w-40 bg-muted rounded animate-pulse mb-6"/>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="h-6 bg-muted rounded animate-pulse w-2/3"/>
              <div className="h-24 bg-muted rounded animate-pulse"/>
              <div className="h-24 bg-muted rounded animate-pulse"/>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded animate-pulse"/>
              <div className="h-40 bg-muted rounded animate-pulse"/>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!proj) {
    return (
      <section className="section">
        <div className="container mx-auto px-6">
          <Button asChild variant="outline" className="mb-6"><Link to="/projets"><ArrowLeft size={16}/> Retour aux projets</Link></Button>
          <h2 className="text-2xl font-bold">Projet introuvable</h2>
          <p className="text-muted-foreground">Le projet demandé n'existe pas ou n'est pas encore synchronisé.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container mx-auto px-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <Button asChild variant="outline" className="mb-3"><Link to="/projets"><ArrowLeft size={16}/> Retour</Link></Button>
            <h1 className="text-3xl font-extrabold tracking-tight">{proj.name}</h1>
          </div>
          <div className="flex items-center gap-2"> 
            {proj.id ? (
              <Button variant="secondary" onClick={() => setEditing(v => !v)} className="inline-flex items-center gap-2">
                <Pencil size={16}/> {editing ? "Annuler" : "Éditer"}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Édition dispo après création via API</span>
            )}
            <a href={proj.url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              Voir sur GitHub <ExternalLink size={16}/>
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {proj.topics?.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Left: Story */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Pourquoi et comment</CardTitle></CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                {!editing ? (
                  <>
                    <p className="text-foreground/80 leading-relaxed">
                      {proj.details?.story || "Ajoutez ici votre récit: pourquoi vous avez réalisé ce projet, quand, et l'impact. (Contenu à enrichir)"}
                    </p>
                    <Separator className="my-4"/>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {proj.details?.startedAt && <div><span className="text-muted-foreground">Début</span><div className="font-medium">{new Date(proj.details.startedAt).toLocaleDateString('fr-FR')}</div></div>}
                      {proj.details?.completedAt && <div><span className="text-muted-foreground">Fin</span><div className="font-medium">{new Date(proj.details.completedAt).toLocaleDateString('fr-FR')}</div></div>}
                      {proj.details?.role && <div><span className="text-muted-foreground">Rôle</span><div className="font-medium">{proj.details.role}</div></div>}
                      {proj.details?.impact && <div><span className="text-muted-foreground">Impact</span><div className="font-medium">{proj.details.impact}</div></div>}
                    </div>
                  </>
                ) : (
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm mb-1" htmlFor="story">Récit</label>
                      <Textarea id="story" value={form.story} onChange={e => setForm({ ...form, story: e.target.value })} rows={6} placeholder="Pourquoi, quand, utilité, enseignements..."/>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1" htmlFor="startedAt">Début</label>
                        <Input id="startedAt" type="date" value={form.startedAt} onChange={e => setForm({ ...form, startedAt: e.target.value })}/>
                      </div>
                      <div>
                        <label className="block text-sm mb-1" htmlFor="completedAt">Fin</label>
                        <Input id="completedAt" type="date" value={form.completedAt} onChange={e => setForm({ ...form, completedAt: e.target.value })}/>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1" htmlFor="role">Rôle</label>
                        <Input id="role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Auteur, Maintainer, etc."/>
                      </div>
                      <div>
                        <label className="block text-sm mb-1" htmlFor="impact">Impact</label>
                        <Input id="impact" value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value })} placeholder="Résultats, adoption..."/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-1" htmlFor="repoTree">Aperçu du dépôt (JSON)</label>
                      <Textarea id="repoTree" value={form.repoTree} onChange={e => setForm({ ...form, repoTree: e.target.value })} rows={8} placeholder='[ {"name":"src","type":"dir","children":[{"name":"main.rs","type":"file"}]} ]'/>
                      <p className="text-xs text-muted-foreground mt-1">Conseil: garde un arbre concis (dossiers/ fichiers clés).</p>
                    </div>
                    <div>
                      <Button onClick={onSave} className="inline-flex items-center gap-2"><Save size={16}/> Enregistrer</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Résumé</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{proj.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Repo overview */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Statistiques</CardTitle></CardHeader>
              <CardContent className="text-sm flex items-center gap-6">
                <div className="inline-flex items-center gap-1"><Star size={16}/> {proj.stars}</div>
                <div className="inline-flex items-center gap-1"><GitBranch size={16}/> {proj.forks}</div>
                <div className="ml-auto text-xs opacity-70">{new Date(proj.updatedAt).toLocaleDateString('fr-FR')}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Aperçu du dépôt</CardTitle></CardHeader>
              <CardContent>
                <RepoTree nodes={repoNodes} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}