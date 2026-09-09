import { getCollection } from 'astro:content';

export type Post = Awaited<ReturnType<typeof getCollection<'blog'>>>[number];

export async function getSortedPosts(): Promise<Post[]> {
	const posts = await getCollection('blog');
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getCategoryCounts(): Promise<[string, number][]> {
	const posts = await getSortedPosts();
	const map = new Map<string, number>();
	for (const post of posts) {
		const cat = (post.data.category ?? '').trim();
		if (!cat) continue;
		map.set(cat, (map.get(cat) ?? 0) + 1);
	}
	return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export async function getTagCounts(): Promise<[string, number][]> {
	const posts = await getSortedPosts();
	const map = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.data.tags ?? []) {
			const t = tag.trim();
			if (!t) continue;
			map.set(t, (map.get(t) ?? 0) + 1);
		}
	}
	return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** 生成与 rehype-slug / GitHub 一致的 slug(保留中日韩字符) */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[\u2000-\u206f\u2e00-\u2e7f\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+$/g, '') || 'section';
}

export async function getHubCounts(): Promise<[string, number][]> {
	const posts = await getSortedPosts();
	const map = new Map<string, number>();
	for (const post of posts) {
		for (const hub of post.data.hubs ?? []) {
			const h = hub.trim();
			if (!h) continue;
			map.set(h, (map.get(h) ?? 0) + 1);
		}
	}
	return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function hubSlug(hub: string): string {
	return slugify(hub);
}

export async function getPostsOfHub(hub: string): Promise<Post[]> {
	const posts = await getSortedPosts();
	const target = hubSlug(hub);
	return posts.filter((post) =>
		(post.data.hubs ?? []).some((h) => hubSlug(h.trim()) === target),
	);
}

/** 粗略统计正文总字符数(去掉 frontmatter 与空白字符) */
export const totalChars: number = (() => {
	const raw = import.meta.glob('../content/blog/**/*.{md,mdx}', {
		query: '?raw',
		import: 'default',
		eager: true,
	}) as Record<string, string>;
	let count = 0;
	for (const text of Object.values(raw)) {
		const body = text.replace(/^---[\s\S]*?---/, '');
		count += body.replace(/\s/g, '').length;
	}
	return count;
})();