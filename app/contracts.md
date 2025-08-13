# API Contracts v1.1 (Frontend ⇄ Backend)

Note: La v1 frontend utilisait des mocks (src/mock.js). Depuis v1.1, l'UI consomme l'API, avec repli vers mock en cas d'erreur. Toutes les routes backend sont préfixées par /api.

Base URL
- Frontend: REACT_APP_BACKEND_URL (frontend/.env)
- Appels: `${REACT_APP_BACKEND_URL}/api/...`

Data Models
- Project
  {
    id: string,             // _id Mongo ObjectId string
    name: string,
    description: string,
    stars: number,
    forks: number,
    language: string,
    topics: string[],
    url: string,
    homepage?: string,
    updatedAt: string,      // ISO date
    featured?: boolean,
    details?: {             // champs éditoriaux pour la page détail
      story?: string,       // ton récit: pourquoi, quand, utilité, etc.
      startedAt?: string,   // ISO date
      completedAt?: string, // ISO date
      role?: string,
      impact?: string,
      problem?: string,
      solution?: string
    },
    repoTree?: Array<{      // aperçu hiérarchique du repo (manuel, pas d'appel GitHub)
      name: string,
      type: 'file' | 'dir',
      children?: any[]
    }>
  }

- ContactMessage
  {
    id: string,
    name: string,
    email: string,
    message: string,
    createdAt: string
  }

Endpoints
1) GET /api/projects
   - Query: q, lang, sort=updated|stars|name
   - Res: { items: Project[] }
2) POST /api/projects
   - Body: Project | Project[] (sans id). Pour seed manuel (pas d'import GitHub).
   - Res: { inserted: number }
3) GET /api/projects/featured
   - Res: { items: Project[] }
4) GET /api/projects/{id}
   - Res: Project (ProjectOut)
5) PUT /api/projects/{id}
   - Body: Partial<Project> (utilisation prévue surtout pour details/repoTree)
   - Res: { updated: number }
6) POST /api/contact
   - Body: { name, email, message }
   - Res: ContactMessage
7) Health (existant)
   - GET /api/ -> { message: 'Hello World' }
   - POST/GET /api/status

Intégration Frontend
- src/lib/api.js: fetchProjects, fetchFeatured, fetchProject(id), sendContact
- Pages: /projets/:id affiche 2 colonnes (gauche: récit, droite: aperçu repoTree et méta)
- Fallback sur src/mock.js si API indisponible

Tests
- Tester d'abord le backend (deep_testing_backend_v2)
- Puis, sur demande, tests UI.