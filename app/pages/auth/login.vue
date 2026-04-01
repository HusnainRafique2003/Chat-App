<script setup lang="ts">
import AuthLayout from '~/layouts/AuthLayout.vue'
import { useValidation } from '~/composables/useValidation'
import { useUserStore } from '~/stores/useUserStore'

definePageMeta({
  layout: false
})

const userStore = useUserStore()
const {
  clearErrors,
  getError,
  getPasswordStrength,
  validateEmail,
  validateRequired
} = useValidation()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const formError = ref('')

const loading = computed(() => userStore.isLoading)
const passwordStrength = computed(() => password.value ? getPasswordStrength(password.value) : null)

const isSubmitDisabled = computed(() => {
  return loading.value || !email.value.trim() || !password.value
})

function validateForm() {
  clearErrors()
  const isEmailValid = validateEmail(email.value, 'email')
  const isPasswordValid = validateRequired(password.value, 'password', 'Password')
  return isEmailValid && isPasswordValid
}

async function handleSubmit() {
  formError.value = ''
  email.value = email.value.trim().toLowerCase()

  if (!validateForm()) return

  const result = await userStore.login(email.value, password.value)

  if (!result.success) {
    formError.value = result.error || 'Unable to sign in. Please try again.'
    return
  }

await navigateTo('/dashboard', { redirectCode: 302 })
}

function handleEmailBlur() {
  validateEmail(email.value, 'email')
}

function handlePasswordBlur() {
  validateRequired(password.value, 'password', 'Password')
}
</script>

<template>
  <AuthLayout
    title="Welcome back"
    subtitle="Sign in to continue managing channels, workspaces, and team communication with confidence."
    badge="Secure team sign in"
    gradient="from-[var(--ui-primary)]/7 via-transparent to-[var(--ui-secondary)]/10"
  >
    <div class="mb-8">
      <h2 class="text-2xl font-black text-[var(--ui-text-highlighted)]">Sign in</h2>
      <p class="mt-2 text-[var(--ui-text-muted)]">Use your workspace credentials to access the dashboard.</p>
    </div>

    <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
      <BaseInput
        v-model="email"
        label="Work email"
        name="email"
        type="email"
        autocomplete="email"
        placeholder="you@company.com"
        required
        icon="i-mdi-email-outline"
        :error="getError('email')"
        @blur="handleEmailBlur"
      />

      <div>
        <BaseInput
          v-model="password"
          label="Password"
          name="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="Enter your password"
          required
          icon="i-mdi-lock-outline"
          :error="getError('password')"
          @blur="handlePasswordBlur"
        >
          <template #trailing>
            <button
              type="button"
              class="flex items-center justify-center text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]"
              aria-label="Toggle password visibility"
              @click="showPassword = !showPassword"
            >
              <Icon :name="showPassword ? 'i-mdi-eye-off-outline' : 'i-mdi-eye-outline'" class="h-5 w-5" />
            </button>
          </template>
        </BaseInput>

        <div v-if="passwordStrength" class="mt-3 flex items-center gap-2">
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--ui-bg-muted)]">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="{
                'w-1/3 bg-[var(--ui-error)]': passwordStrength === 'weak',
                'w-2/3 bg-[var(--ui-warning)]': passwordStrength === 'medium',
                'w-full bg-[var(--ui-success)]': passwordStrength === 'strong'
              }"
            />
          </div>
          <span class="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ui-text-dimmed)]">
            {{ passwordStrength }}
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4 pt-1">
        <p class="text-sm text-[var(--ui-text-muted)]">Use the same email you registered with.</p>
        <NuxtLink to="/auth/forgot-password" class="text-sm font-semibold text-[var(--ui-primary)] hover:opacity-75">
          Forgot password?
        </NuxtLink>
      </div>

      <div
        v-if="formError"
        class="rounded-2xl border border-[var(--ui-error)]/20 bg-[var(--ui-error)]/8 px-4 py-3 text-sm text-[var(--ui-error)]"
        role="alert"
      >
        {{ formError }}
      </div>

      <BaseButton
        type="submit"
        label="Sign In"
        color="primary"
        size="lg"
        :block="true"
        :loading="loading"
        :disabled="isSubmitDisabled"
        class="mt-2"
      />
    </form>

    <div class="mt-8 border-t border-[var(--ui-border)]/60 pt-6 text-center text-sm text-[var(--ui-text-muted)]">
      Don&apos;t have an account?
      <NuxtLink to="/auth/register" class="ml-1 font-semibold text-[var(--ui-primary)] hover:opacity-75">
        Create one
      </NuxtLink>
    </div>
  </AuthLayout>
</template>
