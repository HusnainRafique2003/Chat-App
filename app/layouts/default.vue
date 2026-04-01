<script setup lang="ts">
import { useUserStore } from '~/stores/useUserStore'

const userStore = useUserStore()

const navItems = [
  { label: 'Home', icon: 'i-mdi-home', to: '/' },
  { label: 'Features', icon: 'i-mdi-lightning-bolt', to: '/#features' },
  { label: 'Reviews', icon: 'i-mdi-star-four-points', to: '/#reviews' },
  { label: 'Get Started', icon: 'i-mdi-rocket-launch', to: '/#get-started' }
]

function handleLogout() {
  userStore.logout()
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[var(--ui-bg)] text-[var(--ui-text)]">
    <!-- Navbar -->
    <header class="border-b border-[var(--ui-border)] bg-[var(--ui-bg)]/80 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2 font-bold text-2xl bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-secondary)] bg-clip-text text-transparent">
            <span>Chat</span><span class="text-[var(--ui-success)]">Sphere</span>
          </NuxtLink>

          <!-- Nav Links -->
          <nav class="hidden md:flex items-center gap-8">
            <NuxtLink 
              v-for="item in navItems" 
              :key="item.to" 
              :to="item.to"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--ui-text-muted)] hover:text-[var(--ui-primary)] hover:bg-[var(--ui-bg-elevated)] transition-all duration-200 font-medium"
            >
              <Icon :name="item.icon" class="w-4 h-4" />
              {{ item.label }}
            </NuxtLink>
          </nav>

          <!-- Auth CTAs -->
          <div class="flex items-center gap-3">
            <template v-if="userStore.isLoggedIn">
              <BaseButton 
                label="Dashboard" 
                size="sm" 
                color="primary" 
                to="/dashboard"
              />
              <BaseButton 
                label="Logout" 
                size="sm" 
                color="neutral" 
                variant="ghost"
                @click="handleLogout"
              />
            </template>
            <template v-else>
              <BaseButton 
                label="Login" 
                size="sm" 
                color="secondary" 
                variant="outline"
                to="/auth/login"
              />
              <BaseButton 
                label="Sign Up" 
                size="sm" 
                color="primary"
                to="/auth/register"
              />
            </template>
            <ColorModeButton class="ml-2" />
          </div>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-[var(--ui-border)] bg-[var(--ui-bg-muted)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid md:grid-cols-4 gap-8">
          <!-- Product -->
          <div>
            <NuxtLink to="/" class="flex items-center gap-2 font-bold text-xl mb-4 bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-secondary)] bg-clip-text text-transparent">
              ChatSphere
            </NuxtLink>
            <p class="text-[var(--ui-text-muted)] mb-4 max-w-sm">
              Revolutionize your team communication with real-time messaging, secure workspaces, and AI-powered insights.
            </p>
          </div>

          <!-- Links -->
          <div>
            <h4 class="font-semibold text-[var(--ui-text)] mb-4">Product</h4>
            <ul class="space-y-2 text-sm">
              <li><NuxtLink to="/#features" class="text-[var(--ui-text-muted)] hover:text-[var(--ui-primary)] transition-colors">Features</NuxtLink></li>
              <li><NuxtLink to="/#reviews" class="text-[var(--ui-text-muted)] hover:text-[var(--ui-primary)] transition-colors">Reviews</NuxtLink></li>
              <li><NuxtLink to="/#get-started" class="text-[var(--ui-text-muted)] hover:text-[var(--ui-primary)] transition-colors">Get Started</NuxtLink></li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold text-[var(--ui-text)] mb-4">Company</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="text-[var(--ui-text-muted)] hover:text-[var(--ui-primary)] transition-colors">About</a></li>
              <li><a href="#" class="text-[var(--ui-text-muted)] hover:text-[var(--ui-primary)] transition-colors">Careers</a></li>
              <li><a href="#" class="text-[var(--ui-text-muted)] hover:text-[var(--ui-primary)] transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold text-[var(--ui-text)] mb-4">Connect</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="text-[var(--ui-text-muted)] hover:text-[var(--ui-primary)] transition-colors">Discord</a></li>
              <li><a href="#" class="text-[var(--ui-text-muted)] hover:text-[var(--ui-primary)] transition-colors">Twitter</a></li>
              <li><a href="#" class="text-[var(--ui-text-muted)] hover:text-[var(--ui-primary)] transition-colors">Support</a></li>
            </ul>
          </div>
        </div>

        <div class="border-t border-[var(--ui-border-muted)] mt-12 pt-8 text-center text-sm text-[var(--ui-text-muted)]">
          <p>&copy; 2024 ChatSphere. All rights reserved. | <a href="/privacy">Privacy</a> | <a href="/terms">Terms</a></p>
        </div>
      </div>
    </footer>
  </div>
</template>
