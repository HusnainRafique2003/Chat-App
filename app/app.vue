<script setup lang="ts">
import { onMounted } from 'vue'
import * as locales from '@nuxt/ui/locale'
import { useUserStore } from '~/stores/useUserStore'

const { locale } = useI18n()
const route = useRoute()
const userStore = useUserStore()

const uiLocale = computed(() => locales[locale.value] ?? locales.en)
const lang = computed(() => uiLocale.value.code ?? 'en')
const dir = computed(() => uiLocale.value.dir ?? 'ltr')

onMounted(async () => {
  if (process.client && userStore.isLoggedIn) {
    await userStore.validateAuth()
  }
})

useHead({
  htmlAttrs: {
    lang,
    dir
  }
})
</script>

<template>
  <UApp :locale="uiLocale">
    <NuxtLayout>
      <NuxtPage :page-key="route.fullPath" />
    </NuxtLayout>
  </UApp>
</template>
