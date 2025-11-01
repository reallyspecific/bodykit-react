import path from "path";
import { readFileSync as readFile, existsSync as fileExists, writeFileSync as writeFile } from "fs";
import webpack from "webpack";
import { defineReactCompilerLoaderOption } from 'react-compiler-webpack';
import MiniCssExtractPlugin from "mini-css-extract-plugin";

import Compiler from "@reallyspecific/bodykit/compiler";
import deepmerge from "deepmerge";

import defaultConfig from "./default.webpack.config.js";


const __dirname = import.meta.dirname;

export default class extends Compiler {

	static type = 'react';

	include = ['*.js','*.jsx'];

	clean = ['*.min.js'];

	filenamePattern = '[path]/[name].[contenthash].js';

	async compile( props ) {

		const buildOptions = {
			...this.options,
			...props ?? {},
		}

		let webpackConfig = { ...defaultConfig };
		let compiler;

		try {

			if ( buildOptions.config ) {
				const projectConfigPath = path.join( this.sourceIn, buildOptions.config );
				if (fileExists(projectConfigPath)) {
					const config = await import( projectConfigPath );
					webpackConfig = deepmerge( webpackConfig, config.default );
				}
			}

			webpackConfig = deepmerge(
				webpackConfig,
				{
					context: this.sourceIn,
					mode: buildOptions.mode ?? 'production',
					entry: buildOptions.entry ?? null,
					output: {
						path: this.destOut,
						...buildOptions.output ?? {},
					},
				}
			);

			if ( webpackConfig.mode === 'production' ) {
				webpackConfig.plugins = [ [ new MiniCssExtractPlugin() ] ].flat();
				webpackConfig.module.rules.push(
					{
						test: /\.css$/,
						use: [
							MiniCssExtractPlugin.loader,
							"css-loader"
						]
					}
				);
			}




			if ( ! webpackConfig.entry ) {
				throw new Error( 'The react compiler requires an entry point defined in the build options ("entry") or webpack config file ("config")' );
			}

			if ( buildOptions.compilerOptions ) {
				webpackConfig.module.rules[0].use[1].options = defineReactCompilerLoaderOption( props.compilerOptions );
			}

			compiler = webpack(webpackConfig);

		} catch( error ) {
			// setup error
			return [ {
				...props,
				error
			} ];
		}

		try {

			compiler.run( (err, stats) => {

				// todo: make this better.
				if (err) {
					console.error(err.stack || err);
					if (err.details) {
						console.error(err.details);
					}
					return;
				}

				const info = stats.toJson();

				if (stats.hasErrors()) {
					console.error(info.errors);
				}

				if (stats.hasWarnings()) {
					console.warn(info.warnings);
				}

				const basedir = buildOptions.basedir ?? this.destOut;

				if ( buildOptions.template ) {
					const templatePath = buildOptions.template === true
						? path.join( __dirname, 'default.template.html' )
						: path.join( this.sourceIn, buildOptions.template );
					if ( fileExists( templatePath ) ) {
						const template = readFile( templatePath, 'utf8' );
						if ( template ) {
							for ( const entryName in info.entrypoints ) {
								const entrypoint = info.entrypoints[ entryName ];
								const compiled = this.compileTemplate( { entrypoint, template, basedir, hash: info.hash } );
								const appPath = path.join( basedir, entrypoint.name + '.html' );
								if ( compiled ) {
									writeFile( appPath, compiled, { encoding:'utf8' } );
								} else {
									throw new Error( `Unable to compile template for entrypoint "${entryName}"` );
								}
							}
						}
					}
				}

				compiler.close( (closeErr) => {
					if ( closeErr ) {
						console.error( closeErr.stack || closeErr );
						if ( closeErr.details ) {
							console.error( closeErr.details );
						}
						return;
					}
				} );
			});

		} catch ( error ) {
			// build error
			return [ {
				...props,
				error
			} ];
		}

	}

	compileTemplate( { entrypoint, template, basedir, hash } ) {

		let head = '';
		let scripts = '';

		for( const assetCollection of [ entrypoint.auxiliaryAssets, entrypoint.assets ] ) {
			for ( const asset of assetCollection ) {
				let url = asset.name;
				if ( hash ) {
					url += '?v=' + hash;
				}
				if ( asset.name.endsWith( '.css' ) ) {
					head += `<link rel="stylesheet" href="${url}">`;
				} else if ( asset.name.endsWith( '.js' ) ) {
					scripts += `<script src="${url}"></script>`;
				}
			}
		}

		const compiled = template
			.replace( /<!--\s*?@head\s*?-->/g, head )
			.replace( /<!--\s*?@scripts\s*?-->/g, scripts );

		return compiled;

	}

	async write( compiled ) {
		return null;
	}

}
