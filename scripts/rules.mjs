// 社群翻譯共用的小規則，沒有任何相依（只用語言內建）：
// validate.mjs 與 crowdin-stamp.mjs 都引用它；stamp.yml 帶著寫入 token 跑，不能 npm ci，所以 crowdin-stamp.mjs 只能靠這個檔。
// 會被 `npm run i18n:export` 複製進公開翻譯 repo 的 scripts/。

/**
 * FNV-1a 32-bit，跟主 repo 的 lib/i18n/flat.ts 的 hashString 一樣（測試守著）。只用來偵測原文有沒有改。
 * @param {string} s
 */
export const hashString = (s) => {
	let h = 0x811c9dc5;
	for (const ch of new TextEncoder().encode(s)) {
		h ^= ch;
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return h.toString(16).padStart(8, '0');
};

/**
 * 語言資料夾名稱：BCP-47 的樣子（en、zh-HK、yue-Hant-HK），而且不是任何大小寫的 zh-TW
 * （macOS 不分大小寫，zh-tw 匯入時會蓋掉主 repo 的 messages/zh-TW）。
 * @param {string} name
 */
export const isLocaleDirName = (name) =>
	/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(name) &&
	name.toLowerCase() !== 'zh-tw';

const CROWDIN_FILES = new Set(['ui.json', 'safety.json', 'safety.hashes.json']);

/**
 * Crowdin 送來的 PR（l10n_crowdin）改到不該改的路徑：只能是 messages/<語言>/ 底下的訊息檔，
 * zh-TW 原文、CI 設定、範本一律不行（docs/superpowers/specs/2026-11-18-crowdin-translation-design.md §3）。
 * @param {string[]} paths
 * @returns {string[]}
 */
export const crowdinScopeErrors = (paths) =>
	paths.filter((p) => {
		const parts = p.split('/');
		return !(
			parts.length === 3 &&
			parts[0] === 'messages' &&
			isLocaleDirName(parts[1]) &&
			CROWDIN_FILES.has(parts[2])
		);
	});
