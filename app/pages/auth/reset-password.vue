<script setup lang="ts">
import { useUserStore } from '~/stores/useUserStore'
const userStore = useUserStore()

const route = useRoute()
const router = useRouter()

const token = ref(route.query.token as string || '')
const password = ref('')
const passwordConfirm = ref('')
const loading = computed(() => userStore.isLoading)
const error = ref('')
const success = ref(false)

async function handleReset() {
  error.value = ''
  const result = await userStore.resetPassword(token.value, password.value, passwordConfirm.value)
  if (result.success) {
    success.value = true
  } else {
    error.value = result.error || 'Reset failed'
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
            <Icon name="i-mdi-key-change" class="w-10 h-10 text-white" />
          </div>
        </NuxtLink>
        <h2 class="mt-6 text-center text-3xl font-bold text-[var(--ui-text-highlighted)]">
          Reset Password
        </h2>
        <p class="mt-2 text-center text-[var(--ui-text-muted)]">
          Enter your new password.
        </p>
      </div>

      <!-- Form -->
      <BaseCard class="p-8">
        <!-- Success State -->
        <div v-if="success" class="text-center">
          <div class="w-24 h-24 mx-auto mb-6 bg-[var(--ui-success)]/20 rounded-2xl flex items-center justify-center">
            <Icon name="i-mdi-check-circle" class="w-12 h-12 text-[var(--ui-success)]" />
          </div>
          <h3 class="text-2xl font-bold text-[var(--ui-success)] mb-6">Password Reset Successful!</h3>
          <BaseButton label="Sign In" color="primary" size="lg" :block="true" to="/auth/login" />
        </div>

        <!-- Form State -->
        <form v-else @submit.prevent="handleReset" class="space-y-6">
          <BaseInput
            v-model="token"
            label="Reset Token"
            placeholder="Paste token from email"
            required
            autocomplete="one-time-code"
            icon="i-mdi-key"
          />
          <BaseInput
            v-model="password"
            label="New Password"
            type="password"
            placeholder="New secure password"
            required
            autocomplete="new-password"
            icon="i-mdi-lock"
          />
          <BaseInput
            v-model="passwordConfirm"
            label="Confirm Password"
            type="password"
            placeholder="Confirm new password"
            required
            autocomplete="new-password"
            icon="i-mdi-lock-check"
          />

          <BaseButton
            type="submit"
            label="Reset Password"
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

      <div class="text-center">
        <p class="text-[var(--ui-text-muted)]">
          <NuxtLink to="/auth/login" class="font-semibold text-[var(--ui-primary)] hover:text-[var(--ui-primary)]/80">
            Back to Sign In
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

