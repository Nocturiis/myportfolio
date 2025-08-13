import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./index.css";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { projects as mockProjects, profile } from "./mock";
import { ThemeProvider, useTheme } from "next-themes";
import { Github, Mail, Sun, Moon, Search, Star, GitBranch, ExternalLink, Eye, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./components/ui/select";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";
import { fetchProjects, fetchFeatured, sendContact } from "./lib/api";
import ProjectDetail from "./pages/ProjectDetail";
import AdminProjects from "./pages/AdminProjects";

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 header-blur">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 rounded-md bg-[color:var(--brand)]" />
          <span>Nocturiis</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" active={isActive("/")}>Accueil</NavLink>
          <NavLink to="/projets" active={isActive("/projets")}>Projets</NavLink>
          <NavLink to="/a-propos" active={isActive("/a-propos")}>À propos</NavLink>
          <NavLink to="/contact" active={isActive("/contact")}>Contact</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/admin/projets" className="hidden sm:inline-flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-muted" title="Espace admin">
            <Shield size={16}/> Admin
          </Link>
          <a href={profile.socials.github} target="_blank" rel="noreferrer" className="p-2 rounded-md hover:bg-muted transition-colors" aria-label="GitHub">
            <Github size={18} />
          </a>
          <ThemeToggle />
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors link-underline ${
        active ? "text-primary" : "text-foreground/80 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Menu
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow">
          <div className="flex flex-col p-2">
            <Link className="px-3 py-2 rounded hover:bg-muted" to="/" onClick={() => setOpen(false)}>Accueil</Link>
            <Link className="px-3 py-2 rounded hover:bg-muted" to="/projets" onClick={() => setOpen(false)}>Projets</Link>
            <Link className="px-3 py-2 rounded hover:bg-muted" to="/a-propos" onClick={() => setOpen(false)}>À propos</Link>
            <Link className="px-3 py-2 rounded hover:bg-muted" to="/contact" onClick={() => setOpen(false)}>Contact</Link>
            <Link className="px-3 py-2 rounded hover:bg-muted" to="/admin/projets" onClick={() => setOpen(false)}>Admin</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-6 py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} {profile.name}. Tous droits réservés.</p>
        <div className="flex items-center gap-4">
          <a href={profile.socials.github} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
          {profile.socials.linkedin && (
            <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>
          )}
        </div>
      </div>
    </footer>
  );
}

function Home() {
  const [featured, setFeatured] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await fetchFeatured();
        if (mounted) setFeatured(items);
      } catch (e) {
        setFeatured(mockProjects.filter(p => p.featured));
        toast({ title: "Mode dégradé", description: "Chargement des projets vedettes depuis le mock.", });
      }
    })();
    return () => { mounted = false }
  }, []);

  return (
    <div>
      <section className="section">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
                Construisons des logiciels solides et élégants
              </h1>
              <p className="mt-4 text-lg text-foreground/70 max-w-prose">
                {profile.bio}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="bg-[color:var(--brand)] hover:bg-[color:var(--brand-600)]" onClick={() => navigate('/projets')}>
                  Voir les projets
                </Button>
                <Button variant="outline" onClick={() => navigate('/contact')}>
                  Me contacter
                </Button>
              </div>
            </div>
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="text-primary" size={18}/> Projets en vedette</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {featured.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">{p.description}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {p.topics?.slice(0, 3).map((t) => (
                          <span key={t} className="badge-pill text-xs">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link to={`/projets/${p.id || encodeURIComponent(p.name)}`} className="p-2 rounded hover:bg-muted text-sm inline-flex items-center gap-1" aria-label="Voir détails">
                        <Eye size={16}/> Détails
                      </Link>
                      <a href={p.url} target="_blank" rel="noreferrer" className="p-2 rounded hover:bg-muted" aria-label="Ouvrir sur GitHub">
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="section bg-[color:var(--muted-bg)]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold">Envie de collaborer ?</h2>
              <p className="text-muted-foreground">Je suis ouvert aux opportunités freelances et projets open-source.</p>
            </div>
            <Link to="/contact"><Button className="bg-[color:var(--brand)] hover:bg-[color:var(--brand-600)]">Discutons</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Projects() {
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("all");
  const [sort, setSort] = useState("updated");
  const [items, setItems] = useState([]);
  const { toast } = useToast();

  const languages = useMemo(() => ["all", ...Array.from(new Set((items.length? items: mockProjects).map(p => p.language)))], [items]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchProjects({ q, lang, sort });
        if (mounted) setItems(list);
      } catch (e) {
        if (mounted) setItems(mockProjects);
        toast({ title: "Mode dégradé", description: "Chargement des projets depuis le mock.", });
      }
    })();
    return () => { mounted = false }
  }, [q, lang, sort]);

  const filtered = items;

  return (
    <section className="section">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">Mes projets GitHub</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher un projet..." className="pl-8 w-64" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Langage" /></SelectTrigger>
              <SelectContent>
                {languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Trier par" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Mis à jour</SelectItem>
                <SelectItem value="stars">Stars</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <Card key={p.id || p.name} className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="truncate">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <Link to={`/projets/${p.id || encodeURIComponent(p.name)}`} className="text-primary hover:underline flex items-center gap-1 text-sm">
                      Détails <Eye size={14}/>
                    </Link>
                    <a href={p.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                      GitHub <ExternalLink size={14} />
                    </a>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1"><Star size={16}/> {p.stars}</span>
                  <span className="inline-flex items-center gap-1"><GitBranch size={16}/> {p.forks}</span>
                  <span className="ml-auto text-xs opacity-70">{new Date(p.updatedAt).toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.topics?.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-70">{p.language}</span>
                  {p.homepage && (
                    <a className="text-primary hover:underline" href={p.homepage} target="_blank" rel="noreferrer">Demo</a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="section">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <Card className="md:col-span-1">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <img src={profile.avatarUrl} alt="Avatar" className="w-28 h-28 rounded-full object-cover" />
              <h3 className="mt-4 text-xl font-semibold">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.title}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Github size={16}/> <a className="hover:underline" href={profile.socials.github} target="_blank" rel="noreferrer">@{profile.username}</a>
              </div>
            </CardContent>
          </Card>
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">À propos</h2>
              <p className="mt-2 text-foreground/80 leading-relaxed max-w-prose">
                {profile.bio}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Compétences clés</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {["React", "TypeScript", "Python", "FastAPI", "Docker", "CI/CD", "Rust"].map(s => (
                  <span key={s} className="badge-pill">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      try {
        await sendContact(payload);
      } catch (apiErr) {
        const key = "contact_submissions";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push({ ...payload, id: Date.now(), date: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(prev));
        toast({ title: "Mode dégradé", description: "Message sauvegardé localement.", });
      }
      toast({ title: "Message envoyé", description: "Je vous répondrai au plus vite." });
      setForm({ name: "", email: "", message: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-2xl font-bold mb-6">Me contacter</h2>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="name">Nom</label>
            <Input id="name" name="name" placeholder="Votre nom" value={form.name} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="email">Email</label>
            <Input id="email" type="email" name="email" placeholder="vous@exemple.com" value={form.email} onChange={onChange} required />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="message">Message</label>
            <Textarea id="message" name="message" placeholder="Écrivez votre message..." value={form.message} onChange={onChange} required rows={6} />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting} className="bg-[color:var(--brand)] hover:bg-[color:var(--brand-600)]">
              {submitting ? "Envoi..." : "Envoyer"}
            </Button>
            <a className="inline-flex items-center gap-2 text-primary" href={`mailto:${profile.email}`}>
              <Mail size={16}/> Écrire un email
            </a>
          </div>
        </form>
      </div>
    </section>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      className="p-2 rounded-md hover:bg-muted transition-colors"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Basculer le thème"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function App() {
  return (
    <div className="App">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projets" element={<Projects />} />
              <Route path="/projets/:id" element={<ProjectDetail />} />
              <Route path="/admin/projets" element={<AdminProjects />} />
              <Route path="/a-propos" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Layout>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
    </div>
  );
}

export default App;