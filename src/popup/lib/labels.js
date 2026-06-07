/**
 * Context-aware label for the edit row. `editable` controls whether we use
 * the live verb (resolving or resolved) or the disabled fallback.
 */
export function editLabel(ctx, editable) {
	if (!editable) return editDisabledLabel(ctx);
	if (ctx.pageType === 'term') {
		if (ctx.taxonomy === 'category') return 'Edit Category';
		if (ctx.taxonomy === 'post_tag') return 'Edit Tag';
		return 'Edit Term';
	}
	if (ctx.pageType === 'author') return 'Edit Author';
	// Template-backed views (block themes) edit a site-editor template, not a
	// post. Checked before `ctx.postType` so a post-type archive reads as a
	// template edit rather than "Edit Book".
	if (ctx.pageType === 'home') return 'Edit Blog Template';
	if (ctx.pageType === 'archive') return 'Edit Archive Template';
	if (ctx.postType) return `Edit ${postTypeLabel(ctx.postType)}`;
	return 'Edit Page';
}

/**
 * Label for the disabled edit row. `info.isBlockTheme` (when known) lets the
 * template-backed cases be honest about *why* editing is unavailable rather
 * than dangling a "Coming Soon" promise:
 *   - false → classic theme; its templates are PHP, not site-editor content.
 *   - true  → block theme, but no matching template was found.
 *   - null  → couldn't determine (not an admin, REST disabled).
 */
export function editDisabledLabel(ctx, info = {}) {
	if (ctx.pageType === 'archive' || ctx.pageType === 'home') {
		if (info.isBlockTheme === false) return 'Editing Not Available (Classic Theme)';
		if (info.isBlockTheme === true) return 'Template Not Found';
		return 'Editing Not Available';
	}
	if (ctx.pageType === 'term') return 'Edit Term (Not Resolvable)';
	if (ctx.pageType === 'author') return 'Edit Author (Not Resolvable)';
	if (ctx.pageType === 'search' || ctx.pageType === '404') return 'Nothing to Edit';
	return 'Edit Page';
}

/**
 * Turns a WP post type slug into a human-readable label. Built-in types get
 * friendly names; custom post type slugs are title-cased. For CPTs whose
 * registered label differs significantly from their slug (e.g. "kb_article"
 * → "Knowledge Base Article"), this won't be perfect — a REST lookup to
 * /wp/v2/types could resolve that in the future.
 */
export function postTypeLabel(postType) {
	switch (postType) {
		case 'post':
			return 'Post';
		case 'page':
			return 'Page';
		case 'attachment':
			return 'Media';
		case 'wp_block':
			return 'Block Pattern';
		case 'wp_template':
			return 'Template';
		case 'wp_template_part':
			return 'Template Part';
		case 'wp_navigation':
			return 'Navigation Menu';
		default:
			return postType.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}
}
