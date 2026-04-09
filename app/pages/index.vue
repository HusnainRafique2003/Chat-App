<script setup lang="ts">
interface StatItem {
  number: number
  target: number
  label: string
  icon: string
  suffix?: string
  duration: number
}

interface CapabilityItem {
  icon: string
  title: string
  desc: string
}

interface WorkflowItem {
  step: string
  title: string
  desc: string
}

interface ReviewItem {
  quote: string
  author: string
  role: string
  avatar: string
}

const stats = reactive<StatItem[]>([
  { number: 0, target: 1000000, label: 'messages delivered daily', icon: 'i-mdi-message-text-fast-outline', suffix: '+', duration: 2200 },
  { number: 0, target: 12000, label: 'workspaces launched', icon: 'i-mdi-briefcase-outline', suffix: '+', duration: 2200 },
  { number: 0, target: 99.9, label: 'reliable uptime', icon: 'i-mdi-clock-check-outline', suffix: '%', duration: 2200 },
  { number: 0, target: 38, label: 'countries using the platform', icon: 'i-mdi-earth', duration: 2200 }
])

const capabilities: CapabilityItem[] = [
  {
    icon: 'i-mdi-forum-outline',
    title: 'Channels that stay organized',
    desc: 'Keep product, engineering, operations, and support aligned with focused spaces that are easy to scan and easy to maintain.'
  },
  {
    icon: 'i-mdi-shield-check-outline',
    title: 'Workspace-level control',
    desc: 'Structure permissions and membership around real teams so private collaboration feels safe, predictable, and professional.'
  },
  {
    icon: 'i-mdi-view-dashboard-outline',
    title: 'Built for everyday operations',
    desc: 'Move from landing page to onboarding to dashboard with one consistent product language instead of disconnected screens.'
  },
  {
    icon: 'i-mdi-lightning-bolt-outline',
    title: 'Fast under daily pressure',
    desc: 'The interface is designed for speed, whether your team is joining channels, reviewing updates, or moving work forward in real time.'
  },
  {
    icon: 'i-mdi-account-group-outline',
    title: 'Designed for growing teams',
    desc: 'Support a small founding team today and multiple departments tomorrow without losing clarity in the communication model.'
  },
  {
    icon: 'i-mdi-palette-outline',
    title: 'A warmer, tactile UI',
    desc: 'The visual system feels grounded and product-like, helping the app read as a serious team workspace instead of a generic template.'
  }
]

const workflow: WorkflowItem[] = [
  {
    step: '01',
    title: 'Create the workspace',
    desc: 'Start with one team hub and establish a clean home for channels, members, and collaboration rules.'
  },
  {
    step: '02',
    title: 'Invite the right people',
    desc: 'Bring teammates into the workspace with a structure that supports focused visibility and fast onboarding.'
  },
  {
    step: '03',
    title: 'Run communication with clarity',
    desc: 'Keep updates, handoffs, and team discussions organized in a way that still feels calm as activity grows.'
  }
]

const reviews: ReviewItem[] = [
  {
    quote: 'The product feels coherent now. The landing page, onboarding flow, and workspace direction all sound like the same app.',
    author: 'Sarah Khan',
    role: 'Product Lead, Northstar Labs',
    avatar: 'SK'
  },
  {
    quote: 'It has the structure of a serious collaboration tool, but the warmer presentation makes it more approachable for everyday teams.',
    author: 'Hassan Ali',
    role: 'Founder, Loopstack',
    avatar: 'HA'
  },
  {
    quote: 'Readable, trustworthy, and calm. That matters a lot for a chat platform people will stare at all day.',
    author: 'Mariam Noor',
    role: 'Operations Manager, VerveOps',
    avatar: 'MN'
  }
]

const animationIds = new Map<string, number>()
let statsObserver: IntersectionObserver | null = null

async function goToLogin() {
  await navigateTo('/auth/login')
}

async function goToRegister() {
  await navigateTo('/auth/register')
}

async function goToDashboard() {
  await navigateTo('/dashboard')
}

function animateCounter(stat: StatItem) {
  const key = stat.label
  const existing = animationIds.get(key)

  if (existing !== undefined) {
    cancelAnimationFrame(existing)
  }

  const startTime = performance.now()

  function animate(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / stat.duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)

    stat.number = eased * stat.target

    if (progress < 1) {
      animationIds.set(key, requestAnimationFrame(animate))
      return
    }

    stat.number = stat.target
    animationIds.delete(key)
  }

  animationIds.set(key, requestAnimationFrame(animate))
}

function formatStat(stat: StatItem) {
  if (stat.target % 1 !== 0) {
    return stat.number.toFixed(1)
  }

  return Math.round(stat.number).toLocaleString()
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return
  }

  const statsSection = document.querySelector('.stats-section')
  if (!statsSection) return

  statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return

      stats.forEach(stat => animateCounter(stat))
      statsObserver?.unobserve(entry.target)
    })
  }, { threshold: 0.35 })

  statsObserver.observe(statsSection)
})

onBeforeUnmount(() => {
  if (statsObserver) {
    statsObserver.disconnect()
    statsObserver = null
  }

  animationIds.forEach(id => cancelAnimationFrame(id))
  animationIds.clear()
})
</script>

<template>
  <div class="page-shell">
    <section id="home" class="page-section px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14">
      <div class="hero-panel mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div class="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <div class="relative z-10 animate-in">
            <div class="section-eyebrow stagger-1 mb-6">
              <span class="h-2.5 w-2.5 rounded-full bg-[var(--ui-success)]" />
              Slack-style workspace communication
            </div>

            <h1 class="section-title stagger-2 animate-in mb-6 max-w-4xl">
              Professional team chat with the structure modern companies actually need.
            </h1>

            <p class="section-copy stagger-3 animate-in mb-8 max-w-2xl">
              ChatSphere helps teams organize work around channels, members, and workspaces without losing clarity. It is built to feel calm, credible, and ready for daily operations from the very first screen.
            </p>

            <div class="stagger-4 animate-in flex flex-col gap-4 sm:flex-row">
              <UButton label="Create Workspace" size="xl" color="primary" class="px-6 py-3 text-sm font-semibold transition-transform duration-300 hover:-translate-y-1" @click="goToRegister" />
              <UButton label="Sign In" size="xl" color="neutral" variant="soft" class="px-6 py-3 text-sm font-semibold transition-transform duration-300 hover:-translate-y-1" @click="goToLogin" />
            </div>

            <div class="stagger-5 animate-in mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div class="flex h-full flex-col justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/72 px-4 py-3 text-sm text-[var(--ui-text-muted)]">
                <div class="mb-1 font-semibold text-[var(--ui-text-highlighted)]">Channel-first</div>
                Clear conversation lanes for every team.
              </div>
              <div class="flex h-full flex-col justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/72 px-4 py-3 text-sm text-[var(--ui-text-muted)]">
                <div class="mb-1 font-semibold text-[var(--ui-text-highlighted)]">Workspace-ready</div>
                Built for onboarding and team growth.
              </div>
              <div class="flex h-full flex-col justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/72 px-4 py-3 text-sm text-[var(--ui-text-muted)]">
                <div class="mb-1 font-semibold text-[var(--ui-text-highlighted)]">Tactile UI</div>
                Warm surfaces with stronger readability.
              </div>
            </div>
          </div>

          <div class="relative z-10">
            <div class="float-soft rounded-[1.75rem] border border-white/45 bg-white/70 p-5 shadow-[var(--shadow-lg)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(12,18,32,0.74)]">
              <div class="mb-5 flex items-start justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-dimmed)]">Live Product Preview</p>
                  <h2 class="mt-2 text-xl font-bold text-[var(--ui-text-highlighted)] sm:text-2xl">Workspace Command Center</h2>
                </div>
                <UBadge label="Online" color="success" variant="soft" />
              </div>

              <div class="grid gap-4">
                <div class="flex h-full flex-col rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/80 p-4">
                  <div class="mb-3 flex items-center justify-between">
                    <div>
                      <p class="text-sm font-semibold text-[var(--ui-text)]">Engineering Workspace</p>
                      <p class="text-xs text-[var(--ui-text-muted)]">12 members and 8 active channels</p>
                    </div>
                    <UIcon name="i-mdi-arrow-top-right" class="h-5 w-5 text-[var(--ui-primary)]" />
                  </div>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between rounded-xl bg-[var(--ui-bg-muted)] px-3 py-2 text-sm">
                      <span># product-updates</span>
                      <span class="text-[var(--ui-success)]">24 new</span>
                    </div>
                    <div class="flex items-center justify-between rounded-xl bg-[var(--ui-bg-muted)] px-3 py-2 text-sm">
                      <span># qa-handoff</span>
                      <span class="text-[var(--ui-secondary)]">Synced</span>
                    </div>
                    <div class="flex items-center justify-between rounded-xl bg-[var(--ui-bg-muted)] px-3 py-2 text-sm">
                      <span># design-review</span>
                      <span class="text-[var(--ui-text-muted)]">Waiting</span>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="flex h-full flex-col rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/80 p-4">
                    <p class="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-dimmed)]">Average Response</p>
                    <p class="mt-2 text-2xl font-black text-[var(--ui-text-highlighted)] sm:text-3xl">2.4m</p>
                  </div>
                  <div class="flex h-full flex-col rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/80 p-4">
                    <p class="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-dimmed)]">Team Readiness</p>
                    <p class="mt-2 text-2xl font-black text-[var(--ui-text-highlighted)] sm:text-3xl">High</p>
                  </div>
                </div>

                <div class="flex h-full flex-col rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/80 p-4">
                  <div class="mb-3 flex items-center justify-between">
                    <p class="text-sm font-semibold text-[var(--ui-text)]">Launch Checklist</p>
                    <span class="text-xs text-[var(--ui-text-muted)]">Today</span>
                  </div>
                  <div class="space-y-3 text-sm">
                    <div class="flex items-center gap-3">
                      <div class="h-2.5 w-2.5 rounded-full bg-[var(--ui-success)]" />
                      Invite department leads
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="h-2.5 w-2.5 rounded-full bg-[var(--ui-secondary)]" />
                      Configure default channels
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="h-2.5 w-2.5 rounded-full bg-[var(--ui-warning)]" />
                      Finalize workspace settings
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="page-section stats-section px-4 py-10 sm:px-6 lg:px-8">
      <div class="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-4">
        <UCard v-for="stat in stats" :key="stat.label" class="metric-card animate-in h-full">
          <div class="flex h-full flex-col">
            <div class="mb-6 flex items-center justify-between gap-3">
              <div class="feature-icon-shell shrink-0">
                <UIcon :name="stat.icon" class="h-7 w-7 text-[var(--ui-primary)]" />
              </div>
              <span class="text-right text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-dimmed)]">Platform metric</span>
            </div>
            <div class="mt-auto text-3xl font-black text-[var(--ui-text-highlighted)] sm:text-4xl">
              {{ formatStat(stat) }}{{ stat.suffix || '' }}
            </div>
            <p class="mt-3 text-sm uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">{{ stat.label }}</p>
          </div>
        </UCard>
      </div>
    </section>

    <section id="features" class="page-section px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div class="mx-auto max-w-7xl">
        <div class="mb-12 max-w-3xl animate-in">
          <div class="section-eyebrow mb-5">
            <span class="h-2.5 w-2.5 rounded-full bg-[var(--ui-primary)]" />
            Product capabilities
          </div>
          <h2 class="section-title mb-5">Designed to feel credible to decision-makers and intuitive for teams.</h2>
          <p class="section-copy">
            A professional collaboration product needs more than visuals. It needs clarity in structure, confidence in tone, and enough polish to make the experience feel dependable from the start.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <UCard v-for="capability in capabilities" :key="capability.title" class="feature-panel animate-in h-full">
            <div class="flex h-full flex-col">
              <div class="feature-icon-shell mb-6 shrink-0">
                <UIcon :name="capability.icon" class="h-7 w-7 text-[var(--ui-primary)]" />
              </div>
              <h3 class="mb-4 text-xl font-bold text-[var(--ui-text-highlighted)] sm:text-2xl">{{ capability.title }}</h3>
              <p class="section-copy mt-auto text-[0.98rem]">{{ capability.desc }}</p>
            </div>
          </UCard>
        </div>
      </div>
    </section>

    <section class="page-section px-4 py-20 sm:px-6 lg:px-8">
      <div class="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <UCard class="feature-panel animate-in h-full">
          <div class="section-eyebrow mb-5">
            <span class="h-2.5 w-2.5 rounded-full bg-[var(--ui-secondary)]" />
            Why this matters
          </div>
          <h2 class="mb-5 text-2xl font-black leading-tight text-[var(--ui-text-highlighted)] sm:text-3xl">
            Team chat software should reduce noise, not just create more places to talk.
          </h2>
          <p class="section-copy mb-6 text-[0.98rem]">
            The best communication tools help teams make decisions faster, onboard people smoothly, and maintain order as conversations grow across departments.
          </p>
          <div class="space-y-4">
            <div class="flex h-full flex-col rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/72 p-4">
              <p class="font-semibold text-[var(--ui-text-highlighted)]">Leadership clarity</p>
              <p class="mt-1 text-sm text-[var(--ui-text-muted)]">Executives need confidence that information moves clearly across teams and priorities.</p>
            </div>
            <div class="flex h-full flex-col rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/72 p-4">
              <p class="font-semibold text-[var(--ui-text-highlighted)]">Operational speed</p>
              <p class="mt-1 text-sm text-[var(--ui-text-muted)]">Operations teams benefit when channels, permissions, and workspace structure are simple and predictable.</p>
            </div>
            <div class="flex h-full flex-col rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/72 p-4">
              <p class="font-semibold text-[var(--ui-text-highlighted)]">Daily usability</p>
              <p class="mt-1 text-sm text-[var(--ui-text-muted)]">A grounded visual system improves readability and makes long sessions feel calmer.</p>
            </div>
          </div>
        </UCard>

        <UCard class="feature-panel animate-in h-full">
          <div class="section-eyebrow mb-5">
            <span class="h-2.5 w-2.5 rounded-full bg-[var(--ui-success)]" />
            Team workflow
          </div>
          <h2 class="mb-6 text-2xl font-black leading-tight text-[var(--ui-text-highlighted)] sm:text-3xl">
            A professional path from signup to daily communication.
          </h2>
          <div class="space-y-5">
            <div v-for="item in workflow" :key="item.step" class="grid gap-4 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/72 p-5 sm:grid-cols-[auto_1fr]">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--ui-primary)] text-sm font-bold text-[var(--ui-primary-foreground)]">
                {{ item.step }}
              </div>
              <div class="min-w-0">
                <h3 class="text-lg font-bold text-[var(--ui-text-highlighted)] sm:text-xl">{{ item.title }}</h3>
                <p class="mt-2 text-[var(--ui-text-muted)]">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </section>

    <section id="reviews" class="page-section px-4 py-20 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <div class="mb-12 max-w-3xl animate-in">
          <div class="section-eyebrow mb-5">
            <span class="h-2.5 w-2.5 rounded-full bg-[var(--ui-secondary)]" />
            Product perception
          </div>
          <h2 class="section-title mb-5">The first impression should already feel like a serious product.</h2>
          <p class="section-copy">
            Decision-makers judge clarity, trust, and product maturity fast. A stronger homepage helps communicate that the workspace experience behind it is worth adopting.
          </p>
        </div>

        <UCarousel
          v-slot="{ item: review }"
          :items="reviews"
          :ui="{ item: 'basis-full lg:basis-1/3' }"
          class="animate-in"
          indicators
          navigation
        >
          <UCard class="review-panel h-full">
            <div class="flex h-full flex-col">
              <p class="mb-8 flex-1 text-lg leading-relaxed text-[var(--ui-text)] sm:text-xl">&ldquo;{{ review.quote }}&rdquo;</p>
              <div class="flex items-center gap-4">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ui-primary)] to-[var(--ui-secondary)] text-lg font-bold text-white">
                  {{ review.avatar }}
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-[var(--ui-text-highlighted)]">{{ review.author }}</p>
                  <p class="text-sm text-[var(--ui-text-muted)]">{{ review.role }}</p>
                </div>
              </div>
            </div>
          </UCard>
        </UCarousel>
      </div>
    </section>

    <section id="get-started" class="page-section px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24">
      <div class="cta-panel mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div class="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div class="animate-in">
            <div class="section-eyebrow mb-5">
              <span class="h-2.5 w-2.5 rounded-full bg-[var(--ui-success)]" />
              Start the workspace
            </div>
            <h2 class="section-title mb-4">Launch a cleaner communication system for your team.</h2>
            <p class="section-copy max-w-2xl">
              Create a workspace, invite members, and move into a product experience that already feels structured enough for real daily collaboration.
            </p>
          </div>

          <div class="animate-in flex flex-col gap-3 sm:flex-row lg:flex-col">
            <UButton label="Start Registration" size="xl" color="primary" class="px-7 py-3 text-sm font-semibold transition-transform duration-300 hover:-translate-y-1" @click="goToRegister" />
            <UButton label="Open Dashboard" size="xl" color="neutral" variant="soft" class="px-7 py-3 text-sm font-semibold transition-transform duration-300 hover:-translate-y-1" @click="goToDashboard" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
