<script setup lang="ts">
import AuthLayout from '~/layouts/AuthLayout.vue'
import { useValidation } from '~/composables/useValidation'
import { useUserStore } from '~/stores/useUserStore'

definePageMeta({
  layout: false
})

const userStore = useUserStore()
const route = useRoute()
const {
  clearErrors,
  getError,
  getPasswordStrength,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
  validateToken,
  validateWorkspace
} = useValidation()

const step = ref<'signup' | 'verify'>('signup')
const formError = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const signupForm = reactive({
  name: '',
  email: '',
  workspace: '',
  password: '',
  password_confirmation: ''
})

const verifyForm = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  token: typeof route.query.token === 'string' ? route.query.token : ''
})

const loading = computed(() => userStore.isLoading)
const passwordStrength = computed(() => getPasswordStrength(signupForm.password))

const isSignupDisabled = computed(() => {
  return loading.value
    || !signupForm.name.trim()
    || !signupForm.email.trim()
    || !signupForm.workspace.trim()
    || !signupForm.password
    || !signupForm.password_confirmation
})

const isVerifyDisabled = computed(() => {
  return loading.value || !verifyForm.token.trim()
})

function validateSignupForm() {
  clearErrors()

  signupForm.name = signupForm.name.trim()
  signupForm.email = signupForm.email.trim().toLowerCase()
  signupForm.workspace = signupForm.workspace.trim()

  const checks = [
    validateName(signupForm.name, 'name'),
    validateEmail(signupForm.email, 'email'),
    validateWorkspace(signupForm.workspace, 'workspace'),
    validatePassword(signupForm.password, 'password'),
    validatePasswordConfirmation(signupForm.password, signupForm.password_confirmation, 'password_confirmation')
  ]

  return checks.every(Boolean)
}

function validateVerifyForm() {
  clearErrors()
  verifyForm.email = verifyForm.email.trim().toLowerCase()
  const checks = [
    validateEmail(verifyForm.email, 'verify_email'),
    validateToken(verifyForm.token, 'token')
  ]

  return checks.every(Boolean)
}

async function handleSignup() {
  formError.value = ''
  successMessage.value = ''

  if (!validateSignupForm()) return

  const result = await userStore.register({ ...signupForm })

  if (!result.success) {
    formError.value = result.error || 'Unable to create your account.'
    return
  }

  verifyForm.email = signupForm.email
  verifyForm.token = ''
  step.value = 'verify'
  successMessage.value = result.message || 'Check your email for the verification token.'
}

async function handleVerify() {
  formError.value = ''

  if (!validateVerifyForm()) return

  const result = await userStore.verifySignup(verifyForm.email, verifyForm.token.trim())

  if (!result.success) {
    formError.value = result.error || 'Unable to verify your email.'
    return
  }

  await navigateTo('/dashboard')
}

function goBackToSignup() {
  formError.value = ''
  successMessage.value = ''
  clearErrors()
  step.value = 'signup'
}
</script>

<template>
  <AuthLayout
    :title="step === 'signup' ? 'Create your workspace account' : 'Verify your email'"
    :subtitle="step === 'signup'
      ? 'Set up your account and workspace in one clean onboarding flow.'
      : 'Enter the verification token from your email to activate your account.'"
    badge="Secure workspace onboarding"
    gradient="from-[var(--ui-secondary)]/7 via-transparent to-[var(--ui-success)]/10"
  >
    <div class="mb-8">
      <h2 class="text-2xl font-black text-[var(--ui-text-highlighted)]">
        {{ step === 'signup' ? 'Get started' : 'Email verification' }}
      </h2>
      <p class="mt-2 text-[var(--ui-text-muted)]">
        {{ step === 'signup'
          ? 'Create your account with a strong password and a clear workspace name.'
          : 'Verification completes activation and signs you into the app.' }}
      </p>
    </div>

    <div
      v-if="successMessage"
      class="mb-6 rounded-2xl border border-[var(--ui-success)]/20 bg-[var(--ui-success)]/8 px-4 py-3 text-sm text-[var(--ui-success)]"
    >
      {{ successMessage }}
    </div>

    <form v-if="step === 'signup'" class="space-y-5" novalidate @submit.prevent="handleSignup">
      <BaseInput
        v-model="signupForm.name"
        label="Full name"
        name="name"
        placeholder="John Doe"
        required
        icon="i-mdi-account-outline"
        :error="getError('name')"
        @blur="validateName(signupForm.name, 'name')"
      />

      <BaseInput
        v-model="signupForm.email"
        label="Work email"
        name="email"
        type="email"
        autocomplete="email"
        placeholder="john@company.com"
        required
        icon="i-mdi-email-outline"
        :error="getError('email')"
        @blur="validateEmail(signupForm.email, 'email')"
      />

      <BaseInput
        v-model="signupForm.workspace"
        label="Workspace name"
        name="workspace"
        placeholder="Product Team"
        required
        icon="i-mdi-briefcase-outline"
        :error="getError('workspace')"
        @blur="validateWorkspace(signupForm.workspace, 'workspace')"
      />

      <div>
        <BaseInput
          v-model="signupForm.password"
          label="Password"
          name="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="Create a secure password"
          required
          icon="i-mdi-lock-outline"
          :error="getError('password')"
          @blur="validatePassword(signupForm.password, 'password')"
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
        <p class="mt-2 text-xs text-[var(--ui-text-muted)]">
          Use at least 8 characters with uppercase, lowercase, a number, and a symbol.
        </p>
      </div>

      <BaseInput
        v-model="signupForm.password_confirmation"
        label="Confirm password"
        name="password_confirmation"
        :type="showConfirmPassword ? 'text' : 'password'"
        autocomplete="new-password"
        placeholder="Repeat your password"
        required
        icon="i-mdi-lock-check-outline"
        :error="getError('password_confirmation')"
        @blur="validatePasswordConfirmation(signupForm.password, signupForm.password_confirmation, 'password_confirmation')"
      >
        <template #trailing>
          <button
            type="button"
            class="flex items-center justify-center text-[var(--ui-text-muted)] transition-colors hover:text-[var(--ui-text)]"
            aria-label="Toggle confirm password visibility"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <Icon :name="showConfirmPassword ? 'i-mdi-eye-off-outline' : 'i-mdi-eye-outline'" class="h-5 w-5" />
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
        label="Create Account"
        color="primary"
        size="lg"
        :block="true"
        :loading="loading"
        :disabled="isSignupDisabled"
      />
    </form>

    <form v-else class="space-y-5" novalidate @submit.prevent="handleVerify">
      <BaseInput
        v-model="verifyForm.email"
        label="Email"
        name="verify_email"
        type="email"
        autocomplete="email"
        placeholder="you@company.com"
        required
        icon="i-mdi-email-outline"
        :error="getError('verify_email')"
        @blur="validateEmail(verifyForm.email, 'verify_email')"
      />

      <BaseInput
        v-model="verifyForm.token"
        label="Verification token"
        name="token"
        placeholder="Paste the token from your email"
        required
        icon="i-mdi-shield-key-outline"
        :error="getError('token')"
        @blur="validateToken(verifyForm.token, 'token')"
      />

      <div
        v-if="formError"
        class="rounded-2xl border border-[var(--ui-error)]/20 bg-[var(--ui-error)]/8 px-4 py-3 text-sm text-[var(--ui-error)]"
        role="alert"
      >
        {{ formError }}
      </div>

      <div class="flex flex-col gap-3 sm:flex-row">
        <BaseButton
          type="submit"
          label="Verify and Continue"
          color="primary"
          size="lg"
          :block="true"
          :loading="loading"
          :disabled="isVerifyDisabled"
        />
        <BaseButton
          type="button"
          label="Back"
          color="neutral"
          variant="soft"
          size="lg"
          :block="true"
          @click="goBackToSignup"
        />
      </div>
    </form>

    <div v-if="step === 'signup'" class="mt-8 border-t border-[var(--ui-border)]/60 pt-6 text-center text-sm text-[var(--ui-text-muted)]">
      Already have an account?
      <NuxtLink to="/auth/login" class="ml-1 font-semibold text-[var(--ui-primary)] hover:opacity-75">
        Sign in
      </NuxtLink>
    </div>

    <div v-else class="mt-8 border-t border-[var(--ui-border)]/60 pt-6 text-center text-sm text-[var(--ui-text-muted)]">
      Need a different email?
      <button type="button" class="ml-1 font-semibold text-[var(--ui-primary)] hover:opacity-75" @click="goBackToSignup">
        Edit details
      </button>
    </div>
  </AuthLayout>
</template>
