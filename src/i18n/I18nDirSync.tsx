/**
 * Syncs document dir attribute with current locale for RTL support.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtl } from './index';

export function I18nDirSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = isRtl(i18n.language) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return null;
}
