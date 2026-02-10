<template>
  <div class="faq-page">
    <!-- FAQ Content -->
    <main class="faq-main">
      <div class="faq-container">
        <div class="faq-header">
          <h1>{{ t.faq_title }}</h1>
          <p>{{ t.faq_subtitle }}</p>
        </div>

        <div class="faq-categories">
          <!-- General Questions -->
          <section class="faq-category">
            <h2><i class="fas fa-info-circle"></i> {{ t.faq_cat_general }}</h2>
            <div class="faq-list">
              <details class="faq-item">
                <summary>{{ t.faq_q1 }}</summary>
                <div class="faq-answer">{{ t.faq_a1 }}</div>
              </details>
              <details class="faq-item">
                <summary>{{ t.faq_q2 }}</summary>
                <div class="faq-answer">{{ t.faq_a2 }}</div>
              </details>
              <details class="faq-item">
                <summary>{{ t.faq_q3 }}</summary>
                <div class="faq-answer">{{ t.faq_a3 }}</div>
              </details>
            </div>
          </section>

          <!-- Equalizer Questions -->
          <section class="faq-category">
            <h2><i class="fas fa-sliders-h"></i> {{ t.faq_cat_equalizer }}</h2>
            <div class="faq-list">
              <details class="faq-item">
                <summary>{{ t.faq_eq_q1 }}</summary>
                <div class="faq-answer">{{ t.faq_eq_a1 }}</div>
              </details>
              <details class="faq-item">
                <summary>{{ t.faq_eq_q2 }}</summary>
                <div class="faq-answer">{{ t.faq_eq_a2 }}</div>
              </details>
              <details class="faq-item">
                <summary>{{ t.faq_eq_q3 }}</summary>
                <div class="faq-answer">{{ t.faq_eq_a3 }}</div>
              </details>
            </div>
          </section>

          <!-- Compressor Questions -->
          <section class="faq-category">
            <h2><i class="fas fa-compress-alt"></i> {{ t.faq_cat_compressor }}</h2>
            <div class="faq-list">
              <details class="faq-item">
                <summary>{{ t.faq_comp_q1 }}</summary>
                <div class="faq-answer">{{ t.faq_comp_a1 }}</div>
              </details>
              <details class="faq-item">
                <summary>{{ t.faq_comp_q2 }}</summary>
                <div class="faq-answer">{{ t.faq_comp_a2 }}</div>
              </details>
              <details class="faq-item">
                <summary>{{ t.faq_comp_q3 }}</summary>
                <div class="faq-answer">{{ t.faq_comp_a3 }}</div>
              </details>
            </div>
          </section>

          <!-- Recording Questions -->
          <section class="faq-category">
            <h2><i class="fas fa-microphone-alt"></i> {{ t.faq_cat_recording }}</h2>
            <div class="faq-list">
              <details class="faq-item">
                <summary>{{ t.faq_rec_q1 }}</summary>
                <div class="faq-answer">{{ t.faq_rec_a1 }}</div>
              </details>
              <details class="faq-item">
                <summary>{{ t.faq_rec_q2 }}</summary>
                <div class="faq-answer">{{ t.faq_rec_a2 }}</div>
              </details>
              <details class="faq-item">
                <summary>{{ t.faq_rec_q3 }}</summary>
                <div class="faq-answer">{{ t.faq_rec_a3 }}</div>
              </details>
            </div>
          </section>

          <!-- Technical Questions -->
          <section class="faq-category">
            <h2><i class="fas fa-cogs"></i> {{ t.faq_cat_technical }}</h2>
            <div class="faq-list">
              <details class="faq-item">
                <summary>{{ t.faq_tech_q1 }}</summary>
                <div class="faq-answer">{{ t.faq_tech_a1 }}</div>
              </details>
              <details class="faq-item">
                <summary>{{ t.faq_tech_q2 }}</summary>
                <div class="faq-answer">{{ t.faq_tech_a2 }}</div>
              </details>
              <details class="faq-item">
                <summary>{{ t.faq_tech_q3 }}</summary>
                <div class="faq-answer">{{ t.faq_tech_a3 }}</div>
              </details>
            </div>
          </section>
        </div>

        <!-- CTA -->
        <div class="faq-cta">
          <h3>{{ t.faq_cta_title }}</h3>
          <p>{{ t.faq_cta_desc }}</p>
          <router-link to="/app" class="cta-btn">
            <i class="fas fa-rocket"></i>
            {{ t.nav_start_app }}
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const { t } = inject('i18n')
</script>

<style scoped>
.faq-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Main Content */
.faq-main {
  flex: 1;
  padding: 40px 24px 60px;
  background: var(--primary-bg);
}

.faq-container {
  max-width: 900px;
  margin: 0 auto;
}

.faq-header {
  text-align: center;
  margin-bottom: 60px;
}

.faq-header h1 {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 800;
  margin: 0 0 16px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.faq-header p {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0;
}

/* FAQ Categories */
.faq-categories {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.faq-category h2 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border-color);
}

.faq-category h2 i {
  color: var(--accent-primary);
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.faq-item:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 4px 20px var(--shadow-light);
}

.faq-item[open] {
  border-color: var(--accent-primary);
}

.faq-item summary {
  padding: 18px 24px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item summary::after {
  content: '+';
  font-size: 24px;
  color: var(--accent-primary);
  font-weight: 300;
  transition: transform 0.3s ease;
}

.faq-item[open] summary::after {
  transform: rotate(45deg);
}

.faq-item summary:hover {
  background: var(--hover-bg);
}

.faq-answer {
  padding: 0 24px 20px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
  margin-top: -1px;
  padding-top: 18px;
}

/* CTA */
.faq-cta {
  margin-top: 60px;
  text-align: center;
  padding: 48px;
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
}

.faq-cta h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}

.faq-cta p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 24px;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px var(--shadow-medium);
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px var(--shadow-medium);
}

/* Responsive */
@media (max-width: 768px) {
  .faq-main {
    padding: 30px 16px 40px;
  }

  .faq-item summary {
    padding: 14px 18px;
    font-size: 15px;
  }

  .faq-answer {
    padding: 0 18px 16px;
    font-size: 14px;
  }

  .faq-cta {
    padding: 32px 24px;
  }
}

@media (max-width: 480px) {
  .faq-header h1 {
    font-size: 28px;
  }
}
</style>
