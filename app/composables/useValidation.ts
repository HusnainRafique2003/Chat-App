import { computed, ref } from 'vue'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type PasswordStrength = 'weak' | 'medium' | 'strong'

function normalize(value: string | null | undefined) {
  return value?.trim() ?? ''
}

export function useValidation() {
  const errors = ref<Record<string, string>>({})

  function setError(field: string, message: string) {
    errors.value[field] = message
    return false
  }

  function clearFieldError(field: string) {
    delete errors.value[field]
    return true
  }

  function clearErrors() {
    errors.value = {}
  }

  function getError(field: string) {
    return errors.value[field]
  }

  function validateRequired(value: string, field: string, label: string) {
    if (!normalize(value)) {
      return setError(field, `${label} is required`)
    }

    return clearFieldError(field)
  }

  function validateEmail(value: string, field = 'email') {
    const trimmed = normalize(value).toLowerCase()

    if (!trimmed) {
      return setError(field, 'Email is required')
    }

    if (trimmed.length > 254) {
      return setError(field, 'Email address is too long')
    }

    if (!emailRegex.test(trimmed)) {
      return setError(field, 'Please enter a valid email address')
    }

    return clearFieldError(field)
  }

  function validateName(value: string, field = 'name') {
    const trimmed = normalize(value)

    if (!trimmed) {
      return setError(field, 'Full name is required')
    }

    if (trimmed.length < 2) {
      return setError(field, 'Full name must be at least 2 characters')
    }

    if (trimmed.length > 80) {
      return setError(field, 'Full name must be 80 characters or fewer')
    }

    return clearFieldError(field)
  }

  function validateWorkspace(value: string, field = 'workspace') {
    const trimmed = normalize(value)

    if (!trimmed) {
      return setError(field, 'Workspace name is required')
    }

    if (trimmed.length < 2) {
      return setError(field, 'Workspace name must be at least 2 characters')
    }

    if (trimmed.length > 80) {
      return setError(field, 'Workspace name must be 80 characters or fewer')
    }

    return clearFieldError(field)
  }

  function validatePassword(value: string, field = 'password') {
    if (!value) {
      return setError(field, 'Password is required')
    }

    if (value.length < 8) {
      return setError(field, 'Password must be at least 8 characters')
    }

    if (value.length > 128) {
      return setError(field, 'Password must be 128 characters or fewer')
    }

    const hasUpper = /[A-Z]/.test(value)
    const hasLower = /[a-z]/.test(value)
    const hasNumber = /\d/.test(value)
    const hasSpecial = /[^A-Za-z0-9]/.test(value)

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return setError(field, 'Use uppercase, lowercase, number, and special character')
    }

    return clearFieldError(field)
  }

  function validatePasswordConfirmation(password: string, confirmation: string, field = 'password_confirmation') {
    if (!confirmation) {
      return setError(field, 'Please confirm your password')
    }

    if (password !== confirmation) {
      return setError(field, 'Passwords do not match')
    }

    return clearFieldError(field)
  }

  function validateToken(value: string, field = 'token') {
    const trimmed = normalize(value)

    if (!trimmed) {
      return setError(field, 'Token is required')
    }

    if (trimmed.length < 6) {
      return setError(field, 'Token looks too short')
    }

    if (trimmed.length > 512) {
      return setError(field, 'Token looks too long')
    }

    return clearFieldError(field)
  }

  function getPasswordStrength(value: string): PasswordStrength {
    if (!value) return 'weak'

    let score = 0
    if (value.length >= 8) score += 1
    if (/[A-Z]/.test(value)) score += 1
    if (/[a-z]/.test(value)) score += 1
    if (/\d/.test(value)) score += 1
    if (/[^A-Za-z0-9]/.test(value)) score += 1

    if (score >= 5) return 'strong'
    if (score >= 3) return 'medium'
    return 'weak'
  }

  const hasErrors = computed(() => Object.keys(errors.value).length > 0)

  return {
    errors,
    hasErrors,
    clearErrors,
    getError,
    validateRequired,
    validateEmail,
    validateName,
    validateWorkspace,
    validatePassword,
    validatePasswordConfirmation,
    validateToken,
    getPasswordStrength
  }
}
