// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  srcDir: 'app',
  devServer: {
    host: 'localhost',
    port: 3000
  },
  runtimeConfig: {
    public: {
      // Dev-only override token for debugging API calls from the browser.
      // Set via `NUXT_PUBLIC_DEV_API_TOKEN` in `.env.local`.
      devApiToken: process.env.NUXT_PUBLIC_DEV_API_TOKEN || ''
    }
  },
  app: {
    head: {
      // ADDED: Meta configuration to allow Blob URLs for images
      meta: [
        { 
          'http-equiv': 'Content-Security-Policy', 
          content: "img-src 'self' blob: data: http://178.104.58.236;" 
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap'
        }
      ]
    }
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt'
  ],

  devtools: {
    enabled: false
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
  },

  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'ar', name: 'العربية' }
    ]
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  nitro: {
    preset: 'node-server'
  },

  vite: {
    cacheDir: '.vite',
    optimizeDeps: {
      force: false,
      include: [
        'vue',
        'vue-router',
        'pinia',
        '@vue/shared',
        'axios',
        '@tiptap/extension-code-block-lowlight',
        '@tiptap/extension-link',
        '@tiptap/extension-placeholder',
        '@tiptap/starter-kit',
        '@tiptap/vue-3',
        'lowlight'
      ]
    }
  }
})