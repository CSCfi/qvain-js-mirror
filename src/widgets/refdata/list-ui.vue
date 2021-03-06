<!--
This file is part of Qvain -project.

Author(s):
	Juhapekka Piiroinen <jp@1337.fi>
	Aaron Hakala <aaron.hakala@metropolia.fi>
	Jori Niemi <3295718+tahme@users.noreply.github.com>
	Eemeli Kouhia <eemeli.kouhia@gofore.com>
	Wouter Van Hemel <wouter.van.hemel@helsinki.fi>

License: GPLv3

See LICENSE file for more information.
Copyright (C) 2019 Ministry of Culture and Education, Finland.
All Rights Reserved.
-->
<template>
	<div row>
		<!-- ElasticSearch widget -->
		<b-form-group
			id="list-ui-form-group"
			class="list-ui-form-group"
			:class="isRequired ? 'required' : ''"
			:label-cols="uiLabel ? labelCols : 1"
			:description="uiDescription"
			:label="uiLabel"
		>
			<b-input-group>
				<div
					v-if="type === 'multiselect'"
					class="flex-grow-1"
				>
					<Multiselect
						v-if="items"
						v-model="model"
						:options="items"
						:custom-label="customLabel"
						:options-limit="40"
						:allow-empty="!isRequired"
						:show-labels="false"
						:disabled="readOnly"
						@input="setValue"
					/>
				</div>
				<b-input-group-append>
					<b-btn
						v-if="error"
						id="list-ui-error-btn"
						ref="refErrorButton"
						v-b-tooltip.hover="error"
						variant="danger"
					>
						<font-awesome-icon icon="exclamation-triangle" />
					</b-btn>
					<b-btn
						v-if="error"
						v-b-tooltip.hover="error"
						variant="dark"
						title="retry"
						@click="getList(esIndex, esDoctype)"
					>
						<font-awesome-icon icon="sync" />
						<font-awesome-icon
							v-if="busy"
							icon="sync"
							spin
						/>
					</b-btn>
				</b-input-group-append>
			</b-input-group>
		</b-form-group>
	</div>
</template>

<style>
.popover {
	color: red;
}
.error-popover {
	background-color: red;
}

fieldset.list-ui-form-group.required div.form-row legend:after {
	content: '*';
	color: red;
}
</style>

<script>
import esApiClient from './es.js'
import Multiselect from 'vue-multiselect'

function groupByParent(objectArray) {
	let grouped = objectArray.reduce(function(acc, obj) {
		if (!obj['_source']) return acc

		// get rid of the annoying _source level
		obj = obj['_source']

		// if a value doesn't have parent_ids, add it to empty key
		let targets = obj['parent_ids'] || ['']

		// group top categories with their children
		if (targets.length < 1) {
			targets = obj['has_children'] ? [obj.id] : ['']
		}

		for (let key of targets) {
			if (!acc[key]) {
				acc[key] = { group: null, children: [] }
			}
			if (obj.id === key) {
				// group item
				acc[key].group = obj
			} else {
				// child item
				acc[key].children.push(obj)
			}
		}
		return acc
	}, {})

	// pre-sort children
	Object.keys(grouped).forEach(group => grouped[group].children.sort(sortById))

	return grouped
}

const sortById = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

// eslint-disable-next-line no-unused-vars
function filterKeys(full, wanted) {
	return Object.keys(full)
		.filter(key => wanted.includes(key))
		.reduce((obj, key) => {
			obj[key] = full[key]
			return obj
		}, {})
}

export default {
	name: 'RefdataList',
	description: 'refdata list from Elastic Search',
	schematype: 'object',
	components: {
		Multiselect,
	},
	props: {
		esIndex: {
			default: 'reference_data',
			type: String,
		},
		esDoctype: {
			default: 'funder_type', // funder_type, license
			type: String,
		},
		optgroups: {
			default: false,
			type: Boolean,
		},
		uiDescription: {
			type: String,
		},
		uiPlaceholder: {
			type: String,
		},
		uiLabel: {
			type: String,
		},
		placeholder: {
			type: String,
		},
		help: { type: String },
		labelCols: {
			default: '3',
			type: String,
		},
		customLabel: { type: Function },
		isRequired: { type: Boolean },
		setValue: { required: true, type: Function },
		value: { required: true },
		type: { type: String },
		readOnly: { type: Boolean },
	},
	data: function() {
		return {
			items: null,
			model: null,
			error: null,
			busy: false,
			filterApiFields: true,
			lang: 'en',
			apiFields: [ 'code', 'id', 'label', 'type', 'uri' ],
		}
	},
	computed: {
		groups: function() {
			return this.items ? Object.keys(this.items).sort() : []
		},
		noGroupItems: function() {
			return this.items && this.items[''] && this.items[''].children
				? this.items[''].children
				: []
		},
	},
	created() {
		this.model = this.value
		this.getList(this.esIndex, this.esDoctype)
	},
	methods: {
		getList: function(index, doctype) {
			this.busy = true
			let vm = this
			esApiClient(index, doctype)
				.then(response => {
					if (response.data && response.data.hits && response.data.hits.hits) {
						if (this.optgroups) {
							vm.items = groupByParent(response.data.hits.hits)
						} else {
							/*
							let items = response.data.hits.hits
							vm.items = vm.filterApiFields
								? items.map(item => filterKeys(item['_source'], vm.apiFields))
								: items.map(item => item['_source'])
							*/

							let lang = this.$root.language || 'en'

							vm.items = response.data.hits.hits.map(item => {
								let es = item['_source']
								return {
									'identifier': es.uri,
									'code': es.code,
									'pref_label': es.label,
									'label': es.label[lang],
								}
							})
						}
						vm.error = null
					} else {
						vm.items = []
						vm.error = 'no data'
					}
				})
				.catch(error => {
					console.error(error)
					this.error = 'error calling ElasticSearch API'
					if (error.response && error.response.status) {
						this.error += ': ' + error.response.status + (error.response.statusText ? '(' + error.response.statusText + ')' : '')
					}
				})
				// "finally() is not a function" :(
				.then(() => {
					vm.busy = false
				})
		},
		indexOf: function(id) {
			if (!this.items) {
				return -1
			}
			for (let i = 0; i < this.items.length; i++) {
				if (this.items['id'] === id) {
					return i
				}
			}
			return -1
		},
	},
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style>
.input-group {
	flex-wrap: nowrap;
}
</style>
