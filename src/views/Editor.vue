<!--
This file is part of Qvain -project.

Author(s):
	Juhapekka Piiroinen <jp@1337.fi>
	Wouter Van Hemel <wouter.van.hemel@helsinki.fi>
	Jori Niemi <3295718+tahme@users.noreply.github.com>
	Shreyas Deshpande <31839853+ShreyasDeshpande@users.noreply.github.com>
	Eemeli Kouhia <eemeli.kouhia@gofore.com>
	Kauhia <Kauhia@users.noreply.github.com>

License: GPLv3

See LICENSE file for more information.
Copyright (C) 2019 Ministry of Culture and Education, Finland.
All Rights Reserved.
-->
<template>
	<b-container id="editor-view">
		<b-navbar
			sticky
			toggleable="sm"
			variant="light"
		>
			<b-container>
				<b-row no-gutters>
					<h4
						v-if="!!selectedCatalog"
						class="component-title"
					>
						<span v-if="title">
							{{ title }}
						</span>
						<span v-else>
							(no title)
						</span>
						<b-badge
							v-if="$store.state.metadata.isOldVersion"
							variant="warning"
						>
							Old version
						</b-badge>
						<b-badge
							v-if="$store.state.metadata.isDeprecated"
							variant="danger"
						>
							Deprecated
						</b-badge>
						<b-badge
							v-if="$store.state.metadata.isReadOnly"
							variant="info"
						>
							Read only
						</b-badge>
						<span class="secondary-text text-muted">
							<span>{{ selectedCatalog.title }}</span>
						</span>
						<span
							v-if="qvainData"
							class="secondary-text text-muted"
						>
							<span v-if="qvainData && qvainData.published && !isPublishedAndUpdateAvailable">
								<font-awesome-icon
									icon="circle"
									class="fa-sm text-primary"
								/>
								&nbsp;
								<span>Published</span>
							</span>
							<span v-else-if="isPublishedAndUpdateAvailable">
								<font-awesome-layers class="fa-sm">
									<font-awesome-icon
										icon="circle"
										class="text-warning"
									/>
								</font-awesome-layers>
								&nbsp;
								<span>Unpublished Changes</span>
							</span>
							<span v-else>
								<font-awesome-icon
									icon="circle"
									class="fa-sm text-success"
								/>
								&nbsp;
								<span>Draft</span>
							</span>
						</span>
						<span
							v-else
							class="secondary-text text-muted"
						>
							<span v-if="loading">
								<font-awesome-icon
									icon="spinner"
									spin
								/>
							</span>
							<span v-else>
								<font-awesome-icon
									icon="circle"
									class="fa-sm text-danger"
								/>
								&nbsp;<span>Unsaved draft</span>
							</span>
						</span>
					</h4>
				</b-row>
				<b-navbar-toggle
					target="nav-collapse"
					class="navbar-toggler ml-auto"
				/>
			</b-container>

			<b-collapse
				id="nav-collapse"
				is-nav
			>
				<b-container v-if="!errorMessage">
					<b-row>
						<b-col md="3">
							<b-button
								v-if="qvainData"
								id="editor_refresh_dataset"
								variant="secondary"
								block
								:disabled="this.$store.state.metadata.isReadOnly"
								@click="reloadDataset"
							>
								<font-awesome-icon
									:icon="reloading ? 'spinner' : 'undo'"
									:spin="reloading"
								/>
								&nbsp;
								<span v-if="!reloading">
									Undo All Changes
								</span>
							</b-button>
						</b-col>
						<b-col>
							<b-button
								v-if="selectedCatalog"
								id="editor_button_save_top"
								ref="dataset-save-button"
								:variant="isSaveDisabled ? 'outline-secondary' : 'success'"
								:disabled="isSaveDisabled"
								block
								@click="save"
							>
								<font-awesome-icon
									:icon="saving ? 'spinner' : 'save'"
									:spin="saving"
								/>
								&nbsp;
								Save
							</b-button>
						</b-col>
						<b-col>
							<b-button
								v-if="selectedCatalog"
								id="editor_button_publish_top"
								ref="dataset-publish-button"
								v-b-modal.publishModal
								:variant="isPublishDisabled ? 'outline-secondary' : 'primary'"
								block
								:disabled="isPublishDisabled"
							>
								<font-awesome-icon
									:icon="publishing ? 'spinner' : 'upload'"
									:spin="publishing"
								/>
								&nbsp;
								Publish
							</b-button>
						</b-col>
						<b-col v-if="isPublished">
							<b-button
								id="editor_button_etsin_top"
								ref="dataset-etsin-button"
								variant="info"
								block
								@click="viewInEtsin()"
							>
								<font-awesome-icon icon="external-link-alt" />
								&nbsp;
								Etsin
							</b-button>
						</b-col>
					</b-row>
				</b-container>
			</b-collapse>
		</b-navbar>

		<b-alert
			variant="danger"
			:show="!!error"
			dismissible
			@dismissed="error=null"
		>
			<i class="fas fa-ban" /> API error: {{ error }}
		</b-alert>
		<b-alert variant="warning">
			<font-awesome-icon icon="info" /> Publishing: I understand that publishing this dataset:
		</b-alert>

		<!-- Modals -->
		<b-modal
			id="publishModal"
			ref="publishModal"
			title="Publish dataset?"
			ok-title="Publish"
			cancel-variant="primary"
			ok-variant="success"
			@ok="publish"
		>
			<div class="d-block text-left">
				<p>I understand that publishing this dataset:</p>
				<ul>
					<li>will make it available publicly</li>
					<li>marks it as ready and enables editing restrictions</li>
				</ul>
			</div>
		</b-modal>
		<publish-modal
			id="publishErrorModal"
			ref="publishErrorModal"
			:error="publishError"
			@hidden="publishError = null"
		/>
		<b-alert
			variant="danger"
			:show="!!errorMessage"
		>
			{{ errorMessage }}
		</b-alert>

		<b-container v-if="!errorMessage">
			<b-row no-gutters>
				<b-col
					v-if="!!selectedCatalog"
					md="3"
				>
					<b-nav
						class="sticky-top editor-index-navigation"
						vertical
					>
						<b-nav-item
							v-for="(tab, index) in tabs"
							:key="tab.uri"
							:to="`/dataset/${id}/${tab.uri}`"
						>
							<b-row>
								<b-badge
									:variant="$route.params.tab === tab.uri ? 'info' : 'secondary'"
								>
									{{ index+1 }}
								</b-badge>
								<b-col>
									{{ tab.label }}
								</b-col>
							</b-row>
						</b-nav-item>
					</b-nav>
				</b-col>

				<b-col v-if="selectedCatalog">
					<b-form
						:key="refreshCounter"
						novalidate
						@submit.prevent
					>
						<tab-selector
							:schema="$store.state.schema"
							path=""
							:parent="$store.state"
							property="record"
							:value="$store.state.record"
							:active-tab="$route.params.tab"
							:depth="0"
							:read-only="$store.state.metadata.isReadOnly"
							@set-cumulative="setCumulative"
							@refresh-directory="refreshDirectory"
						/>
						<input
							v-show="false"
							ref="submit"
							type="submit"
						>
					</b-form>
				</b-col>

				<b-col v-else-if="loading">
					<b-container class="page-is-loading">
						<b-row>
							<b-col>
								<font-awesome-icon
									icon="spinner"
									spin
								/>
							</b-col>
						</b-row>
					</b-container>
				</b-col>

				<b-col
					v-else-if="!loading"
					class="schema-help-text"
				>
					<b-container>
						<b-row>
							<b-col>
								<h2 class="component-title">
									Where are your files related to this dataset?
								</h2>
							</b-col>
						</b-row>
						<b-row class="mb-3">
							<b-col>
								<b-badge variant="warning">
									<b>NOTE!</b>
									You can <u>not</u> change the selected option after this step.
								</b-badge>
							</b-col>
						</b-row>
						<b-row class="mb-3">
							<b-col>
								<b-card-group
									v-for="(bundle, index) in bundles"
									:key="index"
									v-model="selectedCatalog"
									deck
									:title="bundle"
								>
									<b-card
										v-for="(val, id) in getCatalogOptions(bundle)"
										:id="id"
										:key="id"
										:title="val.title"
									>
										<b-card-text>
											{{ val.description }}
										</b-card-text>
										<b-button
											slot="footer"
											variant="primary"
											@click="selectCatalog(val)"
										>
											{{ val.name }}
										</b-button>
									</b-card>
								</b-card-group>
							</b-col>
						</b-row>
						<b-row>
							<b-col>
								<b-card-group>
									<b-card>
										<b-card-text>
											<b-badge variant="info">
												<b>Hint</b>
											</b-badge>
											You can also make descriptions without any files. In that case, please select either one. The selection cannot be re-done, so if you are not sure whether you'll add files later, select the one you think you'll need in the future.
										</b-card-text>
									</b-card>
								</b-card-group>
							</b-col>
						</b-row>
					</b-container>
				</b-col>
			</b-row>
		</b-container>
	</b-container>
</template>

<script>
import Bundle from '@/schemas/bundle.js'
import apiClient from '@/api/client.js'
import PublishModal from '@/components/PublishModal.vue'
import Validator from '../../vendor/validator/src/validate.js'
import cloneWithPrune from '@/lib/cloneWithPrune.js'
import Vue from 'vue'
import TabSelector from '@/widgets/TabSelector.vue'
import getApiError from '@/lib/getApiError.js'

export default {
	name: "Editor",
	components: {
		'publish-modal': PublishModal,
		'tab-selector': TabSelector,
	},
	props: {
		id: {
			type: String,
			default: 'new',
		},
		isClone: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			selectedCatalog: null,
			doLive: true,
			unsubscribeFunc: null,
			validator: null,
			error: null,
			publishError: null,
			loading: false,
			rateLimited: false,
			showPublishConfirmation: false,
			inDev: true,
			reloading: false,
			saving: false,
			publishing: false,
			isDataChanged: false,
			qvainData: null,
			refreshCounter: 0, // dataset form is recreated when this changes
			errorMessage: null,
		}
	},
	computed: {
		isPublishDisabled() {
			return this.loading || this.rateLimited || this.$store.state.metadata.id == null
				|| (this.qvainData && this.qvainData.published && this.qvainData.synced >= this.qvainData.modified)
				|| this.isDataChanged || this.saving || this.publishing  || this.$store.state.metadata.isReadOnly
		},
		isPublished() {
			return this.qvainData && this.qvainData.published
		},
		isPublishedAndUpdateAvailable() {
			return this.isPublished && (this.qvainData.modified > this.qvainData.synced)
		},
		isSaveDisabled() {
			return this.loading || this.rateLimited || this.isDataChanged == false || this.saving || this.publishing
				|| this.$store.state.metadata.isReadOnly
		},
		tabs() {
			return (this.$store.state.hints.tabs || []).filter(tab => tab.uri)
		},
		bundles() {
			return Object.keys(Bundle)
		},
		title() {
			return this.$store.getters.getTitle
		},
	},
	watch: {
		'$route.params.tab': async function(newTab, oldTab) {
			if (!newTab) {
				// this happens when the user navigates to "New dataset" via navigation
				// when user is in Editor view
				this.clearRecord()
			} else {
				this.$store.commit('setMetadata', { tab: newTab })
				this.checkTab()
			}
		},
		'$route.params.id': async function(newId, oldId) {
			if (this.id === 'new') {
				this.clearRecord()
			} else if (this.id !== 'edit' && this.$store.state.metadata.id !== this.id) {
				await this.openRecord(this.id)
			}
		},
		'qvainData': {
			handler(qvainData) {
				this.$store.commit('setMetadata', {
					isOldVersion: !!(qvainData && qvainData.next),
					isDeprecated: !!(qvainData && qvainData.deprecated),
					isReadOnly: !!(qvainData && qvainData.preservation_state >= 80 && qvainData.preservation_state != 100 && qvainData.preservation_state != 130),
					isPas: !!(qvainData && (qvainData.data_catalog === "urn:nbn:fi:att:data-catalog-pas" || qvainData.preservation_state > 0)),
					isPublished: !!(qvainData && this.qvainData.published),
					isPublishedAndUpdateAvailable: !!(qvainData && this.qvainData.modified > this.qvainData.synced),
					metaxIdentifier: qvainData && this.qvainData.identifier,
				})
			},
			deep: true,
			immediate: true,
		},
	},
	async mounted() {
		if (this.id === 'new') {
			this.clearRecord()
		} else if (this.id !== 'edit') {
			await this.openRecord(this.id)
		}

		// if schema is not set, try to read schema from store
		if (!this.selectedCatalog && this.$store.state.metadata.catalog) {
			this.selectedCatalog = this.getCatalogForId(this.$store.state.metadata.catalog)
		}

		if (this.selectedCatalog) {
			this.startValidator()
		}

		this.checkTab()
	},
	methods: {
		getCatalogOptions(bundle) {
			const options = Object.entries(Bundle[bundle]).filter(([ key, val ]) => !val.hidden)
			return Object.fromEntries(options)
		},
		getCatalogForId(catalogId) {
			for (const bundle in Bundle) {
				const catalog = Object.values(Bundle[bundle]).find(catalog=>catalog.id==catalogId)
				if (catalog) {
					return catalog
				}
			}
			return null
		},
		getCatalogForData(data) {
			if (data.preservation_state > 0) {
				return Bundle.fairdata.pas
			}
			return this.getCatalogForId(data.data_catalog)
		},
		async ok(dialogTitle, dialogText, yesButtonTitle) {
			return await this.$bvModal.msgBoxOk(dialogText, {
				title: dialogTitle,
				size: 'md',
				buttonSize: 'md',
				okVariant: 'danger',
				okTitle: yesButtonTitle,
				footerClass: 'p-2',
				hideHeaderClose: false,
				centered: true,
			})
		},
		async confirm(dialogTitle, dialogText, yesButtonTitle, noButtonTitle) {
			return await this.$bvModal.msgBoxConfirm(dialogText, {
				title: dialogTitle,
				size: 'md',
				buttonSize: 'md',
				okVariant: 'danger',
				okTitle: yesButtonTitle,
				cancelTitle: noButtonTitle,
				footerClass: 'p-2',
				hideHeaderClose: false,
				centered: true,
			})
		},
		async confirmUnsavedChanges(dialogTitle, noButtonTitle, callback) {
			// if session is lost, user cannot save
			if (this.$auth.user === null) {
				callback(true)
			} else {
				const value = await this.$bvModal.msgBoxConfirm('If you will select <yes> then all the unsaved changes will be lost. Are you sure?', {
					title: dialogTitle,
					size: 'md',
					buttonSize: 'md',
					okVariant: 'danger',
					okTitle: 'Yes',
					cancelTitle: noButtonTitle,
					footerClass: 'p-2',
					hideHeaderClose: false,
					centered: true,
				})
				callback(value)
			}
		},
		async confirmOpenNewVersion() {
			return await this.confirm(
				"Open new dataset version?",
				"A new version of the dataset was created. Do you want to open the new version for editing?",
				"Yes",
				"No",
			)
		},
		async confirmSetCumulative(newIsCumulative) {
			if (newIsCumulative) {
				return await this.confirm(
					"Make dataset cumulative?",
					"A new version of the dataset will be created.",
					"Yes",
					"No",
				)
			} else {
				return await this.confirm(
					"Make dataset non-cumulative?",
					"Turning the dataset cumulative again later will create a new version of the dataset.",
					"Yes",
					"No",
				)
			}
		},
		async handleLostSession() {
			// there was a permission error
			// we should redirect the user to login
			await this.$auth.logoutDueSessionTimeout()
			this.$router.push({ name: "home", params: { missingSession: true }})
		},
		viewInEtsin() {
			window.open(`${process.env.VUE_APP_ETSIN_API_URL}/${this.qvainData.identifier}`, '_blank')
		},
		publish: async function publishCallback() {
			if (this.saving || this.publishing) {
				return
			}
			this.publishing = true
			try {
				this.showPublishConfirmation = false
				const isExisting = !!this.$store.state.metadata.id
				if (isExisting) {
					const currentId = this.$store.state.metadata.id
					const response = await apiClient.post("/datasets/" + currentId + "/publish", {})
					await this.openRecord(currentId)
					if (response.data && response.data.new_id && await this.confirmOpenNewVersion()) {
						this.$router.replace({ name: 'tab', params: { id: response.data.new_id, tab: this.$route.params.tab }})
					}
				} else {
					this.$root.showAlert("Please save your dataset first", "danger")
				}
			} catch (e) {
				// check if we got an api error for the modal, else show a generic error message
				console.error("publish error:", e, Object.keys(e))
				if (e.response && e.response.status == 401) {
					this.handleLostSession()
					return
				}
				if (e.code ==='ECONNABORTED') {
					const msg = getApiError(e, "while publishing dataset:", this.$store.state.metadata.id)
					this.$root.showAlert("Publish failed! " + msg, "danger")
					return
				}
				if (e.response && e.response.data) {
					this.publishError = e.response.data
					this.$root.$emit('bv::show::modal', 'publishErrorModal', this.$refs['dataset-publish-button'])
					return
				} else {
					this.$root.showAlert("Publish failed!", "danger")
					return
				}
			} finally {
				this.publishing = false
			}
		},
		save: async function saveCallback() {
			this.updateAutocomplete()
			let errorDescription = null
			if (this.saving) {
				return
			}
			this.saving = true
			try {
				const currentId = this.$store.state.metadata.id
				const dataset = this.$store.getters.prunedDataset
				const payload = {
					dataset,
					type: 2,
					schema: this.$store.state.metadata.schemaId,
					cumulative_state: this.$store.state.metadata.cumulativeState,
				}

				const isExisting = (currentId && currentId !== 'new')
				if (isExisting) {
					errorDescription = "While updating dataset"
					payload.id = currentId
					await apiClient.put("/datasets/" + currentId, payload)
					await this.openRecord(currentId)
				} else {
					errorDescription = "While saving dataset"
					const { data: { id }} = await apiClient.post("/datasets/", payload)
					await this.openRecord(id)
					this.$store.commit('setMetadata', { id })
					this.$router.replace({ name: 'tab', params: { id: id, tab: this.$route.params.tab }})
				}
				this.isDataChanged = false
			} catch(error) {
				if (error.response && error.response.status == 401) {
					this.handleLostSession()
				} else {
					const msg = getApiError(error, errorDescription, this.$store.state.metadata.id)
					this.$root.showAlert("Save failed! " + msg, "danger", true)
				}
			} finally {
				this.saving = false
			}
		},
		async setCumulative(value) {
			// Changing the cumulative_state of a published dataset cannot be done directly to
			// the Qvain dataset and requires a Metax RPC call.
			if (this.isPublished) {
				const currentId = this.$store.state.metadata.id
				try {
					if (!await this.confirmSetCumulative(value===1)) {
						return
					}

					const response = await apiClient.post(
						"/datasets/" + currentId + "/change_cumulative_state",
						null,
						{ params: { cumulative_state: value }}
					)
					await this.openRecord(this.id) // reopen updated dataset so possible old version tag gets updated
					if (response.data && response.data.new_id) {
						if (await this.confirmOpenNewVersion()) {
							this.$router.replace({ name: 'tab', params: { id: response.data.new_id, tab: this.$route.params.tab }})
						}
					} else {
						this.$root.showAlert("Cumulative state changed successfully.", "primary")
					}
				} catch(error) {
					let msg = getApiError(error, "changing cumulative state for dataset", this.$store.state.metadata.id)
					if (error.response.data && error.response.data.more && error.response.data.more.detail) {
						msg += "\n\nDetails: " + error.response.data.more.detail
					}
					this.$root.showAlert(msg, "danger", true)
				}
			} else {
				this.$store.commit('setMetadata', { cumulativeState: value })
				this.isDataChanged = true
			}
		},
		async refreshDirectory(directory) {
			// Refreshes the content of a directory using a Metax RPC.
			if (!this.isPublished) {
				return
			}

			const title = "Refresh folder content"
			let description =
				`This will update the dataset to include any new files you have added to the folder "${directory.title}" after the dataset was published.
				The result will be published immediately.`

			// using an array of vnodes allows having multiple paragraphs in the message box
			const paragraphs = [this.$createElement("p", description)]

			if (this.$store.state.metadata.cumulativeState !== 1) { // not cumulative
				const note = "If there are new files, a new version of the dataset will be created."
				paragraphs.push([this.$createElement("p", note)])
			}

			if (this.$store.state.metadata.isPublishedAndUpdateAvailable) {
				const note = "You have unpublished changes. You need to publish any changes to the dataset before you can refresh the folder."
				paragraphs.push(this.$createElement("p", note))
				await this.ok(title, paragraphs, "OK")
				return
			}

			if (!await this.confirm(title+"?", paragraphs, "Refresh", "Cancel")) {
				return
			}

			try {
				const currentId = this.$store.state.metadata.id
				const response = await apiClient.post(
					"/datasets/" + currentId + "/refresh_directory_content",
					null,
					{ params: { dir_identifier: directory.identifier }}
				)
				await this.openRecord(this.id) // reopen updated dataset so possible old version tag gets updated
				if (response.data && response.data.new_id) {
					if (await this.confirmOpenNewVersion()) {
						this.$router.replace({ name: 'tab', params: { id: response.data.new_id, tab: this.$route.params.tab }})
					}
				} else {
					this.$root.showAlert("Folder content refreshed successfully.", "primary")
				}
			} catch(error) {
				let msg = getApiError(error, "refreshing directory content for dataset", this.$store.state.metadata.id)
				if (error.response.data && error.response.data.more && error.response.data.more.detail) {
					msg += "\n\nDetails: " + error.response.data.more.detail
				}
				this.$root.showAlert(msg, "danger", true)
			}
		},

		clearRecord() {
			this.isDataChanged = false
			this.qvainData = null
			this.selectedCatalog = null
			this.$store.commit('loadSchema', {})
			this.$store.commit('loadHints', {})
			this.$store.commit('loadData', undefined)
			this.$store.commit('resetMetadata')
			this.$store.commit('clearMetaxRecord')
		},
		async reloadDataset() {
			this.confirmUnsavedChanges("Do you want to reload the dataset?", "No, I do not want to.", async value => {
				if (value) {
					this.reloading = true
					await this.openRecord(this.id)
					this.reloading = false
				}
			})
		},
		async openRecord(id) {
			if (this.loading) { return }
			this.loading = true
			try {
				const { data } = await apiClient.get(`/datasets/${id}`)
				this.$store.commit('resetMetadata')
				this.$store.commit('clearMetaxRecord')
				this.selectedCatalog = this.getCatalogForData(data)
				this.$store.commit('loadSchema', this.selectedCatalog.schema)
				this.$store.commit('loadHints', this.selectedCatalog.ui)
				this.$store.commit('loadData', Object(data.dataset))
				const metadata = {
					id,
					schemaId: this.selectedCatalog.schemaId,
					catalog: this.selectedCatalog.id,
					originalCatalog: data.data_catalog,
				}

				// If a published dataset has no cumulative_state in the db, leave it empty
				// so Metax will use its current value when publishing.
				if (data.cumulative_state != null || data.published) {
					metadata.cumulativeState = data.cumulative_state
				}
				this.$store.commit('setMetadata', metadata)
				this.isDataChanged = false
				this.qvainData = data
				this.refreshCounter++
				this.startValidator()
			} catch (error) {
				if (error.response && error.response.status == 401) {
					this.handleLostSession()
				}
				else {
					this.errorMessage = getApiError(error, "while opening dataset", id)
				}
				console.error(error)
			} finally {
				this.loading = false
			}
		},
		selectCatalog(catalog) {
			this.selectedCatalog = catalog
			if (this.selectedCatalog !== null) {
				this.$store.commit('loadSchema', this.selectedCatalog.schema)
				this.$store.commit('loadHints', this.selectedCatalog.ui)
				this.$store.commit('setMetadata', {
					schemaId: this.selectedCatalog.schemaId,
					catalog: this.selectedCatalog.id,
				})

				this.startValidator()
				this.checkTab()
			} else {
				this.$store.commit('loadSchema', {})
			}
		},
		checkTab() {
			// if tab is unset or invalid (not in tabs list), try to read tab from store or use the first tab
			const tabUris = this.tabs.map(tab=>tab.uri)
			if (!this.$route.params.tab || !tabUris.includes(this.$route.params.tab)) {
				let newTab = tabUris.includes(this.$store.state.metadata.tab) ? this.$store.state.metadata.tab : null
				if (!newTab && this.tabs.length > 0) {
					newTab = this.tabs[0].uri
				}
				if (newTab) {
					this.$router.replace({ name: 'tab', params: { id: this.$route.params.id, tab: newTab  }})
				} else {
					// Remove tab etc. from url if any. If url didn't change,
					// nothing happens and we get an error that can be safely ignored.
					this.$router.replace({ name: 'editor', params: { id: this.$route.params.id }})
						.catch(()=>{})
				}
			}
		},
		startValidator() {
			this.unsubscribeFunc && this.unsubscribeFunc()
			this.validator = new Validator(
				Vue,
				this.$store.state.schema,
				this.$store.state.record,
				{ 'allowUndefined': true },
			)
			this.validator.v = this.$store.state.vState
			this.unsubscribeFunc = this.$store.subscribe((mutation) => {
				if (mutation.type !== 'initValue') {
					const data = cloneWithPrune(this.$store.state.record, [], [])
					this.validator.validateData(data)
				}
				// the data has been changed after the initial load by the user
				if (mutation.type === 'updateValue' || mutation.type === 'deleteArrayValue' || mutation.type === 'replace') {
					this.isDataChanged = true
				}
			})
		},
		updateAutocomplete() {
			// New autocomplete values are saved when a form is submitted or the submit button is clicked.
			// The form prevents the triggered event from reloading the page.
			if (this.$refs.submit) {
				this.$refs.submit.click() // click hidden submit button
			}
		},
	},
	beforeRouteUpdate(to, form, next) {
		this.refreshCounter++
		this.updateAutocomplete()
		next()
	},
	beforeRouteLeave(to, from, next) {
		this.updateAutocomplete()
		if (!this.isDataChanged) {
			next()
			return
		}
		this.confirmUnsavedChanges("Leave the editor?", "No, I want to stay.", (value) => {
			if (!value || value === null) {
				next(false)
			} else {
				next()
			}
		})
	},
}
</script>

<style>
.nav-tabs .nav-link.active,
.nav-tabs .nav-link.router-link-active,
.nav-tabs .nav-item.show .nav-link {
	color: #495057;
	background-color: #fff;
	border-color: #dee2e6 #dee2e6 #fff;
}

.tab-field-link {
	display: flex;
	height: 2.5em;
	align-items: center;
	justify-content: space-between;
	padding: 4px 2px 4px 10px;
}

.tab-field-link .delete-button {
	margin: 0px 2px 0px 2px;
}

.no-padding {
	padding-left: 0;
	padding-right: 0;
}
</style>

<style lang="scss" scoped>

#editor-view .navbar {
	flex-flow: wrap;
	padding: 0;

	.navbar-item {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.btn-toolbar {
		width: 100%;
		.btn-group {
			margin: 0;
		}
	}
}

#editor-view .bg-light {
	background-color: #fff !important;
}

#editor-view {
	margin: 0;
	padding: 0;

}

h2.component-title {
	font-weight: 300;
	margin-bottom: 1em;
}

h1.component-title {
	margin-bottom: 0;
	.secondary-text {
		font-size: 0.5em;
		display:inline-block;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}
.router-link-active {
	font-weight: 400;
}

.editor-index-navigation {
	margin-top: 2em;
	top: 8em;
	z-index: 1000;
	font-weight: 300;
}

.page-is-loading {
	margin-top: 2em;
	margin-left: auto;
	margin-right: auto;
}

</style>
