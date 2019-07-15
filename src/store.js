/* ADD_LICENSE_HEADER */
import Vue from 'vue'
import Vuex from 'vuex'
import cloneWithPrune from './lib/cloneWithPrune.js'
import getDotted from 'lodash.get'
import hasDotted from 'lodash.has'
import vuePointer from '../vendor/json-pointer/index.js'

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		record: undefined,
		dataset: {},
		schema: {},
		hints: {},
		metadata: {},
		languages: { 'fi':true, 'en':true, 'sv':true },
		defaultDescriptionLang: 'fi',
		UI_VALID_KEYWORDS: [
			'widget',
			'option',
			'label',
			'help',
			'placeholder',
			'tab',
		],
		tabui: {},
		validation: {},
		vState: {},
		datasetsView: {
			currentPage: 1,
			perPage: 20,
			datasetList: null,
			showState: 'all',
			filterString: '',
			filteredCount: null,
			sortBy: null,
			sortDesc: false,
		},
		stats: {
			total: 0,
			pass: 0,
			fail: 0,
			q: 0,
		},
	},
	mutations: {
		setMetadata(state, payload) {
			state.metadata = Object.assign({}, state.metadata, payload)
		},
		resetMetadata(state) {
			state.metadata = {}
		},
		loadData(state, record) {
			Vue.set(state, 'record', record)
		},
		mergeData(state, payload) {
			for (let key in payload) {
				Vue.set(state.record, key, payload[key])
			}
		},
		loadSchema(state, schema) {
			Vue.set(state, 'schema', schema)
		},
		changeSchema(state) {
			Vue.delete(state.schema.properties, 'creator')
		},
		loadHints(state, hints) {
			Vue.set(state, 'hints', hints)
		},
		setHints(state, payload) {
			Object.keys(payload.hints).forEach((key) => (payload.hints[key] == null || payload.hints[key] == undefined) && delete payload.hints[key])
			Vue.set(state.hints, payload.path, payload.hints)
		},
		setHint(state, payload) {
			Vue.set(state.hints, payload.path, payload.hint)
		},
		delHints(state, payload) {
			Vue.delete(state.hints[payload.path])
		},
		addTab(state, payload) {
			Vue.set(state.tabui, payload.tab, payload.schema)
		},
		initValue(state, payload, defaultValue) {
			// set default value for license if ida schema
			const isNewDataset = typeof state.metadata.id === 'undefined'
			const isIDA = state.metadata.schemaId === 'metax-ida'
			//const shouldAddDefault = 'access_type' in payload.p
			//const isLicenseField = payload.prop === 'license'
			// move this to tabselector

			if (isNewDataset && isIDA && defaultValue) {
				Vue.set(payload.p, payload.prop, defaultValue)
			} else {
				Vue.set(payload.p, payload.prop, payload.val)
			}
		},
		updateValue(state, payload) {
			Vue.set(payload.p, payload.prop, payload.val)
			Vue.nextTick(() => {
				if (payload.val === '') { // Note: for objects we may not want to remove the key?
					Vue.delete(payload.p, payload.prop)
				}
			})
		},
		updateArrayValue(state, payload) {
			const index = payload.p[payload.prop].findIndex(x => x[payload.search.field] === payload.search.value)
			Vue.set(payload.p[payload.prop], index, payload.val)
		},
		replace(state, payload) {
			// clear payload.p, assign values from payload.val
			for (let key in payload.p) {
				Vue.delete(payload.p, key)
			}
			for (let key in payload.val) {
				Vue.set(payload.p, key, payload.val[key])
			}
		},
		pushValue(state, payload) {
			payload.p[payload.prop].push(payload.val)
		},
		pushMultiple(state, payload) {
			payload.p[payload.prop].push(...payload.val)
		},
		popValue(state, payload) {
			payload.p[payload.prop].pop()
		},
		removeValue(state, payload) {
			const index = payload.p[payload.prop].findIndex(single => single.identifier === payload.val)
			payload.p[payload.prop].splice(index, 1)
		},
		deleteArrayValue(state, { parent, property, index }) {
			Vue.delete(parent[property], index)
		},
		deleteValue(state, payload) {
			Vue.delete(payload.p, payload.prop)
		},
		addProp(state, payload) {
			Vue.set(payload.val, payload.prop, undefined)
		},
		setPath(state, payload) {
			vuePointer.set(state.dataset, payload.path, payload.value)
		},
		setState(state, payload) {
			Vue.set(state.vState, payload.path, {
				v: payload.v,
				e: payload.e,
			})
		},
		resetState(state) {
			Vue.set(state, 'vState', {})
		},
		updateStats(state, payload) {
			state.stats = payload
		},
		initStateFor(state, path) {
			if (!state.vState[path]) {
				Vue.set(state.vState, path, {e: [], v: null})
			}
		},
		cleanStateFor(state, path) {
			Vue.delete(state.vState, path)
		},
		setLanguages(state, payload) {
			state.languages = Object.assign({}, state.languages, payload)
		},
		updateDatasetsView(state, payload) {
			for (const key in payload) {
				Vue.set(state.datasetsView, key, payload[key])
			}
		},
	},
	getters: {
		// prunedDataset returns a deep-clone of the dataset discarding empty leaves
		prunedDataset: (state) => {
			return cloneWithPrune(state.record, ["#key"], [ "", undefined ])
		},
		// getState returns the validation state for a given path
		getState: (state) => (path) => {
			return state.vState[path]
		},
		// uiForPath returns the UI overrides for the given path (if any)
		uiForPath: (state) => (path) => {
			const searchPathOneOfSensitive = path
				.split('/')
				.filter(key => key !== '')
				.map((key, index, array) => {
					if (isNaN(key)) {
						return key
					} else if (array[index - 1] === 'oneOf') {
						return key
					} else {
						return '*'
					}
				}).join('/')

			const searchPathNoNumber = path
				.split('/')
				.filter(key => key !== '')
				.map((key, index, array) => {
					if (isNaN(key)) {
						return key
					} else {
						return '*'
					}
				}).join('/')

			return state.hints['/' + searchPathOneOfSensitive] || state.hints['/' + searchPathNoNumber] || {}
		},
		// uiValidKeywordsList returns a static array of valid keywords
		uiValidKeywordsList: (state) => {
			//Object.keys(state.UI_VALID_KEYWORDS)
			return state.UI_VALID_KEYWORDS
		},
		// uiValidKeywordsSet returns a static set of valid keywords
		uiValidKeywordsSet: (state) => {
			return new Set(state.UI_VALID_KEYWORDS)
		},
		// hasPath checks if the given json-pointer path exists
		hasPath: (state) => (path) => {
			return vuePointer.has(state.record, path)
		},
		// getPath gets the value for the given json-pointer path
		getPath: (state) => (path) => {
			return vuePointer.get(state.record, path)
		},
		// hasDataPath checks if the given dotted path exists (see: lodash.has)
		hasDataPath: (state) => (path) => {
			// _.has(object, path)
			return hasDotted(state.record, path)
		},
		// getDataPath gets the value for the given dotted path (see: lodash.get)
		getDataPath: (state) => (path) => {
			// _.get(object, path, [defaultValue])
			return getDotted(state.record, path)
		},
		// getTitle returns the English title or the first one defined
		getTitle: (state) => {
			return state.record && state.record.title && (state.record.title['en'] || state.record.title[Object.keys(state.record.title)[0]] || null)
		},
		// getTitleWithLanguage returns the title for the given language or the first defined
		getTitleWithLanguage: (state) => (lang) => {
			return state.record && state.record.title && (state.record.title[lang] || state.record.title[Object.keys(state.record.title)[0]] || null)
		},
	},
})
