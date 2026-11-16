// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/test-utils/module'],

  // Configuration pour ton API Python (accessible via useRuntimeConfig().public.apiBase)
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:4010',
    },
  },

  // Rendu hybride : SEO activé par défaut, mode SPA fluide pour le plateau de jeu
  routeRules: {
    '/boards/**': { ssr: false },
  },
})