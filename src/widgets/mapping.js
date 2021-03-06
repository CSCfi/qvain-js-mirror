/*
This file is part of Qvain -project.

Author(s):
	Juhapekka Piiroinen <jp@1337.fi>
	Wouter Van Hemel <wouter.van.hemel@helsinki.fi>
	Jori Niemi <3295718+tahme@users.noreply.github.com>
	Eemeli Kouhia <eemeli.kouhia@gofore.com>

License: GPLv3

See LICENSE file for more information.
Copyright (C) 2019 Ministry of Culture and Education, Finland.
All Rights Reserved.
*/
export default {
	'TabSelector': require('./TabSelector.vue').default,
	'SchemaString': require('./String.vue').default,
	'SchemaNumber': require('./Number.vue').default,
	'SchemaObject': require('./Object.vue').default,
	'SchemaArray': require('./Array.vue').default,
	'SchemaInlineArray': require('./InlineArray.vue').default,
	'SchemaAnyOf': require('./anyOf.vue').default,
	'SchemaAllOf': require('./allOf.vue').default,
	'SchemaOneOf': require('./oneOf.vue').default,
	'SchemaEnum': require('./Enum.vue').default,
	'SchemaChoice': require('./Choice.vue').default,
	'reference-data': require('../components/ReferenceData.vue').default,
	'i18n-string': require('@/components/i18nStrings.vue').default,
	'i18n-textarea': require('@/components/i18nTextarea.vue').default,
	'autocomplete': require('./refdata/autocomplete.vue').default,
	'filepicker': require('../filebrowser/FilePicker.vue').default,
	'Organization': require('../components/Organization.vue').default,
	'FlatObject': require('./FlatObject.vue').default,
	'date-range': require('../components/DateRange.vue').default,
	'date': require('../components/Date.vue').default,
}
