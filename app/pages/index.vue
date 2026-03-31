<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import { useColorMode } from '#imports'
import type { LocaleObject } from '@nuxtjs/i18n'

const { locale, locales, setLocale } = useI18n()
const colorMode = useColorMode()

const availableLocales = computed(() =>
  (locales.value as LocaleObject[]).map((l: LocaleObject) => ({
    label: l.name ?? l.code,
    value: l.code,
  }))
)
</script>

<template>
  <div class="min-h-screen bg-default text-default transition-colors duration-300">

    <!-- Navbar -->
    <header class="border-b border-default px-6 py-4 flex items-center justify-between">
      <span class="font-bold text-lg text-default">My Nuxt App</span>
      <div class="flex items-center gap-3">
        <USelectMenu
          :items="availableLocales"
          :model-value="locale"
          value-key="value"
          label-key="label"
          class="w-36"
          @update:model-value="setLocale($event)"
        />
        <ColorModeButton />
      </div>
    </header>

    <main class="max-w-3xl mx-auto py-12 px-6 flex flex-col gap-10">

      <!-- Locale + Color Mode Status -->
      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-xl border border-default bg-elevated p-4">
          <p class="text-sm text-muted">Current Locale</p>
          <p class="text-xl font-bold text-primary">{{ locale }}</p>
        </div>
        <div class="rounded-xl border border-default bg-elevated p-4">
          <p class="text-sm text-muted">Color Mode</p>
          <p class="text-xl font-bold text-primary">{{ colorMode.value }}</p>
        </div>
      </div>

      <section>
        <h2 class="text-xl font-bold mb-4 text-default">Pinia State Persistence Test</h2>
        <PiniaTest />
      </section>

      <section>
        <h2 class="text-xl font-bold mb-4 text-default">Axios API & Abort Controller Test</h2>
        <AxiosTest />
      </section>

      <section>
        <h2 class="text-xl font-bold mb-4 text-default">Icon Libraries Test</h2>
        <IconTest />
      </section>

      <section>
        <h2 class="text-xl font-bold mb-4 text-default">Reusable Components Demo</h2>
        <DemoComponentsDemo />
      </section>

    </main>
  </div>
</template>