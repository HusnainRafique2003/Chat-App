<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useApi } from '~/composables/useApi'

// ─── Types ────────────────────────────────────────────────
interface Post {
  id: number
  title: string
  body: string
  userId: number
}

interface User {
  id: number
  name: string
  email: string
  phone: string
  website: string
}

interface SlowResponse {
  url: string
  args: Record<string, string>
  headers: Record<string, string>
}

// ─── API instances (each has its own AbortController) ─────
const postsApi   = useApi<Post[]>('https://jsonplaceholder.typicode.com/posts')
const usersApi   = useApi<User[]>('https://jsonplaceholder.typicode.com/users')
const singlePost = useApi<Post>('')
const slowApi    = useApi<SlowResponse>('')

// ─── Slow request simulation state ───────────────────────
const delaySeconds = ref(5)
const abortLog = ref<string[]>([])

function log(msg: string) {
  abortLog.value.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`)
  if (abortLog.value.length > 6) abortLog.value.pop()
}

// ─── Fetch all posts ──────────────────────────────────────
async function fetchPosts() {
  log('Fetching posts...')
  await postsApi.fetch()
  if (postsApi.data.value) log(`✅ Got ${postsApi.data.value.length} posts`)
  if (postsApi.error.value) log(`❌ Posts: ${postsApi.error.value}`)
}

// ─── Fetch all users ─────────────────────────────────────
async function fetchUsers() {
  log('Fetching users...')
  await usersApi.fetch()
  if (usersApi.data.value) log(`✅ Got ${usersApi.data.value.length} users`)
  if (usersApi.error.value) log(`❌ Users: ${usersApi.error.value}`)
}

// ─── Fetch single post by ID ──────────────────────────────
const postId = ref(1)
async function fetchSinglePost() {
  log(`Fetching post #${postId.value}...`)
  await singlePost.fetch(`https://jsonplaceholder.typicode.com/posts/${postId.value}`)
  if (singlePost.data.value) log(`✅ Got post: "${singlePost.data.value.title}"`)
  if (singlePost.error.value) log(`❌ Single post: ${singlePost.error.value}`)
}

// ─── Slow request + abort demo ───────────────────────────
// httpbin delays the response by N seconds — perfect for abort testing
async function fetchSlow() {
  const url = `https://httpbin.org/delay/${delaySeconds.value}`
  log(`Starting slow request (${delaySeconds.value}s delay)...`)
  await slowApi.fetch(url)
  if (slowApi.data.value) log(`✅ Slow request completed!`)
  if (slowApi.error.value) log(`⚠️ Slow: ${slowApi.error.value}`)
}

function abortSlow() {
  slowApi.abort()
  log('🛑 Slow request manually aborted!')
}

// ─── Rapid fire: start new request cancels old one ────────
const rapidLog = ref<string[]>([])
const rapidApi = useApi<Post>('')
let rapidCount = 0

async function rapidFire() {
  rapidCount++
  const id = rapidCount
  const url = `https://jsonplaceholder.typicode.com/posts/${id}`
  rapidLog.value.unshift(`→ Fired request #${id}`)
  if (rapidLog.value.length > 5) rapidLog.value.pop()

  await rapidApi.fetch(url)

  if (rapidApi.data.value)
    rapidLog.value.unshift(`✅ Request #${id} resolved: "${rapidApi.data.value.title}"`)
  else if (rapidApi.error.value)
    rapidLog.value.unshift(`⚠️ Request #${id}: ${rapidApi.error.value}`)

  if (rapidLog.value.length > 8) rapidLog.value.pop()
}

// ─── Error simulation ─────────────────────────────────────
const errorApi = useApi('https://jsonplaceholder.typicode.com/posts/99999999')
async function fetchError() {
  log('Fetching non-existent resource...')
  await errorApi.fetch()
  if (errorApi.error.value) log(`❌ Error caught: ${errorApi.error.value}`)
  if (errorApi.data.value) log(`✅ Unexpectedly got data`)
}
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- ABORT LOG -->
    <UCard>
      <template #header>
        <p class="font-bold">📋 Activity Log</p>
      </template>
      <div class="font-mono text-xs flex flex-col gap-1 min-h-16">
        <p v-if="abortLog.length === 0" class="text-muted">No activity yet — trigger a request below.</p>
        <p v-for="(entry, i) in abortLog" :key="i" class="text-default">{{ entry }}</p>
      </div>
    </UCard>

    <!-- 1. BASIC FETCH: POSTS -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-bold">1️⃣ Basic Fetch — Posts</p>
          <UBadge color="primary" variant="soft">jsonplaceholder</UBadge>
        </div>
      </template>

      <div class="flex gap-2 mb-4">
        <UButton color="primary" :loading="postsApi.loading.value" @click="fetchPosts">
          Fetch Posts
        </UButton>
        <UButton color="neutral" variant="outline" :disabled="!postsApi.loading.value"
          @click="() => { postsApi.abort(); log('🛑 Posts request aborted!') }">
          Abort
        </UButton>
      </div>

      <div v-if="postsApi.loading.value" class="text-muted text-sm">Loading posts...</div>
      <div v-else-if="postsApi.error.value">
        <UAlert color="error" :title="postsApi.error.value" />
      </div>
      <div v-else-if="postsApi.data.value" class="flex flex-col gap-2 max-h-52 overflow-y-auto">
        <div
          v-for="post in postsApi.data.value.slice(0, 5)"
          :key="post.id"
          class="p-2 rounded bg-muted"
        >
          <p class="text-sm font-semibold text-default">#{{ post.id }} — {{ post.title }}</p>
          <p class="text-xs text-muted line-clamp-1">{{ post.body }}</p>
        </div>
        <p class="text-xs text-dimmed">Showing 5 of {{ postsApi.data.value.length }} posts</p>
      </div>
    </UCard>

    <!-- 2. FETCH BY ID -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-bold">2️⃣ Fetch Single Post by ID</p>
          <UBadge color="secondary" variant="soft">dynamic URL</UBadge>
        </div>
      </template>

      <div class="flex gap-2 mb-4 items-center">
        <UInput
          v-model.number="postId"
          type="number"
          :min="1"
          :max="100"
          class="w-24"
          placeholder="Post ID"
        />
        <UButton color="secondary" :loading="singlePost.loading.value" @click="fetchSinglePost">
          Fetch Post #{{ postId }}
        </UButton>
      </div>

      <div v-if="singlePost.loading.value" class="text-muted text-sm">Loading...</div>
      <div v-else-if="singlePost.error.value">
        <UAlert color="error" :title="singlePost.error.value" />
      </div>
      <div v-else-if="singlePost.data.value" class="p-3 rounded bg-muted">
        <p class="text-sm font-bold text-default">{{ singlePost.data.value.title }}</p>
        <p class="text-xs text-muted mt-1">{{ singlePost.data.value.body }}</p>
        <p class="text-xs text-dimmed mt-2">User ID: {{ singlePost.data.value.userId }}</p>
      </div>
    </UCard>

    <!-- 3. ABORT CONTROLLER DEMO -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-bold">3️⃣ Abort Controller Demo</p>
          <UBadge color="warning" variant="soft">slow request</UBadge>
        </div>
      </template>

      <p class="text-sm text-muted mb-3">
        Starts a request with a deliberate delay. Click <strong>Abort</strong> before it completes to see the AbortController in action.
      </p>

      <div class="flex gap-2 mb-4 items-center flex-wrap">
        <span class="text-sm text-muted">Delay:</span>
        <UInput v-model.number="delaySeconds" type="number" :min="1" :max="10" class="w-20" />
        <span class="text-sm text-muted">seconds</span>

        <UButton
          color="warning"
          :loading="slowApi.loading.value"
          @click="fetchSlow"
        >
          Start Slow Request
        </UButton>
        <UButton
          color="error"
          variant="soft"
          :disabled="!slowApi.loading.value"
          @click="abortSlow"
        >
          🛑 Abort Now
        </UButton>
      </div>

      <div v-if="slowApi.loading.value" class="flex items-center gap-2 text-sm text-warning">
        <span class="animate-spin">⏳</span>
        Waiting {{ delaySeconds }}s for response... click Abort to cancel!
      </div>
      <div v-else-if="slowApi.error.value">
        <UAlert color="error" variant="soft" :title="slowApi.error.value" />
      </div>
      <div v-else-if="slowApi.data.value">
        <UAlert color="success" variant="soft" title="Request completed without abort!" />
      </div>
    </UCard>

    <!-- 4. RAPID FIRE — new cancels old -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-bold">4️⃣ Rapid Fire — Each Request Cancels Previous</p>
          <UBadge color="success" variant="soft">auto-abort</UBadge>
        </div>
      </template>

      <p class="text-sm text-muted mb-3">
        Click rapidly — each new request automatically cancels the previous one. Only the last one resolves.
      </p>

      <UButton color="success" :loading="rapidApi.loading.value" @click="rapidFire">
        Fire Request #{{ rapidCount + 1 }}
      </UButton>

      <div class="mt-4 font-mono text-xs flex flex-col gap-1">
        <p v-if="rapidLog.length === 0" class="text-muted">No rapid requests yet.</p>
        <p v-for="(entry, i) in rapidLog" :key="i" class="text-default">{{ entry }}</p>
      </div>
    </UCard>

    <!-- 5. ERROR HANDLING -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-bold">5️⃣ Error Handling</p>
          <UBadge color="error" variant="soft">404 simulation</UBadge>
        </div>
      </template>

      <p class="text-sm text-muted mb-3">
        Hits a non-existent endpoint to trigger and display a proper error.
      </p>

      <UButton color="error" variant="soft" :loading="errorApi.loading.value" @click="fetchError">
        Trigger 404 Error
      </UButton>

      <div class="mt-3">
        <div v-if="errorApi.loading.value" class="text-muted text-sm">Fetching...</div>
        <UAlert
          v-else-if="errorApi.error.value"
          color="error"
          title="Error caught successfully!"
          :description="errorApi.error.value"
        />
      </div>
    </UCard>

    <!-- 6. USERS -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-bold">6️⃣ Users List</p>
          <UBadge color="primary" variant="soft">with abort</UBadge>
        </div>
      </template>

      <div class="flex gap-2 mb-4">
        <UButton color="primary" :loading="usersApi.loading.value" @click="fetchUsers">
          Fetch Users
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          :disabled="!usersApi.loading.value"
          @click="() => { usersApi.abort(); log('🛑 Users request aborted!') }"
        >
          Abort
        </UButton>
      </div>

      <div v-if="usersApi.loading.value" class="text-muted text-sm">Loading users...</div>
      <div v-else-if="usersApi.error.value">
        <UAlert color="error" :title="usersApi.error.value" />
      </div>
      <div v-else-if="usersApi.data.value" class="grid grid-cols-2 gap-2">
        <div
          v-for="user in usersApi.data.value"
          :key="user.id"
          class="p-2 rounded bg-muted"
        >
          <p class="text-sm font-semibold text-default">{{ user.name }}</p>
          <p class="text-xs text-muted">{{ user.email }}</p>
          <p class="text-xs text-dimmed">{{ user.website }}</p>
        </div>
      </div>
    </UCard>

  </div>
</template>