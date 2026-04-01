<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

const { locale } = useI18n()

const uiLocale = computed(() => locales[locale.value] ?? locales.en)
const lang = computed(() => uiLocale.value.code ?? 'en')
const dir = computed(() => uiLocale.value.dir ?? 'ltr')

useHead({
  htmlAttrs: { lang, dir }
})
</script>

<template>
  <UApp :locale="uiLocale">
    <NuxtLayout>
      <NuxtPage :page-key="route => route.fullPath" />
    </NuxtLayout>
  </UApp>
</template>
