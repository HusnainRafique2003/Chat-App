<script setup lang="ts">
import { useUserStore } from '~/stores/useUserStore'
const userStore = useUserStore()

const router = useRouter()

const email = ref('')
const loading = computed(() => userStore.isLoading)
const error = ref('')
const success = ref(false)
const message = ref('')

async function handleForgot() {
  error.value = ''
  const result = await userStore.forgotPassword(email.value)
  if (result.success) {
    success.value = true
    message.value = 'Password reset link sent to your email!'
  } else {
    error.value = result.error || 'Failed to send email'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--ui-warning)]/5 to-[var(--ui-error)]/5">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div>
        <NuxtLink to="/">
          <div class="mx-auto h-16 w-16 bg-[var(--ui-warning)] rounded-2xl flex items-center justify-center mb-6">
            <Icon name="i-mdi-lock-reset" class="w-10 h-10 text-white" />
          </div>
        </NuxtLink>
        <h2 class="mt-6 text-center text-3xl font-bold text-[var(--ui-text-highlighted)]">
          Forgot Password?
        </h2>
        <p class="mt-2 text-center text-[var(--ui-text-muted)]">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <!-- Form -->
      <BaseCard class="p-8">
        <!-- Success State -->
        <div v-if="success" class="text-center">
          <div class="w-24 h-24 mx-auto mb-6 bg-[var(--ui-success)]/20 rounded-2xl flex items-center justify-center">
            <Icon name="i-mdi-email-check" class="w-12 h-12 text-[var(--ui-success)]" />
          </div>
          <h3 class="text-2xl font-bold text-[var(--ui-success)] mb-4">{{ message }}</h3>
          <BaseButton label="Back to Login" color="primary" to="/auth/login" />
        </div>

        <!-- Form State -->
        <form v-else @submit.prevent="handleForgot" class="space-y-6">
          <BaseInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="your@email.com"
            required
            autocomplete="email"
            icon="i-mdi-email"
          />

          <BaseButton
            type="submit"
            label="Send Reset Link"
            color="warning"
            :block="true"
            :loading="loading"
            size="lg"
            class="!bg-[var(--ui-warning)] hover:shadow-xl"
          />

          <div v-if="error" class="text-[var(--ui-error)] text-sm text-center bg-[var(--ui-error)]/10 p-3 rounded-lg border border-[var(--ui-error)]/20">
            {{ error }}
          </div>
        </form>
      </BaseCard>

      <!-- Footer -->
      <div class="text-center">
        <p class="text-[var(--ui-text-muted)]">
          Remember your password?
          <NuxtLink to="/auth/login" class="font-semibold text-[var(--ui-primary)] hover:text-[var(--ui-primary)]/80 ml-1">
            Sign in
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

