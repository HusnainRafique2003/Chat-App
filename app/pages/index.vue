<script setup lang="ts">
// Landing page data
const stats = [
  { number: '1M+', label: 'Active Users', icon: 'i-mdi-account-group' },
  { number: '10K+', label: 'Workspaces', icon: 'i-mdi-briefcase' },
  { number: '99.9%', label: 'Uptime', icon: 'i-mdi-clock-check' },
  { number: '500K+', label: 'Messages/Day', icon: 'i-mdi-message-draw' },
]

const features = [
  {
    icon: 'i-mdi-message-bulleted',
    title: 'Real-time Messaging',
    description: 'Lightning-fast messages with end-to-end encryption. Never miss a beat.',
    color: 'primary'
  },
  {
    icon: 'i-mdi-shield-lock',
    title: 'Secure Workspaces',
    description: 'Enterprise-grade security with role-based access and private channels.',
    color: 'secondary'
  },
  {
    icon: 'i-mdi-account-group',
    title: 'Team Collaboration',
    description: 'Organize conversations by teams, projects, and topics with threaded replies.',
    color: 'success'
  },
  {
    icon: 'i-mdi-cellphone',
    title: 'Mobile First',
    description: 'Native apps for iOS & Android with full push notifications and offline sync.',
    color: 'warning'
  },
  {
    icon: 'i-mdi-robot',
    title: 'AI Assistant',
    description: 'Smart summaries, auto-replies, and conversation insights powered by AI.',
    color: 'error'
  },
  {
    icon: 'i-mdi-plug',
    title: '100+ Integrations',
    description: 'Connect with Slack, GitHub, Jira, Google Workspace, and 100+ other tools.',
    color: 'neutral'
  }
]

const testimonials = [
  { quote: 'Transformed our team communication!', author: 'Sarah K., Engineering Lead @ TechCorp', avatar: 'SA' },
  { quote: 'Best chat app we\'ve used. Period.', author: 'Mike R., CTO @ StartupX', avatar: 'MR' },
  { quote: 'Scales perfectly from 5 to 5000 users.', author: 'Emily T., Product @ ScaleCo', avatar: 'ET' },
]
</script>

<template>
  <div class="py-20 lg:py-32">
    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-5xl lg:text-7xl font-black bg-gradient-to-r from-[var(--ui-primary)] via-[var(--ui-secondary)] to-[var(--ui-success)] bg-clip-text text-transparent mb-6 leading-tight">
          Revolutionize Your
          <span class="block text-[var(--ui-success)] mt-4">Team Communication</span>
        </h1>
        <p class="text-xl lg:text-2xl text-[var(--ui-text-muted)] mb-12 max-w-2xl mx-auto leading-relaxed">
          Real-time messaging, secure workspaces, and AI-powered insights for modern teams. 
          Join 1M+ users transforming how they collaborate.
        </p>
        
        <!-- Hero Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <BaseCard 
            v-for="stat in stats" 
            :key="stat.label"
            :title="stat.number" 
            :icon="stat.icon"
            color="primary"
            class="text-center hover:scale-105 transition-transform"
          >
            <template #description>
              <p class="text-lg font-bold text-[var(--ui-primary)]">{{ stat.label }}</p>
            </template>
          </BaseCard>
        </div>

        <!-- Hero CTAs -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <BaseButton 
            label="Start Free Trial" 
            size="lg" 
            color="success" 
            class="text-lg px-8 py-6 shadow-2xl hover:shadow-3xl !bg-[var(--ui-success)]"
            to="/auth/register"
          />
          <BaseButton 
            label="Watch Demo (2 min)" 
            size="lg" 
            color="neutral" 
            variant="outline"
            class="text-lg px-8 py-6"
            to="#demo"
          />
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 bg-[var(--ui-bg-muted)]">
      <div class="text-center mb-20">
        <h2 class="text-4xl lg:text-5xl font-black mb-6 text-[var(--ui-text-highlighted)]">
          Everything You Need to Collaborate
        </h2>
        <p class="text-xl text-[var(--ui-text-muted)] max-w-2xl mx-auto">
          From small teams to global enterprises, ChatSphere scales with you.
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <BaseCard 
          v-for="feature in features" 
          :key="feature.title"
          :title="feature.title"
          :icon="feature.icon"
          :color="feature.color"
          :description="feature.description"
          hoverable
          class="group cursor-pointer"
        >
          <template #footer>
            <BaseButton label="Learn More" size="sm" color="primary" variant="ghost" class="opacity-0 group-hover:opacity-100 transition-opacity" />
          </template>
        </BaseCard>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
      <div class="text-center mb-20">
        <BaseBadge label="Trusted by Teams Worldwide" color="success" size="lg" class="mb-6" />
        <h2 class="text-4xl lg:text-5xl font-black mb-6">What Teams Are Saying</h2>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8">
        <div 
          v-for="testimonial in testimonials" 
          :key="testimonial.author"
          class="p-8 lg:p-12 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] hover:shadow-2xl transition-all duration-300"
        >
          <p class="text-lg leading-relaxed mb-6 text-[var(--ui-text)] italic">“{{ testimonial.quote }}”</p>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-[var(--ui-primary)] rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0">
              {{ testimonial.avatar }}
            </div>
            <div>
              <p class="font-semibold text-[var(--ui-text)]">{{ testimonial.author }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center bg-gradient-to-r from-[var(--ui-primary)] to-[var(--ui-secondary)] rounded-3xl mx-8 -mt-20 lg:-mt-32 relative overflow-hidden">
      <div class="relative z-10">
        <h2 class="text-4xl lg:text-5xl font-black text-white mb-6">Ready to Transform Communication?</h2>
        <p class="text-xl text-white/90 mb-12 max-w-2xl mx-auto">No credit card required. Cancel anytime.</p>
        <BaseButton 
          label="Get Started Free" 
          size="lg" 
          color="success" 
          class="text-lg px-12 py-8 shadow-2xl hover:shadow-3xl mx-auto !bg-white text-[var(--ui-success)] font-bold"
          to="/auth/register"
        />
      </div>
    </section>
  </div>
</template>

