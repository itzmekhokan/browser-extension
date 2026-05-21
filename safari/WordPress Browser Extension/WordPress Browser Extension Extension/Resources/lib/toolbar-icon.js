/**
 * Toolbar icon path helpers for the background service worker.
 *
 * Kept framework-free so smoke tests can exercise the naming rules without
 * loading the extension. Three detection states × optional dark-theme plate.
 */
(function (global) {
  /**
   * @param {boolean} isWordPress
   * @param {{ isLoggedIn?: boolean }|null|undefined} context
   * @returns {''|'-active'|'-inactive'}
   */
  function resolveToolbarIconVariant(isWordPress, context) {
    if (!isWordPress) {
      return '-inactive';
    }
    if (context?.isLoggedIn) {
      return '-active';
    }
    return '';
  }

  /**
   * @param {boolean} prefersDark
   * @returns {''|'-dark'}
   */
  function resolveToolbarIconThemeSuffix(prefersDark) {
    return prefersDark ? '-dark' : '';
  }

  /**
   * @param {object} options
   * @param {boolean} options.isWordPress
   * @param {{ isLoggedIn?: boolean }|null|undefined} [options.context]
   * @param {boolean} [options.prefersDark]
   * @param {number[]} [options.sizes]
   * @returns {Record<number, string>}
   */
  function buildToolbarIconPaths({
    isWordPress,
    context,
    prefersDark = false,
    sizes = [16, 32],
  }) {
    const variant = resolveToolbarIconVariant(isWordPress, context);
    const theme = resolveToolbarIconThemeSuffix(prefersDark);
    const paths = {};
    for (const size of sizes) {
      paths[size] = `icons/icon-${size}${variant}${theme}.png`;
    }
    return paths;
  }

  global.WPToolbarIcon = {
    resolveToolbarIconVariant,
    resolveToolbarIconThemeSuffix,
    buildToolbarIconPaths,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
