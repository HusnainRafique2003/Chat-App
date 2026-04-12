<script setup lang="ts">
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Message } from '~/composables/useMessagesApi'

interface Props {
  message?: Message
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  confirm: [content: string]
  cancel: []
}>()

const open = defineModel<boolean>('open', { default: false })

// Editor state
const editor = useEditor({
  content: '',
  extensions: [
    StarterKit.configure({
      link: false,
      paragraph: {
        HTMLAttributes: { class: 'editor-paragraph' }
      }
    }),
    Placeholder.configure({ placeholder: 'Edit your message...' }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'composer-link' },
      linkOnPaste: true,
      autolink: true
    })
  ],
  editorProps: {
    attributes: {
      class: 'min-h-[80px] max-h-[200px] overflow-y-auto'
    }
  }
})

const originalContent = ref('')
const currentContent = ref('')

watch(() => props.message, (newMessage) => {
  if (newMessage?.content && open.value && editor.value) {
    originalContent.value = newMessage.content
    currentContent.value = newMessage.content
    editor.value.commands.setContent(newMessage.content)
  }
}, { immediate: true })

// Update current content on editor changes
watch(() => editor.value?.getHTML(), (html) => {
  if (html) {
    currentContent.value = html
  }
}, { immediate: true })

const hasChanges = computed(() => {
  return currentContent.value.trim() !== originalContent.value.trim()
})

const getHTMLContent = (): string => {
  if (!editor.value) return ''
  let html = editor.value.getHTML()
  html = html.replace(/<p>\s*<\/p>/g, '')
  if (!html || html.trim() === '' || html === '<p></p>') {
    return ''
  }
  return html.trim()
}

function insertBold() { editor.value?.chain().focus().toggleBold().run() }
function insertItalic() { editor.value?.chain().focus().toggleItalic().run() }
function openLinkDialog() {
  if (!editor.value) return
  const { from, to } = editor.value.state.selection
  const selectedText = editor.value.state.doc.textBetween(from, to, '')
  const linkAttrs = editor.value.getAttributes('link')
  
  // Simple link insertion for now
  const url = prompt('Enter URL:', linkAttrs.href || '')
  if (url) {
    const cleanUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
    if (from === to) {
      editor.value.chain().focus().insertContent({
        type: 'text',
        marks: [{ type: 'link', attrs: { href: cleanUrl } }],
        text: selectedText || cleanUrl
      }).run()
    } else {
      editor.value.chain().focus().setLink({ href: cleanUrl }).run()
    }
  }
}

function handleConfirm() {
  const htmlContent = getHTMLContent()
  if (htmlContent && hasChanges.value) {
    emit('confirm', htmlContent)
  }
  open.value = false
}

function handleCancel() {
  emit('cancel')
  open.value = false
}

onMounted(() => {
  if (editor.value) {
    editor.value.on('update', () => {
      currentContent.value = editor.value!.getHTML()
    })
  }
})

onUnmounted(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<template>
  <BaseModal
    v-model:open="open"
    title="Edit Message"
    description="Update your message content"
    icon="i-lucide-pencil"
    confirm-label="Update"
    :confirm-disabled="!hasChanges"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
<div class="flex flex-col gap-4">
      <!-- Rich Editor Toolbar -->
      <div class="flex items-center gap-1 p-2 border-b border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] rounded-lg">
        <UButton icon="i-lucide-bold" size="sm" variant="ghost" @click="insertBold" />
        <UButton icon="i-lucide-italic" size="sm" variant="ghost" @click="insertItalic" />
        <UButton icon="i-lucide-link" size="sm" variant="ghost" @click="openLinkDialog" />
      </div>
      
      <!-- Editor -->
      <div class="relative">
        <label class="text-sm font-semibold text-[var(--ui-text)] block mb-2 sr-only">
          Message Content
        </label>
        <EditorContent
          :editor="editor"
          class="w-full min-h-[100px] px-3 py-3 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] text-[var(--ui-text)] focus-within:ring-2 focus-within:ring-[var(--ui-primary)]"
        />
      </div>
      
      <!-- Status -->
      <div class="flex items-center justify-between pt-2 border-t border-[var(--ui-border)]">
        <p class="text-xs text-[var(--ui-text-muted)]">
          Rich text editor (links preserved)
        </p>
        <p v-if="hasChanges" class="text-xs text-[var(--ui-primary)] font-semibold">
          ✓ Changes detected
        </p>
      </div>
    </div>
  </BaseModal>
</template>
