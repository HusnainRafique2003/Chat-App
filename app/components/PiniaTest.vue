<script setup lang="ts">
import { reactive } from 'vue'
import { useUserStore } from '~/stores/useUserStore'
import { useSessionStore } from '~/stores/useSessionStore'

const userStore = useUserStore()
const sessionStore = useSessionStore()

const loginForm = reactive({
  name: '',
  age: 0,
  email: '',
})

function handleLogin() {
  if (!loginForm.name || !loginForm.email) return
  userStore.login({ name: loginForm.name, age: loginForm.age, email: loginForm.email })
  loginForm.name = ''
  loginForm.age = 0
  loginForm.email = ''
}

function addUser() {
  if (!loginForm.name || !loginForm.email) return
  userStore.addToList({ name: loginForm.name, age: loginForm.age, email: loginForm.email })
  loginForm.name = ''
  loginForm.age = 0
  loginForm.email = ''
}

function patchVisitCount() {
  userStore.$patch({ visitCount: userStore.visitCount + 10 })
}

// ✅ No explicit types needed — inferred automatically from setup store
userStore.$subscribe((mutation, state) => {
  console.log('[userStore] mutation type:', mutation.type)
  console.log('[userStore] new state:', JSON.stringify(state))
})
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- ✅ PERSISTED STORE -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-bold">✅ Persisted Store — useUserStore</p>
          <UBadge color="success" variant="soft">Survives Refresh</UBadge>
        </div>
      </template>

      <div class="mb-4 p-3 rounded-lg bg-muted text-sm font-mono flex flex-col gap-1">
        <p>
          <span class="text-muted">isLoggedIn: </span>
          <span :class="userStore.isLoggedIn ? 'text-green-500' : 'text-red-500'">
            {{ userStore.isLoggedIn }}
          </span>
        </p>
        <p><span class="text-muted">isAdmin: </span>{{ userStore.isAdmin }}</p>
        <p><span class="text-muted">visitCount: </span>{{ userStore.visitCount }}</p>
        <p><span class="text-muted">greeting: </span>{{ userStore.fullGreeting }}</p>
      </div>

      <div v-if="userStore.user" class="mb-4 p-3 rounded-lg border border-default">
        <p class="text-sm font-semibold text-muted mb-1">Current User</p>
        <p class="text-default">👤 {{ userStore.user.name }} ({{ userStore.user.age }})</p>
        <p class="text-muted text-sm">{{ userStore.user.email }}</p>
      </div>

      <div class="flex flex-col gap-3 mb-4">
        <p class="text-sm font-semibold text-muted">Login / Add User</p>
        <div class="grid grid-cols-3 gap-2">
          <UInput v-model="loginForm.name" placeholder="Name" />
          <UInput v-model.number="loginForm.age" type="number" placeholder="Age" />
          <UInput v-model="loginForm.email" placeholder="Email" />
        </div>
        <div class="flex gap-2 flex-wrap">
          <UButton color="primary" @click="handleLogin">Login as this User</UButton>
          <UButton color="secondary" variant="soft" @click="addUser">Add to List</UButton>
          <UButton color="warning" variant="soft" @click="patchVisitCount">+10 visits ($patch)</UButton>
          <UButton color="error" variant="soft" @click="userStore.logout()">Logout</UButton>
          <UButton color="neutral" variant="outline" @click="userStore.$reset()">$reset()</UButton>
        </div>
      </div>

      <div v-if="userStore.userList.length > 0">
        <p class="text-sm font-semibold text-muted mb-2">User List ({{ userStore.userList.length }})</p>
        <div class="flex flex-col gap-1">
          <div
            v-for="(u, i) in userStore.userList"
            :key="i"
            class="flex items-center gap-2 text-sm p-2 rounded bg-muted"
          >
            <UAvatar :alt="u.name" size="xs" />
            <span class="text-default">{{ u.name }}</span>
            <span class="text-muted">{{ u.email }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <p class="text-xs text-dimmed">
          💾 Stored in <code>localStorage</code> key: <code>"user"</code> — refresh and data stays!
        </p>
      </template>
    </UCard>

    <!-- ❌ NON-PERSISTED STORE -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-bold">❌ Non-Persisted Store — useSessionStore</p>
          <UBadge color="error" variant="soft">Resets on Refresh</UBadge>
        </div>
      </template>

      <div class="mb-4 p-3 rounded-lg bg-muted text-sm font-mono flex flex-col gap-1">
        <p><span class="text-muted">clickCount: </span>{{ sessionStore.clickCount }}</p>
        <p><span class="text-muted">lastAction: </span>{{ sessionStore.lastAction }}</p>
        <p><span class="text-muted">tempMessage: </span>"{{ sessionStore.tempMessage || '(empty)' }}"</p>
      </div>

      <div class="flex flex-col gap-3">
        <UInput
          :model-value="sessionStore.tempMessage"
          placeholder="Type a temp message..."
          @update:model-value="sessionStore.setMessage($event)"
        />
        <div class="flex gap-2">
          <UButton color="primary" @click="sessionStore.increment()">
            Increment ({{ sessionStore.clickCount }})
          </UButton>
          <UButton color="neutral" variant="outline" @click="sessionStore.$reset()">$reset()</UButton>
        </div>
      </div>

      <template #footer>
        <p class="text-xs text-dimmed">
          🔄 No <code>persist: true</code> — resets to zero on every page refresh.
        </p>
      </template>
    </UCard>

    <UAlert
      icon="i-lucide-refresh-cw"
      color="primary"
      variant="soft"
      title="How to test"
      description="Fill both stores → press F5. The ✅ store keeps its data. The ❌ store resets to zero."
    />
  </div>
</template>

export type { UserState }
