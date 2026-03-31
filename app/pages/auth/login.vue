<script setup lang="ts">
import { useUserStore } from '~/stores/useUserStore'
const userStore = useUserStore()

const router = useRouter()

// Form
const email = ref('')
const password = ref('')
const loading = computed(() => userStore.isLoading)
const error = ref('')

async function handleLogin() {
  error.value = ''
  const result = await userStore.login(email.value, password.value)
  if (result.success) {
    await navigateTo('/dashboard')
  } else {
    error.value = result.error || 'Login failed'
  }
}

function handleForgot() {
  navigateTo('/auth/forgot-password')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--ui-primary)]/5 to-[var(--ui-secondary)]/5">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div>
        <NuxtLink to="/">
          <div class="mx-auto h-16 w-16 bg-[var(--ui-success)] rounded-2xl flex items-center justify-center mb-6">
            <Icon name="i-mdi-message-draw" class="w-10 h-10 text-white" />
          </div>
        </NuxtLink>
        <h2 class="mt-6 text-center text-3xl font-bold text-[var(--ui-text-highlighted)]">
          Sign in to ChatSphere
        </h2>
        <p class="mt-2 text-center text-[var(--ui-text-muted)]">
          Welcome back! Please sign in to your account.
        </p>
      </div>

      <!-- Form -->
      <BaseCard class="p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <BaseInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="your@email.com"
            required
            autocomplete="email"
            icon="i-mdi-email"
          />

          <BaseInput
            v-model="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            required
            autocomplete="current-password"
            icon="i-mdi-lock"
          />

          <BaseButton
            type="submit"
            label="Sign In"
            color="primary"
            :block="true"
            :loading="loading"
            size="lg"
            class="!bg-[var(--ui-primary)] hover:!bg-[color:var(--ui-primary_opacity_90)]"
          />

          <div v-if="error" class="text-[var(--ui-error)] text-sm text-center bg-[var(--ui-error)]/10 p-3 rounded-lg border border-[var(--ui-error)]/20">
            {{ error }}
          </div>
        </form>

        <div class="mt-8 text-center">
          <BaseButton
            label="Forgot Password?"
            color="neutral"
            variant="link"
            size="sm"
            @click="handleForgot"
          />
        </div>
      </BaseCard>

      <!-- Footer -->
      <div class="text-center">
        <p class="text-[var(--ui-text-muted)]">
          Don't have an account?
          <NuxtLink to="/auth/register" class="font-semibold text-[var(--ui-primary)] hover:text-[var(--ui-primary)]/80 ml-1">
            Sign up
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

