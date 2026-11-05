<template>
  <section id="blog" class="lp-section lp-section-alt">
    <!-- Blog: posts about Equalizer 19 on kodinitools.com (src/data/blogArticles.js) -->
    <div class="lp-wrap">
      <header class="lp-section-head">
        <h2>{{ t.lp_blog_title }}</h2>
        <p>{{ t.lp_blog_subtitle }}</p>
      </header>
      <div class="lp-blog-grid">
        <a
          v-for="article in blogCards"
          :key="article.id"
          :href="article.url"
          class="lp-blog-card"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="lp-blog-media">
            <img :src="article.image" alt="" width="640" height="360" loading="lazy" />
          </div>
          <div class="lp-blog-body">
            <div class="lp-blog-head">
              <span class="lp-blog-tag">{{ article.tag }}</span>
              <span class="lp-blog-meta">{{ article.meta }}</span>
            </div>
            <h3>{{ article.title }}</h3>
            <p>{{ article.description }}</p>
            <span class="lp-blog-link">
              {{ t.lp_blog_read_more }} <span aria-hidden="true">→</span>
            </span>
          </div>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
  import { inject, computed } from 'vue'
  import { getBlogArticlesNewestFirst } from '../../data/blogArticles.js'
  import { buildBlogCards } from '../../utils/blogCards.js'

  const { t, currentLanguage } = inject('i18n')

  // Blog cards in the active language, newest post first (src/data/blogArticles.js)
  const blogCards = computed(() =>
    buildBlogCards(getBlogArticlesNewestFirst(), currentLanguage.value, t.value.lp_blog_minutes)
  )
</script>

<style scoped src="./landing.css"></style>

<style scoped>
  /* ---- Blog cards (posts on kodinitools.com) ---- */
  .lp-blog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .lp-blog-card {
    display: flex;
    flex-direction: column;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    transition:
      border-color 0.2s,
      transform 0.2s,
      box-shadow 0.2s;
  }

  .lp-blog-card:hover,
  .lp-blog-card:focus-visible {
    border-color: var(--accent-primary);
    transform: translateY(-2px);
    box-shadow: 0 12px 28px var(--shadow-light);
  }

  .lp-blog-card:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .lp-blog-media {
    aspect-ratio: 16 / 9;
    background: var(--primary-bg);
    border-bottom: 1px solid var(--border-color);
    overflow: hidden;
  }

  .lp-blog-media img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .lp-blog-card:hover .lp-blog-media img {
    transform: scale(1.03);
  }

  .lp-blog-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 10px;
    padding: 20px 24px 24px;
  }

  .lp-blog-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .lp-blog-tag {
    padding: 3px 9px;
    border-radius: 999px;
    background: var(--accent-primary);
    color: var(--on-accent);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .lp-blog-meta {
    font-size: 13px;
    color: var(--text-muted);
  }

  .lp-blog-body h3 {
    margin: 0;
    font-size: 18px;
    line-height: 1.35;
    font-weight: 700;
    color: var(--text-primary);
  }

  .lp-blog-body p {
    flex: 1;
    margin: 0;
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  .lp-blog-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent-primary);
  }

  @media (prefers-reduced-motion: reduce) {
    .lp-blog-card:hover,
    .lp-blog-card:hover .lp-blog-media img {
      transform: none;
    }
  }
</style>
