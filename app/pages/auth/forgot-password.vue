<script setup lang="ts">
import AuthLayout from '~/layouts/AuthLayout.vue'
import { useValidation } from '~/composables/useValidation'
import { useUserStore } from '~/stores/useUserStore'

definePageMeta({
  layout: false
})

const userStore = useUserStore()
const { clearErrors, getError, validateEmail } = useValidation()

const email = ref('')
const successMessage = ref('')
const formError = ref('')

const loading = computed(() => userStore.isLoading)
const isSubmitDisabled = computed(() => loading.value || !email.value.trim())

function handleEmailBlur() {
  validateEmail(email.value, 'email')
}

async function handleSubmit() {
  formError.value = ''
  successMessage.value = ''
  clearErrors()

  email.value = email.value.trim().toLowerCase()

  if (!validateEmail(email.value, 'email')) return

  const result = await userStore.forgotPassword(email.value)

  if (!result.success) {
    formError.value = result.error || 'Unable to send a reset link right now.'
    return
  }

  successMessage.value = result.message || 'Password reset link sent to your email'
}
</script>

<template>
  <AuthLayout
    title="Reset your password"
    subtitle="We&apos;ll send a reset link to the email address attached to your workspace account."
    badge="Password recovery"
    gradient="from-[var(--ui-warning)]/7 via-transparent to-[var(--ui-error)]/10"
  >
    <div class="mb-7">
      <h2 class="text-xl font-black text-[var(--ui-text-highlighted)] sm:text-2xl">
        Forgot password
      </h2>
      <p class="mt-2 text-sm leading-6 text-[var(--ui-text-muted)] sm:text-[0.95rem]">
        Enter your work email and we&apos;ll guide you back into the app.
      </p>
    </div>

    <div
      v-if="successMessage"
      class="mb-6 rounded-2xl border border-[var(--ui-success)]/20 bg-[var(--ui-success)]/8 px-4 py-3 text-sm text-[var(--ui-success)]"
    >
      {{ successMessage }}
    </div>

    <form
      class="space-y-5"
      novalidate
      @submit.prevent="handleSubmit"
    >
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

      <div
        v-if="formError"
        class="rounded-2xl border border-[var(--ui-error)]/20 bg-[var(--ui-error)]/8 px-4 py-3 text-sm text-[var(--ui-error)]"
        role="alert"
      >
        {{ formError }}
      </div>

      <BaseButton
        type="submit"
        label="Send Reset Link"
        color="primary"
        size="lg"
        :block="true"
        :loading="loading"
        :disabled="isSubmitDisabled"
        class="transition-transform duration-300 hover:-translate-y-0.5"
      />
    </form>

    <div class="mt-8 border-t border-[var(--ui-border)]/60 pt-6 text-center text-sm text-[var(--ui-text-muted)]">
      Remembered your password?
      <NuxtLink
        to="/auth/login"
        class="ml-1 font-semibold text-[var(--ui-primary)] transition-all duration-300 hover:-translate-y-0.5 hover:opacity-80"
      >
        Sign in
      </NuxtLink>
    </div>
  </AuthLayout>
</template>
