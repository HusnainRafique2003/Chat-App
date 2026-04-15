<script setup lang="ts">
import { useValidation } from '~/composables/useValidation'
import AuthLayout from '~/layouts/AuthLayout.vue'
import { useUserStore } from '~/stores/useUserStore'

definePageMeta({
  layout: false
})

const route = useRoute()
const userStore = useUserStore()
const {
  clearErrors,
  getError,
  getPasswordStrength,
  validatePassword,
  validatePasswordConfirmation,
  validateToken
} = useValidation()

const token = ref(typeof route.query.token === 'string' ? route.query.token : '')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)
const successMessage = ref('')
const formError = ref('')

const loading = computed(() => userStore.isLoading)
const passwordStrength = computed(() => getPasswordStrength(password.value))
const isSubmitDisabled = computed(() => loading.value || !token.value.trim() || !password.value || !passwordConfirmation.value)

function handleTokenBlur() {
  validateToken(token.value, 'token')
}

function handlePasswordBlur() {
  validatePassword(password.value, 'password')
}

function handlePasswordConfirmationBlur() {
  validatePasswordConfirmation(password.value, passwordConfirmation.value, 'password_confirmation')
}

async function handleSubmit() {
  formError.value = ''
  successMessage.value = ''
  clearErrors()

  token.value = token.value.trim()

  const checks = [
    validateToken(token.value, 'token'),
    validatePassword(password.value, 'password'),
    validatePasswordConfirmation(password.value, passwordConfirmation.value, 'password_confirmation')
  ]

  if (!checks.every(Boolean)) return

  const result = await userStore.resetPassword(token.value, password.value, passwordConfirmation.value)

  if (!result.success) {
    formError.value = result.error || 'Unable to reset your password.'
    return
  }

  successMessage.value = result.message || 'Password reset successfully'
}
</script>

<template>
  <AuthLayout
    title="Choose a new password"
    subtitle="Finish recovery with a secure password that protects your workspace account."
    badge="Reset access securely"
    gradient="from-[var(--ui-warning)]/7 via-transparent to-[var(--ui-secondary)]/10"
  >
    <div class="mb-7">
      <h2 class="text-xl font-black text-[var(--ui-text-highlighted)] sm:text-2xl">
        Set a new password
      </h2>
      <p class="mt-2 text-sm leading-6 text-[var(--ui-text-muted)] sm:text-[0.95rem]">
        Use a strong password that you have not used elsewhere.
      </p>
    </div>

    <div
      v-if="successMessage"
      class="mb-6 rounded-2xl border border-[var(--ui-success)]/20 bg-[var(--ui-success)]/8 px-4 py-3 text-sm text-[var(--ui-success)]"
    >
      {{ successMessage }}
    </div>

    <div
      v-if="successMessage"
      class="space-y-5"
    >
      <div class="rounded-2xl border border-[var(--ui-success)]/20 bg-[var(--ui-success)]/8 px-4 py-4 text-sm text-[var(--ui-success)]">
        {{ successMessage }}
      </div>

      <BaseButton
        label="Back to Sign In"
        to="/auth/login"
        color="primary"
        size="lg"
        :block="true"
        class="transition-transform duration-300 hover:-translate-y-0.5"
      />
    </div>

    <form
      v-else
      class="space-y-5"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <BaseInput
        v-model="token"
        label="Reset token"
        name="token"
        autocomplete="one-time-code"
        placeholder="Paste your reset token"
        required
        icon="i-mdi-key-outline"
        :error="getError('token')"
        @blur="handleTokenBlur"
      />

      <div>
        <BaseInput
          v-model="password"
          label="New password"
          name="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="Create a secure password"
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
              <UIcon
                :name="showPassword ? 'i-mdi-eye-off-outline' : 'i-mdi-eye-outline'"
                class="h-5 w-5"
              />
            </button>
          </template>
        </BaseInput>

        <div class="mt-3 flex items-center gap-2">
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

      <BaseInput
        v-model="passwordConfirmation"
        label="Confirm new password"
        name="password_confirmation"
        :type="showPasswordConfirmation ? 'text' : 'password'"
        autocomplete="new-password"
        placeholder="Repeat the new password"
        required
        icon="i-mdi-lock-check-outline"
        :error="getError('password_confirmation')"
        @blur="handlePasswordConfirmationBlur"
      >
        <template #trailing>
          <button
            type="button"
            class="flex items-center justify-center text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]"
            aria-label="Toggle confirm password visibility"
            @click="showPasswordConfirmation = !showPasswordConfirmation"
          >
            <UIcon
              :name="showPasswordConfirmation ? 'i-mdi-eye-off-outline' : 'i-mdi-eye-outline'"
              class="h-5 w-5"
            />
          </button>
        </template>
      </BaseInput>

      <div
        v-if="formError"
        class="rounded-2xl border border-[var(--ui-error)]/20 bg-[var(--ui-error)]/8 px-4 py-3 text-sm text-[var(--ui-error)]"
        role="alert"
      >
        {{ formError }}
      </div>

      <BaseButton
        type="submit"
        label="Reset Password"
        color="primary"
        size="lg"
        :block="true"
        :loading="loading"
        :disabled="isSubmitDisabled"
        class="transition-transform duration-300 hover:-translate-y-0.5"
      />
    </form>

    <div
      v-if="!successMessage"
      class="mt-8 border-t border-[var(--ui-border)]/60 pt-6 text-center text-sm text-[var(--ui-text-muted)]"
    >
      Return to
      <NuxtLink
        to="/auth/login"
        class="ml-1 font-semibold text-[var(--ui-primary)] transition-all duration-300 hover:-translate-y-0.5 hover:opacity-80"
      >
        sign in
      </NuxtLink>
    </div>
  </AuthLayout>
</template>
