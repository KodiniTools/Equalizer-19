<template>
  <div class="pro-features">
    <div class="pro-header">
      <h3>
        <i class="fas fa-crown"></i>
        {{ t.pro_title }}
      </h3>
    </div>

    <div class="pro-content">
      <p class="pro-description">
        {{ t.pro_description }}
      </p>

      <div class="pro-badge">
        <i class="fas fa-star"></i>
        <span>{{ t.pro_badge }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { inject } from 'vue'

  const { t } = inject('i18n')
</script>

<style scoped>
  .pro-features {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border-radius: 20px;
    padding: 25px;
    margin-bottom: 25px;
    color: white;
    box-shadow: 0 10px 40px rgba(240, 147, 251, 0.3);
  }

  .pro-header h3 {
    margin: 0 0 15px 0;
    font-size: 1.4em;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pro-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .pro-description {
    margin: 0;
    font-size: 1em;
    opacity: 0.9;
  }

  .pro-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.2);
    padding: 10px 20px;
    border-radius: 25px;
    font-weight: 600;
    backdrop-filter: blur(10px);
    align-self: flex-start;
  }

  .pro-badge i {
    font-size: 1.2em;
    color: #ffd700;
  }

  @media (max-width: 600px) {
    .pro-features {
      padding: 18px;
      border-radius: 16px;
      margin-bottom: 16px;
    }

    .pro-header h3 {
      font-size: 1.2em;
      margin-bottom: 10px;
    }

    .pro-description {
      font-size: 0.9em;
    }

    .pro-badge {
      padding: 8px 16px;
      font-size: 0.9em;
    }

    .pro-content {
      gap: 12px;
    }
  }

  @media (max-width: 400px) {
    .pro-features {
      padding: 14px;
      border-radius: 12px;
    }

    .pro-header h3 {
      font-size: 1.1em;
      gap: 8px;
    }

    .pro-description {
      font-size: 0.85em;
    }

    .pro-badge {
      padding: 7px 14px;
      font-size: 0.85em;
      border-radius: 20px;
    }
  }
</style>
