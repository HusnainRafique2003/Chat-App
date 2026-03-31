<script setup lang="ts">
import { ref } from 'vue'

const selectedSize = ref<'sm' | 'md' | 'lg' | 'xl'>('md')

const sizes = [
  { label: 'SM', value: 'sm' },
  { label: 'MD', value: 'md' },
  { label: 'LG', value: 'lg' },
  { label: 'XL', value: 'xl' },
]

const sizeClass = computed(() => ({
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
}[selectedSize.value]))

// ── MDI Icons ──────────────────────────────────────────────
const mdiIcons = [
  { name: 'i-mdi-home',              label: 'Home' },
  { name: 'i-mdi-account',           label: 'Account' },
  { name: 'i-mdi-heart',             label: 'Heart' },
  { name: 'i-mdi-shopping-cart',     label: 'Cart' },
  { name: 'i-mdi-bell',              label: 'Bell' },
  { name: 'i-mdi-magnify',           label: 'Search' },
  { name: 'i-mdi-cog',               label: 'Settings' },
  { name: 'i-mdi-email',             label: 'Email' },
  { name: 'i-mdi-map-marker',        label: 'Location' },
  { name: 'i-mdi-star',              label: 'Star' },
  { name: 'i-mdi-thumb-up',          label: 'Like' },
  { name: 'i-mdi-share-variant',     label: 'Share' },
  { name: 'i-mdi-delete',            label: 'Delete' },
  { name: 'i-mdi-pencil',            label: 'Edit' },
  { name: 'i-mdi-plus-circle',       label: 'Add' },
  { name: 'i-mdi-check-circle',      label: 'Check' },
  { name: 'i-mdi-close-circle',      label: 'Close' },
  { name: 'i-mdi-information',       label: 'Info' },
  { name: 'i-mdi-alert-circle',      label: 'Alert' },
  { name: 'i-mdi-lock',              label: 'Lock' },
  { name: 'i-mdi-calendar',          label: 'Calendar' },
  { name: 'i-mdi-image',             label: 'Image' },
]

// ── Material Symbols Icons ─────────────────────────────────
const materialIcons = [
  { name: 'i-material-symbols-home',            label: 'Home' },
  { name: 'i-material-symbols-person',          label: 'Person' },
  { name: 'i-material-symbols-search',          label: 'Search' },
  { name: 'i-material-symbols-notifications',   label: 'Notifications' },
  { name: 'i-material-symbols-settings',        label: 'Settings' },
  { name: 'i-material-symbols-mail',            label: 'Mail' },
  { name: 'i-material-symbols-location-on',     label: 'Location' },
  { name: 'i-material-symbols-star',            label: 'Star' },
  { name: 'i-material-symbols-thumb-up',        label: 'Like' },
  { name: 'i-material-symbols-share',           label: 'Share' },
  { name: 'i-material-symbols-delete',          label: 'Delete' },
  { name: 'i-material-symbols-edit',            label: 'Edit' },
  { name: 'i-material-symbols-add-circle',      label: 'Add' },
  { name: 'i-material-symbols-check-circle',    label: 'Check' },
  { name: 'i-material-symbols-cancel',          label: 'Cancel' },
  { name: 'i-material-symbols-info',            label: 'Info' },
  { name: 'i-material-symbols-warning',         label: 'Warning' },
  { name: 'i-material-symbols-lock',            label: 'Lock' },
  { name: 'i-material-symbols-calendar-month',  label: 'Calendar' },
  { name: 'i-material-symbols-image',           label: 'Image' },
  { name: 'i-material-symbols-shopping-cart',   label: 'Cart' },
  { name: 'i-material-symbols-favorite',        label: 'Favorite' },
]

// ── Icon in UButton demo ───────────────────────────────────
const buttonIcons = [
  { icon: 'i-mdi-home',                   label: 'Home',     color: 'primary'   },
  { icon: 'i-mdi-heart',                  label: 'Like',     color: 'error'     },
  { icon: 'i-mdi-shopping-cart',          label: 'Cart',     color: 'success'   },
  { icon: 'i-material-symbols-search',    label: 'Search',   color: 'secondary' },
  { icon: 'i-material-symbols-settings',  label: 'Settings', color: 'neutral'   },
  { icon: 'i-material-symbols-share',     label: 'Share',    color: 'warning'   },
]

const copiedIcon = ref('')
function copyName(name: string) {
  navigator.clipboard.writeText(`<UIcon name="${name}" />`)
  copiedIcon.value = name
  setTimeout(() => (copiedIcon.value = ''), 1500)
}
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- Size Selector -->
    <UCard>
      <template #header>
        <p class="font-bold">🎛️ Icon Size Preview</p>
      </template>
      <div class="flex gap-2 items-center flex-wrap">
        <span class="text-sm text-muted">Size:</span>
        <UButton
          v-for="s in sizes"
          :key="s.value"
          :variant="selectedSize === s.value ? 'solid' : 'outline'"
          color="primary"
          size="sm"
          @click="selectedSize = s.value as any"
        >
          {{ s.label }}
        </UButton>
        <div class="ml-4 flex gap-4 items-center">
          <UIcon name="i-mdi-home" :class="sizeClass" />
          <UIcon name="i-mdi-heart" :class="sizeClass" />
          <UIcon name="i-material-symbols-search" :class="sizeClass" />
          <UIcon name="i-material-symbols-favorite" :class="sizeClass" />
        </div>
      </div>
    </UCard>

    <!-- MDI Icons Grid -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-bold">📦 MDI Icons — @iconify-json/mdi</p>
          <UBadge color="primary" variant="soft">{{ mdiIcons.length }} shown</UBadge>
        </div>
      </template>

      <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        <button
          v-for="icon in mdiIcons"
          :key="icon.name"
          class="flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer
                 hover:bg-muted transition-colors group"
          :class="copiedIcon === icon.name ? 'bg-muted ring-2 ring-primary' : ''"
          @click="copyName(icon.name)"
        >
          <UIcon
            :name="icon.name"
            class="text-2xl text-default group-hover:text-primary transition-colors"
          />
          <span class="text-[10px] text-muted text-center leading-tight">
            {{ icon.label }}
          </span>
          <span
            v-if="copiedIcon === icon.name"
            class="text-[9px] text-primary font-semibold"
          >
            Copied!
          </span>
        </button>
      </div>

      <template #footer>
        <p class="text-xs text-dimmed">Click any icon to copy its <code>&lt;UIcon&gt;</code> tag to clipboard.</p>
      </template>
    </UCard>

    <!-- Material Symbols Grid -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-bold">✨ Material Symbols — @iconify-json/material-symbols</p>
          <UBadge color="secondary" variant="soft">{{ materialIcons.length }} shown</UBadge>
        </div>
      </template>

      <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        <button
          v-for="icon in materialIcons"
          :key="icon.name"
          class="flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer
                 hover:bg-muted transition-colors group"
          :class="copiedIcon === icon.name ? 'bg-muted ring-2 ring-secondary' : ''"
          @click="copyName(icon.name)"
        >
          <UIcon
            :name="icon.name"
            class="text-2xl text-default group-hover:text-secondary transition-colors"
          />
          <span class="text-[10px] text-muted text-center leading-tight">
            {{ icon.label }}
          </span>
          <span
            v-if="copiedIcon === icon.name"
            class="text-[9px] text-secondary font-semibold"
          >
            Copied!
          </span>
        </button>
      </div>

      <template #footer>
        <p class="text-xs text-dimmed">Click any icon to copy its <code>&lt;UIcon&gt;</code> tag to clipboard.</p>
      </template>
    </UCard>

    <!-- Icons inside UButton -->
    <UCard>
      <template #header>
        <p class="font-bold">🔘 Icons inside UButton</p>
      </template>
      <div class="flex flex-wrap gap-3">
        <UButton
          v-for="btn in buttonIcons"
          :key="btn.icon"
          :color="btn.color as any"
          :leading-icon="btn.icon"
        >
          {{ btn.label }}
        </UButton>
      </div>
      <div class="flex flex-wrap gap-3 mt-3">
        <UButton
          v-for="btn in buttonIcons"
          :key="btn.icon + '-icon-only'"
          :color="btn.color as any"
          variant="ghost"
          :icon="btn.icon"
          :aria-label="btn.label"
        />
      </div>
    </UCard>

    <!-- Side by side comparison -->
    <UCard>
      <template #header>
        <p class="font-bold">⚖️ Side-by-Side Comparison</p>
      </template>
      <div class="grid grid-cols-2 gap-4">

        <div class="flex flex-col gap-3">
          <p class="text-sm font-semibold text-muted uppercase tracking-wide">MDI</p>
          <div v-for="icon in mdiIcons.slice(0, 6)" :key="icon.name"
            class="flex items-center gap-3 p-2 rounded-lg bg-muted">
            <UIcon :name="icon.name" class="text-xl text-primary" />
            <span class="text-xs text-default font-mono">{{ icon.name }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <p class="text-sm font-semibold text-muted uppercase tracking-wide">Material Symbols</p>
          <div v-for="icon in materialIcons.slice(0, 6)" :key="icon.name"
            class="flex items-center gap-3 p-2 rounded-lg bg-muted">
            <UIcon :name="icon.name" class="text-xl text-secondary" />
            <span class="text-xs text-default font-mono">{{ icon.name }}</span>
          </div>
        </div>

      </div>
    </UCard>

  </div>
</template>