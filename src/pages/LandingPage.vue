<template>
  <div class="landing-page">
    <!-- Navigation -->
    <nav class="landing-nav">
      <div class="nav-container">
        <router-link to="/" class="nav-logo">
          <i class="fas fa-sliders-h"></i>
          <span>EQUALIZER 19</span>
        </router-link>
        <div class="nav-links">
          <router-link to="/app" class="nav-link nav-link-primary">
            <i class="fas fa-play-circle"></i>
            {{ t.nav_start_app }}
          </router-link>
          <router-link to="/faq" class="nav-link">
            <i class="fas fa-question-circle"></i>
            {{ t.nav_faq }}
          </router-link>
          <div class="nav-controls">
            <button
              @click="toggleLanguage"
              class="nav-btn"
              :title="currentLanguage === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'"
            >
              <i class="fas fa-globe"></i>
              {{ currentLanguage === 'de' ? 'EN' : 'DE' }}
            </button>
            <button
              @click="toggleTheme"
              class="nav-btn"
              :title="currentTheme === 'dark' ? t.light_theme : t.dark_theme"
            >
              <i :class="currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-container">
        <div class="hero-content">
          <h1 class="hero-title">{{ t.hero_title }}</h1>
          <p class="hero-subtitle">{{ t.hero_subtitle }}</p>
          <div class="hero-cta">
            <router-link to="/app" class="cta-btn cta-btn-primary">
              <i class="fas fa-rocket"></i>
              {{ t.hero_cta_start }}
            </router-link>
            <a href="#features" class="cta-btn cta-btn-secondary">
              <i class="fas fa-info-circle"></i>
              {{ t.hero_cta_learn }}
            </a>
          </div>
        </div>

        <!-- Hero Feature Cards Grid -->
        <div class="hero-cards">
          <div class="hero-card">
            <div class="hero-card-icon">
              <i class="fas fa-sliders-h"></i>
            </div>
            <h3>{{ t.card_eq_title }}</h3>
            <p>{{ t.card_eq_desc }}</p>
            <ul class="hero-card-list">
              <li><i class="fas fa-check"></i> {{ t.card_eq_feature1 }}</li>
              <li><i class="fas fa-check"></i> {{ t.card_eq_feature2 }}</li>
              <li><i class="fas fa-check"></i> {{ t.card_eq_feature3 }}</li>
            </ul>
          </div>

          <div class="hero-card hero-card-featured">
            <div class="hero-card-badge">{{ t.card_badge_popular }}</div>
            <div class="hero-card-icon">
              <i class="fas fa-compress-alt"></i>
            </div>
            <h3>{{ t.card_comp_title }}</h3>
            <p>{{ t.card_comp_desc }}</p>
            <ul class="hero-card-list">
              <li><i class="fas fa-check"></i> {{ t.card_comp_feature1 }}</li>
              <li><i class="fas fa-check"></i> {{ t.card_comp_feature2 }}</li>
              <li><i class="fas fa-check"></i> {{ t.card_comp_feature3 }}</li>
            </ul>
          </div>

          <div class="hero-card">
            <div class="hero-card-icon">
              <i class="fas fa-microphone-alt"></i>
            </div>
            <h3>{{ t.card_rec_title }}</h3>
            <p>{{ t.card_rec_desc }}</p>
            <ul class="hero-card-list">
              <li><i class="fas fa-check"></i> {{ t.card_rec_feature1 }}</li>
              <li><i class="fas fa-check"></i> {{ t.card_rec_feature2 }}</li>
              <li><i class="fas fa-check"></i> {{ t.card_rec_feature3 }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features-section">
      <div class="features-container">
        <div class="section-header">
          <h2>{{ t.features_title }}</h2>
          <p>{{ t.features_subtitle }}</p>
        </div>

        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-wave-square"></i>
            </div>
            <div class="feature-content">
              <h3>{{ t.feature_webaudio_title }}</h3>
              <p>{{ t.feature_webaudio_desc }}</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-chart-bar"></i>
            </div>
            <div class="feature-content">
              <h3>{{ t.feature_viz_title }}</h3>
              <p>{{ t.feature_viz_desc }}</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-cogs"></i>
            </div>
            <div class="feature-content">
              <h3>{{ t.feature_presets_title }}</h3>
              <p>{{ t.feature_presets_desc }}</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-download"></i>
            </div>
            <div class="feature-content">
              <h3>{{ t.feature_export_title }}</h3>
              <p>{{ t.feature_export_desc }}</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-mobile-alt"></i>
            </div>
            <div class="feature-content">
              <h3>{{ t.feature_responsive_title }}</h3>
              <p>{{ t.feature_responsive_desc }}</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <i class="fas fa-lock"></i>
            </div>
            <div class="feature-content">
              <h3>{{ t.feature_privacy_title }}</h3>
              <p>{{ t.feature_privacy_desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Tech Stack Section -->
    <section class="tech-section">
      <div class="tech-container">
        <div class="section-header">
          <h2>{{ t.tech_title }}</h2>
          <p>{{ t.tech_subtitle }}</p>
        </div>

        <div class="tech-grid">
          <div class="tech-item">
            <div class="tech-icon">
              <i class="fab fa-vuejs"></i>
            </div>
            <h4>Vue.js 3</h4>
            <p>{{ t.tech_vue_desc }}</p>
          </div>

          <div class="tech-item">
            <div class="tech-icon">
              <i class="fas fa-music"></i>
            </div>
            <h4>Web Audio API</h4>
            <p>{{ t.tech_webaudio_desc }}</p>
          </div>

          <div class="tech-item">
            <div class="tech-icon">
              <i class="fas fa-bolt"></i>
            </div>
            <h4>Vite</h4>
            <p>{{ t.tech_vite_desc }}</p>
          </div>

          <div class="tech-item">
            <div class="tech-icon">
              <i class="fas fa-palette"></i>
            </div>
            <h4>CSS Variables</h4>
            <p>{{ t.tech_css_desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="stats-container">
        <div class="stat-box">
          <span class="stat-number">19</span>
          <span class="stat-label">{{ t.stat_bands }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">14+</span>
          <span class="stat-label">{{ t.stat_presets }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">60</span>
          <span class="stat-label">{{ t.stat_fps }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">0</span>
          <span class="stat-label">{{ t.stat_server }}</span>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-container">
        <h2>{{ t.cta_title }}</h2>
        <p>{{ t.cta_subtitle }}</p>
        <router-link to="/app" class="cta-btn cta-btn-large">
          <i class="fas fa-play"></i>
          {{ t.cta_button }}
        </router-link>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-brand">
            <i class="fas fa-sliders-h"></i>
            <span>EQUALIZER 19</span>
          </div>
          <p>{{ t.footer_desc }}</p>
        </div>
        <div class="footer-links">
          <router-link to="/app">{{ t.nav_start_app }}</router-link>
          <router-link to="/faq">{{ t.nav_faq }}</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const { t, currentLanguage, setLanguage } = inject('i18n')
const { currentTheme, setTheme } = inject('theme')

const toggleLanguage = () => {
  setLanguage(currentLanguage.value === 'de' ? 'en' : 'de')
}

const toggleTheme = () => {
  setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
}
</script>

<style scoped>
/* Landing Navigation */
.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--nav-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-logo i {
  color: var(--accent-primary);
  font-size: 22px;
}

.nav-logo:hover {
  color: var(--accent-primary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--hover-bg);
}

.nav-link-primary {
  background: var(--accent-primary);
  color: #fff;
}

.nav-link-primary:hover {
  background: var(--accent-secondary);
  color: #fff;
}

.nav-controls {
  display: flex;
  gap: 8px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--secondary-bg);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  color: var(--text-primary);
  border-color: var(--accent-primary);
  background: var(--hover-bg);
}

/* Hero Section */
.hero-section {
  padding: 120px 24px 80px;
  background: var(--gradient-primary);
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.hero-container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.hero-content {
  text-align: center;
  margin-bottom: 60px;
}

.hero-title {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 800;
  margin: 0 0 20px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: clamp(16px, 2vw, 20px);
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto 32px;
  line-height: 1.6;
}

.hero-cta {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cta-btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #fff;
  box-shadow: 0 4px 20px var(--shadow-medium);
}

.cta-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px var(--shadow-medium);
}

.cta-btn-secondary {
  background: var(--secondary-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.cta-btn-secondary:hover {
  border-color: var(--accent-primary);
  background: var(--hover-bg);
}

/* Hero Cards */
.hero-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-card {
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.hero-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px var(--shadow-medium);
  border-color: var(--accent-primary);
}

.hero-card-featured {
  border-color: var(--accent-primary);
  transform: scale(1.02);
}

.hero-card-featured:hover {
  transform: scale(1.02) translateY(-8px);
}

.hero-card-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hero-card-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  transition: all 0.3s ease;
}

.hero-card:hover .hero-card-icon {
  transform: scale(1.1) rotate(5deg);
}

.hero-card h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}

.hero-card > p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.5;
}

.hero-card-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.hero-card-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
}

.hero-card-list li:first-child {
  border-top: none;
}

.hero-card-list li i {
  color: var(--success);
  font-size: 12px;
}

/* Features Section */
.features-section {
  padding: 100px 24px;
  background: var(--secondary-bg);
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  margin: 0 0 16px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.section-header p {
  font-size: 16px;
  color: var(--text-secondary);
  max-width: 500px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-item {
  display: flex;
  gap: 20px;
  padding: 24px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px var(--shadow-light);
  border-color: var(--accent-primary);
}

.feature-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
}

.feature-content h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--text-primary);
}

.feature-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Tech Section */
.tech-section {
  padding: 100px 24px;
  background: var(--primary-bg);
}

.tech-container {
  max-width: 1200px;
  margin: 0 auto;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.tech-item {
  text-align: center;
  padding: 32px 24px;
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.tech-item:hover {
  transform: translateY(-4px);
  border-color: var(--accent-primary);
  box-shadow: 0 10px 30px var(--shadow-light);
}

.tech-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  background: var(--secondary-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--accent-primary);
  transition: all 0.3s ease;
}

.tech-item:hover .tech-icon {
  background: var(--accent-primary);
  color: #fff;
}

.tech-item h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--text-primary);
}

.tech-item p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Stats Section */
.stats-section {
  padding: 60px 24px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
}

.stats-container {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.stat-box {
  text-align: center;
  color: #fff;
}

.stat-number {
  display: block;
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* CTA Section */
.cta-section {
  padding: 100px 24px;
  background: var(--secondary-bg);
  text-align: center;
}

.cta-container {
  max-width: 600px;
  margin: 0 auto;
}

.cta-section h2 {
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 700;
  margin: 0 0 16px;
  color: var(--text-primary);
}

.cta-section p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 32px;
}

.cta-btn-large {
  padding: 18px 40px;
  font-size: 18px;
}

/* Footer */
.landing-footer {
  padding: 40px 24px;
  background: var(--primary-bg);
  border-top: 1px solid var(--border-color);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.footer-brand i {
  color: var(--accent-primary);
}

.footer-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: var(--accent-primary);
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-cards {
    grid-template-columns: 1fr;
    max-width: 500px;
  }

  .hero-card-featured {
    transform: none;
    order: -1;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .tech-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .nav-links {
    gap: 12px;
  }

  .nav-link span {
    display: none;
  }

  .hero-section {
    padding: 100px 16px 60px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .tech-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .stat-number {
    font-size: 36px;
  }

  .footer-container {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 16px;
  }

  .hero-cards {
    gap: 16px;
  }

  .hero-card {
    padding: 24px 20px;
  }

  .tech-grid {
    grid-template-columns: 1fr;
  }

  .stats-container {
    grid-template-columns: 1fr 1fr;
  }

  .cta-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
