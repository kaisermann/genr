import { describe, expect, test } from 'vitest';
import { filterOutIrrelevantTags } from '../src/lib/tagFilter';
import type { LastFmTag } from '../src/lib/lastFm';

const tag = (name: string): LastFmTag => ({
	name,
	url: `https://www.last.fm/tag/${name}`
});

describe('filterOutIrrelevantTags', () => {
	test('removes artist-name tags and keeps real genres', () => {
		const tags = [tag('Red Hot Chili Peppers'), tag('rhcp'), tag('rock'), tag('funk rock')];

		expect(filterOutIrrelevantTags(tags, { artist: 'Red Hot Chili Peppers' })).toEqual([
			tag('rock'),
			tag('funk rock')
		]);
	});

	test('removes article-stripped artist aliases', () => {
		const tags = [tag('The Cure'), tag('cure'), tag('post-punk')];

		expect(filterOutIrrelevantTags(tags, { artist: 'The Cure' })).toEqual([tag('post-punk')]);
	});

	test('removes social, vocal, decade, location, and numeric tags', () => {
		const tags = [
			tag('seen live'),
			tag('favorites'),
			tag('female vocalists'),
			tag('80s'),
			tag("90's"),
			tag('123'),
			tag('UK'),
			tag('synthpop')
		];

		expect(filterOutIrrelevantTags(tags, { artist: 'New Order' })).toEqual([tag('synthpop')]);
	});

	test('keeps valid genres that only partially resemble the artist name', () => {
		const tags = [tag('dance'), tag('punk'), tag('french house'), tag('electronic')];

		expect(filterOutIrrelevantTags(tags, { artist: 'Daft Punk' })).toEqual(tags);
	});

	test('removes standalone geography and nationality tags found in Last.fm results', () => {
		const tags = [
			tag('british'),
			tag('American'),
			tag('german'),
			tag('Japanese'),
			tag('new york'),
			tag('los angeles'),
			tag('california'),
			tag('rock')
		];

		expect(filterOutIrrelevantTags(tags, { artist: 'Radiohead' })).toEqual([tag('rock')]);
	});

	test('keeps compound genres that contain location words', () => {
		const tags = [
			tag('french house'),
			tag('latin pop'),
			tag('west coast hip hop'),
			tag('british invasion'),
			tag('brazilian jazz')
		];

		expect(filterOutIrrelevantTags(tags, { artist: 'Daft Punk' })).toEqual(tags);
	});
});
