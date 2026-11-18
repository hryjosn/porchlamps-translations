// 社群翻譯的格式檢查（docs/superpowers/specs/2026-11-18-community-translation-design.md §4）。
// 這個檔會被 `npm run i18n:export` 原封不動複製進公開的翻譯 repo（scripts/validate.mjs），
// 所以只能引用 node 內建與 @formatjs/icu-messageformat-parser，不能引用主 repo 的任何檔案。
// 用法：node scripts/validate.mjs <messages 資料夾>（安全鍵清單在它旁邊的 safety-keys.json）。
//       node scripts/validate.mjs <messages 資料夾> --changed-files <檔>：Crowdin 的 PR 只能改各語言的訊息檔（檔內每行一個路徑）。
//       node scripts/validate.mjs <messages 資料夾> --stamp <語言>：翻完安全字後記下照哪一版原文翻的（safety.hashes.json）。
import {
	existsSync,
	readdirSync,
	readFileSync,
	realpathSync,
	writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse, TYPE } from '@formatjs/icu-messageformat-parser';
import { crowdinScopeErrors, hashString, isLocaleDirName } from './rules.mjs';

/** @typedef {Record<string, string>} Flat */
/** @typedef {{ file: 'ui.json' | 'safety.json'; key: string; message: string }} Issue */

const isUnder = (
	/** @type {string} */ path,
	/** @type {readonly string[]} */ prefixes,
) => prefixes.some((p) => path === p || path.startsWith(`${p}.`));

// 雜湊、語言資料夾名稱、Crowdin PR 範圍：放在無相依的 rules.mjs，crowdin-stamp.mjs 不用安裝套件也能用
export { crowdinScopeErrors, hashString, isLocaleDirName } from './rules.mjs';

/** 主 repo 的 lib/i18n/sync.ts 的 STALE_STAMP 要一致：匯入時這類錯誤只丟掉那一則、不擋整個語言 */
export const STALE_STAMP = '中文原文改過';

/**
 * 訊息裡所有變數名（含 select／plural 分支裡的）。
 * @param {import('@formatjs/icu-messageformat-parser').MessageFormatElement[]} ast
 * @param {Set<string>} out
 * @param {string[]} problems 缺 other 分支的 select／plural
 */
const collect = (ast, out, problems) => {
	for (const el of ast) {
		if (el.type === TYPE.tag) collect(el.children, out, problems);
		if (
			el.type === TYPE.argument ||
			el.type === TYPE.number ||
			el.type === TYPE.date ||
			el.type === TYPE.time ||
			el.type === TYPE.select ||
			el.type === TYPE.plural
		)
			out.add(el.value);
		if (el.type === TYPE.select || el.type === TYPE.plural) {
			if (!('other' in el.options)) problems.push(el.value);
			for (const opt of Object.values(el.options))
				collect(opt.value, out, problems);
		}
	}
};

const parseMessage = (/** @type {string} */ message) => {
	const vars = new Set();
	/** @type {string[]} */
	const noOther = [];
	collect(parse(message, { ignoreTag: true }), vars, noOther);
	return { vars, noOther };
};

/** @param {string} message */
export const variablesOf = (message) => parseMessage(message).vars;

const sameSet = (/** @type {Set<string>} */ a, /** @type {Set<string>} */ b) =>
	a.size === b.size && [...a].every((x) => b.has(x));

/**
 * @param {{ source: Flat; ui: Flat; safety: Flat; stamps: Flat; safetyKeys: readonly string[] }} args
 * @returns {{ errors: Issue[]; warnings: Issue[] }}
 */
export const validateLocale = ({ source, ui, safety, stamps, safetyKeys }) => {
	/** @type {Issue[]} */
	const errors = [];
	/** @type {Issue[]} */
	const warnings = [];
	/** @type {[Issue['file'], Flat][]} */
	const files = [
		['ui.json', ui],
		['safety.json', safety],
	];
	for (const [file, flat] of files) {
		for (const [key, message] of Object.entries(flat)) {
			const err = (/** @type {string} */ m) =>
				errors.push({ file, key, message: m });
			if (!Object.hasOwn(source, key)) {
				err('原文沒有這個鍵');
				continue;
			}
			const isSafety = isUnder(key, safetyKeys);
			if (file === 'ui.json' && isSafety) {
				err('安全相關的字要放在 safety.json');
				continue;
			}
			if (file === 'safety.json' && !isSafety) {
				err('這個鍵不是安全相關的字，要放在 ui.json');
				continue;
			}
			const original = source[key];
			if (message.trim() === '') {
				warnings.push({ file, key, message: '空字串：會顯示中文原文' });
				continue;
			}
			if (isSafety) {
				if (!Object.hasOwn(stamps, key))
					err('缺少翻譯時的原文記錄：翻完安全字後跑 npm run stamp -- <語言>');
				else if (stamps[key] !== hashString(original))
					err(
						`${STALE_STAMP}：請對照新的原文確認譯文，再跑 npm run stamp -- <語言>`,
					);
			}
			if (/[!！]/.test(message))
				warnings.push({ file, key, message: '有驚嘆號：留燈的語氣不用驚嘆號' });
			if (message.includes('#')) err('不能用 #：數字一律寫 {n}');
			if (/,\s*number\b/.test(message))
				err('不能用 {n, number}：數字一律寫 {n}');
			let parsed;
			try {
				parsed = parseMessage(message);
			} catch (e) {
				err(`ICU 格式錯誤：${e instanceof Error ? e.message : e}`);
				continue;
			}
			for (const name of parsed.noOther) err(`{${name}, …} 要有 other 分支`);
			const expected = parseMessage(original).vars;
			if (!sameSet(parsed.vars, expected))
				err(
					`變數要和原文一樣：原文 {${[...expected].join('}、{')}}，譯文 {${[...parsed.vars].join('}、{')}}`,
				);
		}
	}
	return { errors, warnings };
};

/** 攤平成一層；非字串的葉子回報成錯誤 */
const flattenFile = (/** @type {unknown} */ tree) => {
	/** @type {Flat} */
	const flat = {};
	/** @type {string[]} */
	const nonStrings = [];
	const walk = (/** @type {unknown} */ node, /** @type {string} */ path) => {
		if (typeof node === 'string') flat[path] = node;
		else if (node && typeof node === 'object' && !Array.isArray(node))
			for (const [k, v] of Object.entries(node))
				walk(v, path ? `${path}.${k}` : k);
		else nonStrings.push(path);
	};
	walk(tree, '');
	return { flat, nonStrings };
};

const readJson = (/** @type {string} */ file) => {
	if (!existsSync(file)) return {};
	try {
		return JSON.parse(readFileSync(file, 'utf8'));
	} catch (e) {
		throw new Error(
			`${file} 不是合法的 JSON：${e instanceof Error ? e.message : e}`,
		);
	}
};

const main = (
	/** @type {string} */ dir,
	/** @type {string | undefined} */ stampLocale,
) => {
	const messages = resolve(dir);
	const safetyKeys = readJson(join(dirname(messages), 'safety-keys.json'));
	if (!Array.isArray(safetyKeys)) throw new Error('找不到 safety-keys.json');
	const source = {
		...flattenFile(readJson(join(messages, 'zh-TW/ui.json'))).flat,
		...flattenFile(readJson(join(messages, 'zh-TW/safety.json'))).flat,
	};
	if (stampLocale) {
		const safety = flattenFile(
			readJson(join(messages, stampLocale, 'safety.json')),
		).flat;
		const stamps = Object.fromEntries(
			Object.keys(safety)
				.filter((k) => Object.hasOwn(source, k))
				.map((k) => [k, hashString(source[k])]),
		);
		writeFileSync(
			join(messages, stampLocale, 'safety.hashes.json'),
			`${JSON.stringify(stamps, null, '\t')}\n`,
		);
		console.log(
			`✓ ${stampLocale}：記下 ${Object.keys(stamps).length} 則安全字照目前的原文翻`,
		);
		return;
	}
	let failed = false;
	for (const locale of readdirSync(messages)) {
		if (locale === 'zh-TW' || locale.startsWith('.')) continue;
		if (!isLocaleDirName(locale)) {
			console.error(
				`✗ messages/${locale}：資料夾名稱要是語言代碼（例如 en、zh-HK），也不能是 zh-TW 的大小寫變體`,
			);
			failed = true;
			continue;
		}
		const ui = flattenFile(readJson(join(messages, locale, 'ui.json')));
		const safety = flattenFile(readJson(join(messages, locale, 'safety.json')));
		const { errors, warnings } = validateLocale({
			source,
			ui: ui.flat,
			safety: safety.flat,
			stamps: flattenFile(
				readJson(join(messages, locale, 'safety.hashes.json')),
			).flat,
			safetyKeys,
		});
		for (const key of ui.nonStrings)
			errors.push({ file: 'ui.json', key, message: '要是字串' });
		for (const key of safety.nonStrings)
			errors.push({ file: 'safety.json', key, message: '要是字串' });
		for (const i of warnings)
			console.warn(`⚠ ${locale}/${i.file} ${i.key}：${i.message}`);
		for (const i of errors)
			console.error(`✗ ${locale}/${i.file} ${i.key}：${i.message}`);
		if (errors.length) failed = true;
		else console.log(`✓ ${locale}`);
	}
	process.exit(failed ? 1 : 0);
};

// 直接執行時才跑；比對真實路徑（macOS 的 /var 是 /private/var 的捷徑，不展開就永遠不相等、什麼都不做）
if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
	const dir = process.argv[2];
	if (!dir) {
		console.error('用法：node scripts/validate.mjs <messages 資料夾>');
		process.exit(2);
	}
	const changed = process.argv.indexOf('--changed-files');
	if (changed !== -1) {
		const paths = readFileSync(process.argv[changed + 1], 'utf8')
			.split('\n')
			.map((l) => l.trim())
			.filter(Boolean);
		const bad = crowdinScopeErrors(paths);
		for (const p of bad)
			console.error(`✗ ${p}：Crowdin 的 PR 只能改 messages/<語言>/ 的訊息檔`);
		if (bad.length) process.exit(1);
		console.log(`✓ Crowdin PR 只改了訊息檔（${paths.length} 個）`);
	}
	const at = process.argv.indexOf('--stamp');
	main(dir, at === -1 ? undefined : process.argv[at + 1]);
}
