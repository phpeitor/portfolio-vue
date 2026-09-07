<script setup lang="ts">
import ButtonRound from "./ButtonRound.vue";
import { locale } from "../i18n/store";
import { changeLocale } from "../i18n/utils/locale";
import { t } from "../i18n/utils/translate";
import esFlag from "../assets/images/lang/es.svg";
import usFlag from "../assets/images/lang/us.svg";

const handleLangSwitch = () => {
  changeLocale(locale.value === "es" ? "en" : "es");
};
</script>

<template>
  <ButtonRound
    variant="theme"
    size="sm"
    class="lang-switch children-unclickable"
    @click="handleLangSwitch"
    :aria-label="t('switch-language')"
    data-cursor="circle-white"
    data-sound="click"
    data-hoversound="hover"
  >
    <img
      :src="locale === 'es' ? usFlag : esFlag"
      :alt="locale === 'es' ? 'English' : 'Español'"
      class="lang-switch-flag"
    />
  </ButtonRound>
</template>

<style scoped lang="scss">
.lang-switch {
  // The flag image fills the whole circle, so ButtonRound's own size-variant
  // padding needs to go regardless of style-injection order — :deep() beats it
  // reliably instead of hoping a same-specificity class wins on source order.
  &:deep(.button-round) {
    padding: 0;
    overflow: hidden;
  }

  &-flag {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
}
</style>
