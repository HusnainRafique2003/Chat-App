<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

const { locale } = useI18n()

const lang = computed(() => locales[locale.value]?.code ?? 'en')
const dir = computed(() => locales[locale.value]?.dir ?? 'ltr')

useHead({
  htmlAttrs: { lang, dir }
})
</script>

<template>
  <UApp :locale="locales[locale]">
    <div class="flex h-screen w-full overflow-hidden bg-[var(--ui-bg)] text-[var(--ui-text)]">
      <AppSidebar />
      <main class="flex-1 overflow-auto rounded-l-[2rem] bg-white my-2 mr-2 shadow-2xl relative">
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
