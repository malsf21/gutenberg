/**
 * External dependencies
 */
const inquirer = require( 'inquirer' );
const program = require( 'commander' );
const { startCase } = require( 'lodash' );

/**
 * Internal dependencies
 */
const checkSystemRequirements = require( './check-system-requirements' );
const CLIError = require( './cli-error' );
const log = require( './log' );
const { engines, version } = require( '../package.json' );
const scaffold = require( './scaffold' );
const { getDefaultValues, getPrompts } = require( './templates' );

const commandName = `wp-create-block`;
program
	.name( commandName )
	.description(
		'Generates PHP, JS and CSS code for registering a block for a WordPress plugin.\n\n' +
			'[slug] is optional. When provided it triggers the quick mode where it is used ' +
			'as the block slug used for its identification, the output location for scaffolded files, ' +
			'and the name of the WordPress plugin. The rest of the configuration is set to all default values.'
	)
	.version( version )
	.arguments( '[slug]' )
	.option(
		'-t, --template <name>',
		'template type name, allowed values: "es5", "esnext"',
		'esnext'
	)
	.option(
		'--namespace <namespace>',
		'internal namespace for the block name'
	)
	.option( '--title <title>', 'display title for the block' )
	.option( '--category <category>', 'category name for the block' )
	.action( async ( slug, commandObject ) => {
		const { template } = commandObject;
		const optionsProvided = [ 'namespace', 'title', 'category' ]
			.filter( ( optionName ) => commandObject[ optionName ] )
			.reduce( ( accumulator, optionName ) => {
				accumulator[ optionName ] = commandObject[ optionName ];
				return accumulator;
			}, {} );

		console.log( optionsProvided );
		await checkSystemRequirements( engines );
		try {
			const defaultValues = getDefaultValues( template );
			if ( slug ) {
				const answers = {
					...defaultValues,
					slug,
					// Transforms slug to title as a fallback.
					title: startCase( slug ),
				};
				await scaffold( template, answers );
			} else {
				const propmpts = getPrompts( template );
				const answers = await inquirer.prompt( propmpts );
				await scaffold( template, {
					...defaultValues,
					...answers,
				} );
			}
		} catch ( error ) {
			if ( error instanceof CLIError ) {
				log.error( error.message );
				process.exit( 1 );
			} else {
				throw error;
			}
		}
	} )
	.on( '--help', function() {
		log.info( '' );
		log.info( 'Examples:' );
		log.info( `  $ ${ commandName }` );
		log.info( `  $ ${ commandName } todo-list` );
		log.info( `  $ ${ commandName } --template es5 todo-list` );
	} )
	.parse( process.argv );
