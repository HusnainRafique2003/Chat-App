<script setup lang="ts">
import { useUserStore } from '~/stores/useUserStore'
const userStore = useUserStore()

const router = useRouter()
const route = useRoute()

// Step state
const step = ref<'signup' | 'verify'>('signup')
const email = ref('')
const name = ref('')
const workspace = ref('')
const password = ref('')
const passwordConfirm = ref('')
const otpToken = ref('')
const loading = computed(() => userStore.isLoading)
const error = ref('')
const successMessage = ref('')

// Track registered email for verify step
const registeredEmail = ref('')

async function handleSignup() {
  error.value = ''
  const form = {
    name: name.value,
    email: email.value,
    workspace: workspace.value,
    password: password.value,
    password_confirmation: passwordConfirm.value,
  }
  
  const result = await userStore.register(form)
  if (result.success) {
    registeredEmail.value = email.value
    step.value = 'verify'
    successMessage.value = 'Account created! Enter the verification token sent to your email.'
  } else {
    error.value = result.error || 'Registration failed'
  }
}

async function handleVerify() {
  error.value = ''
  const result = await userStore.verifySignup(email.value, otpToken.value)
  if (result.success) {
    await navigateTo('/dashboard')
  } else {
    error.value = result.error || 'Verification failed'
  }
}

function goBack() {
  step.value = 'signup'
  successMessage.value = ''
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--ui-secondary)]/5 to-[var(--ui-success)]/5">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div>
        <NuxtLink to="/">
          <div class="mx-auto h-16 w-16 bg-[var(--ui-success)] rounded-2xl flex items-center justify-center mb-6">
            <Icon name="i-mdi-account-plus" class="w-10 h-10 text-white" />
          </div>
        </NuxtLink>
        <h2 class="mt-6 text-center text-3xl font-bold text-[var(--ui-text-highlighted)]">
          {{ step === 'signup' ? 'Create Account' : 'Verify Email' }}
        </h2>
        <p v-if="step === 'signup'" class="mt-2 text-center text-[var(--ui-text-muted)]">
          Join ChatSphere in less than a minute.
        </p>
        <p v-else class="mt-2 text-center text-[var(--ui-text-muted)]">
          Check your email for the verification token.
        </p>
      </div>

      <!-- Form -->
      <BaseCard class="p-8">
        <!-- Success message after signup -->
        <div v-if="successMessage" class="mb-6 p-4 bg-[var(--ui-success)]/10 border border-[var(--ui-success)]/20 rounded-xl text-[var(--ui-success)]">
          {{ successMessage }}
        </div>

        <!-- Signup Form -->
        <form v-if="step === 'signup'" @submit.prevent="handleSignup" class="space-y-6">
          <BaseInput
            v-model="name"
            label="Full Name"
            placeholder="John Doe"
            required
            icon="i-mdi-account"
          />
          <BaseInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="john@example.com"
            required
            autocomplete="email"
            icon="i-mdi-email"
          />
          <BaseInput
            v-model="workspace"
            label="Workspace Name"
            placeholder="My Team"
            required
            icon="i-mdi-briefcase"
          />
          <BaseInput
            v-model="password"
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            required
            autocomplete="new-password"
            icon="i-mdi-lock"
          />
          <BaseInput
            v-model="passwordConfirm"
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            required
            autocomplete="new-password"
            icon="i-mdi-lock-check"
          />

          <BaseButton
            type="submit"
            label="Create Account"
            color="success"
            :block="true"
            :loading="loading"
            size="lg"
            class="!bg-[var(--ui-success)] hover:shadow-xl"
          />
        </form>

        <!-- Verify Form -->
        <form v-else @submit.prevent="handleVerify" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
              Email (pre-filled)
            </label>
            <BaseInput
              v-model="email"
              type="email"
              :value="registeredEmail"
              readonly
              class="bg-[var(--ui-bg-muted)]"
            />
          </div>
          <BaseInput
            v-model="otpToken"
            label="Verification Token"
            placeholder="Paste token from email"
            required
            autocomplete="one-time-code"
            icon="i-mdi-check-circle"
          />

          <div class="flex gap-3">
            <BaseButton
              type="submit"
              label="Verify & Continue"
              color="success"
              :block="true"
              :loading="loading"
              flex="1"
              class="!bg-[var(--ui-success)]"
            />
            <BaseButton
              type="button"
              label="Back"
              color="neutral"
              variant="outline"
              @click="goBack"
              flex="1"
            />
          </div>
        </form>

        <div v-if="error" class="mt-6 p-4 bg-[var(--ui-error)]/10 border border-[var(--ui-error)]/20 rounded-lg text-[var(--ui-error)] text-sm">
          {{ error }}
        </div>
      </BaseCard>

      <!-- Footer -->
      <div class="text-center">
        <p v-if="step === 'signup'" class="text-[var(--ui-text-muted)]">
          Already have an account?
          <NuxtLink to="/auth/login" class="font-semibold text-[var(--ui-primary)] hover:text-[var(--ui-primary)]/80 ml-1">
            Sign in
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

