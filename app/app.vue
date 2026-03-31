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
    <NuxtPage />
  </UApp>
</template>